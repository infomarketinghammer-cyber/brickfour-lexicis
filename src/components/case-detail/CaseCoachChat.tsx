import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, Send, Bot, X, Minimize2 } from 'lucide-react';
import { Case } from '../../types';
import * as api from '../../api/client';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

interface CaseCoachChatProps {
  caseItem: Case;
  autoOpenChat?: boolean;
  onChatOpenChange?: (open: boolean) => void;
}

const QUICK_SUGGESTIONS = [
  "What is my next procedural step?",
  "Summarize case risks",
  "Explain judge's background",
  "How to prepare for hearing?"
];

const nowTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const messageId = (prefix: string) => `${prefix}-${Math.random().toString(36).substr(2, 9)}`;

/** Floating action button and chat window for the AI case coach. */
export default function CaseCoachChat({ caseItem, autoOpenChat, onChatOpenChange }: CaseCoachChatProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showCoachTooltip, setShowCoachTooltip] = useState(true);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [sendingMessage, setSendingMessage] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Start a fresh conversation whenever a different case is opened
  useEffect(() => {
    setChatMessages([
      {
        id: 'welcome',
        sender: 'ai',
        text: `Hello! I am your AI Case Coach & Legal Advisor. I have fully indexed the court details for **${caseItem.title}** (${caseItem.caseNumber || 'Unspecified Case'}).\n\nHow can I support your legal strategy today? Feel free to ask me to summarize **next steps**, identify potential **legal risks**, explain the **presiding judge's role**, or evaluate **procedural tactics**.`,
        timestamp: nowTime()
      }
    ]);
  }, [caseItem.id, caseItem.title, caseItem.caseNumber]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Open when the parent asks (e.g. from the welcome pop-up), then hand control back
  useEffect(() => {
    if (autoOpenChat) {
      setIsChatOpen(true);
      setShowCoachTooltip(false);
      if (onChatOpenChange) {
        onChatOpenChange(false);
      }
    }
  }, [autoOpenChat, onChatOpenChange]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || chatInput;
    if (!textToSend.trim() || sendingMessage) return;

    setChatMessages(prev => [...prev, {
      id: messageId('msg-user'),
      sender: 'user',
      text: textToSend,
      timestamp: nowTime()
    }]);
    if (!customText) {
      setChatInput('');
    }
    setSendingMessage(true);

    try {
      // Prior turns in Gemini's role/parts history format
      const history = chatMessages
        .filter(m => m.id !== 'welcome')
        .map(m => ({
          role: m.sender === 'user' ? ('user' as const) : ('model' as const),
          parts: [{ text: m.text }]
        }));

      const reply = await api.askCaseCoach(caseItem.id, textToSend, history);
      setChatMessages(prev => [...prev, {
        id: messageId('msg-ai'),
        sender: 'ai',
        text: reply,
        timestamp: nowTime()
      }]);
    } catch (err: any) {
      console.error(err);
      setChatMessages(prev => [...prev, {
        id: messageId('msg-err'),
        sender: 'ai',
        text: "I encountered an issue consulting the AI Legal Coach database. Please check your connectivity or try resubmitting your query.",
        timestamp: nowTime()
      }]);
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end" id="floating-coach-portal">
      {/* Floating Tooltip Callout */}
      {showCoachTooltip && !isChatOpen && (
        <div className="bg-brand-700 text-white rounded-xl py-2 px-3 shadow-xl border border-brand-600 text-xs mb-3 mr-1 animate-bounce flex items-center space-x-2 shrink-0 max-w-[280px]">
          <div className="bg-indigo-600 p-1 rounded-lg">
            <Bot className="h-3 w-3 text-white" />
          </div>
          <div className="text-left flex-1 min-w-0">
            <p className="font-semibold text-[10px] text-amber-400 font-sans uppercase tracking-wider">Coach Connected</p>
            <p className="text-[10px] text-slate-300 truncate">Ask strategy questions about your case!</p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowCoachTooltip(false);
            }}
            className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
            title="Dismiss tooltip"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Floating Action Button (FAB) */}
      {!isChatOpen && (
        <button
          onClick={() => {
            setIsChatOpen(true);
            setShowCoachTooltip(false);
          }}
          className="group relative flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white h-14 w-14 sm:h-16 sm:w-16 rounded-full shadow-2xl cursor-pointer hover:scale-105 active:scale-95 transition-all focus:outline-none"
          title="Open AI Case Coach Chatbox"
          id="floating-coach-trigger-fab"
        >
          {/* Pulsing ring */}
          <span className="absolute -inset-1 bg-indigo-500/30 rounded-full animate-ping opacity-60"></span>
          
          <div className="relative flex flex-col items-center">
            <Sparkles className="h-6 w-6 text-amber-300 fill-amber-300 animate-pulse group-hover:rotate-12 transition-transform" />
            <span className="text-[8px] font-mono font-bold tracking-widest text-slate-100 uppercase mt-1 hidden sm:inline">Coach</span>
          </div>
        </button>
      )}

      {/* Professional Chat Box Window */}
      {isChatOpen && (
        <div 
          className="bg-white rounded-2xl border border-slate-200 shadow-2xl flex flex-col w-[320px] sm:w-[420px] h-[520px] sm:h-[620px] max-h-[82vh] max-sm:fixed max-sm:bottom-0 max-sm:right-0 max-sm:left-0 max-sm:w-full max-sm:h-[85vh] max-sm:max-h-full max-sm:rounded-t-3xl max-sm:rounded-b-none transition-all duration-300 ease-out"
          id="ai-coach-floating-window"
        >
          {/* Header */}
          <div className="bg-brand-700 text-white px-5 py-4 shrink-0 flex justify-between items-center max-sm:rounded-t-3xl rounded-t-2xl">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="bg-indigo-600 p-2 rounded-xl border border-indigo-500 shadow-sm">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                {/* Live Green Ring */}
                <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-900"></span>
              </div>
              <div className="text-left">
                <h3 className="text-xs font-extrabold font-sans uppercase tracking-wider text-slate-100">
                  AI Case Advisor
                </h3>
                <div className="flex items-center space-x-1 mt-0.5">
                  <span className="text-[9px] font-semibold text-amber-400 bg-slate-850 px-1.5 py-0.2 rounded font-mono">
                    {caseItem.caseNumber}
                  </span>
                  <span className="text-[8px] text-slate-400 font-sans">• Lexicis Search Expert Ready</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => setIsChatOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Minimize Coaching Companion"
                id="ai-coach-minimize-btn"
              >
                <Minimize2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsChatOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer max-sm:hidden"
                title="Close Case Companion"
                id="ai-coach-close-btn"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Chat message area */}
          <div 
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50" 
            id="ai-chat-messages-scrollarea"
          >
            {chatMessages.map((m) => {
              const isAi = m.sender === 'ai';
              return (
                <div key={m.id} className={`flex ${isAi ? 'justify-start' : 'justify-end'} animate-fade-in`}>
                  <div className={`flex items-start space-x-2 max-w-[88%] ${!isAi ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    {isAi && (
                      <div className="bg-white border border-slate-200 rounded-lg p-1.5 shrink-0 mt-0.5 shadow-xs">
                        <Bot className="h-3.5 w-3.5 text-indigo-600" />
                      </div>
                    )}
                    
                    <div className="space-y-1">
                      <div
                        className={`rounded-2xl px-3.5 py-2.5 text-sm shadow-xs leading-relaxed text-left ${
                          isAi
                            ? m.id === 'welcome'
                              ? 'bg-gradient-to-br from-indigo-50/50 to-slate-50 border border-indigo-100 rounded-tl-none text-slate-800'
                              : 'bg-white border border-slate-200 rounded-tl-none text-slate-700'
                            : 'bg-indigo-600 text-white rounded-tr-none'
                        }`}
                      >
                        <div className="whitespace-pre-line text-[13px] sm:text-sm leading-relaxed">
                          {/* Simple bold text formatter */}
                          {m.text.split(/\*\*([\s\S]*?)\*\*/g).map((part, i) => 
                            i % 2 === 1 ? (
                              <strong key={i} className={`font-bold ${isAi ? 'text-slate-900 font-sans' : 'text-white'}`}>{part}</strong>
                            ) : (
                              part
                            )
                          )}
                        </div>
                      </div>
                      <div className={`text-[8px] text-slate-400 font-mono px-1 ${!isAi ? 'text-right' : 'text-left'}`}>
                        {m.timestamp}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {sendingMessage && (
              <div className="flex justify-start animate-pulse">
                <div className="flex items-start space-x-2 max-w-[85%]">
                  <div className="bg-white border border-slate-200 rounded-lg p-1.5 shrink-0 shadow-xs">
                    <Bot className="h-3.5 w-3.5 text-indigo-600" />
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-3.5 py-2.5 flex items-center space-x-1.5 shadow-xs">
                    <span className="h-1.5 w-1.5 bg-indigo-600 rounded-full animate-bounce"></span>
                    <span className="h-1.5 w-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="h-1.5 w-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Suggestions Chips */}
          <div className="flex flex-nowrap gap-1.5 overflow-x-auto px-4 py-2 bg-slate-50 border-t border-slate-100 shrink-0 scrollbar-none">
            {QUICK_SUGGESTIONS.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(s)}
                disabled={sendingMessage}
                className="text-[10px] text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 border border-indigo-150 px-3 py-1.5 rounded-full whitespace-nowrap cursor-pointer transition-colors shrink-0 font-semibold font-sans"
                id={`ai-coach-suggestion-${idx}`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center space-x-2 shrink-0 p-3 bg-white border-t border-slate-100 max-sm:pb-6"
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask about strategies, judges, files..."
              disabled={sendingMessage}
              className="flex-1 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-xs rounded-xl px-3 py-2.5 outline-none transition-all placeholder:text-slate-400"
              id="ai-coach-chat-input"
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || sendingMessage}
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer transition-colors shadow-sm shrink-0"
              id="ai-coach-chat-submit"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}