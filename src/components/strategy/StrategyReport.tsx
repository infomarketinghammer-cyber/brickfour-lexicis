import React, { useState } from 'react';
import {
  ShieldAlert, AlertTriangle, CheckCircle2, Copy, Check, Clock, Download, ShieldCheck, Gavel,
  FileCheck, Scale, CalendarClock, FileText, Building2, HelpCircle, BookOpen, ArrowUpRight,
  Briefcase, XCircle, Handshake, ListChecks, MessageSquare, Info
} from 'lucide-react';
import { FutureCaseStrategy, StrategyRequestInput } from '../../types';
import FollowUpChat from './FollowUpChat';

interface StrategyReportProps {
  strategy: FutureCaseStrategy;
  input: StrategyRequestInput;
  savedCaseSuccess: boolean;
  onSaveAsCase: () => void;
}

function getRiskColorClass(level: string) {
  switch (level) {
    case 'Low':
      return { tint: 'bg-emerald-50 border-emerald-200 text-emerald-900', badge: 'bg-emerald-600 text-white', bar: 'bg-emerald-500' };
    case 'Medium':
      return { tint: 'bg-amber-50 border-amber-200 text-amber-900', badge: 'bg-amber-500 text-slate-950', bar: 'bg-amber-500' };
    case 'High':
      return { tint: 'bg-orange-50 border-orange-200 text-orange-900', badge: 'bg-orange-600 text-white', bar: 'bg-orange-500' };
    case 'Severe':
      return { tint: 'bg-rose-50 border-rose-200 text-rose-900', badge: 'bg-rose-600 text-white', bar: 'bg-rose-600' };
    default:
      return { tint: 'bg-slate-50 border-slate-200 text-slate-900', badge: 'bg-slate-600 text-white', bar: 'bg-slate-500' };
  }
}

/** A report section in the app's standard card style. */
function Section({ id, icon: Icon, title, subtitle, children, action }: {
  id?: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section id={id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm scroll-mt-36 break-inside-avoid">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-display font-bold text-slate-900 flex items-center space-x-2">
            <Icon className="h-4 w-4 text-amber-600" />
            <span>{title}</span>
          </h3>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function SidebarCard({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm break-inside-avoid">
      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5 mb-3">
        <Icon className="h-3.5 w-3.5 text-amber-600" />
        <span>{title}</span>
      </h4>
      {children}
    </div>
  );
}

/** The generated legal prediction & strategy plan. */
export default function StrategyReport({ strategy, input, savedCaseSuccess, onSaveAsCase }: StrategyReportProps) {
  const [completedActions, setCompletedActions] = useState<Record<string, boolean>>({});
  const [copiedTemplate, setCopiedTemplate] = useState<boolean>(false);

  const risk = getRiskColorClass(strategy.overallRiskLevel);
  const outcome = strategy.predictedCaseOutcome;
  const settlement = strategy.outOfCourtSettlementGuide;
  const judgments = strategy.relevantJudgments || [];
  const deadlines = strategy.keyDeadlines || [];

  const toggleActionCheck = (key: string) => {
    setCompletedActions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const copyTemplateToClipboard = () => {
    if (!settlement.sampleAgreementTemplate) return;
    navigator.clipboard.writeText(settlement.sampleAgreementTemplate);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 3000);
  };

  const nav = [
    { id: 'strategy-overview', label: 'Overview' },
    { id: 'strategy-laws', label: 'Laws & Exposure' },
    { id: 'strategy-actions', label: 'Action Plan' },
    { id: 'strategy-roadmap', label: 'Legal Roadmap' },
    { id: 'strategy-settlement', label: 'Settlement' },
    { id: 'strategy-timeline', label: 'Timeline' },
    ...(judgments.length ? [{ id: 'strategy-judgments', label: 'Related Judgments' }] : []),
    { id: 'strategy-advisor', label: 'Ask the Advisor' }
  ];

  const outcomeBars = [
    { label: 'Out-of-court settlement', value: outcome.probabilityOutofCourtSettlement, color: 'bg-emerald-500' },
    { label: 'Civil remedy / fine / compounding', value: outcome.probabilityCivilFineOnly, color: 'bg-sky-500' },
    { label: 'Formal court trial', value: outcome.probabilityCriminalTrial, color: 'bg-slate-500' }
  ];

  return (
    <div className="space-y-6 animate-fade-in scroll-mt-20" id="strategy-report">

      {/* Report header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-display font-bold text-slate-900">Legal Strategy Report</h2>
            <p className="text-xs text-slate-500">
              {input.incidentType}
              {input.incidentDate ? ` · ${input.incidentDate}` : ''}
              {input.location ? ` · ${input.location}` : ''}
              {` · Prepared ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <button
            type="button"
            onClick={onSaveAsCase}
            disabled={savedCaseSuccess}
            className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer disabled:cursor-default"
          >
            {savedCaseSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">Saved in Dashboard Cases</span>
              </>
            ) : (
              <>
                <FolderPlus className="w-4 h-4 text-amber-600" />
                <span>Save to Dashboard Cases</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl bg-brand-600 text-white hover:bg-brand-700 text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export / Print</span>
          </button>
        </div>
      </div>

      {strategy.isFallback && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium px-4 py-3 rounded-xl flex items-start gap-2">
          <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <span>The AI analysis service was unavailable, so this is a general template for this type of incident rather than advice tailored to your facts. Try again shortly for a full analysis.</span>
        </div>
      )}

      {/* Section navigation */}
      <nav className="sticky top-16 z-30 bg-slate-50/95 backdrop-blur py-2 -mx-1 px-1 print:hidden" aria-label="Report sections">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
          {nav.map(item => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap bg-white text-slate-600 hover:bg-brand-600 hover:text-white border border-slate-200 transition-colors cursor-pointer"
            >
              {item.label}
            </a>
          ))}
        </div>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">

          <Section id="strategy-overview" icon={Scale} title="Situation Overview">
            {strategy.applicableLawNote && (
              <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 text-xs text-sky-900 mb-4 flex items-start gap-2">
                <BookOpen className="h-4 w-4 text-sky-700 shrink-0 mt-0.5" />
                <span><strong>Applicable law:</strong> {strategy.applicableLawNote}</span>
              </div>
            )}
            <p className="text-sm text-slate-800 leading-relaxed">{strategy.incidentSummary}</p>
            {outcome.likelyVerdictSummary && (
              <div className="mt-4 bg-amber-50/70 p-4 border-l-4 border-amber-500 rounded-r-xl">
                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Most Likely Outcome</h4>
                <p className="text-sm text-slate-800 leading-relaxed">{outcome.likelyVerdictSummary}</p>
              </div>
            )}
          </Section>

          <Section id="strategy-laws" icon={Gavel} title="Applicable Laws & Legal Exposure"
            subtitle="Sections that apply, or that the other side or police may invoke, and what each means for you.">
            {strategy.potentialLegalCharges.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No penal provisions identified for this situation.</p>
            ) : (
              <div className="space-y-3">
                {strategy.potentialLegalCharges.map((charge, idx) => (
                  <div key={idx} className="border border-slate-200 bg-slate-50/60 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <span className="font-bold text-xs text-slate-900 bg-white border border-slate-300 px-2.5 py-1 rounded-lg">{charge.actOrSection}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${charge.bailable ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {charge.bailable ? 'BAILABLE' : 'NON-BAILABLE'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed mt-2">{charge.description}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-xs">
                      <div className="bg-white border border-slate-200 rounded-lg p-2.5">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Procedure</span>
                        <span className="text-slate-700">{charge.bailableText}</span>
                      </div>
                      <div className="bg-white border border-slate-200 rounded-lg p-2.5">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Maximum Penalty</span>
                        <span className="text-amber-800 font-semibold">{charge.penaltyOrSentence}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section id="strategy-actions" icon={ListChecks} title="Immediate Action Plan"
            subtitle="Check off each step as you complete it."
          >
            <div className="space-y-5">
              {strategy.immediateActionPlan.map((group, idx) => (
                <div key={idx} className="space-y-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                      {group.timeframe}
                    </span>
                    <span className="text-sm font-bold text-slate-900">{group.title}</span>
                  </div>
                  {group.actions.map((act, actIdx) => {
                    const key = `${idx}-${actIdx}`;
                    const done = !!completedActions[key];
                    return (
                      <div
                        key={actIdx}
                        onClick={() => toggleActionCheck(key)}
                        className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-all ${
                          done ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200 hover:border-slate-350'
                        }`}
                      >
                        <input type="checkbox" checked={done} onChange={() => {}} className="mt-0.5 h-4 w-4 rounded text-amber-600 focus:ring-brand-500 border-slate-300 cursor-pointer" />
                        <span className={`text-sm ${done ? 'line-through text-slate-400' : 'text-slate-800'}`}>{act}</span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </Section>

          {((strategy.documentsChecklist || []).length > 0 || (strategy.authoritiesToApproach || []).length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(strategy.documentsChecklist || []).length > 0 && (
                <Section icon={FileText} title="Documents to Gather">
                  <ul className="space-y-2">
                    {strategy.documentsChecklist!.map((doc, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{doc}</span>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}
              {(strategy.authoritiesToApproach || []).length > 0 && (
                <Section icon={Building2} title="Where to Go">
                  <ul className="space-y-3">
                    {strategy.authoritiesToApproach!.map((a, idx) => (
                      <li key={idx} className="text-sm">
                        <span className="font-bold text-slate-900 block">{a.authority}</span>
                        <span className="text-slate-600 text-xs">{a.purpose}</span>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}
            </div>
          )}

          <Section id="strategy-roadmap" icon={ShieldCheck} title="Step-by-Step Legal Roadmap">
            <div className="space-y-3">
              {strategy.mitigationAndLegalSteps.map((step) => (
                <div key={step.stepNumber} className="border border-slate-200 rounded-xl p-4 flex gap-4 items-start">
                  <div className="w-7 h-7 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-xs shrink-0 status-dot">
                    {step.stepNumber}
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <h4 className="text-sm font-bold text-slate-900">{step.title}</h4>
                    <p className="text-sm text-slate-700 leading-relaxed">{step.description}</p>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                      <span><strong className="text-slate-800">Legal basis:</strong> {step.legalRationale}</span>
                      {step.recommendedDocumentOrActivity && (
                        <span className="shrink-0 font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                          📄 {step.recommendedDocumentOrActivity}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(strategy.rightsAndProtections || []).length > 0 && (
              <Section icon={ShieldCheck} title="Your Rights & Protections">
                <ul className="space-y-2">
                  {strategy.rightsAndProtections!.map((right, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                      <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{right}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            )}
            {strategy.whatNotToDo.length > 0 && (
              <Section icon={AlertTriangle} title="What Not To Do">
                <ul className="space-y-2">
                  {strategy.whatNotToDo.map((warn, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                      <XCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                      <span>{warn}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            )}
          </div>

          <Section
            id="strategy-settlement"
            icon={Handshake}
            title="Settlement & Negotiation"
            action={settlement.sampleAgreementTemplate ? (
              <button
                type="button"
                onClick={copyTemplateToClipboard}
                className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer print:hidden"
              >
                {copiedTemplate ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedTemplate ? 'Copied' : 'Copy Draft Deed'}</span>
              </button>
            ) : undefined}
          >
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold mb-4 border ${
              settlement.isSettlementRecommended
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}>
              {settlement.isSettlementRecommended ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Info className="w-3.5 h-3.5" />}
              <span>{settlement.isSettlementRecommended ? 'Out-of-court settlement is recommended' : 'Out-of-court settlement is not the recommended route here'}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {settlement.negotiationStrategy && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Negotiation Approach</h4>
                  <p className="text-sm text-slate-700 leading-relaxed">{settlement.negotiationStrategy}</p>
                </div>
              )}
              {settlement.recommendedDamagesFormula && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">How to Work Out the Amount</h4>
                  <p className="text-sm font-semibold text-slate-900 leading-relaxed">{settlement.recommendedDamagesFormula}</p>
                </div>
              )}
            </div>

            {settlement.keyTermsToIncludeInAgreement.length > 0 && (
              <div className="mt-4">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Terms the Agreement Must Include</h4>
                <div className="flex flex-wrap gap-2">
                  {settlement.keyTermsToIncludeInAgreement.map((term, idx) => (
                    <span key={idx} className="text-xs font-medium px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{term}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {settlement.sampleAgreementTemplate && (
              <div className="mt-4">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Draft Compromise Memorandum (review with your advocate before signing)</h4>
                <pre className="p-4 rounded-xl bg-slate-900 text-slate-200 text-[11px] font-mono leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto border border-slate-800">
                  {settlement.sampleAgreementTemplate}
                </pre>
              </div>
            )}
          </Section>

          <Section id="strategy-timeline" icon={Clock} title="What to Expect at Each Stage">
            <div className="relative border-l-2 border-slate-200 ml-3 pl-6 space-y-5">
              {strategy.stepByStepTimeline.map((stage, idx) => (
                <div key={idx} className="relative">
                  <span className="absolute -left-[33px] top-0.5 h-4 w-4 rounded-full bg-amber-500 border-4 border-white shadow-sm status-dot" />
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">{stage.estimatedTime}</span>
                    <h4 className="text-sm font-bold text-slate-900">{stage.stage}</h4>
                  </div>
                  <p className="text-sm text-slate-700 mt-1.5"><strong className="text-slate-900">What to expect:</strong> {stage.whatToExpect}</p>
                  <p className="text-sm text-slate-700 mt-1 bg-slate-50 border border-slate-200 rounded-lg p-2.5"><strong className="text-slate-900">How to respond:</strong> {stage.howToRespond}</p>
                </div>
              ))}
            </div>
          </Section>

          {judgments.length > 0 && (
            <Section id="strategy-judgments" icon={BookOpen} title="Related Court Judgments"
              subtitle="Decisions on the same legal question from Indian Kanoon, with what each court ordered.">
              <div className="space-y-3">
                {judgments.map((j, idx) => (
                  <div key={idx} className="border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <a href={j.docUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-slate-900 hover:text-amber-700 hover:underline inline-flex items-start gap-1">
                        <span>{j.title}</span>
                        <ArrowUpRight className="h-4 w-4 text-slate-400 shrink-0" />
                      </a>
                      {typeof j.similarity === 'number' && (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded shrink-0">{j.similarity}% match</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{[j.court, j.status].filter(Boolean).join(' · ')}</p>
                    <p className="text-sm text-slate-700 mt-2"><strong className="text-slate-900">Outcome:</strong> {j.result}</p>
                    {j.takeaway && <p className="text-xs text-slate-600 mt-1.5 bg-slate-50 border border-slate-200 rounded-lg p-2.5"><strong>For your situation:</strong> {j.takeaway}</p>}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {(strategy.questionsToClarify || []).length > 0 && (
            <Section icon={HelpCircle} title="Questions That Could Change This Advice"
              subtitle="Facts you have not mentioned. Ask the advisor below, or share them with your lawyer.">
              <ul className="space-y-2">
                {strategy.questionsToClarify!.map((q, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="text-amber-600 font-bold shrink-0">?</span>
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <section id="strategy-advisor" className="scroll-mt-36 print:hidden">
            <FollowUpChat input={input} strategy={strategy} />
          </section>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            This plan is AI-generated guidance based only on the facts you entered. Laws, deadlines and outcomes depend on details that may not be captured here; consult an advocate before taking legal action.
          </p>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-32">
          <div className={`rounded-2xl border p-5 shadow-sm ${risk.tint}`}>
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 opacity-80">
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>Legal Risk</span>
              </h4>
              <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold ${risk.badge}`}>{strategy.overallRiskLevel}</span>
            </div>
            <div className="flex items-baseline gap-1 mt-3">
              <span className="text-3xl font-display font-bold">{strategy.riskScore}</span>
              <span className="text-xs opacity-70">/ 100</span>
            </div>
            <div className="w-full bg-white/70 rounded-full h-2 mt-2 overflow-hidden">
              <div className={`h-2 rounded-full ${risk.bar}`} style={{ width: `${Math.min(100, Math.max(4, strategy.riskScore))}%` }} />
            </div>
          </div>

          <SidebarCard title="Outcome Estimate" icon={Scale}>
            <div className="space-y-3">
              {outcomeBars.map(bar => (
                <div key={bar.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-700">{bar.label}</span>
                    <span className="font-bold text-slate-900">{bar.value}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div className={`h-1.5 rounded-full ${bar.color}`} style={{ width: `${bar.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 mt-3">AI estimate based on your facts and similar decided cases.</p>
          </SidebarCard>

          {deadlines.length > 0 && (
            <SidebarCard title="Key Deadlines" icon={CalendarClock}>
              <ul className="space-y-3">
                {deadlines.map((d, idx) => (
                  <li key={idx} className="border-l-2 border-rose-400 pl-3">
                    <span className="block text-xs font-bold text-rose-700">{d.deadline}</span>
                    <span className="block text-sm text-slate-800">{d.action}</span>
                    {d.consequenceIfMissed && <span className="block text-[11px] text-slate-500 mt-0.5">If missed: {d.consequenceIfMissed}</span>}
                  </li>
                ))}
              </ul>
            </SidebarCard>
          )}

          {strategy.lawyerToConsult && (
            <SidebarCard title="Who to Consult" icon={Briefcase}>
              <p className="text-sm text-slate-700 leading-relaxed">{strategy.lawyerToConsult}</p>
            </SidebarCard>
          )}

          <a
            href="#strategy-advisor"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('strategy-advisor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors cursor-pointer print:hidden"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Ask a Follow-Up Question</span>
          </a>
        </aside>
      </div>
    </div>
  );
}

// Helper FolderPlus icon component to avoid missing icon import
function FolderPlus(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 10v6" />
      <path d="M9 13h6" />
      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L8.6 3.3A2 2 0 0 0 7.1 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z" />
    </svg>
  );
}
