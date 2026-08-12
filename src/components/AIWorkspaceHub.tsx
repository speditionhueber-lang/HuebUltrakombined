import React, { useState, useEffect } from 'react';
import { BrainCircuit, MessageSquareText, Sparkles } from 'lucide-react';
import { AIAssistantWidget } from './AIAssistantWidget';
import { AIControlCenter } from './AIControlCenter';
import { WorkspaceAIChat } from './WorkspaceAIChat';
import { caseService } from '@/src/lib/case-service';

type AIWorkspace = 'assistant' | 'workspace-chat' | 'control-center';

type AIWorkspaceHubProps = {
  onExitMobileAIMode?: () => void;
};

const WORKSPACES: Array<{
  id: AIWorkspace;
  title: string;
  mobileTitle: string;
  description: string;
  icon: any;
}> = [
  {
    id: 'assistant',
    title: 'KI-Assistent',
    mobileTitle: 'Assistent',
    description: 'Vorschläge & Aufgaben',
    icon: Sparkles
  },
  {
    id: 'workspace-chat',
    title: 'HueberAI Chat',
    mobileTitle: 'HueberAI',
    description: 'Workspace Chat',
    icon: MessageSquareText
  },
  {
    id: 'control-center',
    title: 'KI Steuerzentrale',
    mobileTitle: 'Zentrale',
    description: 'Aktivitäten & Prozesse',
    icon: BrainCircuit
  }
];

export function AIWorkspaceHub({ onExitMobileAIMode }: AIWorkspaceHubProps) {
  const [activeWorkspace, setActiveWorkspace] = useState<AIWorkspace>('assistant');
  const [assistantCount, setAssistantCount] = useState(0);
  const [leftPanelWidth, setLeftPanelWidth] = useState(25);
  const [isControlCenterActive, setIsControlCenterActive] = useState(() => {
    return localStorage.getItem('hueber_ai_control_center_active') === 'true';
  });

  const toggleControlCenter = () => {
    const newState = !isControlCenterActive;
    setIsControlCenterActive(newState);
    localStorage.setItem('hueber_ai_control_center_active', newState ? 'true' : 'false');
  };

  useEffect(() => {
    const refreshCounts = () => {
      try {
        const cached = JSON.parse(localStorage.getItem('hueber_ai_assistant_cache_v2') || '{}');
        const anfragen = Array.isArray(cached.anfragen) ? cached.anfragen : [];
        const wichtig = Array.isArray(cached.wichtig) ? cached.wichtig : [];
        const handledItems = Array.isArray(cached.handledItems) ? cached.handledItems : [];
        
        const anfragenCount = anfragen.filter((item: any) => !handledItems.includes(item.id)).length;
        const wichtigCount = wichtig.filter((item: any) => !handledItems.includes(item.id)).length;
        
        setAssistantCount(anfragenCount + wichtigCount);
      } catch {
        setAssistantCount(0);
      }
    };
    refreshCounts();
    window.addEventListener('assistant_cache_updated', refreshCounts);
    return () => window.removeEventListener('assistant_cache_updated', refreshCounts);
  }, []);

  return (
    <div id="ai-tab-container" className="flex h-full min-h-0 w-full flex-col md:flex-row overflow-hidden bg-slate-100 relative" aria-label="AI und Workspace">
      
      {/* Left Navigation Panel */}
      <aside 
        className="shrink-0 border-b md:border-b-0 md:border-r border-slate-200 bg-white p-2.5 md:p-4 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-y-auto"
        style={{ width: typeof window !== 'undefined' && window.innerWidth >= 768 ? `${leftPanelWidth}%` : '100%' }}
      >
        <div className="flex md:flex-col gap-2 min-w-max md:min-w-0" aria-label="KI-Workspaces">
          {WORKSPACES.map(workspace => {
            const Icon = workspace.icon;
            const isActive = activeWorkspace === workspace.id;
            const badgeCount = workspace.id === 'assistant' ? assistantCount : 0;
            return (
              <button
                key={workspace.id}
                type="button"
                onClick={() => setActiveWorkspace(workspace.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative flex min-h-[54px] min-w-0 items-center justify-center gap-3 rounded-xl px-3 py-3 text-left transition-all ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 border border-transparent'
                }`}
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${isActive ? 'bg-indigo-100/50' : 'bg-slate-100'}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="hidden md:block min-w-0 flex-1">
                  <span className="block truncate text-sm font-black">{workspace.title}</span>
                  <span className="mt-0.5 block truncate text-[11px] text-slate-400">{workspace.description}</span>
                </span>
                {badgeCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 md:top-auto md:right-3 md:relative flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white md:ring-0">
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </aside>

      {/* Resizer */}
      <div
        className="hidden md:flex w-2 cursor-col-resize hover:bg-slate-300 active:bg-slate-400 shrink-0 z-10 mx-[-4px] relative"
        onMouseDown={(e) => {
          e.preventDefault();
          const startX = e.clientX;
          const startWidth = leftPanelWidth;
          const onMouseMove = (moveEvent: MouseEvent) => {
            const deltaX = moveEvent.clientX - startX;
            const containerWidth = document.getElementById('ai-tab-container')?.clientWidth || 1000;
            const deltaPercent = (deltaX / containerWidth) * 100;
            setLeftPanelWidth(Math.max(15, Math.min(50, startWidth + deltaPercent)));
          };
          const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
          };
          document.addEventListener('mousemove', onMouseMove);
          document.addEventListener('mouseup', onMouseUp);
        }}
      />

      {/* Main Content Area */}
      <main className="min-h-0 flex-1 flex flex-col overflow-hidden p-0 md:p-4 bg-slate-50/50">
        <div className="h-full min-h-0 overflow-hidden bg-white md:rounded-2xl md:border md:border-slate-200 md:shadow-sm flex flex-col relative">
          
          {/* Main Top Header Switch for KI Steuerzentrale */}
          {activeWorkspace === 'control-center' && (
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 shrink-0">
              <div className="flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-indigo-600" />
                <div>
                  <h2 className="text-sm font-bold text-slate-900">KI Steuerzentrale</h2>
                  <p className="text-[11px] text-slate-500">Zentrale Steuerung für Automatisierungen & KI-Dienste</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-bold ${isControlCenterActive ? 'text-indigo-600' : 'text-slate-400'}`}>
                  {isControlCenterActive ? 'AKTIVIERT' : 'DEAKTIVIERT'}
                </span>
                <button
                  type="button"
                  onClick={toggleControlCenter}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${
                    isControlCenterActive ? 'bg-indigo-600' : 'bg-slate-200'
                  }`}
                  role="switch"
                  aria-checked={isControlCenterActive}
                >
                  <span className="sr-only">KI Steuerzentrale {isControlCenterActive ? 'deaktivieren' : 'aktivieren'}</span>
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isControlCenterActive ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* Conditional rendering based on workspace and active state */}
          {activeWorkspace === 'control-center' ? (
            isControlCenterActive ? (
              <div className="flex-1 min-h-0 overflow-hidden">
                <AIControlCenter 
                  onExitMobileAIMode={onExitMobileAIMode} 
                  onOpenAssistant={() => setActiveWorkspace('assistant')} 
                />
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
                <BrainCircuit className="h-16 w-16 text-slate-300 mb-4" />
                <h3 className="text-lg font-bold text-slate-700 mb-2">KI Steuerzentrale ist deaktiviert</h3>
                <p className="max-w-md text-sm mb-6">
                  Aktivieren Sie die Steuerzentrale, um Zugriff auf die vollumfänglichen Automatisierungs-, Überwachungs- und KI-Dienste zu erhalten. Im deaktivierten Zustand laufen keine automatisierten Hintergrundprozesse.
                </p>
                <button
                  onClick={toggleControlCenter}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg shadow-sm transition-colors"
                >
                  KI Steuerzentrale aktivieren
                </button>
              </div>
            )
          ) : null}

          {activeWorkspace === 'assistant' ? <AIAssistantWidget /> : null}
          {activeWorkspace === 'workspace-chat' ? (
            <WorkspaceAIChat
              onExitMobileAIMode={onExitMobileAIMode}
              storageKey="hueber_ai_workspace_chat_v1"
            />
          ) : null}
        </div>
      </main>
    </div>
  );
}
