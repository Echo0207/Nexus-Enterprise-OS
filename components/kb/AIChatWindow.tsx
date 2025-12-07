import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, User as UserIcon, Sparkles, FileText, ChevronDown, Minimize2, Maximize2, Lock } from 'lucide-react';
import { ChatMessage, User } from '../../types';
import { kbService } from '../../services/kbService';

interface AIChatWindowProps {
  currentUser: User;
}

export const AIChatWindow: React.FC<AIChatWindowProps> = ({ currentUser }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `你好，${currentUser.name}！我是 Nexus AI 助理。\n您可以詢問任何公司規章、技術文件，或查詢您的個人資料。`,
      timestamp: new Date().toISOString()
    }
  ]);
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    try {
      // Call Mock RAG Service
      const response = await kbService.searchKnowledgeBase(userMsg.content, currentUser);
      setMessages(prev => [...prev, response]);
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, {
        id: 'err-' + Date.now(),
        role: 'assistant',
        content: '抱歉，系統暫時無法回應。',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsThinking(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-xl hover:shadow-2xl transition-all hover:scale-105 z-50 flex items-center gap-2 group"
      >
        <Sparkles size={24} className="animate-pulse" />
        <span className="font-bold pr-1 hidden group-hover:block transition-all">Ask Nexus AI</span>
      </button>
    );
  }

  return (
    <div 
      className={`fixed bottom-6 right-6 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 flex flex-col transition-all duration-300 overflow-hidden ${
        isMinimized ? 'w-72 h-14' : 'w-[400px] h-[600px]'
      }`}
    >
      {/* Header */}
      <div 
        className="bg-slate-900 text-white p-4 flex justify-between items-center cursor-pointer shrink-0"
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-500 to-purple-500 p-1.5 rounded-lg">
            <Bot size={20} />
          </div>
          <div>
            <h3 className="font-bold text-sm">Nexus AI Copilot</h3>
            {!isMinimized && <p className="text-[10px] text-slate-400 flex items-center gap-1"><Lock size={8}/> Secure Mode</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
            className="p-1 hover:bg-white/10 rounded"
          >
            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
            className="p-1 hover:bg-white/10 rounded"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-blue-100' : 'bg-purple-100'}`}>
                    {msg.role === 'user' ? <UserIcon size={16} className="text-blue-600"/> : <Bot size={16} className="text-purple-600"/>}
                  </div>
                  
                  <div className="space-y-2">
                    <div className={`p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-tr-none' 
                        : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none'
                    }`}>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                    
                    {/* Citations */}
                    {msg.sources && (
                      <div className="space-y-1">
                        <p className="text-[10px] text-slate-400 font-bold uppercase ml-1">Sources:</p>
                        {msg.sources.map((src, idx) => (
                          <div key={idx} className="bg-white border border-slate-200 p-2 rounded-lg text-xs hover:border-purple-300 transition-colors cursor-pointer group">
                            <div className="flex items-center gap-1 font-bold text-slate-700 group-hover:text-purple-700">
                              <FileText size={10} />
                              {src.doc_title}
                            </div>
                            <div className="text-slate-500 mt-1 line-clamp-1 italic">
                              "{src.snippet}"
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isThinking && (
              <div className="flex justify-start">
                <div className="flex gap-2">
                   <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <Bot size={16} className="text-purple-600"/>
                   </div>
                   <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-none flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-100"></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-200"></div>
                      <span className="text-xs text-slate-400 ml-1">Searching secure docs...</span>
                   </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-slate-200">
            <div className="relative">
              <input 
                type="text" 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Ask anything..."
                className="w-full bg-slate-100 border-none rounded-xl pl-4 pr-12 py-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isThinking}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                <Send size={16} />
              </button>
            </div>
            <div className="text-[10px] text-center text-slate-400 mt-2">
              AI responses are generated based on your permission level.
            </div>
          </div>
        </>
      )}
    </div>
  );
};