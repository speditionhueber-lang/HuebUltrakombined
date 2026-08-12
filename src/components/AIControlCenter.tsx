import React, { useState } from 'react';
import { Activity, LayoutDashboard, ListTree, MessageSquare, Zap } from 'lucide-react';
import { ActivityFeed } from './ActivityFeed';
import { AutomationControlCenter } from './AutomationControlCenter';
import { CompanyBrainWidget } from './CompanyBrainWidget';
import { ProcessOverview } from './ProcessOverview';
import { WorkspaceAIChat } from './WorkspaceAIChat';

type ControlCenterTab = 'chat' | 'activity' | 'automation';
type ActivityView = 'overview' | 'timeline';

type AIControlCenterProps = {
  onExitMobileAIMode?: () => void;
  onOpenAssistant: () => void;
};

const TABS: Array<{
  id: ControlCenterTab;
  label: string;
  icon: typeof MessageSquare;
}> = [
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'activity', label: 'Aktivitäten', icon: Activity },
  { id: 'automation', label: 'Automatisierung', icon: Zap }
];

export function AIControlCenter({ onExitMobileAIMode, onOpenAssistant }: AIControlCenterProps) {
  const [activeTab, setActiveTab] = useState<ControlCenterTab>('chat');
  const [activityView, setActivityView] = useState<ActivityView>('overview');

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-50" aria-label="KI-Steuerzentrale">
      <div className="shrink-0 space-y-3 border-b border-slate-200 bg-slate-100/80 p-3 md:p-4">
        <CompanyBrainWidget onOpenAssistant={onOpenAssistant} />

        <nav className="grid grid-cols-3 gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm" aria-label="Bereiche der KI-Steuerzentrale">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-2 text-[11px] font-bold transition-all md:text-xs ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className={tab.id === 'automation' ? 'hidden min-[390px]:inline' : ''}>{tab.label}</span>
                {tab.id === 'automation' ? <span className="min-[390px]:hidden">Automatik</span> : null}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {activeTab === 'chat' ? (
          <WorkspaceAIChat
            embedded
            onExitMobileAIMode={onExitMobileAIMode}
            storageKey="hueber_ai_control_center_chat_v1"
          />
        ) : null}

        {activeTab === 'activity' ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex shrink-0 justify-center border-b border-slate-200 bg-white p-2">
              <div className="grid w-full max-w-md grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setActivityView('overview')}
                  className={`flex min-h-9 items-center justify-center gap-1.5 rounded-md text-[11px] font-bold ${activityView === 'overview' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}
                >
                  <LayoutDashboard className="h-3.5 w-3.5" /> Prozessübersicht
                </button>
                <button
                  type="button"
                  onClick={() => setActivityView('timeline')}
                  className={`flex min-h-9 items-center justify-center gap-1.5 rounded-md text-[11px] font-bold ${activityView === 'timeline' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}
                >
                  <ListTree className="h-3.5 w-3.5" /> Verlauf
                </button>
              </div>
            </div>
            {activityView === 'overview' ? (
              <ProcessOverview
                onOpenActivity={() => setActivityView('timeline')}
                onOpenAutomation={() => setActiveTab('automation')}
              />
            ) : (
              <ActivityFeed />
            )}
          </div>
        ) : null}

        {activeTab === 'automation' ? <AutomationControlCenter /> : null}
      </div>
    </div>
  );
}
