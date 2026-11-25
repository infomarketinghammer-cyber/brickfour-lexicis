import React, { useEffect, useRef, useState } from 'react';
import { ShieldAlert, Sparkles, ArrowRight, ShieldCheck, Loader2, AlertCircle, Layers, CheckCircle2 } from 'lucide-react';
import { FutureCaseStrategy, Case, StrategyRequestInput } from '../../types';
import * as api from '../../api/client';
import { PRESET_SCENARIOS, PresetScenario } from './presetScenarios';
import StrategyReport from './StrategyReport';

interface FutureCasePredictorProps {
  onSaveAsCase?: (newCase: Case) => void;
}

const INCIDENT_TYPES = [
  { value: 'Motor Vehicle Accident / Road Collision', label: '🚗 Motor Vehicle Accident / Road Collision' },
  { value: 'Financial / Cheque Bounce / Debt Dispute', label: '💰 Financial / Cheque Bounce / Debt Dispute' },
  { value: 'Property / Landlord & Tenant Dispute', label: '📜 Property / Landlord & Tenant Dispute' },
  { value: 'Employment / Contractual Dispute', label: '💼 Employment / Contractual Dispute' },
  { value: 'Workplace / Misconduct Notice', label: '👔 Workplace / Misconduct Notice' },
  { value: 'Consumer / Service Deficiency Issue', label: '🛍️ Consumer / Service Deficiency Issue' },
  { value: 'Civil Wrong / Defamation Claim', label: '⚖️ Civil Wrong / Defamation Claim' },
  { value: 'Other Legal Incident', label: '📁 Other Legal Incident' }
];

const USER_ROLES = [
  { value: 'At Fault / Caused Incident', label: 'At Fault / Accidental Contributor' },
  { value: 'Victim / Damaged Party', label: 'Victim / Affected Party' },
  { value: 'Unintentional Contributor', label: 'Unintentional Contributor / Misunderstanding' },
  { value: 'Co-involved / Third Party', label: 'Co-involved / Third Party' }
];

// Shown while the plan is prepared (research and drafting take ~20-40 seconds)
const PROGRESS_STEPS = [
  'Identifying the applicable law (BNS / IPC and special acts)',
  'Searching judgments on the same legal question',
  'Assessing risk, deadlines and likely outcome',
  'Drafting your action plan'
];

const inputClass = 'w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500';
const labelClass = 'block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1';

const randomSuffix = () => Math.random().toString(36).substr(2, 9);

/** Builds a pre-litigation case file from a generated strategy so it can be tracked on the dashboard. */
function buildPreLitigationCase(
  strategy: FutureCaseStrategy,
  incidentType: string,
  userRole: string,
  incidentDetails: string
): Case {
  const caseNumber = `PRE-LIT/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`;
  return {
    id: `ec-strategy-${randomSuffix()}`,
    caseNumber,
    title: `${userRole.split('/')[0]} - ${incidentType}`,
    petitioner: userRole.includes('Fault') ? 'Self (Pre-litigation Incident File)' : 'Opposing Party',
    respondent: userRole.includes('Fault') ? 'Affected / Third Party' : 'Self (Pre-litigation)',
    court: 'Pre-Litigation Settlement & Police Station Intimation Registry',
    judge: 'Out-of-Court Mediation Desk',
    currentStatus: 'Pre-Litigation - Strategy Plan Formulated',
    category: incidentType.includes('Vehicle') ? 'Motor Vehicle & Road Collision' : 'Civil Dispute & Pre-litigation',
    lastUpdated: new Date().toISOString(),
    filingDate: new Date().toISOString().split('T')[0],
    nextHearingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    isProposedHearing: true,
    courtRoom: 'Out-of-Court Settlement Desk',
    description: incidentDetails,
    advocateName: 'AI Legal Strategy Advisor',
    documents: strategy.outOfCourtSettlementGuide.sampleAgreementTemplate ? [
      {
        id: `doc-${randomSuffix()}`,
        name: 'Draft_Compromise_Deed_NOC_Template.txt',
        category: 'Settlement Agreement',
        uploadDate: new Date().toISOString().split('T')[0],
        size: '1.2 KB',
        description: 'Auto-generated Out-of-Court Settlement & Compromise Deed draft',
        attorneyName: 'AI Strategy Engine'
      }
    ] : [],
    history: [
      {
        id: `h-strat-${randomSuffix()}`,
        date: new Date().toISOString(),
        title: 'Legal Strategy & Risk Analysis Generated',
        description: `Risk Level: ${strategy.overallRiskLevel} (${strategy.riskScore}/100). Primary recommendation: ${strategy.outOfCourtSettlementGuide.isSettlementRecommended ? 'Out-of-Court Compromise Settlement' : 'Formal Legal Response'}`,
        status: 'Strategy Logged',
        updatedBy: 'AI Legal Predictor'
      }
    ]
  };
}

function GeneratingState() {
  const [step, setStep] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const timer = setInterval(() => setStep(s => Math.min(s + 1, PROGRESS_STEPS.length - 1)), 7000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div ref={cardRef} className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm" id="strategy-generating">
      <div className="flex items-center space-x-3 mb-5">
        <Loader2 className="h-6 w-6 text-amber-500 animate-spin" />
        <div>
          <h3 className="text-base font-display font-bold text-slate-900">Preparing your legal strategy</h3>
          <p className="text-xs text-slate-500">This usually takes 20–40 seconds.</p>
        </div>
      </div>
      <ol className="space-y-2.5">
        {PROGRESS_STEPS.map((label, idx) => (
          <li key={label} className="flex items-center space-x-2.5 text-sm">
            {idx < step ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : idx === step ? (
              <Loader2 className="h-4 w-4 text-amber-500 animate-spin shrink-0" />
            ) : (
              <span className="h-4 w-4 rounded-full border-2 border-slate-200 shrink-0 status-dot" />
            )}
            <span className={idx <= step ? 'text-slate-800 font-medium' : 'text-slate-400'}>{label}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function FutureCasePredictor({ onSaveAsCase }: FutureCasePredictorProps) {
  // Input form state
  const [incidentType, setIncidentType] = useState<string>('Motor Vehicle Accident / Road Collision');
  const [userRole, setUserRole] = useState<string>('At Fault / Caused Incident');
  const [incidentDetails, setIncidentDetails] = useState<string>('');
  const [actionsTaken, setActionsTaken] = useState<string>('');
  const [userGoals, setUserGoals] = useState<string>('Handle legally, pay damages out-of-court, avoid police FIR / jail time');
  const [incidentDate, setIncidentDate] = useState<string>('');
  const [location, setLocation] = useState<string>('');

  // Async state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [strategy, setStrategy] = useState<FutureCaseStrategy | null>(null);
  // The inputs the current report was generated from (the form may be edited afterwards)
  const [reportInput, setReportInput] = useState<StrategyRequestInput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedCaseSuccess, setSavedCaseSuccess] = useState<boolean>(false);

  // Bring a freshly generated report into view
  useEffect(() => {
    if (strategy) {
      document.getElementById('strategy-report')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [strategy]);

  const handlePresetSelect = (preset: PresetScenario) => {
    setIncidentType(preset.type);
    setUserRole(preset.role);
    setIncidentDetails(preset.details);
    setActionsTaken(preset.actions);
    setUserGoals(preset.goals);
    setStrategy(null);
    setError(null);
    setSavedCaseSuccess(false);
  };

  const handleGenerateStrategy = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!incidentDetails.trim()) {
      setError('Please provide a detailed explanation of what happened.');
      return;
    }

    const input: StrategyRequestInput = {
      incidentType, userRole, incidentDetails, actionsTaken, userGoals,
      incidentDate: incidentDate || undefined,
      location: location.trim() || undefined
    };
    setIsLoading(true);
    setError(null);
    setStrategy(null);
    setSavedCaseSuccess(false);

    try {
      setStrategy(await api.predictStrategy(input));
      setReportInput(input);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while analyzing the incident.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAsTrackedCase = async () => {
    if (!strategy || !reportInput) return;
    const newCase = buildPreLitigationCase(strategy, reportInput.incidentType, reportInput.userRole, reportInput.incidentDetails);
    try {
      await api.createCase(newCase);
    } catch (err) {
      // The case is still added locally; tracking registers it with the server
      console.warn("Could not create case file on server:", err);
    }
    if (onSaveAsCase) onSaveAsCase(newCase);
    setSavedCaseSuccess(true);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-150 p-6 shadow-sm print:hidden">

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-display font-bold text-slate-900 flex items-center space-x-2">
            <ShieldAlert className="h-5 w-5 text-amber-600" />
            <span>Legal Strategy & Predictor</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            Describe a legal situation to get a lawful, step-by-step plan: the laws that apply, your deadlines, the likely outcome, related court judgments and settlement options.
          </p>
        </div>

        <form onSubmit={handleGenerateStrategy} className="space-y-4 bg-slate-50 p-4 sm:p-5 border border-slate-200/80 rounded-2xl">

          {/* Examples */}
          <div className="flex items-center flex-wrap gap-1.5 pb-1">
            <span className="text-[11px] font-semibold text-slate-500 mr-1 flex items-center space-x-1">
              <Layers className="h-3 w-3 text-slate-400" />
              <span>Start from an example:</span>
            </span>
            {PRESET_SCENARIOS.map(preset => {
              const Icon = preset.icon;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handlePresetSelect(preset)}
                  className="px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1.5 bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  title={preset.type}
                >
                  <Icon className="h-3.5 w-3.5 text-amber-600" />
                  <span>{preset.label.replace(/^\S+\s/, '')}</span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <label className={labelClass}>Incident Category / Type</label>
              <select value={incidentType} onChange={(e) => setIncidentType(e.target.value)} className={inputClass}>
                {INCIDENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="lg:col-span-2">
              <label className={labelClass}>Your Role in the Event</label>
              <select value={userRole} onChange={(e) => setUserRole(e.target.value)} className={inputClass}>
                {USER_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div className="lg:col-span-2">
              <label className={labelClass}>Date of Incident / Notice</label>
              <input type="date" value={incidentDate} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setIncidentDate(e.target.value)} className={inputClass} />
            </div>
            <div className="lg:col-span-2">
              <label className={labelClass}>Location (City, State)</label>
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Pune, Maharashtra" className={inputClass} />
            </div>
          </div>

          {/* Detailed Explanation */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className={labelClass + ' mb-0'}>
                What Happened <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">{incidentDetails.length} characters</span>
            </div>
            <textarea
              rows={5}
              value={incidentDetails}
              onChange={(e) => setIncidentDetails(e.target.value)}
              placeholder="Explain the situation in plain words — what happened, who is involved, any injuries, damage or amounts, notices or threats received, and what the other side wants."
              className={`${inputClass} leading-relaxed`}
              required
              id="strategy-incident-details"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              The date and location you give decide which criminal code applies (BNS or IPC), your deadlines, and the courts and police station with jurisdiction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Actions Taken So Far (Optional)</label>
              <input
                type="text"
                value={actionsTaken}
                onChange={(e) => setActionsTaken(e.target.value)}
                placeholder="e.g. Took injured to hospital, replied to notice, informed insurer..."
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Your Primary Goals</label>
              <input
                type="text"
                value={userGoals}
                onChange={(e) => setUserGoals(e.target.value)}
                placeholder="e.g. Settle out of court, recover my deposit, avoid prosecution..."
                className={inputClass}
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200/80">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Confidential AI analysis. Guidance only — not a substitute for an advocate's advice.</span>
            </div>
            <button
              type="submit"
              disabled={isLoading || !incidentDetails.trim()}
              className="w-full sm:w-auto bg-brand-600 text-white hover:bg-brand-700 border border-brand-700 px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
              id="btn-generate-strategy"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Preparing Strategy...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze & Generate Legal Strategy</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {isLoading && <GeneratingState />}

      {strategy && reportInput && !isLoading && (
        <StrategyReport
          strategy={strategy}
          input={reportInput}
          savedCaseSuccess={savedCaseSuccess}
          onSaveAsCase={handleSaveAsTrackedCase}
        />
      )}
    </div>
  );
}
