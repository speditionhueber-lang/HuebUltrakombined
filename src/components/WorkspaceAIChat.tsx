import { apiFetch } from "@/src/lib/api-client";
import Markdown from 'react-markdown';
import React, { useState, useEffect, useRef } from 'react';
import { BarChart3, BrainCircuit, Download, FileText, Mic, Send, Sparkles } from 'lucide-react';
import { useCustomer } from '@/src/contexts/customer-context';
import { learningService } from '@/src/lib/learning-service';

type Message = {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: string;
  actions?: { label: string; actionType: string; data?: any }[];
};

type RichContentBlock =
  | { type: 'text'; content: string }
  | { type: 'memory'; content: string }
  | { type: 'file'; content: { filename?: string; content?: string; mimeType?: string } }
  | { type: 'chart'; content: { title?: string; data?: Array<{ name: string; value: number }> } };

const MEMORY_STORAGE_KEY = 'hueber_ai_longterm_memory_v1';
const RICH_BLOCK_PATTERN = /```(memory|file|chart)\n([\s\S]*?)\n```/g;

function parseRichContent(content: string): RichContentBlock[] {
  const blocks: RichContentBlock[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;
  RICH_BLOCK_PATTERN.lastIndex = 0;

  while ((match = RICH_BLOCK_PATTERN.exec(content)) !== null) {
    if (match.index > cursor) blocks.push({ type: 'text', content: content.slice(cursor, match.index) });
    if (match[1] === 'memory') {
      blocks.push({ type: 'memory', content: match[2].trim() });
    } else {
      try {
        const parsed = JSON.parse(match[2]);
        blocks.push({ type: match[1] as 'file' | 'chart', content: parsed });
      } catch {
        blocks.push({ type: 'text', content: match[0] });
      }
    }
    cursor = match.index + match[0].length;
  }
  if (cursor < content.length) blocks.push({ type: 'text', content: content.slice(cursor) });
  return blocks.length > 0 ? blocks : [{ type: 'text', content }];
}

function storeMemoryBlocks(content: string) {
  const memoryBlocks = parseRichContent(content).filter((block): block is Extract<RichContentBlock, { type: 'memory' }> => block.type === 'memory');
  if (memoryBlocks.length === 0) return;
  const existing = localStorage.getItem(MEMORY_STORAGE_KEY) || '';
  const additions = memoryBlocks.map(block => `${new Date().toISOString().slice(0, 10)}: ${block.content}`).join('\n');
  localStorage.setItem(MEMORY_STORAGE_KEY, `${existing}\n${additions}`.trim().slice(-20_000));
}

function RichAssistantContent({ content }: { content: string }) {
  const blocks = parseRichContent(content);
  return (
    <div className="space-y-3">
      {blocks.map((block, index) => {
        if (block.type === 'text') {
          return block.content.trim() ? (
            <div key={index} className="markdown-body [&>ul]:list-disc [&>ul]:pl-4 [&>ol]:list-decimal [&>ol]:pl-4 [&>p]:mb-2 [&>h1]:font-bold [&>h2]:font-bold [&>h3]:font-bold [&>strong]:font-bold">
              <Markdown>{block.content}</Markdown>
            </div>
          ) : null;
        }
        if (block.type === 'memory') {
          return (
            <div key={index} className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-[10px] text-amber-800">
              <BrainCircuit className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span><strong className="font-black">Für später gemerkt:</strong> {block.content}</span>
            </div>
          );
        }
        if (block.type === 'file') {
          const filename = block.content.filename || 'KI-Datei.txt';
          return (
            <div key={index} className="flex items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
              <div className="flex min-w-0 items-center gap-2"><FileText className="h-4 w-4 shrink-0 text-blue-600" /><span className="truncate font-bold">{filename}</span></div>
              <button
                type="button"
                onClick={() => {
                  const blob = new Blob([block.content.content || ''], { type: block.content.mimeType || 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = filename;
                  link.click();
                  URL.revokeObjectURL(url);
                }}
                className="flex min-h-9 min-w-9 items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                aria-label={`${filename} herunterladen`}
              >
                <Download className="h-4 w-4" />
              </button>
            </div>
          );
        }

        const data = Array.isArray(block.content.data) ? block.content.data : [];
        const maxValue = Math.max(1, ...data.map(item => Number(item.value) || 0));
        return (
          <div key={index} className="rounded-lg border border-slate-200 bg-white p-3">
            <h4 className="mb-3 flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-600"><BarChart3 className="h-3.5 w-3.5 text-indigo-500" /> {block.content.title || 'KI-Auswertung'}</h4>
            <div className="space-y-2">
              {data.length === 0 ? <p className="text-center text-[10px] text-slate-400">Keine Diagrammdaten vorhanden.</p> : data.map((item, dataIndex) => (
                <div key={`${item.name}-${dataIndex}`} className="grid grid-cols-[70px_1fr_36px] items-center gap-2 text-[9px]">
                  <span className="truncate font-semibold text-slate-500">{item.name}</span>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.max(3, ((Number(item.value) || 0) / maxValue) * 100)}%` }} /></div>
                  <strong className="text-right text-slate-700">{item.value}</strong>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

type WorkspaceAIChatProps = {
  embedded?: boolean;
  onExitMobileAIMode?: () => void;
  storageKey?: string;
};

const INITIAL_MESSAGE: Message = {
  id: 'init',
  role: 'ai',
  content: 'Hallo! Ich bin dein Workspace KI-Assistent. Ich habe Zugriff auf alle Kundendaten, E-Mails, Kalender und Preisberechnungen. Wie kann ich dir heute helfen?',
  timestamp: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
};

function readStoredMessages(storageKey: string): Message[] {
  try {
    const storedMessages = JSON.parse(localStorage.getItem(storageKey) || '[]');
    return Array.isArray(storedMessages) && storedMessages.length > 0 ? storedMessages : [INITIAL_MESSAGE];
  } catch {
    return [INITIAL_MESSAGE];
  }
}

export function WorkspaceAIChat({
  embedded = false,
  onExitMobileAIMode,
  storageKey = 'hueber_ai_workspace_chat_v1'
}: WorkspaceAIChatProps) {
  const { customers } = useCustomer();
  const [messages, setMessages] = useState<Message[]>(() => readStoredMessages(storageKey));
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [logoClickCount, setLogoClickCount] = useState(0);
  const endRef = useRef<HTMLDivElement>(null);
  const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(messages.slice(-100)));
  }, [messages, storageKey]);

  useEffect(() => () => {
    if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    
    const newMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setIsTyping(true);

    learningService.recordLearningRecord({
      actionType: 'workspace_chat_contribution',
      contextType: 'workspace_chat',
      finalDecision: 'shared_context',
      result: 'accepted',
      confidence: 'medium',
      originalData: { messageLength: newMsg.content.length }
    });

    try {
      const memory = localStorage.getItem(MEMORY_STORAGE_KEY) || '';
      const learningSignals = learningService.getLearningRecords().slice(-30).map(record => ({
        actionType: record.actionType,
        contextType: record.contextType,
        result: record.result,
        detectedDecision: record.detectedDecision,
        finalDecision: record.finalDecision,
        createdAt: record.createdAt
      }));
      const response = await apiFetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [...messages, newMsg],
          customers,
          memory,
          learningSignals
        })
      });

      if (response.ok) {
        const data = await response.json();
        storeMemoryBlocks(data.text);
        
        let actions = undefined;
        const lowerResponse = data.text.toLowerCase();
        
        // Simple logic to parse potential actions from response
        if (lowerResponse.includes('wechsle zur standard') || lowerResponse.includes('normale ansicht') || lowerResponse.includes('standard app') || lowerResponse.includes('hauptmenü')) {
           actions = [
             { label: 'Zur Standard App wechseln', actionType: 'switch_standard_app' }
           ];
        } else if (lowerResponse.includes('termin') && (lowerResponse.includes('gespeichert') || lowerResponse.includes('soll ich'))) {
           actions = [
             { label: 'Termin bestätigen', actionType: 'create_event' }
           ];
        } else if (lowerResponse.includes('e-mail') || lowerResponse.includes('entwurf')) {
           actions = [
             { label: 'Entwurf ansehen', actionType: 'view_email' }
           ];
        }

        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'ai',
          content: data.text,
          timestamp: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
          actions
        }]);
      } else {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'ai',
          content: 'Fehler bei der Kommunikation mit Gemini API.',
          timestamp: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
        }]);
      }
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: 'Verbindungsfehler zur KI.',
        timestamp: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleLogoTripleClick = () => {
    const nextCount = logoClickCount + 1;
    if (nextCount >= 3) {
      setLogoClickCount(0);
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
      if (onExitMobileAIMode) {
        onExitMobileAIMode();
      } else {
        window.dispatchEvent(new CustomEvent('exit_mobile_ai_mode'));
      }
      return;
    }
    setLogoClickCount(nextCount);
    if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    clickTimeoutRef.current = setTimeout(() => {
      setLogoClickCount(0);
    }, 2000);
  };

  const handleAction = (actionType: string) => {
     if (actionType === 'switch_standard_app') {
        if (onExitMobileAIMode) {
           onExitMobileAIMode();
        } else {
           window.dispatchEvent(new CustomEvent('exit_mobile_ai_mode'));
        }
     } else if (actionType === 'create_event') {
        window.dispatchEvent(new CustomEvent('toast_notification', { detail: { type: 'success', message: 'Termin wurde erfolgreich im Kalender angelegt.' } }));
     } else if (actionType === 'view_email') {
        window.dispatchEvent(new CustomEvent('toast_notification', { detail: { type: 'info', message: 'E-Mail Entwurf geöffnet...' } }));
     }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 relative">
      {!embedded ? <div className="z-10 shrink-0 border-b border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={handleLogoTripleClick}
            className="flex items-center space-x-3 cursor-pointer select-none active:opacity-75 transition-opacity"
            title="3x tippen für normale Ansicht"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800">KI Workspace Chat</h3>
              <p className="text-[10px] text-slate-500">Verbunden mit CRM &amp; Kalender</p>
            </div>
          </button>
        </div>
      </div> : null}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map(m => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl p-3 ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm'}`}>
                                <div className="text-xs leading-relaxed font-medium markdown-body [&>ul]:list-disc [&>ul]:pl-4 [&>ol]:list-decimal [&>ol]:pl-4 [&>p]:mb-2 [&>h1]:font-bold [&>h2]:font-bold [&>h3]:font-bold [&>strong]:font-bold">
                    {m.role === 'ai' ? <RichAssistantContent content={m.content} /> : <p>{m.content}</p>}
                  </div>
                  
                  {m.actions && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {m.actions.map((act, i) => (
                        <button 
                          key={i}
                          type="button"
                          onClick={() => handleAction(act.actionType)}
                          className="bg-indigo-50 border border-indigo-100 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors"
                        >
                          {act.label}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  <div className={`text-[9px] mt-1.5 ${m.role === 'user' ? 'text-indigo-200 text-right' : 'text-slate-400'}`}>
                    {m.timestamp}
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-4 shadow-sm flex space-x-1 items-center">
                   <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                   <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                   <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={endRef} />
      </div>

      <div className="p-3 bg-white border-t border-slate-200 shrink-0 flex items-center space-x-2">
            <div className="relative flex-1 flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                aria-label="Nachricht an die KI"
                placeholder="Anweisung eingeben... (z.B. Erstelle Termin am...)"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-12 py-3 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              <button 
                type="button"
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                aria-label="Nachricht senden"
                className="absolute right-2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <button 
              type="button"
              className="p-3 md:p-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-xl transition-colors shrink-0 flex items-center justify-center"
              title="Spracheingabe"
              aria-label="Spracheingabe"
            >
              <Mic className="w-6 h-6 md:w-5 md:h-5" />
            </button>
      </div>
    </div>
  );
}
