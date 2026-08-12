import React, { useCallback, useEffect, useState } from 'react';
import { BrainCircuit, Network, Sparkles, Target, Zap } from 'lucide-react';
import { learningService } from '@/src/lib/learning-service';
import type { LearningRecord } from '@/src/lib/types';

type BrainProgress = {
  level: number;
  recordCount: number;
  xp: number;
  xpRequired: number;
};

type CompanyBrainWidgetProps = {
  onOpenAssistant?: () => void;
};

const XP_BY_RESULT: Record<LearningRecord['result'], number> = {
  accepted: 10,
  corrected: 20,
  executed: 10,
  failed: 0,
  rejected: 5,
  reverted: 0
};

export function calculateBrainProgress(records: LearningRecord[]): BrainProgress {
  let level = 1;
  let xp = 0;

  for (const record of records) {
    xp += XP_BY_RESULT[record.result] ?? 0;
    while (xp >= level * 50) {
      xp -= level * 50;
      level += 1;
    }
  }

  return {
    level,
    recordCount: records.length,
    xp,
    xpRequired: level * 50
  };
}

function readProgress(): BrainProgress {
  return calculateBrainProgress(learningService.getLearningRecords());
}

export function CompanyBrainWidget({ onOpenAssistant }: CompanyBrainWidgetProps) {
  const [progress, setProgress] = useState<BrainProgress>(readProgress);
  const refresh = useCallback(() => setProgress(readProgress()), []);

  useEffect(() => learningService.subscribe(refresh), [refresh]);

  const progressPercent = Math.min(100, Math.round((progress.xp / progress.xpRequired) * 100));

  return (
    <section
      aria-label="Unternehmens-Gehirn"
      className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 p-4 text-white shadow-xl md:p-5"
    >
      <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-1/3 h-52 w-52 rounded-full bg-fuchsia-500/10 blur-3xl" />

      <div className="relative z-10 grid gap-4 lg:grid-cols-[1.1fr_0.9fr] lg:items-stretch">
        <div className="flex min-w-0 flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex min-w-0 items-center gap-4">
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-indigo-300/30 bg-gradient-to-br from-indigo-500 via-purple-600 to-fuchsia-600 shadow-[0_0_38px_rgba(99,102,241,0.38)] md:h-24 md:w-24">
              <div className="absolute inset-2 animate-pulse rounded-full border border-white/20" />
              <Network className="h-9 w-9 md:h-11 md:w-11" />
              <Sparkles className="absolute right-1 top-2 h-4 w-4 text-fuchsia-200" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-fuchsia-300">Unternehmens-Gehirn</p>
              <h2 className="mt-1 text-base font-black tracking-tight md:text-lg">
                Die KI lernt mit jedem Ihrer Klicks. Level {progress.level}
              </h2>
              <p className="mt-1 text-[10px] text-slate-400">
                {progress.recordCount} {progress.recordCount === 1 ? 'gespeichertes Lernsignal' : 'gespeicherte Lernsignale'} aus Ihren Entscheidungen
              </p>
            </div>
          </div>

          <div className="min-w-[180px] sm:max-w-[230px] sm:flex-1">
            <div className="mb-1.5 flex items-center justify-between text-[10px] font-black uppercase tracking-wider">
              <span className="text-indigo-200">XP {progress.xp}</span>
              <span className="text-slate-400">Zur nächsten Stufe {progress.xpRequired}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-800" aria-label={`${progressPercent} Prozent bis zur nächsten Stufe`}>
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 transition-all duration-700"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] p-3.5 backdrop-blur-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-fuchsia-500/15 text-fuchsia-200">
            <Target className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <BrainCircuit className="h-3.5 w-3.5 text-indigo-300" />
              <h3 className="text-xs font-black">KI-Training</h3>
            </div>
            <p className="mt-1 text-[10px] leading-relaxed text-slate-300">
              Ihre KI braucht Input, um autonomer zu werden. Kategorisieren Sie E-Mails oder bewerten Sie Aufgaben, um das Modell zu verbessern.
            </p>
            <button
              type="button"
              onClick={onOpenAssistant}
              className="mt-2 inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-indigo-500/15 px-2.5 py-1.5 text-left text-[10px] font-bold text-indigo-200 transition-colors hover:bg-indigo-500/25"
            >
              <Zap className="h-3.5 w-3.5" /> Nutzen Sie den Assistenten, um XP zu sammeln!
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
