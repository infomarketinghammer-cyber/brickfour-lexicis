import React, { useEffect, useState } from 'react';
import { Sparkles, Loader2, RefreshCw, CheckCircle2, Scale, BookOpen, ArrowUpRight, Gavel, FileText, Lightbulb, Landmark, Calendar } from 'lucide-react';
import { Case, CaseAiInsight, isCaseDisposed } from '../../types';

const SECTION_HEADING = 'text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2';

/** Badge for a precedent's outcome ("Other" just means a decided matter outside the usual labels). */
function outcomeStyle(status?: string): { label: string; className: string } {
  const s = (status || '').trim().toLowerCase();
  if (s.startsWith('partly')) return { label: 'Partly Allowed', className: 'bg-amber-50 text-amber-800 border-amber-200' };
  if (s.startsWith('allowed')) return { label: 'Allowed', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  if (s.startsWith('dismissed')) return { label: 'Dismissed', className: 'bg-rose-50 text-rose-700 border-rose-200' };
  if (s.startsWith('remanded')) return { label: 'Remanded', className: 'bg-sky-50 text-sky-800 border-sky-200' };
  if (s === 'disposed') return { label: 'Disposed', className: 'bg-slate-100 text-slate-700 border-slate-200' };
  return { label: 'Decided', className: 'bg-slate-100 text-slate-700 border-slate-200' };
}

/** Label and colours for a precedent's relevance score. */
function matchStyle(similarity: number): { label: string; text: string; bar: string } {
  if (similarity >= 75) return { label: 'Strong match', text: 'text-emerald-700', bar: 'bg-emerald-500' };
  if (similarity >= 55) return { label: 'Good match', text: 'text-brand-600', bar: 'bg-brand-500' };
  return { label: 'Partial match', text: 'text-amber-700', bar: 'bg-amber-500' };
}

interface AiInsightsPanelProps {
  caseItem: Case;
  insights: CaseAiInsight | null;
  loadingInsights: boolean;
  onReanalyze: () => void;
}

/** AI summary, merit assessment, comparable precedents and the recovery checklist. */
export default function AiInsightsPanel({ caseItem, insights, loadingInsights, onReanalyze }: AiInsightsPanelProps) {
  const [maxCases, setMaxCases] = useState(10);

  // Recovery checklist progress, kept per case
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
  useEffect(() => {
    setCompletedSteps({});
  }, [caseItem.id]);

  const toggleStep = (stepText: string) => {
    setCompletedSteps(prev => ({
      ...prev,
      [stepText]: !prev[stepText]
    }));
  };

  const precedentAnalysis = insights?.precedentAnalysis?.whatWillHappen ? insights.precedentAnalysis : null;
  const isDisposed = insights?.caseStage ? insights.caseStage === 'disposed' : isCaseDisposed(caseItem);
  const precedentCount = insights?.similarCases?.length || 0;
  const visibleCases = Math.min(maxCases, Math.max(1, precedentCount));

  return (
    <div className="bg-gradient-to-br from-amber-50/30 to-white text-slate-900 rounded-2xl p-6 shadow-sm border border-amber-200/80 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-5">
        <Sparkles className="h-40 w-40 text-amber-600" />
      </div>

      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-amber-500 fill-amber-400" />
          <h3 className="text-base font-display font-bold tracking-tight text-slate-950">
            AI-Powered Judicial Insights & Suggestions
          </h3>
        </div>
        
        <button
          onClick={onReanalyze}
          disabled={loadingInsights}
          className="text-[11px] text-amber-700 hover:text-amber-800 font-semibold font-mono bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg py-1 px-2.5 flex items-center space-x-1 cursor-pointer transition-colors"
          id="btn-reanalyze-case"
        >
          <RefreshCw className={`h-3 w-3 ${loadingInsights ? 'animate-spin' : ''}`} />
          <span>Re-Analyze Case</span>
        </button>
      </div>

      {loadingInsights ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Reading every court order on record and comparing judgments on the same legal issues...</p>
          <p className="text-[11px] text-slate-400">The first analysis of a case can take 1–2 minutes while the official orders are retrieved.</p>
        </div>
      ) : insights ? (
        <div className="space-y-6 animate-fade-in" id="ai-insights-content">
          
          {insights.registryNotice && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium px-3.5 py-2.5 rounded-xl" id="insights-registry-notice">
              {insights.registryNotice}
            </div>
          )}

          {/* Executive Summary */}
          <div className="bg-amber-50/70 p-4 border-l-4 border-amber-500 rounded-r-xl">
            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              AI Legal Standing Summary
              {typeof insights.ordersAnalyzed === 'number' && (
                <span className="ml-2 normal-case tracking-normal font-semibold text-amber-700">
                  · complete case to date, based on {insights.ordersAnalyzed} court order{insights.ordersAnalyzed === 1 ? '' : 's'}
                </span>
              )}
            </h4>
            <p className="text-sm text-slate-800 leading-relaxed font-sans font-medium whitespace-pre-line">
              {insights.summary}
            </p>
          </div>

          {/* Legal merit assessment: one justified block (hyphenation keeps the word spacing even) */}
          {insights.legalMeritAnalysis && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <h5 className={`${SECTION_HEADING} mb-3`}>
                <span className="h-7 w-7 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0">
                  <Gavel className="h-3.5 w-3.5 text-brand-600" />
                </span>
                <span>Legal Merit Assessment</span>
              </h5>
              <p className="text-sm text-slate-700 leading-7 whitespace-pre-line text-justify hyphens-auto">
                {insights.legalMeritAnalysis}
              </p>
            </div>
          )}

          {/* Similar Cases & Outcomes */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h4 className="text-base font-display font-bold text-slate-950 flex items-center gap-2">
                  <span className="h-8 w-8 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0">
                    <Scale className="h-4 w-4 text-brand-600" />
                  </span>
                  <span>Comparative Precedents & Outcome Analysis</span>
                  {precedentCount > 0 && (
                    <span className="text-[11px] font-semibold text-brand-700 bg-brand-50 border border-brand-100 px-2 py-0.5 rounded-full">
                      {precedentCount} judgment{precedentCount === 1 ? '' : 's'}
                    </span>
                  )}
                </h4>
                <p className="text-xs text-slate-500 mt-1.5 sm:ml-10">
                  Judgments that decided the same legal questions as this case, with what each court actually ordered.
                </p>
              </div>
              {precedentCount > 1 && (
                <label className="flex items-center gap-3 text-xs text-slate-600 font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 shrink-0">
                  <span className="whitespace-nowrap">Showing {visibleCases} of {precedentCount}</span>
                  <input
                    type="range"
                    min="1"
                    max={precedentCount}
                    value={visibleCases}
                    onChange={(e) => {
                      const parsed = parseInt(e.target.value, 10);
                      setMaxCases(isNaN(parsed) ? 5 : parsed);
                    }}
                    className="w-28 accent-brand-600"
                  />
                </label>
              )}
            </div>

            {/* Results List */}
            {(insights.similarCases || []).length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs italic">
                No judgments on the same legal issues were found for this case.
              </div>
            ) : (
              <div className="space-y-4">
                {(insights.similarCases || []).slice(0, visibleCases).map((sc, i) => {
                  const kanoonUrl = sc.docUrl || (sc.kanoonDocId
                    ? `https://indiankanoon.org/doc/${sc.kanoonDocId}/`
                    : `https://indiankanoon.org/search/?formInput=${encodeURIComponent(sc.citation || sc.title)}`);
                  const outcome = outcomeStyle(sc.status);
                  const match = typeof sc.similarity === 'number' ? matchStyle(sc.similarity) : null;
                  // Search snippets can start mid-sentence
                  const facts = sc.description && /^[a-z]/.test(sc.description) ? `…${sc.description}` : sc.description;

                  return (
                    <article key={i} className="border border-slate-200 rounded-2xl bg-white hover:border-brand-200 hover:shadow-sm transition-all overflow-hidden">

                      {/* Header: number, title, meta, match strength and source link */}
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 p-5 bg-slate-50/70 border-b border-slate-100">
                        <div className="flex gap-3 min-w-0">
                          <span className="h-7 w-7 status-dot bg-brand-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <div className="min-w-0 space-y-2">
                            <a
                              href={kanoonUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[15px] font-semibold text-slate-950 hover:text-brand-600 leading-snug inline-flex items-start gap-1 group cursor-pointer"
                              title="Click to view full judgment on Indian Kanoon"
                            >
                              <span className="group-hover:underline">{sc.title}</span>
                              <ArrowUpRight className="h-4 w-4 mt-0.5 text-brand-400 group-hover:text-brand-600 transition-colors shrink-0" />
                            </a>
                            <div className="flex items-center flex-wrap gap-1.5 text-[11px]">
                              <span className={`font-semibold px-2 py-0.5 rounded-full border ${outcome.className}`}>
                                {outcome.label}
                              </span>
                              {sc.court && (
                                <span className="inline-flex items-center gap-1 text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                                  <Landmark className="h-3 w-3 text-slate-400" />
                                  {sc.court}
                                </span>
                              )}
                              {sc.decisionDate && (
                                <span className="inline-flex items-center gap-1 text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                                  <Calendar className="h-3 w-3 text-slate-400" />
                                  {sc.decisionDate}
                                </span>
                              )}
                              {sc.citation && (
                                <span className="font-mono text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                                  {sc.citation}
                                </span>
                              )}
                              <span className="text-slate-400">Source: Indian Kanoon</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap lg:flex-col items-center lg:items-end gap-3 shrink-0 pl-10 lg:pl-4">
                          {match && (
                            <div className="w-full sm:w-36" title="How closely this judgment's issues match your case">
                              <div className="flex justify-between items-baseline text-[11px]">
                                <span className={`font-semibold ${match.text}`}>{match.label}</span>
                                <span className="font-bold text-slate-900">{sc.similarity}%</span>
                              </div>
                              <div className="h-1.5 bg-slate-200 rounded-full mt-1 overflow-hidden">
                                <div className={`h-full ${match.bar}`} style={{ width: `${Math.max(0, Math.min(100, sc.similarity!))}%` }} />
                              </div>
                            </div>
                          )}
                          <a
                            href={kanoonUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-brand-200 bg-white text-brand-700 hover:bg-brand-600 hover:text-white hover:border-brand-600 inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap"
                            title="Open full judgment transcript on Indian Kanoon"
                          >
                            <BookOpen className="h-3.5 w-3.5" />
                            <span>View on Indian Kanoon</span>
                          </a>
                        </div>
                      </div>

                      <div className="p-5 space-y-4">
                        {/* Verdict leads: what the court actually ordered */}
                        <section className="border-l-4 border-amber-400 bg-amber-50/60 rounded-r-xl px-4 py-3">
                          <h5 className={SECTION_HEADING}>
                            <Gavel className="h-4 w-4 text-amber-600" />
                            <span>Judicial Verdict & Result</span>
                          </h5>
                          <p className="text-sm text-slate-800 font-medium leading-relaxed mt-1.5">
                            {sc.result}
                          </p>
                        </section>

                        {(facts || sc.takeaway) && (
                          <div className={`grid grid-cols-1 gap-4 ${facts && sc.takeaway ? 'lg:grid-cols-2' : ''}`}>
                            {facts && (
                              <section className="rounded-xl border border-slate-200 px-4 py-3">
                                <h5 className={SECTION_HEADING}>
                                  <FileText className="h-4 w-4 text-slate-500" />
                                  <span>Case Facts & Dispute Context</span>
                                </h5>
                                <p className="text-sm text-slate-600 leading-relaxed mt-1.5">{facts}</p>
                              </section>
                            )}
                            {sc.takeaway && (
                              <section className="rounded-xl border border-brand-100 bg-brand-50/50 px-4 py-3">
                                <h5 className={SECTION_HEADING}>
                                  <Lightbulb className="h-4 w-4 text-brand-600" />
                                  <span>Ratio Decidendi & Takeaway for Your Case</span>
                                </h5>
                                <p className="text-sm text-slate-700 leading-relaxed mt-1.5">{sc.takeaway}</p>
                              </section>
                            )}
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          {/* Precedent Outcome Synthesis & Case Prognosis Block */}
          {precedentAnalysis && (
            <div className="bg-gradient-to-br from-amber-50/60 to-orange-50/30 border border-amber-200 rounded-2xl p-6 shadow-xs space-y-5">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
                  <span>AI Precedent Synthesis & Strategic Diagnosis</span>
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  {isDisposed
                    ? 'Based on the complete record and the final orders: what the court decided, what it means now, and how the party came out of the dispute.'
                    : 'Based on the complete record, the latest orders and the outcomes of the precedents above: what will happen next and the exact strategic actions required to recover.'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* Section 1: Prognosis / What Will Happen */}
                <div className="bg-white p-5 rounded-xl border border-slate-150 space-y-3 shadow-2xs">
                  <div className="flex items-center space-x-2 border-b border-slate-100 pb-2.5">
                    <Scale className="h-4 w-4 text-amber-600" />
                    <h5 className="text-xs font-bold uppercase tracking-wider text-amber-900 font-mono">
                      {isDisposed ? 'Final Outcome & Its Effect ("What Happened")' : 'Case Prognosis & Trajectory ("What Will Happen")'}
                    </h5>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line font-sans">
                    {precedentAnalysis.whatWillHappen}
                  </p>
                </div>

                {/* Section 2: Strategy / What You Must Do */}
                <div className="bg-white p-5 rounded-xl border border-slate-150 space-y-3 shadow-2xs">
                  <div className="flex items-center space-x-2 border-b border-slate-100 pb-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-900 font-mono">
                      {isDisposed ? 'How the Party Recovered ("What Was Done")' : 'Action Plan to Recover ("What You Must Do")'}
                    </h5>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line font-sans">
                    {precedentAnalysis.howToRecover}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Disposed cases: how the matter was resolved and how the party recovered */}
          {isDisposed && (
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200" id="case-resolution-path">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                How This Case Was Resolved — Recovery Path
              </h4>
              <p className="text-[10px] text-slate-500 mb-4">
                This case is disposed. The steps below trace, from the court orders, how the dispute was resolved and how the party recovered.
              </p>
              {(insights.resolutionSteps || []).length === 0 ? (
                <p className="text-xs text-slate-500 italic">The record does not show enough detail to trace the resolution.</p>
              ) : (
                <ol className="relative border-l-2 border-emerald-200 ml-2 pl-5 space-y-3">
                  {(insights.resolutionSteps || []).map((step, idx) => (
                    <li key={idx} className="relative">
                      <span className="absolute -left-[29px] top-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-white status-dot"></span>
                      <p className="text-sm text-slate-800 font-medium leading-relaxed">{step}</p>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}

          {/* Step-by-Step recovery plan checklist (pending cases only) */}
          {!isDisposed && (
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              AI Case Recovery Roadmap
            </h4>
            <p className="text-[10px] text-slate-500 mb-4">
              Actionable recommended tasks generated specifically for this dispute phase. Check off tasks as you complete them to track progress.
            </p>

            <div className="space-y-3">
              {insights.recoverySteps.map((step, idx) => {
                const isDone = !!completedSteps[step];
                return (
                  <div
                    key={idx}
                    onClick={() => toggleStep(step)}
                    className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      isDone
                        ? 'bg-emerald-50 border-emerald-200 text-slate-700'
                        : 'bg-white border-slate-200 hover:border-slate-350 text-slate-800'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isDone}
                      onChange={() => {}} // toggled on container click
                      className="mt-0.5 h-4 w-4 rounded text-amber-600 focus:ring-brand-500 border-slate-300 bg-white cursor-pointer"
                    />
                    <div className="text-sm font-medium">
                      <span className={isDone ? 'line-through text-slate-400' : ''}>
                        {step}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          )}

        </div>
      ) : (
        <div className="text-center py-8 text-slate-400 text-xs">
          AI analysis has not loaded correctly. Try clicking 'Re-Analyze Case' above.
        </div>
      )}
    </div>
  );
}
