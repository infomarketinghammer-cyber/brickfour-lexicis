import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function NoCaseSelected({ onGoToPortfolio }: { onGoToPortfolio: () => void }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-lg mx-auto space-y-4 shadow-sm">
      <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200">
        <Sparkles className="w-7 h-7" />
      </div>
      <h3 className="text-lg font-bold text-slate-900">No Active Case Selected</h3>
      <p className="text-xs text-slate-500 leading-relaxed">
        Select a case from your portfolio or search the Lexicis Search Registry to consult the AI Case Coach and inspect timeline insights.
      </p>
      <button
        onClick={onGoToPortfolio}
        className="inline-flex items-center space-x-2 bg-brand-600 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-brand-700 transition-colors cursor-pointer"
      >
        <span>Go to Portfolio</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
