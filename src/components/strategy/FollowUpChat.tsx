import React, { useEffect, useRef, useState } from 'react';
import { Send, MessageSquare, Loader2 } from 'lucide-react';
import { FutureCaseStrategy, StrategyRequestInput } from '../../types';
import * as api from '../../api/client';

interface ChatMessage {
  role: 'user' | 'advisor';
  text: string;
  time: string;
}

interface FollowUpChatProps {
  input: StrategyRequestInput;
  strategy: FutureCaseStrategy;
}

const SUGGESTED_QUESTIONS = [
  'What exactly should I do first?',
  'Can this be settled, and how do I make it binding?',
  'What happens if I miss a deadline?',
  'Do I need a lawyer right now?'
];

const nowTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

/** Renders **bold** segments from the advisor's reply. */
function RichText({ text }: { text: string }) {
  return (
    <>
      {text.split(/\*\*([\s\S]*?)\*\*/g).map((part, i) =>
        i % 2 === 1 ? <strong key={i} className="font-bold text-slate-900">{part}</strong> : <React.Fragment key={i}>{part}</React.Fragment>
      )}
    </>
  );
}

/** Follow-up questions about a generated strategy, answered by the AI advisor with the plan as context. */
export default function FollowUpChat({ input, strategy }: FollowUpChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [{
    role: 'advisor',
    text: `Your strategy for this ${input.incidentType.toLowerCase()} is ready above. Ask me anything about it — the police or court process, negotiating a settlement, the documents you need, or what a deadline means for you.`,
    time: nowTime()
  }]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, sending]);

  const send = async (question: string) => {
    const text = question.trim();
    if (!text || sending) return;
    // History excludes the greeting, which carries no information
    const history = messages.slice(1).map(m => ({ role: m.role, text: m.text }));
    setMessages(prev => [...prev, { role: 'user', text, time: nowTime() }]);
    setDraft('');
    setSending(true);
    try {
      const reply = await api.askStrategyQuestion(input, strategy, history, text);
      setMessages(prev => [...prev, { role: 'advisor', text: reply, time: nowTime() }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'advisor', text: err?.message || 'The advisor could not answer right now. Please try again.', time: nowTime() }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 pt-6 pb-4 border-b border-slate-100">
        <h3 className="text-base font-display font-bold text-slate-900 flex items-center space-x-2">
          <MessageSquare className="h-4 w-4 text-amber-600" />
          <span>Ask the Legal Advisor</span>
        </h3>
        <p className="text-xs text-slate-500 mt-1">Follow-up questions are answered using your facts and the plan above.</p>
      </div>

      <div className="px-6 py-4 space-y-3 max-h-96 overflow-y-auto bg-slate-50/50" id="strategy-chat-messages">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div
              data-chat-role={m.role}
              className={`px-3.5 py-2.5 rounded-2xl max-w-[85%] text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-brand-600 text-white rounded-br-none'
                  : 'bg-white text-slate-700 border border-slate-200 rounded-bl-none'
              }`}
            >
              {m.role === 'advisor' ? <RichText text={m.text} /> : m.text}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 px-1">{m.time}</span>
          </div>
        ))}
        {sending && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-500" />
            <span>The advisor is preparing an answer…</span>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="px-6 py-3 border-t border-slate-100 flex gap-1.5 overflow-x-auto scrollbar-none">
        {SUGGESTED_QUESTIONS.map(q => (
          <button
            key={q}
            type="button"
            onClick={() => send(q)}
            disabled={sending}
            className="text-[11px] font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg whitespace-nowrap cursor-pointer transition-colors disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); send(draft); }}
        className="px-6 pb-6 pt-1 flex items-center gap-2"
      >
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask a question, e.g. 'What if the other side demands more money?'"
          disabled={sending}
          className="flex-1 px-3 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          id="strategy-chat-input"
        />
        <button
          type="submit"
          disabled={!draft.trim() || sending}
          className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer transition-colors"
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
