import React from 'react';
import { Calendar, CheckCircle2, Scale, Briefcase, ArrowUpRight } from 'lucide-react';
import { Case } from '../../types';

interface CaseOverviewCardProps {
  caseItem: Case;
  onUntrackCase?: (c: Case) => void;
}

// Shared typography so every highlight card reads the same
const CARD_LABEL = 'text-[10px] uppercase tracking-wider font-mono font-bold flex items-center gap-1 min-h-[14px]';
const CARD_VALUE = 'text-sm font-bold leading-snug mt-1.5 break-words';

/** Case identifiers, status, hearing, courtroom, judge and counsel at a glance. */
export default function CaseOverviewCard({ caseItem, onUntrackCase }: CaseOverviewCardProps) {
  return (
    <div className="bg-white text-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 flex-wrap gap-1.5">
            <span className="text-xs uppercase font-mono bg-sky-900 text-amber-400 font-bold px-2.5 py-1 rounded shadow-xs">
              CNR: {caseItem.cnrNumber || 'MHOS060012522023'}
            </span>
            <span className="text-[11px] text-slate-700 font-mono bg-slate-100 px-2 py-1 rounded border border-slate-200 font-semibold">
              Reg no: {caseItem.regNo || '57/2023'}
            </span>
            <span className="text-[11px] text-slate-700 font-mono bg-slate-100 px-2 py-1 rounded border border-slate-200 font-semibold">
              Filing no: {caseItem.filingNo || '755/2023'}
            </span>
            <span className="text-[11px] text-slate-500 font-mono bg-slate-100 px-2 py-1 rounded border border-slate-200">
              Last Synced: {new Date(caseItem.lastUpdated).toLocaleString()}
            </span>
            {caseItem.source && (
              <span className={`text-[11px] font-semibold px-2 py-1 rounded border flex items-center space-x-1 ${
                caseItem.source === 'Indian Kanoon'
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : 'bg-sky-50 text-sky-700 border-sky-200'
              }`}>
                <span>{caseItem.source === 'Indian Kanoon' ? '📜 Indian Kanoon' : '🏛️ eCourts India'}</span>
              </span>
            )}
            {caseItem.docUrl && (
              <a
                href={caseItem.docUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-semibold bg-purple-700 hover:bg-purple-800 text-white px-2.5 py-1 rounded flex items-center space-x-1 transition-colors"
              >
                <span>View on Indian Kanoon</span>
                <ArrowUpRight className="h-3 w-3" />
              </a>
            )}
            {onUntrackCase && (
              <button
                type="button"
                onClick={() => onUntrackCase(caseItem)}
                className="text-[11px] font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2.5 py-1 rounded flex items-center space-x-1 transition-colors cursor-pointer"
                id="btn-detail-unbind-case"
                title="Unbind this case from your dashboard"
              >
                <span>Unbind Case</span>
              </button>
            )}
          </div>
          <h2 className="text-2xl font-display font-bold text-slate-950 mt-1 leading-snug">
            {caseItem.title}
          </h2>
          <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-semibold text-slate-800"><strong className="text-slate-500 font-medium">Court:</strong> {caseItem.court}</span>
            <span className="text-slate-300">•</span>
            <span><strong className="text-slate-500 font-medium">Case Type:</strong> {caseItem.caseType || caseItem.category}</span>
            <span className="text-slate-300">•</span>
            <span><strong className="text-slate-500 font-medium">Case Category:</strong> {caseItem.actsAndSections || caseItem.category}</span>
          </div>
        </div>
      </div>

      {/* Highlight status & Representation details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t border-slate-100">
        <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
          <div className={`${CARD_LABEL} text-slate-500`}>Current Status</div>
          <div className={`${CARD_VALUE} text-amber-700`}>{caseItem.currentStatus || 'DECIDED / REPORTED'}</div>
        </div>
        <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
          <div className={`${CARD_LABEL} text-slate-500`}>Next Hearing</div>
          <div className={`${CARD_VALUE} text-slate-800`}>
            {caseItem.nextHearingDate ? (
              <div>
                <span className="text-rose-600 flex items-center space-x-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{caseItem.nextHearingDate}</span>
                </span>
              </div>
            ) : caseItem.decisionDate ? (
              <div className="text-emerald-700 flex items-center space-x-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Decided: {caseItem.decisionDate}</span>
              </div>
            ) : <span className="text-slate-400 italic">Decided / Disposed</span>}
          </div>
        </div>
        <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
          <div className={`${CARD_LABEL} text-slate-500`}>Courtroom</div>
          <div className={`${CARD_VALUE} text-slate-800`}>
            {caseItem.courtRoom || (caseItem.source === 'Indian Kanoon' ? 'REGISTRAR COURT. 1' : 'Courtroom 1')}
          </div>
        </div>
        
        {/* Highlighted Judge Box */}
        <div className="bg-amber-50/60 border border-amber-200 p-3 rounded-xl col-span-1">
          <div className={`${CARD_LABEL} text-amber-800`}>
            <Scale className="h-3.5 w-3.5 text-amber-600" />
            <span>Presiding Judge</span>
          </div>
          <div className={`${CARD_VALUE} text-slate-800`} title={caseItem.judge}>
            {caseItem.judge || "Hon'ble Bench"}
          </div>
        </div>

        {/* Highlighted Advocate/Counsel Box */}
        <div className="bg-indigo-50/60 border border-indigo-200 p-3 rounded-xl col-span-1">
          <div className={`${CARD_LABEL} text-indigo-800`}>
            <Briefcase className="h-3.5 w-3.5 text-indigo-600" />
            <span>Designated Counsel</span>
          </div>
          <div className={`${CARD_VALUE} text-slate-800`} title={caseItem.advocateName || 'Not Assigned'}>
            {caseItem.advocateName || (caseItem.petitionerAdvocates?.[0]) || 'Advocate on Record'}
          </div>
        </div>
      </div>
    </div>
  );
}