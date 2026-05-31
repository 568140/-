import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, User, ShieldCheck, Sparkles, MinusCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
  id: string;
  sender: 'user' | 'support' | 'other';
  text: string;
  timestamp: Date;
  senderName?: string;
}

const LiveChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: '1',
          sender: 'support',
          text: 'مرحباً بك في دكان الشرق البلاتيني. كيف يمكننا مساعدتك اليوم؟',
          timestamp: new Date(),
          senderName: 'فريق النخبة'
        }
      ]);
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setInput('');
    
    // Simulate support typing response
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const responses = [
        'شكراً لتواصلك معنا، جاري مراجعة استفسارك.',
        'نحن هنا لخدمتك، هل تود السؤال عن شحن منتج معين؟',
        'يسعدنا اهتمامك بمنتجاتنا البلاتينية، سيتم الرد عليك في غضون لحظات.',
        'طلبك محل اهتمامنا الفائق.'
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      const supportReply: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'support',
        text: randomResponse,
        timestamp: new Date(),
        senderName: 'خدمة العملاء VIP'
      };
      setMessages(prev => [...prev, supportReply]);
    }, 2000);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 pointer-events-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="pointer-events-auto mb-4 w-[350px] max-w-[calc(100vw-2rem)] h-[500px] bg-white rounded-3xl shadow-2xl border border-gold/10 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-navy p-4 flex items-center justify-between text-white border-b border-gold/20">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="h-10 w-10 bg-gold rounded-2xl flex items-center justify-center shadow-lg">
                    <User className="h-6 w-6 text-navy" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 h-3.5 w-3.5 bg-emerald-500 border-2 border-navy rounded-full animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-black font-display text-gradient-gold">دردشة النخبة المباشرة</h3>
                  <p className="text-[10px] text-gold/60 font-display flex items-center gap-1 uppercase tracking-widest">
                    <Sparkles className="h-2.5 w-2.5" /> Live Support Online
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X className="h-5 w-5 text-gold" />
              </button>
            </div>

            {/* Messages Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-cream/30 scroll-smooth"
            >
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, x: msg.sender === 'user' ? -10 : 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`max-w-[80%] rounded-2xl p-3 shadow-sm ${
                    msg.sender === 'user' 
                      ? 'bg-navy text-white rounded-br-none' 
                      : 'bg-white border border-gray-100 text-charcoal rounded-bl-none'
                  }`}>
                    {msg.senderName && (
                      <span className="block text-[9px] font-black font-display mb-1 text-gold uppercase tracking-tighter">
                        {msg.senderName}
                      </span>
                    )}
                    <p className="text-xs font-sans leading-relaxed">{msg.text}</p>
                    <span className={`block text-[9px] mt-1 ${msg.sender === 'user' ? 'text-white/40' : 'text-gray-400'} font-mono`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </motion.div>
              ))}
              
              {isTyping && (
                <div className="flex justify-end">
                  <div className="bg-white border border-gray-100 rounded-2xl px-4 py-2 flex gap-1">
                    <div className="h-1.5 w-1.5 bg-gold/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="h-1.5 w-1.5 bg-gold/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="h-1.5 w-1.5 bg-gold/50 rounded-full animate-bounce" />
                  </div>
                </div>
              )}
            </div>

            {/* Footer Form */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-50 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="اكتب رسالتك هنا للمساعدة..."
                className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-2.5 text-xs focus:outline-hidden focus:border-gold transition-all"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="h-10 w-10 bg-navy text-gold rounded-2xl flex items-center justify-center hover:bg-navy-light transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <Send className="h-5 w-5 group-hover:scale-110 transition-transform" />
              </button>
            </form>
            
            <div className="px-4 pb-3 pt-0 bg-white flex items-center justify-center gap-1.5">
              <ShieldCheck className="h-3 w-3 text-gold" />
              <span className="text-[8px] text-gray-400 font-display uppercase tracking-widest">End-to-End Encrypted Chat</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="pointer-events-auto h-14 w-14 bg-navy text-gold rounded-3xl flex items-center justify-center shadow-2xl hover:shadow-gold/20 transition-all border border-gold/30 group"
      >
        {isOpen ? <MinusCircle className="h-7 w-7" /> : <MessageSquare className="h-7 w-7 group-hover:rotate-12 transition-transform" />}
        {!isOpen && (
          <div className="absolute -top-1 -right-1 h-5 w-5 bg-gold text-navy rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white animate-bounce">
            1
          </div>
        )}
      </motion.button>
    </div>
  );
};

export default LiveChat;
