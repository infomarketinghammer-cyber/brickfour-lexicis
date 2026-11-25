import React from 'react';
import { Plus, Check, FileText, BookOpen, ExternalLink } from 'lucide-react';
import { Case } from '../../types';

interface CasePreviewPanelProps {
  selectedCase: Case | null;
  isTracked: boolean;
  isAdding: boolean;
  onTrack: (c: Case) => void;
  onUntrack: (c: Case) => void;
  onOpenKanoonDoc: (c: Case) => void;
}

/** Right-hand detail panel for the search result currently selected. */
export default function CasePreviewPanel({
  selectedCase,
  isTracked,
  isAdding,
  onTrack,
  onUntrack,
  onOpenKanoonDoc
}: CasePreviewPanelProps) {
  return (
    <div className="border border-slate-200 rounded-2xl bg-slate-50 p-5 min-h-[280px] flex flex-col justify-between">
      {selectedCase ? (
        <div className="space-y-4 animate-fade-in" id="case-search-preview-panel">
          <div>
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-xs uppercase font-mono bg-brand-700 text-amber-300 px-2.5 py-1 rounded-md border border-brand-600 font-bold">
                {selectedCase.caseNumber}
              </span>
              {selectedCase.cnrNumber && (
                <span className="text-xs uppercase font-mono bg-sky-900 text-sky-100 border border-sky-800 px-2.5 py-1 rounded-md font-bold">
                  CNR: {selectedCase.cnrNumber}
                </span>
              )}
              {selectedCase.regNo && (
                <span className="text-[11px] font-mono bg-slate-200 text-slate-800 px-2 py-0.5 rounded border border-slate-300 font-semibold">
                  Reg: {selectedCase.regNo}
                </span>
              )}
              {selectedCase.judicialSection && (
                <span className="text-[11px] font-mono bg-indigo-100 text-indigo-900 px-2 py-0.5 rounded border border-indigo-200 font-bold">
                  Sec: {selectedCase.judicialSection}
                </span>
              )}
            </div>

            <h3 className="text-lg font-display font-bold text-slate-950 mt-3 leading-snug">
              {selectedCase.title}
            </h3>
          </div>

          {/* Detailed Real JSON Grid */}
          <div className="space-y-3 text-xs text-slate-700 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">

            {/* Parties */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Petitioner / Plaintiff</span>
                <span className="text-slate-900 font-semibold block mt-0.5">{selectedCase.petitioner}</span>
                {selectedCase.petitionerAdvocates && selectedCase.petitionerAdvocates.length > 0 && (
                  <span className="text-[11px] text-indigo-700 font-medium block mt-0.5">
                    Counsel: {selectedCase.petitionerAdvocates.join(', ')}
                  </span>
                )}
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Respondent / Defendant</span>
                <span className="text-slate-900 font-semibold block mt-0.5">{selectedCase.respondent}</span>
                {selectedCase.respondentAdvocates && selectedCase.respondentAdvocates.length > 0 && (
                  <span className="text-[11px] text-amber-800 font-medium block mt-0.5">
                    Counsel: {selectedCase.respondentAdvocates.join(', ')}
                  </span>
                )}
              </div>
            </div>

            {/* Court & Bench */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Court / Jurisdiction</span>
                <span className="text-slate-900 font-semibold block mt-0.5">{selectedCase.court}</span>
                {(selectedCase.district || selectedCase.state) && (
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    {[selectedCase.district, selectedCase.state].filter(Boolean).join(', ')}
                  </span>
                )}
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Judicial Bench</span>
                <span className="text-slate-900 font-semibold block mt-0.5">{selectedCase.judge}</span>
              </div>
            </div>

            {/* Key Dates */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pb-3 border-b border-slate-100 bg-slate-50 p-2.5 rounded-lg border border-slate-150">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Filing Date</span>
                <span className="text-slate-800 font-mono font-bold">{selectedCase.filingDate || 'N/A'}</span>
              </div>
              {selectedCase.nextHearingDate && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-700 block">Next Hearing</span>
                  <span className="text-amber-900 font-mono font-bold">{selectedCase.nextHearingDate}</span>
                </div>
              )}
              {selectedCase.registrationDate && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Reg Date</span>
                  <span className="text-slate-800 font-mono font-bold">{selectedCase.registrationDate}</span>
                </div>
              )}
              {selectedCase.decisionDate && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-700 block">Decision Date</span>
                  <span className="text-emerald-900 font-mono font-bold">{selectedCase.decisionDate}</span>
                </div>
              )}
            </div>

            {/* Acts & Category */}
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Acts & Sections</span>
              <span className="text-slate-900 font-bold bg-amber-50 text-amber-900 px-2 py-1 rounded border border-amber-200 block mt-1">
                {selectedCase.actsAndSections || selectedCase.category || "Code of Civil Procedure, 1908"}
              </span>
            </div>

            {/* Indian Kanoon Specific Details & Read Judgment Action */}
            {selectedCase.source === 'Indian Kanoon' && (
              <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-purple-900 flex items-center space-x-1">
                    <BookOpen className="h-3.5 w-3.5 text-purple-600" />
                    <span>Indian Kanoon Law Precedent</span>
                  </span>
                  {selectedCase.kanoonDocId && (
                    <span className="text-[10px] font-mono text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded font-bold">
                      Doc #{selectedCase.kanoonDocId}
                    </span>
                  )}
                </div>
                {selectedCase.citation && (
                  <div className="text-xs text-purple-950 font-semibold font-mono">
                    Official Citation: {selectedCase.citation}
                  </div>
                )}
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onOpenKanoonDoc(selectedCase)}
                    className="bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>Read Full Judgment Text</span>
                  </button>
                  {selectedCase.docUrl && (
                    <a
                      href={selectedCase.docUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white hover:bg-purple-100 text-purple-900 border border-purple-300 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      <span>Open on Indian Kanoon</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* AI Keywords / Subject tags */}
            {selectedCase.aiKeywords && selectedCase.aiKeywords.length > 0 && (
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-1">Subject Keywords</span>
                <div className="flex flex-wrap gap-1">
                  {selectedCase.aiKeywords.map((kw, idx) => (
                    <span key={idx} className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded border border-slate-200 font-medium">
                      #{kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Status & Action */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="text-[10px] text-slate-400 font-mono uppercase font-bold">Case Status</div>
              <div className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded mt-0.5 inline-block">
                {selectedCase.currentStatus}
              </div>
            </div>

            {isTracked ? (
              <div className="flex items-center space-x-2">
                <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1">
                  <Check className="h-3.5 w-3.5" />
                  <span>Tracked in System</span>
                </div>
                <button
                  type="button"
                  onClick={() => onUntrack(selectedCase)}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-xs flex items-center space-x-1"
                  id="btn-search-unbind-case"
                >
                  <span>Unbind Case</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => onTrack(selectedCase)}
                disabled={isAdding}
                className="bg-brand-600 hover:bg-brand-700 text-white border border-brand-700 font-bold text-xs px-4 py-2 rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer shadow-sm"
                id="btn-track-selected-case"
              >
                <Plus className="h-4 w-4" />
                <span>{isAdding ? "Syncing..." : "Bind Case to Dashboard"}</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 space-y-3">
          <FileText className="h-10 w-10 text-slate-300 stroke-[1.5]" />
          <div>
            <p className="text-xs font-semibold text-slate-700">No Case Selected</p>
          </div>
        </div>
      )}
    </div>
  );
}
