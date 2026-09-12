import { useState, useRef, useEffect } from 'react';
import { api } from '../api';
import { useI18n } from '../context/I18nContext';
import { Send, Bot, User } from 'lucide-react';

export default function AIChat({ patientId, vitals, onClose }) {
  const { lang, t } = useI18n();
  const [messages, setMessages] = useState([
    { role: 'assistant', content: t('aiGreeting') }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 1 && prev[0].role === 'assistant') {
        return [{ role: 'assistant', content: t('aiGreeting') }];
      }
      return prev;
    });
  }, [lang, t]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    const userText = input.trim();
    if (!userText || loading) return;

    const userMessage = { role: 'user', content: userText };
    // Pass current messages history before appending
    const historySnapshot = [...messages];

    // Clean functional update: append user message
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.sendChatMessage(patientId, userText, lang, historySnapshot, vitals);
      const replyContent = (res && res.reply) ? res.reply : t('aiError');
      // Clean functional update: append assistant response
      setMessages(prev => [...prev, { role: 'assistant', content: replyContent }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: t('aiError') }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
      <div className="bg-teal-600 text-white p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          <h3 className="font-semibold">{t('aiAssistant')}</h3>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-white hover:text-gray-200 text-lg">
            ✕
          </button>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-teal-100 text-teal-600'}`}>
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className={`max-w-[80%] rounded-lg p-3 text-sm whitespace-pre-wrap ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm'}`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-teal-100 text-teal-600">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-gray-200 rounded-lg rounded-tl-none p-3 shadow-sm flex gap-1 items-center">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-200 flex gap-2">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('typeMessage')} 
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-sm"
          disabled={loading}
        />
        <button 
          type="submit" 
          disabled={loading || !input.trim()}
          className="bg-teal-600 text-white p-2 rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
