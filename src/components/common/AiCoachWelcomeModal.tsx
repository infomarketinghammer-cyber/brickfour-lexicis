import React from 'react';
import { Sparkles, AlertCircle, Bot, X, MessageSquare, ArrowRight } from 'lucide-react';

interface AiCoachWelcomeModalProps {
  onDismiss: () => void;
  onConsultCoach: () => void;
}

export default function AiCoachWelcomeModal({ onDismiss, onConsultCoach }: AiCoachWelcomeModalProps) {
  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in" id="ai-coach-welcome-backdrop">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-md w-full overflow-hidden animate-fade-in relative flex flex-col max-h-[92vh] overflow-y-auto scrollbar-none" id="ai-coach-welcome-modal">

        {/* Header / Graphic */}
        <div className="bg-brand-700 text-white p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-6 -mt-6 p-12 bg-indigo-600 rounded-full opacity-20"></div>

          <button
            onClick={onDismiss}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 cursor-pointer transition-colors"
            title="Dismiss Welcome Coach"
            id="ai-coach-welcome-close"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center space-x-3 mb-3">
            <div className="bg-indigo-600 p-2.5 rounded-xl border border-indigo-500 shadow-sm">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-extrabold font-sans uppercase tracking-wider text-slate-100">
                AI Case Coach Engaged
              </h3>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full status-dot bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full status-dot h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[9px] text-slate-400 font-sans tracking-wide uppercase font-semibold">Active Advisory Module</span>
              </div>
            </div>
          </div>

          <h4 className="text-lg font-bold font-sans tracking-tight text-amber-500 mt-2">
            Accelerate Your Litigation Strategy
          </h4>
        </div>

        {/* Content / Info list */}
        <div className="p-6 text-left space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Welcome to your interactive legal advisory portal. Your AI legal companion has indexed the Lexicis Search Registry and is ready to formulate personalized trial strategies.
          </p>

          <div className="space-y-3 pt-1">
            <div className="flex items-start space-x-3">
              <div className="bg-indigo-50 p-1 rounded-lg border border-indigo-100 shrink-0 mt-0.5">
                <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-slate-900 font-sans">Strategic Next Steps</h5>
                <p className="text-[10px] text-slate-500 leading-relaxed">Instantly mapping statutory timelines, motion filings, and trial milestones.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="bg-amber-50 p-1 rounded-lg border border-amber-100 shrink-0 mt-0.5">
                <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-slate-900 font-sans">Risk & Merit Evaluation</h5>
                <p className="text-[10px] text-slate-500 leading-relaxed">Objective evaluation of case strengths based on national legal precedents.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex flex-col space-y-2">
          <button
            onClick={onConsultCoach}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center space-x-2 animate-pulse"
            id="btn-ai-coach-welcome-primary"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Consult AI Case Coach</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={onDismiss}
            className="w-full text-slate-500 hover:text-slate-800 font-semibold text-xs py-2 px-4 rounded-xl cursor-pointer transition-colors text-center"
            id="btn-ai-coach-welcome-secondary"
          >
            Maybe Later
          </button>
        </div>

      </div>
    </div>
  );
}
