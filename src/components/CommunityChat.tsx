import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, User, Sparkles, ShieldCheck, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, onSnapshot, setDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

interface ChatMessage {
  id: string;
  userName: string;
  text: string;
  timestamp: Date;
  role: 'user' | 'admin' | 'vip';
}

const CommunityChat: React.FC<{ currentUser: any }> = ({ currentUser }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [activeRoom, setActiveRoom] = useState<'general' | 'vip'>('general');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load live messages from Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'community_messages'), (snapshot) => {
      if (snapshot.empty) {
        const defaultMsg = {
          id: '1',
          userName: 'أحمد من جدة',
          text: 'ما شاء الله العطر الملكي وصل اليوم وريحته خرافية! 🔥',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          role: 'vip' as const
        };
        setDoc(doc(db, 'community_messages', defaultMsg.id), defaultMsg).catch(e => 
          handleFirestoreError(e, OperationType.WRITE, `community_messages/${defaultMsg.id}`)
        );
      } else {
        const list: ChatMessage[] = [];
        const now = Date.now();
        const ONE_HOUR = 60 * 60 * 1000;
        
        snapshot.forEach(docSnap => {
          const d = docSnap.data();
          const msgTime = new Date(d.timestamp).getTime();
          
          if (now - msgTime > ONE_HOUR) {
             import('firebase/firestore').then(({ deleteDoc, doc }) => {
                deleteDoc(doc(db, 'community_messages', d.id)).catch(() => {});
             });
          } else {
            list.push({
              id: d.id,
              userName: d.userName,
              text: d.text,
              timestamp: new Date(d.timestamp),
              role: d.role
            });
          }
        });
        // Sort oldest to newest
        list.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        setMessages(list);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'community_messages');
    });
    return () => unsub();
  }, []);

  const filteredMessages = messages.filter(m => {
    if (activeRoom === 'vip') return m.role === 'vip' || m.role === 'admin';
    return true; // General shows all
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, activeRoom]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (!currentUser) {
      alert('يرجى تسجيل الدخول للمشاركة في مجتمع دكان الشرق');
      return;
    }

    const newMessageId = Date.now().toString();
    const newMessage = {
      id: newMessageId,
      userName: currentUser.name,
      text: input.trim(),
      timestamp: new Date().toISOString(),
      role: activeRoom === 'vip' ? ('vip' as const) : ('user' as const)
    };

    setDoc(doc(db, 'community_messages', newMessageId), newMessage).then(() => {
      setInput('');
    }).catch(e => {
      handleFirestoreError(e, OperationType.WRITE, `community_messages/${newMessageId}`);
    });
  };

  return (
    <div className="fixed bottom-6 left-6 z-50 pointer-events-none sm:left-24">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="pointer-events-auto mb-4 w-[320px] max-w-[calc(100vw-2rem)] h-[450px] bg-white rounded-3xl shadow-2xl border border-navy/10 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-navy p-4 flex flex-col gap-3 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-gold/20 rounded-xl">
                    <Zap className="h-4 w-4 text-gold" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black font-display text-gradient-gold">مجتمع دكان الشرق</h3>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white/10 rounded-lg">
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              {/* Rooms switch */}
              <div className="flex bg-white/10 p-1 rounded-xl">
                <button 
                  onClick={() => setActiveRoom('general')}
                  className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition-all ${activeRoom === 'general' ? 'bg-gold text-navy shadow-xs' : 'text-gray-300'}`}
                >
                  الدردشة العامة
                </button>
                <button 
                  onClick={() => setActiveRoom('vip')}
                  className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${activeRoom === 'vip' ? 'bg-gold text-navy shadow-xs' : 'text-gray-300'}`}
                >
                   روم الكبار (VIP) <ShieldCheck className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-cream/20">
              {filteredMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-30 p-6">
                  <MessageSquare className="h-10 w-10 mb-2" />
                  <p className="text-xs font-bold leading-relaxed">لا توجد رسائل حالياً في هذه الغرفة. كن أول من يرحب بالجميع!</p>
                </div>
              )}
              {filteredMessages.map(msg => (
                <div key={msg.id} className="flex flex-col gap-1 text-right">
                  <div className="flex items-center justify-end gap-1.5 px-1">
                    <span className="text-[9px] text-gray-400 font-mono">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className={`text-[10px] font-black font-display ${
                      msg.role === 'admin' ? 'text-rose-500' : msg.role === 'vip' ? 'text-gold' : 'text-navy'
                    }`}>
                      {msg.userName} {msg.role === 'admin' && '👑'} {msg.role === 'vip' && '⭐'}
                    </span>
                  </div>
                  <div className={`p-2.5 rounded-2xl text-xs font-sans shadow-xs inline-block ml-auto max-w-[90%] ${
                    msg.role === 'admin' ? 'bg-navy text-white' : msg.role === 'vip' ? 'bg-gold-dark text-white' : 'bg-white border border-gray-100 text-charcoal'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-50 flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={currentUser ? "شارك رأيك مع الجميع..." : "سجل دخول للمشاركة..."}
                disabled={!currentUser}
                className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-[11px] focus:outline-hidden focus:border-gold opacity-80"
              />
              <button
                type="submit"
                disabled={!currentUser || !input.trim()}
                className="p-2 bg-navy text-gold rounded-xl disabled:opacity-30"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="pointer-events-auto flex items-center gap-2 px-4 py-2.5 bg-white border border-navy/10 rounded-2xl shadow-xl text-navy hover:text-gold transition-colors font-display text-xs font-black"
      >
        <Zap className="h-4 w-4 text-gold animate-pulse" />
        {isOpen ? 'إغلاق المجتمع' : 'دردشة الزوار المباشرة'}
      </motion.button>
    </div>
  );
};

export default CommunityChat;
