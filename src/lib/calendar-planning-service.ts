import { caseService, Case } from './case-service';
import { workflowEngine } from './workflow-engine';
import { learningService } from './learning-service';
import {
  CalendarPlanningReview,
  ProposedSchedule,
  CalendarConflict,
  CalendarPlanningWarning,
  CalendarPlanningReadiness,
  DispatchReview,
  PlanningReview,
  CalendarAddressSnapshot
} from './types';

// Helper: parse HH:mm to minutes from midnight
export function parseTimeToMinutes(timeStr?: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.trim().split(':');
  if (parts.length < 2) return 0;
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
}

// Helper: format minutes from midnight to HH:mm
export function formatMinutesToTime(minutes: number): string {
  const normalized = Math.max(0, Math.min(1439, minutes));
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

// Helper: add minutes to HH:mm
export function addMinutesToTime(timeStr: string, minutesToAdd: number): string {
  const startMins = parseTimeToMinutes(timeStr);
  return formatMinutesToTime(startMins + minutesToAdd);
}

export function evaluateCalendarPlanningReadiness(
  review: Partial<CalendarPlanningReview>
): { readiness: CalendarPlanningReadiness; warnings: CalendarPlanningWarning[] } {
  const warnings: CalendarPlanningWarning[] = [];

  if (review.status === 'rejected' || review.status === 'failed') {
    return { readiness: 'blocked', warnings };
  }

  const sched = review.proposedSchedule;

  // 1. Check Date
  if (!sched?.date || sched.date.trim() === '') {
    warnings.push({
      id: `warn-date-${Date.now()}`,
      code: 'MISSING_DATE',
      message: 'Umzugstermin (Datum) fehlt.',
      severity: 'high',
      field: 'date'
    });
    return { readiness: 'missing_date', warnings };
  }

  // 2. Check Time
  if (!sched?.jobStartTime || sched.jobStartTime.trim() === '') {
    warnings.push({
      id: `warn-time-${Date.now()}`,
      code: 'MISSING_TIME',
      message: 'Startzeit des Umzugs fehlt.',
      severity: 'high',
      field: 'jobStartTime'
    });
    return { readiness: 'missing_time', warnings };
  }

  // 3. Check Vehicle
  if (!review.selectedVehicleId || review.selectedVehicleId.trim() === '') {
    warnings.push({
      id: `warn-veh-${Date.now()}`,
      code: 'MISSING_VEHICLE',
      message: 'Kein Fahrzeug zugewiesen.',
      severity: 'high',
      field: 'selectedVehicleId'
    });
    return { readiness: 'missing_vehicle', warnings };
  }

  // 4. Check Employees
  if (!review.selectedEmployeeIds || review.selectedEmployeeIds.length === 0) {
    warnings.push({
      id: `warn-emp-${Date.now()}`,
      code: 'MISSING_EMPLOYEES',
      message: 'Keine Mitarbeiter zugewiesen.',
      severity: 'high',
      field: 'selectedEmployeeIds'
    });
    return { readiness: 'missing_employees', warnings };
  }

  // 5. Check Incomplete Address
  const pickup = sched.pickupAddress;
  const dest = sched.destinationAddress;
  if (!pickup?.street || !dest?.street) {
    warnings.push({
      id: `warn-addr-${Date.now()}`,
      code: 'INCOMPLETE_ADDRESS',
      message: 'Abhol- oder Zieladresse unvollständig.',
      severity: 'medium',
      field: 'pickupAddress'
    });
    return { readiness: 'incomplete_information', warnings };
  }

  // 6. Check Conflicts
  if (review.conflicts && review.conflicts.length > 0) {
    const hasHighConflict = review.conflicts.some(c => c.severity === 'high');
    if (hasHighConflict) {
      warnings.push({
        id: `warn-conflict-${Date.now()}`,
        code: 'CONFLICT_DETECTED',
        message: 'Kritischer Terminkonflikt vorhanden.',
        severity: 'high'
      });
      return { readiness: 'conflict', warnings };
    }
  }

  return { readiness: 'ready', warnings };
}

export function detectCalendarConflicts(
  proposed: ProposedSchedule,
  selectedVehicleId?: string,
  selectedEmployeeIds: string[] = [],
  currentCaseId: string = '',
  allCases: Case[] = [],
  calendarEvents: any[] = []
): CalendarConflict[] {
  const conflicts: CalendarConflict[] = [];

  const startMins = parseTimeToMinutes(proposed.jobStartTime);
  const endMins = parseTimeToMinutes(proposed.estimatedEndTime);

  // 1. Time Range Validity Check
  if (startMins >= endMins || proposed.estimatedDurationMinutes <= 0) {
    conflicts.push({
      id: `conf-time-${Date.now()}`,
      type: 'invalid_time_range',
      title: 'Ungültiger Zeitbereich',
      description: 'Endzeit liegt vor der Startzeit oder Dauer ist ungültig.',
      severity: 'high'
    });
  }

  // 2. Working Hours Check (06:00 - 22:00 -> 360 to 1320 mins)
  if (startMins < 360 || endMins > 1320) {
    conflicts.push({
      id: `conf-hours-${Date.now()}`,
      type: 'outside_working_hours',
      title: 'Außerhalb der Arbeitszeiten',
      description: 'Der geplante Zeitraum liegt außerhalb der regulären Arbeitszeiten (06:00 - 22:00 Uhr).',
      severity: 'medium'
    });
  }

  // 3. Duplicate Case Check
  const currentCase = allCases.find(c => c.id === currentCaseId);
  if (currentCase) {
    const alreadyScheduled = currentCase.calendarPlanningReviews?.some(
      r => (r.status === 'scheduled' || r.status === 'confirmed') && r.calendarEventId
    );
    if (alreadyScheduled) {
      conflicts.push({
        id: `conf-dup-${Date.now()}`,
        type: 'duplicate_case',
        title: 'Fall bereits terminiert',
        description: 'Für diesen Kundenfall existiert bereits ein aktiver Kalendereintrag.',
        severity: 'high',
        conflictingCaseId: currentCaseId
      });
    }
  }

  // Look through other cases and external calendar events for overlaps on the same date
  for (const otherCase of allCases) {
    if (otherCase.id === currentCaseId) continue;

    const otherReviews = otherCase.calendarPlanningReviews || [];
    for (const otherRev of otherReviews) {
      if (otherRev.status === 'rejected' || otherRev.status === 'failed') continue;

      const otherSched = otherRev.proposedSchedule;
      if (!otherSched || otherSched.date !== proposed.date) continue;

      const otherStartMins = parseTimeToMinutes(otherSched.jobStartTime);
      const otherEndMins = parseTimeToMinutes(otherSched.estimatedEndTime);

      // Check overlap
      const hasOverlap = startMins < otherEndMins && endMins > otherStartMins;

      if (hasOverlap) {
        // Vehicle Overlap
        if (
          selectedVehicleId &&
          otherRev.selectedVehicleId &&
          selectedVehicleId === otherRev.selectedVehicleId
        ) {
          conflicts.push({
            id: `conf-veh-${otherCase.id}-${Date.now()}`,
            type: 'vehicle_overlap',
            title: 'Fahrzeugdoppelbelegung',
            description: `Fahrzeug ${selectedVehicleId} ist im Zeitraum von ${otherSched.jobStartTime} bis ${otherSched.estimatedEndTime} bereits belegt (Fall ${otherCase.id}).`,
            severity: 'high',
            conflictingCaseId: otherCase.id
          });
        }

        // Employee Overlap
        if (selectedEmployeeIds && otherRev.selectedEmployeeIds) {
          const commonEmps = selectedEmployeeIds.filter(emp =>
            otherRev.selectedEmployeeIds.includes(emp)
          );
          if (commonEmps.length > 0) {
            conflicts.push({
              id: `conf-emp-${otherCase.id}-${Date.now()}`,
              type: 'employee_overlap',
              title: 'Mitarbeiterdoppelbelegung',
              description: `Mitarbeiter (${commonEmps.join(', ')}) ist im Zeitraum von ${otherSched.jobStartTime} bis ${otherSched.estimatedEndTime} bereits für Fall ${otherCase.id} eingeteilt.`,
              severity: 'high',
              conflictingCaseId: otherCase.id
            });
          }
        }

        // Parallel Case
        conflicts.push({
          id: `conf-par-${otherCase.id}-${Date.now()}`,
          type: 'parallel_case',
          title: 'Paralleler Einsatz',
          description: `Weiterer Einsatz (${otherSched.title}) ist zeitgleich am ${proposed.date} von ${otherSched.jobStartTime} bis ${otherSched.estimatedEndTime} geplant.`,
          severity: 'medium',
          conflictingCaseId: otherCase.id
        });
      }

      // Tight Schedule Check (buffer check between consecutive jobs on same day)
      const diffBefore = startMins - otherEndMins;
      const diffAfter = otherStartMins - endMins;
      const minBuffer = proposed.bufferMinutes || 30;

      if ((diffBefore >= 0 && diffBefore < minBuffer) || (diffAfter >= 0 && diffAfter < minBuffer)) {
        conflicts.push({
          id: `conf-tight-${otherCase.id}-${Date.now()}`,
          type: 'tight_schedule',
          title: 'Enger Zeitplan',
          description: `Der zeitliche Abstand zu Fall ${otherCase.id} beträgt weniger als ${minBuffer} Minuten Puffer.`,
          severity: 'medium',
          conflictingCaseId: otherCase.id
        });
      }
    }
  }

  // Check stored calendarEvents array as well
  if (Array.isArray(calendarEvents)) {
    for (const evt of calendarEvents) {
      if (evt.caseId === currentCaseId) continue;
      if (evt.startDate !== proposed.date) continue;

      const evtStartMins = parseTimeToMinutes(evt.startTime);
      const evtEndMins = parseTimeToMinutes(evt.endTime);

      const hasOverlap = startMins < evtEndMins && endMins > evtStartMins;
      if (hasOverlap) {
        if (selectedVehicleId && evt.vehicleId === selectedVehicleId) {
          conflicts.push({
            id: `conf-evt-veh-${evt.id}`,
            type: 'vehicle_overlap',
            title: 'Fahrzeugdoppelbelegung (Kalender)',
            description: `Fahrzeug ${selectedVehicleId} ist laut Kalendereintrag "${evt.title}" bereits belegt.`,
            severity: 'high',
            conflictingEventId: evt.id
          });
        }
        if (selectedEmployeeIds && evt.employeeIds) {
          const common = selectedEmployeeIds.filter(emp => evt.employeeIds.includes(emp));
          if (common.length > 0) {
            conflicts.push({
              id: `conf-evt-emp-${evt.id}`,
              type: 'employee_overlap',
              title: 'Mitarbeiterdoppelbelegung (Kalender)',
              description: `Mitarbeiter ${common.join(', ')} im Kalendereintrag "${evt.title}" bereits eingeteilt.`,
              severity: 'high',
              conflictingEventId: evt.id
            });
          }
        }
      }
    }
  }

  return conflicts;
}

export class CalendarPlanningService {
  private isProcessingLock = false;

  createCalendarPlanningReview(
    caseId: string,
    dispatchReviewId?: string
  ): CalendarPlanningReview | null {
    const caseItem = caseService.getCase(caseId);
    if (!caseItem) return null;

    // Find linked dispatch review
    const dispatchReviews = caseItem.dispatchReviews || [];
    const dispatchReview = dispatchReviewId
      ? dispatchReviews.find(d => d.id === dispatchReviewId)
      : dispatchReviews[dispatchReviews.length - 1];

    if (!dispatchReview) return null;

    // Idempotency check: Return existing review if present
    const existing = caseItem.calendarPlanningReviews?.find(
      r => r.dispatchReviewId === dispatchReview.id && r.status !== 'rejected' && r.status !== 'failed'
    );
    if (existing) {
      return existing;
    }

    // Get planning review
    const planningReviews = caseItem.planningReviews || [];
    const planningReview = planningReviews.find(p => p.id === dispatchReview.planningReviewId) || planningReviews[planningReviews.length - 1];
    const planningData = planningReview?.planningData;

    // Determine move date
    const moveDate =
      planningData?.moveDate ||
      caseItem.customerDraft?.fields?.moveDate?.value ||
      new Date(Date.now() + 86400000).toISOString().split('T')[0];

    // Determine start time and duration
    const jobStartTime = planningData?.timeWindow || '08:00';
    const durationHours = dispatchReview.durationSuggestion?.estimatedHours || 4;
    const bufferMinutes = (dispatchReview.durationSuggestion?.bufferHours || 1) * 60;
    const estimatedDurationMinutes = Math.round(durationHours * 60) + bufferMinutes;
    const estimatedEndTime = addMinutesToTime(jobStartTime, estimatedDurationMinutes);

    // Default vehicle selection from suggestions
    const vehicleRec = dispatchReview.vehicleSuggestion?.find(v => v.recommended) || dispatchReview.vehicleSuggestion?.[0];
    const selectedVehicleId = vehicleRec?.id || 'v-3_5t';

    // Default crew selection from suggestions
    const selectedEmployeeIds: string[] = [];
    if (dispatchReview.crewSuggestion && dispatchReview.crewSuggestion.length > 0) {
      dispatchReview.crewSuggestion.forEach((c, idx) => {
        for (let i = 0; i < (c.count || 1); i++) {
          selectedEmployeeIds.push(`emp-${c.role.toLowerCase().replace(/[^a-z0-9]/g, '')}-${i + 1}`);
        }
      });
    } else {
      selectedEmployeeIds.push('emp-fahrer-1', 'emp-moebelpacker-1', 'emp-moebelpacker-2');
    }

    // Build Proposed Schedule
    const proposedSchedule: ProposedSchedule = {
      date: moveDate,
      preparationStartTime: addMinutesToTime(jobStartTime, -30),
      jobStartTime,
      estimatedEndTime,
      estimatedDurationMinutes,
      travelToPickupMinutes: 30,
      loadingMinutes: 120,
      travelToDestinationMinutes: 30,
      unloadingMinutes: 60,
      bufferMinutes,
      pickupAddress: {
        street: planningData?.pickupAddress?.street || 'Musterstraße 1',
        zip: planningData?.pickupAddress?.zip || '10115',
        city: planningData?.pickupAddress?.city || 'Berlin',
        floor: planningData?.pickupAddress?.floor || '1',
        elevator: planningData?.pickupAddress?.elevator || false
      },
      destinationAddress: {
        street: planningData?.destinationAddress?.street || 'Zielweg 10',
        zip: planningData?.destinationAddress?.zip || '10243',
        city: planningData?.destinationAddress?.city || 'Berlin',
        floor: planningData?.destinationAddress?.floor || '2',
        elevator: planningData?.destinationAddress?.elevator || false
      },
      title: `Umzug: ${caseItem.title || caseId}`,
      notes: 'Terminvorschlag aus bestätigter Disposition'
    };

    // Load stored calendar events for conflict check
    let calendarEvents: any[] = [];
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem('outlook_calendar_events_v2');
        if (raw) calendarEvents = JSON.parse(raw);
      }
    } catch (e) {
      // Ignore storage read errors
    }

    const allCases = caseService.getAllCases();
    const conflicts = detectCalendarConflicts(
      proposedSchedule,
      selectedVehicleId,
      selectedEmployeeIds,
      caseId,
      allCases,
      calendarEvents
    );

    const partialReview: Partial<CalendarPlanningReview> = {
      proposedSchedule,
      selectedVehicleId,
      selectedEmployeeIds,
      conflicts,
      status: 'pending'
    };

    const evalRes = evaluateCalendarPlanningReadiness(partialReview);

    const now = new Date().toISOString();
    const review: CalendarPlanningReview = {
      id: `cpr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      caseId,
      planningReviewId: planningReview?.id || '',
      dispatchReviewId: dispatchReview.id,
      status: 'pending',
      proposedSchedule,
      selectedVehicleId,
      selectedEmployeeIds,
      conflicts,
      warnings: evalRes.warnings,
      readiness: evalRes.readiness,
      createdAt: now,
      updatedAt: now
    };

    if (!caseItem.calendarPlanningReviews) {
      caseItem.calendarPlanningReviews = [];
    }
    caseItem.calendarPlanningReviews.push(review);

    // Timeline entry (deduplicated)
    if (!caseItem.timeline.some(t => t.title === 'Kalendervorschlag erzeugt')) {
      caseService.addTimelineEntry(caseId, {
        type: 'status_change',
        category: 'Schedule',
        title: 'Kalendervorschlag erzeugt',
        description: `Terminvorschlag für den ${moveDate} um ${jobStartTime} Uhr erstellt.`,
        source: 'CalendarPlanningService',
        timestamp: now
      });
    }

    caseService.flushPersistence();

    workflowEngine.emitEvent('CALENDAR_PLANNING_REVIEW_CREATED', 'CalendarPlanningService', {
      caseId,
      calendarPlanningReviewId: review.id
    });

    return review;
  }

  updateCalendarPlanningReview(
    caseId: string,
    reviewId: string,
    updates: Partial<CalendarPlanningReview>
  ): CalendarPlanningReview | null {
    const caseItem = caseService.getCase(caseId);
    if (!caseItem || !caseItem.calendarPlanningReviews) return null;

    const review = caseItem.calendarPlanningReviews.find(r => r.id === reviewId);
    if (!review) return null;

    if (updates.proposedSchedule) {
      review.proposedSchedule = {
        ...review.proposedSchedule,
        ...updates.proposedSchedule
      };
      // Recalculate end time if duration or start time changed
      if (updates.proposedSchedule.jobStartTime || updates.proposedSchedule.estimatedDurationMinutes) {
        review.proposedSchedule.estimatedEndTime = addMinutesToTime(
          review.proposedSchedule.jobStartTime,
          review.proposedSchedule.estimatedDurationMinutes
        );
      }
    }

    if (updates.selectedVehicleId !== undefined) {
      review.selectedVehicleId = updates.selectedVehicleId;
    }

    if (updates.selectedEmployeeIds !== undefined) {
      review.selectedEmployeeIds = updates.selectedEmployeeIds;
    }

    const now = new Date().toISOString();
    review.status = 'edited';
    review.updatedAt = now;

    // Load stored calendar events for conflict check
    let calendarEvents: any[] = [];
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem('outlook_calendar_events_v2');
        if (raw) calendarEvents = JSON.parse(raw);
      }
    } catch (e) {
      // Ignore
    }

    const allCases = caseService.getAllCases();
    review.conflicts = detectCalendarConflicts(
      review.proposedSchedule,
      review.selectedVehicleId,
      review.selectedEmployeeIds,
      caseId,
      allCases,
      calendarEvents
    );

    const evalRes = evaluateCalendarPlanningReadiness(review);
    review.readiness = evalRes.readiness;
    review.warnings = evalRes.warnings;

    // Timeline entry
    if (!caseItem.timeline.some(t => t.title === 'Kalenderplanung bearbeitet')) {
      caseService.addTimelineEntry(caseId, {
        type: 'status_change',
        category: 'Schedule',
        title: 'Kalenderplanung bearbeitet',
        description: 'Termin- und Ressourceneinstellungen wurden manuell angepasst.',
        source: 'CalendarPlanningService',
        timestamp: now
      });
    }

    caseService.flushPersistence();

    workflowEngine.emitEvent('CALENDAR_PLANNING_REVIEW_UPDATED', 'CalendarPlanningService', {
      caseId,
      calendarPlanningReviewId: review.id
    });

    return review;
  }

  confirmCalendarPlanningReview(
    caseId: string,
    reviewId: string
  ): CalendarPlanningReview | null {
    if (this.isProcessingLock) {
      console.warn('Calendar planning confirmation lock active, skipping parallel invocation.');
      return null;
    }

    this.isProcessingLock = true;

    try {
      const caseItem = caseService.getCase(caseId);
      if (!caseItem || !caseItem.calendarPlanningReviews) return null;

      const review = caseItem.calendarPlanningReviews.find(r => r.id === reviewId);
      if (!review) return null;

      // Idempotency check: Already scheduled
      if (review.status === 'scheduled') {
        return review;
      }

      // Re-evaluate readiness and conflicts
      let calendarEvents: any[] = [];
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const raw = localStorage.getItem('outlook_calendar_events_v2');
          if (raw) calendarEvents = JSON.parse(raw);
        }
      } catch (e) {
        // Ignore
      }

      const allCases = caseService.getAllCases();
      review.conflicts = detectCalendarConflicts(
        review.proposedSchedule,
        review.selectedVehicleId,
        review.selectedEmployeeIds,
        caseId,
        allCases,
        calendarEvents
      );

      const evalRes = evaluateCalendarPlanningReadiness(review);
      review.readiness = evalRes.readiness;
      review.warnings = evalRes.warnings;

      if (review.readiness === 'conflict' || review.readiness === 'blocked' || review.readiness.startsWith('missing_')) {
        review.status = 'failed';
        review.errorMessage = 'Bestätigung fehlgeschlagen: Unvollständige Angaben oder Terminkonflikte.';
        caseService.flushPersistence();
        return review;
      }

      const now = new Date().toISOString();

      workflowEngine.emitEvent('CALENDAR_EVENT_CREATION_STARTED', 'CalendarPlanningService', {
        caseId,
        calendarPlanningReviewId: review.id
      });

      // Create internal calendar event
      const eventId = `evt_${Date.now()}`;
      const newCalendarEvent = {
        id: eventId,
        title: review.proposedSchedule.title,
        startDate: review.proposedSchedule.date,
        startTime: review.proposedSchedule.jobStartTime,
        endTime: review.proposedSchedule.estimatedEndTime,
        location: `${review.proposedSchedule.pickupAddress?.street || ''}, ${review.proposedSchedule.pickupAddress?.city || ''} -> ${review.proposedSchedule.destinationAddress?.street || ''}, ${review.proposedSchedule.destinationAddress?.city || ''}`,
        description: review.proposedSchedule.notes || `Umzug für Case ${caseId}`,
        category: 'Umzug',
        customerId: caseItem.customerId,
        caseId,
        vehicleId: review.selectedVehicleId,
        employeeIds: review.selectedEmployeeIds
      };

      try {
        if (typeof window !== 'undefined') {
          if (window.localStorage) {
            const saved = localStorage.getItem('outlook_calendar_events_v2');
            const list = saved ? JSON.parse(saved) : [];
            list.push(newCalendarEvent);
            localStorage.setItem('outlook_calendar_events_v2', JSON.stringify(list));
          }
          window.dispatchEvent(new CustomEvent('add_calendar_event', { detail: newCalendarEvent }));
        }
      } catch (e) {
        console.error('Failed to write calendar event to localStorage:', e);
      }

      review.status = 'scheduled';
      review.confirmedAt = now;
      review.scheduledAt = now;
      review.calendarEventId = eventId;
      review.updatedAt = now;

      // Update case status
      caseItem.status = 'Scheduled';

      // Complete task "Kalender vorbereiten"
      const prepTask = caseItem.tasks.find(t => t.title === 'Kalender vorbereiten');
      if (prepTask) {
        prepTask.status = 'Completed';
        prepTask.completedAt = now;
      }

      // Add task "Einsatz durchführen" (deduplicated)
      if (!caseItem.tasks.some(t => t.title === 'Einsatz durchführen')) {
        caseService.addTask(caseId, {
          caseId,
          workflowId: 'wf-calendar-planning',
          title: 'Einsatz durchführen',
          description: `Umzugeinsatz am ${review.proposedSchedule.date} von ${review.proposedSchedule.jobStartTime} bis ${review.proposedSchedule.estimatedEndTime} Uhr durchführen.`,
          category: 'Schedule',
          status: 'Open',
          priority: 'high',
          source: 'System'
        });
      }

      // Add timeline entry (deduplicated)
      if (!caseItem.timeline.some(t => t.title === 'Kalendereintrag erstellt')) {
        caseService.addTimelineEntry(caseId, {
          type: 'status_change',
          category: 'Schedule',
          title: 'Kalendereintrag erstellt',
          description: `Verbindlicher Kalendereintrag für den ${review.proposedSchedule.date} um ${review.proposedSchedule.jobStartTime} Uhr angelegt.`,
          source: 'CalendarPlanningService',
          timestamp: now
        });
      }

      // Record learning
      learningService.recordDecision(caseId, 'calendar_planning_confirmed', 'confirmed', {
        date: review.proposedSchedule.date,
        jobStartTime: review.proposedSchedule.jobStartTime,
        vehicleId: review.selectedVehicleId,
        employeeCount: review.selectedEmployeeIds.length
      });

      caseService.flushPersistence();

      workflowEngine.emitEvent('CALENDAR_EVENT_CREATED', 'CalendarPlanningService', {
        caseId,
        calendarPlanningReviewId: review.id,
        calendarEventId: eventId
      });

      workflowEngine.emitEvent('CALENDAR_PLANNING_REVIEW_CONFIRMED', 'CalendarPlanningService', {
        caseId,
        calendarPlanningReviewId: review.id
      });

      return review;
    } finally {
      this.isProcessingLock = false;
    }
  }

  rejectCalendarPlanningReview(
    caseId: string,
    reviewId: string,
    reason?: string
  ): CalendarPlanningReview | null {
    const caseItem = caseService.getCase(caseId);
    if (!caseItem || !caseItem.calendarPlanningReviews) return null;

    const review = caseItem.calendarPlanningReviews.find(r => r.id === reviewId);
    if (!review) return null;

    const now = new Date().toISOString();
    review.status = 'rejected';
    review.updatedAt = now;
    if (reason) review.errorMessage = reason;

    if (!caseItem.timeline.some(t => t.title === 'Kalenderplanung abgelehnt')) {
      caseService.addTimelineEntry(caseId, {
        type: 'status_change',
        category: 'Schedule',
        title: 'Kalenderplanung abgelehnt',
        description: reason || 'Terminvorschlag wurde abgelehnt.',
        source: 'CalendarPlanningService',
        timestamp: now
      });
    }

    caseService.flushPersistence();

    return review;
  }
}

export const calendarPlanningService = new CalendarPlanningService();
