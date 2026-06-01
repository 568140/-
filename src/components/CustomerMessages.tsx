import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, Phone, Lock, Image as ImageIcon, Video, Paperclip, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, onSnapshot, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

interface PrivateMessage {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  text: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'file';
  timestamp: Date;
}

export const CustomerMessages: React.FC<{ 
  currentUser: any; 
  customerAccounts: any[];
  isAdmin: boolean;
}> = ({ currentUser, customerAccounts, isAdmin }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [input, setInput] = useState('');
  const [activeContact, setActiveContact] = useState<any>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load private messages from Firestore
  useEffect(() => {
    let q = collection(db, 'private_messages');
    const unsub = onSnapshot(q, (snapshot) => {
      const list: PrivateMessage[] = [];
      const now = Date.now();
      const ONE_HOUR = 60 * 60 * 1000;
      
      snapshot.forEach(docSnap => {
        const d = docSnap.data();
        const msgTime = new Date(d.timestamp).getTime();
        
        // Auto-delete after 1 hour setup
        if (now - msgTime > ONE_HOUR) {
          deleteDoc(docSnap.ref).catch(() => {});
        } else {
          list.push({
            id: d.id,
            senderId: d.senderId,
            senderName: d.senderName || 'مجهول',
            receiverId: d.receiverId,
            text: d.text || '',
            mediaUrl: d.mediaUrl,
            mediaType: d.mediaType,
            timestamp: new Date(d.timestamp),
          });
        }
      });
      // Sort oldest to newest
      list.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      setMessages(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'private_messages');
    });
    return () => unsub();
  }, []);

  const filteredMessages = messages.filter(m => {
    if (isAdmin) {
      if (!activeContact) return false;
      return m.senderId === activeContact.phone || m.receiverId === activeContact.phone;
    }
    if (!currentUser) return false;
    if (!activeContact) return false;
    // Current user + selected contact
    return (m.senderId === currentUser.phone && m.receiverId === activeContact.phone) ||
           (m.senderId === activeContact.phone && m.receiverId === currentUser.phone);
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [filteredMessages, activeContact]);

  const handleSend = async (e?: React.FormEvent, mediaUrl?: string, mediaType?: 'image'|'video'|'file') => {
    e?.preventDefault();
    if (!mediaUrl && !input.trim()) return;
    if (!currentUser && !isAdmin) return;
    if (!activeContact) return;

    const senderId = isAdmin ? 'admin' : currentUser.phone;
    const senderName = isAdmin ? 'الإدارة' : currentUser.name;

    const newMessageId = Date.now().toString();
    const newMessage = {
      id: newMessageId,
      senderId,
      senderName,
      receiverId: activeContact.phone,
      text: input.trim(),
      ...(mediaUrl && { mediaUrl, mediaType }),
      timestamp: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'private_messages', newMessageId), newMessage);
      setInput('');
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `private_messages/${newMessageId}`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'image'|'video'|'file') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        handleSend(undefined, reader.result as string, type);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = ''; // reset
  };
  
  const handleDeleteMessage = (msgId: string) => {
    const isSure = window.confirm('هل أنت متأكد من حذف هذه الرسالة؟');
    if (isSure) {
        deleteDoc(doc(db, 'private_messages', msgId)).catch(e => {
            console.error('Delete error', e);
        });
    }
  };

  // Build contact list: Either the admin sees everyone, or user sees everyone.
  const contacts = isAdmin ? customerAccounts : customerAccounts.filter(c => c.phone !== currentUser?.phone);

  return (
    <div className="fixed bottom-24 right-6 z-50 pointer-events-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="pointer-events-auto mb-4 w-[340px] max-w-[calc(100vw-2rem)] h-[480px] bg-white rounded-3xl shadow-2xl border border-navy/10 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-navy p-4 flex flex-col gap-3 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-500/20 rounded-xl">
                    <Lock className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black font-display text-white">غرفة الرسائل الخاصة</h3>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white/10 rounded-lg">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex flex-1 overflow-hidden" dir="rtl">
                {!activeContact ? (
                    // Contacts List
                    <div className="w-full flex flex-col overflow-y-auto bg-gray-50/50 p-2 space-y-1">
                        <div className="text-[10px] font-bold text-gray-400 mb-2 px-2 pt-2">اختر المستلم:</div>
                        {contacts.length === 0 && <p className="text-xs text-center p-4">لا يوجد جهات اتصال مسجلة</p>}
                        {contacts.map(c => (
                            <button 
                                key={c.phone} 
                                onClick={() => setActiveContact(c)}
                                className="w-full text-right p-3 hover:bg-white bg-transparent rounded-xl transition-all border border-transparent hover:border-gray-100 flex items-center gap-3"
                            >
                                <div className="h-8 w-8 rounded-full bg-navy text-gold flex items-center justify-center font-bold text-xs uppercase">
                                    {c.name.charAt(0)}
                                </div>
                                <div className="flex-1">
                                    <div className="text-xs font-bold text-gray-800">{c.name}</div>
                                    <div className="text-[9px] text-gray-400 font-mono">{c.phone}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                ) : (
                    // Chat Area
                    <div className="flex flex-col w-full">
                        {/* Chat Header */}
                        <div className="flex items-center justify-between p-2 border-b border-gray-100 bg-white">
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-navy">{activeContact.name}</span>
                                <span className="text-[9px] text-gray-400 font-mono">{activeContact.phone}</span>
                            </div>
                            <button onClick={() => setActiveContact(null)} className="text-[10px] bg-gray-100 px-2 py-1 rounded-md font-bold text-gray-600 hover:bg-gray-200">
                                عودة
                            </button>
                        </div>
                        {/* Messages Area */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-cream/20">
                            {filteredMessages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-center opacity-30 p-6">
                                <MessageSquare className="h-10 w-10 mb-2" />
                                <p className="text-[10px] font-bold leading-relaxed">بادر واكتب رسالتك</p>
                                <p className="text-[8px]">الرسائل تحذف تلقائياً بعد ساعة</p>
                            </div>
                            )}
                            {filteredMessages.map(msg => {
                                const isMe = isAdmin ? msg.senderId === 'admin' : msg.senderId === currentUser?.phone;
                                return (
                                <div key={msg.id} className={`flex flex-col gap-1 w-full ${isMe ? 'items-end' : 'items-start'}`}>
                                    <div className="flex items-center justify-end gap-2 px-1">
                                        <span className="text-[8px] text-gray-400 font-mono">
                                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        <span className={`text-[9px] font-black font-display ${isMe ? 'text-navy' : 'text-gray-500'}`}>
                                            {isMe ? 'أنت' : msg.senderName}
                                        </span>
                                    </div>
                                    <div className="group relative">
                                        {/* Actions for deleting locally (For all if admin, or if own msg) */}
                                        {(isMe || isAdmin) && (
                                            <button 
                                                onClick={() => handleDeleteMessage(msg.id)}
                                                className="absolute -top-2 -left-2 opacity-0 group-hover:opacity-100 bg-rose-500 text-white rounded-full p-1 text-[8px] z-10 hover:scale-110 transition-all"
                                                title="حذف"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        )}
                                        <div className={`p-2.5 rounded-2xl text-xs font-sans shadow-xs max-w-[200px] overflow-hidden ${
                                            isMe ? 'bg-navy text-white' : 'bg-white border border-gray-100 text-gray-800'
                                        }`}>
                                            {msg.mediaUrl && (
                                                <div className="mb-2">
                                                    {msg.mediaType === 'image' && (
                                                        <a href={msg.mediaUrl} download className="block">
                                                            <img src={msg.mediaUrl} alt="" className="rounded-lg w-full object-cover max-h-32" />
                                                        </a>
                                                    )}
                                                    {msg.mediaType === 'video' && (
                                                        <video src={msg.mediaUrl} controls className="rounded-lg w-full max-h-32" />
                                                    )}
                                                    {msg.mediaType === 'file' && (
                                                        <a href={msg.mediaUrl} download className="flex items-center gap-2 p-2 bg-black/10 rounded-lg text-[10px] break-all">
                                                            <Paperclip className="h-4 w-4 shrink-0" />
                                                            تحميل الملف
                                                        </a>
                                                    )}
                                                </div>
                                            )}
                                            {msg.text && <p className="break-words">{msg.text}</p>}
                                        </div>
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                        {/* Input Area */}
                        <div className="p-3 bg-white border-t border-gray-50 flex flex-col gap-2">
                            <form onSubmit={handleSend} className="flex gap-2">
                                <input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="اكتب رسالتك الخاصة..."
                                    className="flex-1 bg-gray-50 border border-transparent focus:border-emerald-500 focus:bg-white rounded-xl px-3 py-1.5 text-xs focus:outline-hidden transition-all text-right"
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim()}
                                    className="p-2.5 bg-emerald-500 disabled:bg-gray-200 text-white rounded-xl hover:bg-emerald-600 transition-colors shadow-xs"
                                >
                                    <Send className="h-3.5 w-3.5 rtl:-scale-x-100" />
                                </button>
                            </form>
                            <div className="flex gap-2 justify-end">
                                <label className="text-[10px] font-bold text-gray-500 hover:text-navy cursor-pointer flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md">
                                    <ImageIcon className="h-3 w-3" /> صورة
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'image')} />
                                </label>
                                <label className="text-[10px] font-bold text-gray-500 hover:text-navy cursor-pointer flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md">
                                    <Video className="h-3 w-3" /> فيديو
                                    <input type="file" accept="video/*" className="hidden" onChange={(e) => handleFileUpload(e, 'video')} />
                                </label>
                                <label className="text-[10px] font-bold text-gray-500 hover:text-navy cursor-pointer flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md">
                                    <Paperclip className="h-3 w-3" /> ملف
                                    <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'file')} />
                                </label>
                            </div>
                        </div>
                    </div>
                )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="pointer-events-auto h-12 w-12 bg-emerald-500 text-white rounded-2xl shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
        title="غرفة الرسائل الخاصة"
      >
        <Lock className="h-5 w-5" />
      </button>
    </div>
  );
};
