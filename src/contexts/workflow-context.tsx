import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { workflowEngine, WorkflowEvent, WorkflowEventType } from '../lib/workflow-engine';
import '../lib/decision-engine'; // Initialize DecisionEngine

interface WorkflowContextType {
  emitEvent: typeof workflowEngine.emitEvent;
  events: WorkflowEvent[];
  subscribe: typeof workflowEngine.subscribe;
  updateEventStatus: typeof workflowEngine.updateEventStatus;
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

export function WorkflowProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<WorkflowEvent[]>(workflowEngine.getEvents());

  useEffect(() => {
    const handleEvent = () => {
      queueMicrotask(() => {
        setEvents(workflowEngine.getEvents());
      });
    };

    const unsubscribeEvent = workflowEngine.subscribe('event', handleEvent);
    const unsubscribeUpdate = workflowEngine.subscribe('eventUpdated' as any, handleEvent);

    return () => {
      unsubscribeEvent();
      unsubscribeUpdate();
    };
  }, []);

  return (
    <WorkflowContext.Provider
      value={{
        emitEvent: workflowEngine.emitEvent.bind(workflowEngine),
        events,
        subscribe: workflowEngine.subscribe.bind(workflowEngine),
        updateEventStatus: workflowEngine.updateEventStatus.bind(workflowEngine),
      }}
    >
      {children}
    </WorkflowContext.Provider>
  );
}

export function useWorkflow() {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error('useWorkflow must be used within a WorkflowProvider');
  }
  return context;
}
