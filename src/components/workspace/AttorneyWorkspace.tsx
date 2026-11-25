/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Briefcase, Calendar, AlertCircle, ChevronRight, Landmark, Scale, Unlink } from 'lucide-react';
import { Case, isProposedHearingDate } from '../../types';

interface AttorneyWorkspaceProps {
  attorneyName: string;
  trackedCases: Case[];
  onSelectCase: (c: Case) => void;
  onUntrackCase: (c: Case) => void;
  selectedCaseId?: string;
}

const LABEL = 'text-[10px] uppercase tracking-wider font-semibold text-slate-500';

/** Hearings dated today or later, soonest first (dates are ISO yyyy-mm-dd). */
function upcomingHearings(cases: Case[]): string[] {
  const today = new Date().toISOString().slice(0, 10);
  return cases
    .map(c => c.nextHearingDate)
    .filter((d): d is string => !!d && d >= today)
    .sort();
}

export default function AttorneyWorkspace({
  attorneyName,
  trackedCases,
  onSelectCase,
  onUntrackCase,
  selectedCaseId
}: AttorneyWorkspaceProps) {
  const [selectedCase, setSelectedCase] = useState<Case | null>(
    trackedCases.find(c => c.id === selectedCaseId) || trackedCases[0] || null
  );

  const handleCaseSelect = (c: Case) => {
    setSelectedCase(c);
    onSelectCase(c);
  };

  const hearings = upcomingHearings(trackedCases);
  const stats = [
    { label: 'Tracked Cases', value: String(trackedCases.length) },
    { label: 'Upcoming Hearings', value: String(hearings.length) },
    { label: 'Next Hearing', value: hearings[0] || '—' }
  ];

  return (
    <div className="space-y-6 text-slate-900">

      {/* Welcome Banner Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
        <div className="flex items-center gap-4">
          <div className="h-11 w-11 shrink-0 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center">
            <Scale className="h-5 w-5 text-brand-600" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-slate-950">Welcome, {attorneyName}</h2>
            <p className="text-xs text-slate-500 mt-1">
              Access, monitor, and analyze your tracked litigation portfolios in real-time.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 w-full md:w-auto">
          {stats.map(s => (
            <div key={s.label} className="bg-brand-50/60 border border-brand-100 rounded-xl px-4 py-2.5 min-w-[120px]">
              <span className={`${LABEL} block`}>{s.label}</span>
              <span className="text-brand-700 font-bold text-base font-mono">{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Case Grid Layout */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono flex items-center space-x-1.5">
            <Briefcase className="h-3.5 w-3.5 text-slate-400" />
            <span>Active Case Portfolio Directory</span>
          </h3>
        </div>

        {trackedCases.length === 0 ? (
          <div className="text-center py-20 text-slate-400 border border-dashed border-slate-200 bg-white rounded-2xl space-y-3">
            <AlertCircle className="h-8 w-8 mx-auto text-slate-300" />
            <p className="text-xs font-semibold text-slate-600">No active portfolios listed</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trackedCases.map(c => {
              const isSel = selectedCase?.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => handleCaseSelect(c)}
                  className={`bg-white border rounded-2xl shadow-xs flex flex-col h-full overflow-hidden transition-all cursor-pointer ${
                    isSel
                      ? 'border-brand-500 ring-2 ring-brand-100'
                      : 'border-slate-200 hover:border-brand-200 hover:shadow-md'
                  }`}
                  id={`attorney-case-card-${c.id}`}
                >
                  {/* Accent bar marks the selected file */}
                  <div className={`h-1 ${isSel ? 'bg-brand-600' : 'bg-transparent'}`} />

                  <div className="p-5 flex-1 flex flex-col gap-4">
                    {/* Header: Number and Category */}
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-[11px] font-semibold font-mono text-brand-700 bg-brand-50 border border-brand-100 px-2 py-0.5 rounded whitespace-nowrap">
                        {c.caseNumber}
                      </span>
                      {c.category && (
                        <span className="text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded truncate" title={c.category}>
                          {c.category}
                        </span>
                      )}
                    </div>

                    {/* Title & Court */}
                    <div>
                      <h4 className="text-[15px] font-semibold text-slate-900 line-clamp-2 leading-snug" title={c.title}>
                        {c.title}
                      </h4>
                      {c.court && (
                        <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1.5 min-w-0" title={c.court}>
                          <Landmark className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{c.court}</span>
                        </p>
                      )}
                    </div>

                    {/* Judge & Hearing */}
                    <div className="grid grid-cols-2 gap-3 bg-slate-50 border border-slate-100 rounded-xl p-3">
                      <div className="min-w-0">
                        <div className={LABEL}>Presiding Judge</div>
                        <div className="text-[13px] font-semibold text-slate-800 mt-1 leading-snug line-clamp-2" title={c.judge}>
                          {c.judge || "Hon'ble Bench"}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className={LABEL}>Next Hearing</div>
                        {c.nextHearingDate ? (
                          <div className="mt-1">
                            <div className="text-[13px] font-semibold text-rose-600 flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 shrink-0" />
                              <span>{c.nextHearingDate}</span>
                            </div>
                            {isProposedHearingDate(c) && (
                              <span className="inline-block mt-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-px rounded">
                                Proposed
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="text-[13px] text-slate-400 mt-1">Not scheduled</div>
                        )}
                      </div>
                    </div>

                    {/* Current status */}
                    <div className="mt-auto">
                      <div className={LABEL}>Current Status</div>
                      <div className="flex items-start gap-2 mt-1">
                        <span className="status-dot h-2 w-2 bg-amber-500 mt-1.5 shrink-0" />
                        <span className="text-[13px] font-semibold text-amber-800 leading-snug line-clamp-2">
                          {c.currentStatus || 'Status unavailable'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUntrackCase(c);
                      }}
                      className="text-slate-500 hover:text-rose-600 hover:bg-rose-50 font-semibold text-xs py-1.5 px-2.5 rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 whitespace-nowrap"
                      title="Unbind Case"
                      id={`btn-attorney-unbind-${c.id}`}
                    >
                      <Unlink className="h-3.5 w-3.5" />
                      <span>Unbind Case</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCaseSelect(c);
                      }}
                      className="bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs py-1.5 px-3.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap shadow-xs"
                    >
                      <span>Open File</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
