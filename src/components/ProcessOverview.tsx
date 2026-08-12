import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  CircleDot,
  Clock3,
  ListChecks,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Zap
} from 'lucide-react';
import { automationService, INITIAL_LOW_RISK_ACTIONS } from '@/src/lib/automation-service';
import { caseService } from '@/src/lib/case-service';
import type { Case, CaseStatus } from '@/src/lib/case-service';
import { workflowExceptionService } from '@/src/lib/workflow-exception-service';

type ProcessOverviewProps = {
  onOpenActivity: () => void;
  onOpenAutomation: () => void;
};

type ProcessStage = {
  id: string;
  label: string;
  shortLabel: string;
  statuses: CaseStatus[];
};

type OverviewSnapshot = {
  cases: Case[];
  openExceptions: number;
  completedExecutions: number;
  enabledPolicies: number;
};

const PROCESS_STAGES: ProcessStage[] = [
  { id: 'inbox', label: 'Eingang & Analyse', shortLabel: 'Eingang', statuses: ['Draft', 'Analyzing'] },
  { id: 'clarification', label: 'Kundenklärung', shortLabel: 'Klärung', statuses: ['Waiting for Customer'] },
  { id: 'offer', label: 'Angebot & Freigabe', shortLabel: 'Angebot', statuses: ['Waiting for Offer', 'Offer Created', 'Waiting for Confirmation'] },
  { id: 'planning', label: 'Planung & Disposition', shortLabel: 'Planung', statuses: ['Planning', 'Scheduled'] },
  { id: 'execution', label: 'Durchführung', shortLabel: 'Umzug', statuses: ['In Progress'] },
  { id: 'done', label: 'Abschluss', shortLabel: 'Abschluss', statuses: ['Completed', 'Archived'] }
];

const STATUS_LABELS: Record<CaseStatus, string> = {
  Draft: 'Entwurf',
  Analyzing: 'Wird analysiert',
  'Waiting for Customer': 'Wartet auf Kunde',
  'Waiting for Offer': 'Angebot vorbereiten',
  'Offer Created': 'Angebot erstellt',
  'Waiting for Confirmation': 'Wartet auf Bestätigung',
  Planning: 'In Planung',
  Scheduled: 'Eingeplant',
  'In Progress': 'In Durchführung',
  Completed: 'Abgeschlossen',
  Cancelled: 'Storniert',
  Archived: 'Archiviert'
};

function getStageIndex(status: CaseStatus): number {
  return PROCESS_STAGES.findIndex(stage => stage.statuses.includes(status));
}

function readSnapshot(): OverviewSnapshot {
  const policies = automationService.getPolicies();
  const executions = automationService.getExecutions();
  return {
    cases: caseService.getAllCases(),
    openExceptions: workflowExceptionService.getOpenExceptions().length,
    completedExecutions: executions.filter(item => item.status === 'completed' || item.status === 'dry_run').length,
    enabledPolicies: policies.filter(policy => policy.enabled).length
  };
}

function formatRelativeDate(value: string): string {
  const timestamp = new Date(value).getTime();
  const diffMinutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000));
  if (diffMinutes < 1) return 'gerade eben';
  if (diffMinutes < 60) return `vor ${diffMinutes} Min.`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `vor ${diffHours} Std.`;
  return new Date(value).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

export function ProcessOverview({ onOpenActivity, onOpenAutomation }: ProcessOverviewProps) {
  const [snapshot, setSnapshot] = useState<OverviewSnapshot>(readSnapshot);

  const refresh = useCallback(() => setSnapshot(readSnapshot()), []);

  useEffect(() => {
    const unsubscribe = caseService.subscribe(refresh);
    const interval = window.setInterval(refresh, 4_000);
    return () => {
      unsubscribe();
      window.clearInterval(interval);
    };
  }, [refresh]);

  const metrics = useMemo(() => {
    const activeCases = snapshot.cases.filter(item => !['Completed', 'Cancelled', 'Archived'].includes(item.status));
    const completedCases = snapshot.cases.filter(item => item.status === 'Completed' || item.status === 'Archived');
    const openTasks = snapshot.cases.reduce(
      (sum, item) => sum + item.tasks.filter(task => ['Open', 'Waiting', 'In Progress'].includes(task.status)).length,
      0
    );
    const completedTasks = snapshot.cases.reduce(
      (sum, item) => sum + item.tasks.filter(task => task.status === 'Completed').length,
      0
    );
    const criticalCases = activeCases.filter(item => (item.health?.score ?? 100) < 50).length;
    return {
      activeCases,
      completedCases,
      openTasks,
      completedTasks,
      criticalCases
    };
  }, [snapshot]);

  const stageCounts = useMemo(
    () => PROCESS_STAGES.map(stage => snapshot.cases.filter(item => stage.statuses.includes(item.status)).length),
    [snapshot.cases]
  );

  const recentCases = useMemo(
    () => [...metrics.activeCases]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5),
    [metrics.activeCases]
  );

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-5" aria-label="Prozessübersicht">
      <div className="mx-auto max-w-5xl space-y-4">
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Workflow-Kennzahlen">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between"><BriefcaseBusiness className="h-4 w-4 text-indigo-500" /><span className="text-[10px] font-bold uppercase text-slate-400">Aktiv</span></div>
            <p className="mt-2 text-2xl font-black text-slate-900">{metrics.activeCases.length}</p>
            <p className="text-[11px] text-slate-500">laufende Vorgänge</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between"><ListChecks className="h-4 w-4 text-blue-500" /><span className="text-[10px] font-bold uppercase text-slate-400">Aufgaben</span></div>
            <p className="mt-2 text-2xl font-black text-slate-900">{metrics.openTasks}</p>
            <p className="text-[11px] text-slate-500">offen · {metrics.completedTasks} erledigt</p>
          </div>
          <div className={`rounded-xl border bg-white p-4 shadow-sm ${snapshot.openExceptions + metrics.criticalCases > 0 ? 'border-amber-200' : 'border-slate-200'}`}>
            <div className="flex items-center justify-between"><AlertTriangle className="h-4 w-4 text-amber-500" /><span className="text-[10px] font-bold uppercase text-slate-400">Prüfen</span></div>
            <p className="mt-2 text-2xl font-black text-slate-900">{snapshot.openExceptions + metrics.criticalCases}</p>
            <p className="text-[11px] text-slate-500">Ausnahmen & Risiken</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between"><CheckCircle2 className="h-4 w-4 text-emerald-500" /><span className="text-[10px] font-bold uppercase text-slate-400">Erledigt</span></div>
            <p className="mt-2 text-2xl font-black text-slate-900">{metrics.completedCases.length}</p>
            <p className="text-[11px] text-slate-500">abgeschlossene Cases</p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-black text-slate-900"><TrendingUp className="h-4 w-4 text-indigo-500" /> Prozess-Pipeline</h3>
              <p className="mt-0.5 text-[11px] text-slate-500">Wo sich alle Vorgänge gerade befinden</p>
            </div>
            <button onClick={onOpenActivity} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-2 text-[11px] font-bold text-indigo-700 transition-colors hover:bg-indigo-100">
              Alle Vorgänge <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
            {PROCESS_STAGES.map((stage, index) => (
              <div key={stage.id} className="relative rounded-xl border border-slate-200 bg-slate-50 p-3">
                {index < PROCESS_STAGES.length - 1 ? <div className="absolute -right-2 top-1/2 z-10 hidden h-px w-2 bg-slate-300 xl:block" /> : null}
                <div className="flex items-center justify-between">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${stageCounts[index] > 0 ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400 ring-1 ring-slate-200'}`}>{index + 1}</span>
                  <span className="text-lg font-black text-slate-800">{stageCounts[index]}</span>
                </div>
                <p className="mt-2 text-[11px] font-bold text-slate-700">{stage.shortLabel}</p>
                <p className="text-[9px] text-slate-400">{stage.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.45fr_0.85fr]">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div>
                <h3 className="flex items-center gap-2 text-sm font-black text-slate-900"><Activity className="h-4 w-4 text-indigo-500" /> Aktuelle Vorgänge</h3>
                <p className="text-[10px] text-slate-500">Nächster Schritt und Fortschritt auf einen Blick</p>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">Live</span>
            </div>
            <div className="divide-y divide-slate-100">
              {recentCases.length === 0 ? (
                <div className="p-8 text-center">
                  <CircleDot className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-2 text-xs font-semibold text-slate-500">Noch keine laufenden Vorgänge</p>
                  <p className="mt-1 text-[10px] text-slate-400">Neue E-Mails und Kundenanfragen erscheinen automatisch hier.</p>
                </div>
              ) : recentCases.map(caseItem => {
                const stageIndex = getStageIndex(caseItem.status);
                const progress = stageIndex < 0 ? 0 : Math.round(((stageIndex + 1) / PROCESS_STAGES.length) * 100);
                const openCaseTasks = caseItem.tasks.filter(task => ['Open', 'Waiting', 'In Progress'].includes(task.status)).length;
                return (
                  <button key={caseItem.id} onClick={onOpenActivity} className="block w-full p-4 text-left transition-colors hover:bg-slate-50">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-xs font-black text-slate-900">{caseItem.title}</p>
                          {caseItem.priority === 'high' ? <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[9px] font-black uppercase text-rose-600">Priorität</span> : null}
                        </div>
                        <p className="mt-1 truncate text-[10px] text-slate-500">{caseItem.health?.nextStep || STATUS_LABELS[caseItem.status]}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[10px] font-bold text-slate-600">{progress}%</p>
                        <p className="text-[9px] text-slate-400">{formatRelativeDate(caseItem.updatedAt)}</p>
                      </div>
                    </div>
                    <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div className={`h-full rounded-full ${caseItem.health && caseItem.health.score < 50 ? 'bg-amber-500' : 'bg-indigo-500'}`} style={{ width: `${progress}%` }} />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[9px] font-semibold text-slate-400">
                      <span>{STATUS_LABELS[caseItem.status]}</span>
                      <span>{openCaseTasks} offene Aufgabe{openCaseTasks === 1 ? '' : 'n'} · Health {caseItem.health?.score ?? 100}%</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-fuchsia-500" /><h3 className="text-xs font-black text-slate-900">Automatisierungsstatus</h3></div>
              <div className="mt-3 space-y-2 text-[10px]">
                <div className="flex justify-between"><span className="text-slate-500">Aktive Regeln</span><strong className="text-slate-800">{snapshot.enabledPolicies}/{INITIAL_LOW_RISK_ACTIONS.length}</strong></div>
                <div className="flex justify-between"><span className="text-slate-500">Sicher ausgeführt</span><strong className="text-emerald-600">{snapshot.completedExecutions}</strong></div>
                <div className="flex justify-between"><span className="text-slate-500">Manuelle Prüfungen</span><strong className="text-amber-600">{snapshot.openExceptions}</strong></div>
              </div>
              <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-emerald-50 p-2 text-[9px] font-semibold text-emerald-700">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0" /> Kritische Aktionen bleiben bestätigungspflichtig
              </div>
              <button onClick={onOpenAutomation} className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-[11px] font-bold text-white transition-colors hover:bg-indigo-700">
                <Zap className="h-3.5 w-3.5" /> Automatisierung öffnen
              </button>
            </div>
          </div>
        </section>

        <div className="flex items-center justify-center gap-1.5 pb-2 text-[9px] text-slate-400">
          <Clock3 className="h-3 w-3" /> Übersicht aktualisiert sich automatisch
        </div>
      </div>
    </div>
  );
}
