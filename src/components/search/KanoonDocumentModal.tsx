import React from 'react';
import { Loader2, X, BookOpen, ExternalLink } from 'lucide-react';

export interface KanoonDocumentView {
  docId: string;
  title: string;
  doc: string;
  url: string;
  loading: boolean;
}

interface KanoonDocumentModalProps {
  document: KanoonDocumentView;
  onClose: () => void;
}

/** Full judgment text from Indian Kanoon. */
export default function KanoonDocumentModal({ document, onClose }: KanoonDocumentModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-purple-100 text-purple-700">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-200 text-purple-900 px-2 py-0.5 rounded font-mono">
                  Indian Kanoon Judgment Doc #{document.docId}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 line-clamp-1 mt-0.5">
                {document.title}
              </h3>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {document.url && (
              <a
                href={document.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-purple-700 hover:text-purple-900 flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-purple-200 hover:bg-purple-50 transition-colors"
              >
                <span>View on Kanoon</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Judgment Text */}
        <div className="p-6 overflow-y-auto flex-1 font-serif text-slate-800 text-sm leading-relaxed space-y-4">
          {document.loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              <p className="text-xs font-sans text-slate-500">
                Retrieving full judgment text from Indian Kanoon API...
              </p>
            </div>
          ) : (
            <div className="whitespace-pre-wrap font-sans text-xs sm:text-sm bg-slate-50 p-5 rounded-xl border border-slate-200 text-slate-800">
              {document.doc}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Source: api.indiankanoon.org</span>
          <button
            type="button"
            onClick={onClose}
            className="bg-brand-600 hover:bg-brand-700 text-white font-semibold px-4 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
