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
  embedInDashboard?: boolean;
}> = ({ currentUser, customerAccounts, isAdmin, embedInDashboard = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [input, setInput] = useState('');
  const [activeContact, setActiveContact] = useState<any>(null);
  const [lastReadTimestamp, setLastReadTimestamp] = useState<number>(Date.now());
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastMsgRef = useRef<string | null>(null);

  // Play support chime sound
  const playNotificationSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880.00, ctx.currentTime + 0.1); // A5
      
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {
      console.warn("Audio context support not allowed prior to user interaction", e);
    }
  };

  // Load private messages from Firestore
  useEffect(() => {
    const q = collection(db, 'private_messages');
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

  // Update active contact depending on role
  useEffect(() => {
    if (!isAdmin) {
      setActiveContact({ name: 'الدعم الفني والإدارة', phone: 'admin' });
    } else {
      setActiveContact(prev => {
        if (prev?.phone === 'admin') return null;
        return prev;
      });
    }
  }, [isAdmin]);

  // Update last read timestamp on check
  useEffect(() => {
    if (isOpen) {
      setLastReadTimestamp(Date.now());
    }
  }, [isOpen, messages]);

  const filteredMessages = messages.filter(m => {
    if (isAdmin) {
      if (!activeContact) return false;
      return (m.senderId === 'admin' && m.receiverId === activeContact.phone) ||
             (m.senderId === activeContact.phone && m.receiverId === 'admin');
    }
    if (!currentUser) return false;
    return (m.senderId === currentUser.phone && m.receiverId === 'admin') ||
           (m.senderId === 'admin' && m.receiverId === currentUser.phone);
  });

  // Play audio chime when a real new message is received
  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      const isConversational = isAdmin 
        ? (activeContact && (lastMsg.senderId === activeContact.phone || lastMsg.receiverId === activeContact.phone))
        : (currentUser && (lastMsg.senderId === currentUser.phone || lastMsg.receiverId === 'admin'));

      if (isConversational) {
        const isMe = isAdmin ? lastMsg.senderId === 'admin' : lastMsg.senderId === currentUser?.phone;
        if (!isMe && lastMsgRef.current !== lastMsg.id) {
          playNotificationSound();
        }
      }
      lastMsgRef.current = lastMsg.id;
    }
  }, [messages, isAdmin, currentUser, activeContact]);

  // Unread messages calculation for badges
  const unreadMessagesCount = React.useMemo(() => {
    if (isOpen) return 0;
    return messages.filter(m => {
      const isConversational = isAdmin
        ? (activeContact && (m.senderId === activeContact.phone || m.receiverId === activeContact.phone))
        : (currentUser && (m.senderId === currentUser.phone || m.receiverId === 'admin'));
      
      if (!isConversational) return false;
      
      const isMe = isAdmin ? m.senderId === 'admin' : m.senderId === currentUser?.phone;
      return !isMe && m.timestamp.getTime() > lastReadTimestamp;
    }).length;
  }, [messages, isOpen, lastReadTimestamp, isAdmin, currentUser, activeContact]);

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
      if (isOpen) {
        setLastReadTimestamp(Date.now());
      }
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

  // Build combined live contact list for Administrator
  const contacts = React.useMemo(() => {
    if (!isAdmin) {
      return [{ name: 'الدعم الفني والإدارة', phone: 'admin' }];
    }
    const map = new Map<string, { name: string; phone: string }>();
    
    // Add known registered customer accounts
    customerAccounts.forEach(c => {
      map.set(c.phone, { name: c.name, phone: c.phone });
    });
    
    // Add any customer phone numbers who dynamically messaged
    messages.forEach(m => {
      if (m.senderId !== 'admin' && !map.has(m.senderId)) {
        map.set(m.senderId, { name: m.senderName || m.senderId, phone: m.senderId });
      }
    });
    
    return Array.from(map.values());
  }, [isAdmin, customerAccounts, messages]);

  if (embedInDashboard) {
    return (
      <div className="w-full h-[650px] bg-white rounded-3xl border border-gray-150 flex flex-col overflow-hidden shadow-xs mt-2" dir="rtl">
        {/* Header */}
        <div className="bg-navy p-4 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/20 rounded-xl">
              <Lock className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-black font-display text-white">مركز الرسائل الخاصة وإدارة محادثات العملاء</h3>
              <p className="text-[10px] text-gray-400">تواصل فوري محمي ومعزز بالوسائط (تحذف كافة الرسائل تلقائياً بعد مرور ساعة لحماية خصوصية العملاء)</p>
            </div>
          </div>
        </div>

        {/* Dynamic Split Layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Contacts sidebar */}
          <div className={`w-full md:w-80 bg-gray-50/50 border-l border-gray-150 flex flex-col overflow-y-auto p-3 space-y-1 shrink-0 ${activeContact ? 'hidden md:flex' : 'flex'}`}>
            <div className="text-[10px] font-bold text-gray-400 mb-2 px-2">العملاء النشطين للتواصل ({contacts.length}):</div>
            {contacts.length === 0 && <p className="text-xs text-center p-4 text-gray-400">لا يوجد جهات اتصال مسجلة</p>}
            {contacts.map(c => {
              const isSelected = activeContact?.phone === c.phone;
              return (
                <button 
                  key={c.phone} 
                  type="button"
                  onClick={() => setActiveContact(c)}
                  className={`w-full text-right p-3 rounded-xl transition-all border flex items-center gap-3 cursor-pointer ${
                    isSelected 
                      ? 'bg-navy text-white border-navy shadow-xs' 
                      : 'bg-white hover:bg-gray-100/50 border-gray-150 text-gray-800 shadow-xxs'
                  }`}
                >
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center font-black text-xs uppercase shrink-0 ${
                    isSelected ? 'bg-gold text-navy' : 'bg-navy text-gold'
                  }`}>
                    {c.name.charAt(0)}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className={`text-xs font-bold leading-none ${isSelected ? 'text-white' : 'text-navy'}`}>{c.name}</div>
                    <div className={`text-[9px] font-mono mt-1 ${isSelected ? 'text-amber-200' : 'text-gray-400'}`}>{c.phone}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Chat Column */}
          <div className={`flex-1 flex flex-col overflow-hidden bg-white ${!activeContact ? 'hidden md:flex items-center justify-center p-6 text-center text-gray-400 bg-gray-50/30' : 'flex'}`}>
            {activeContact ? (
              <div className="flex flex-col h-full w-full">
                {/* Mobile back header */}
                <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-white shrink-0">
                  <div className="flex flex-col text-right">
                    <span className="text-xs font-bold text-navy">{activeContact.name}</span>
                    <span className="text-[10px] text-gray-400 font-mono" dir="ltr">{activeContact.phone}</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setActiveContact(null)} 
                    className="md:hidden text-xxs bg-navy text-gold px-3 py-1.5 rounded-lg font-bold"
                  >
                    عودة للمحادثات
                  </button>
                </div>

                {/* Messages Area */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
                  {filteredMessages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center opacity-40 p-6">
                      <MessageSquare className="h-12 w-12 mb-3 text-gold" />
                      <p className="text-xs font-bold leading-relaxed">اكتب رسالة الرد لـ {activeContact.name}</p>
                      <p className="text-[10px] text-gray-400">هذه المحادثة مشفرة وتلقائية التصفير</p>
                    </div>
                  )}
                  {filteredMessages.map(msg => {
                    const isMe = msg.senderId === 'admin';
                    return (
                      <div key={msg.id} className={`flex flex-col gap-1 w-full ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className="flex items-center justify-end gap-2 px-1">
                          <span className="text-[8px] text-gray-400 font-mono">
                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className={`text-[9px] font-black font-display ${isMe ? 'text-navy' : 'text-gray-500'}`}>
                            {isMe ? 'أنت (الإدارة)' : msg.senderName}
                          </span>
                        </div>
                        <div className="group relative">
                          <button 
                            type="button"
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="absolute -top-2 -left-2 opacity-0 group-hover:opacity-100 bg-rose-500 text-white rounded-full p-1 text-[8px] z-10 hover:scale-110 transition-all cursor-pointer shadow-xs"
                            title="حذف"
                          >
                            <X className="h-3 w-3" />
                          </button>
                          <div className={`p-3 rounded-2xl text-xs font-sans shadow-xs max-w-[280px] md:max-w-md overflow-hidden ${
                            isMe ? 'bg-navy text-white' : 'bg-white border border-gray-150 text-gray-800'
                          }`}>
                            {msg.mediaUrl && (
                              <div className="mb-2">
                                {msg.mediaType === 'image' && (
                                  <a href={msg.mediaUrl} download className="block">
                                    <img src={msg.mediaUrl} alt="" className="rounded-lg w-full object-cover max-h-48" />
                                  </a>
                                )}
                                {msg.mediaType === 'video' && (
                                  <video src={msg.mediaUrl} controls className="rounded-lg w-full max-h-48" />
                                )}
                                {msg.mediaType === 'file' && (
                                  <a href={msg.mediaUrl} download className="flex items-center gap-2 p-2 bg-black/10 rounded-lg text-[10px] break-all">
                                    <Paperclip className="h-4 w-4 shrink-0" />
                                    تحميل الملف
                                  </a>
                                )}
                              </div>
                            )}
                            {msg.text && <p className="break-words leading-relaxed font-sans">{msg.text}</p>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-gray-100 flex flex-col gap-2 shrink-0">
                  <form onSubmit={handleSend} className="flex gap-2">
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="اكتب رسالة الرد الخاصة..."
                      className="flex-1 bg-gray-50 border border-gray-200 focus:border-navy focus:bg-white rounded-xl px-4 py-2.5 text-xs focus:outline-hidden transition-all text-right"
                    />
                    <button
                      type="submit"
                      disabled={!input.trim()}
                      className="px-4 py-2.5 bg-navy disabled:bg-gray-200 text-gold rounded-xl hover:bg-navy-light transition-colors shadow-xs"
                    >
                      <Send className="h-4 w-4 rtl:-scale-x-100" />
                    </button>
                  </form>
                  <div className="flex gap-2 justify-end">
                    <label className="text-[10px] font-bold text-gray-500 hover:text-navy cursor-pointer flex items-center gap-1 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-150">
                      <ImageIcon className="h-3.5 w-3.5 animate-pulse" /> صورة
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'image')} />
                    </label>
                    <label className="text-[10px] font-bold text-gray-500 hover:text-navy cursor-pointer flex items-center gap-1 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-150">
                      <Video className="h-3.5 w-3.5" /> فيديو
                      <input type="file" accept="video/*" className="hidden" onChange={(e) => handleFileUpload(e, 'video')} />
                    </label>
                    <label className="text-[10px] font-bold text-gray-500 hover:text-navy cursor-pointer flex items-center gap-1 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-150">
                      <Paperclip className="h-3.5 w-3.5" /> ملف
                      <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'file')} />
                    </label>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center opacity-60 m-auto">
                <MessageSquare className="h-16 w-16 mb-4 text-gold animate-bounce" />
                <h4 className="text-sm font-black text-navy mb-1">ابدأ محادثة خاصة</h4>
                <p className="text-[11px] text-gray-500 max-w-xs">اختر أحد جهات الاتصال النشطة من القائمة الجانبية للرد ومتابعة استفسارات العملاء فوراً.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

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
              {!currentUser ? (
                // Sign in Prompt for guest users
                <div className="w-full flex flex-col items-center justify-center p-6 text-center bg-gray-50/50">
                  <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 mb-4 animate-bounce">
                    <Lock className="h-8 w-8 text-amber-650 text-amber-600" />
                  </div>
                  <h4 className="text-xs font-bold text-navy mb-2 font-display">محادثة الدعم الخاصة المشفرة</h4>
                  <p className="text-[10px] text-gray-500 max-w-xs leading-relaxed mb-4 font-sans">
                    يرجى تسجيل الدخول أو إنشاء حساب على المتجر أولاً لتتمكن من مراسلة الإدارة ومتابعة طلباتك بشكل فوري وآمن.
                  </p>
                </div>
              ) : !isAdmin && activeContact ? (
                // Customer Mode - Direct Chat with Administration
                <div className="flex flex-col w-full bg-white">
                  {/* Chat Header */}
                  <div className="flex items-center justify-between p-2.5 border-b border-gray-100 bg-white">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-emerald-500/25 text-emerald-600 flex items-center justify-center text-[10px] font-bold">
                        📞
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="text-xs font-black text-navy">الدعم الفني لدكان الشرق</span>
                        <span className="text-[9px] text-emerald-600 font-bold">متصل الآن ومستعد لمساعدتك</span>
                      </div>
                    </div>
                  </div>

                  {/* Messages Area */}
                  <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-cream/20">
                    {filteredMessages.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full text-center opacity-40 p-6">
                        <MessageSquare className="h-10 w-10 mb-2 text-gold animate-bounce" />
                        <p className="text-[10px] font-bold leading-relaxed font-sans">بادر واكتب رسالتك للدعم الفني</p>
                        <p className="text-[8px] text-gray-400 font-sans">تلقائياً في محادثة مباشرة خاصة مع الإدارة في اليمن</p>
                      </div>
                    )}
                    {filteredMessages.map(msg => {
                      const isMe = msg.senderId === currentUser.phone;
                      return (
                        <div key={msg.id} className={`flex flex-col gap-1 w-full ${isMe ? 'items-end' : 'items-start'}`}>
                          <div className="flex items-center justify-end gap-2 px-1">
                            <span className="text-[8px] text-gray-400 font-mono">
                              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className={`text-[9px] font-black font-display ${isMe ? 'text-navy' : 'text-gray-500'}`}>
                              {isMe ? 'أنت' : 'الدعم الفني'}
                            </span>
                          </div>
                          <div className="group relative">
                            {isMe && (
                              <button 
                                onClick={() => handleDeleteMessage(msg.id)}
                                className="absolute -top-2 -left-2 opacity-0 group-hover:opacity-100 bg-rose-500 text-white rounded-full p-1 text-[8px] z-10 hover:scale-110 transition-all cursor-pointer"
                                title="حذف"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            )}
                            <div className={`p-2.5 rounded-2xl text-xs font-sans shadow-xs max-w-[220px] overflow-hidden ${
                              isMe ? 'bg-navy text-white' : 'bg-white border border-gray-150 text-gray-800'
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
                              {msg.text && <p className="break-words leading-relaxed font-sans">{msg.text}</p>}
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
                        placeholder="اكتب رسالتك الخاصة للإدارة..."
                        className="flex-1 bg-gray-50 border border-transparent focus:border-emerald-500 focus:bg-white rounded-xl px-3 py-1.5 text-xs focus:outline-hidden transition-all text-right font-sans text-gray-850"
                      />
                      <button
                        type="submit"
                        disabled={!input.trim()}
                        className="p-2.5 bg-emerald-500 disabled:bg-gray-200 text-white rounded-xl hover:bg-emerald-600 transition-colors shadow-xs cursor-pointer"
                      >
                        <Send className="h-3.5 w-3.5 rtl:-scale-x-100" />
                      </button>
                    </form>
                    <div className="flex gap-2 justify-end">
                      <label className="text-[10px] font-bold text-gray-500 hover:text-navy cursor-pointer flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                        <ImageIcon className="h-3 w-3" /> صورة
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'image')} />
                      </label>
                      <label className="text-[10px] font-bold text-gray-500 hover:text-navy cursor-pointer flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                        <Video className="h-3 w-3" /> فيديو
                        <input type="file" accept="video/*" className="hidden" onChange={(e) => handleFileUpload(e, 'video')} />
                      </label>
                      <label className="text-[10px] font-bold text-gray-500 hover:text-navy cursor-pointer flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                        <Paperclip className="h-3 w-3" /> ملف
                        <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'file')} />
                      </label>
                    </div>
                  </div>
                </div>
              ) : !activeContact ? (
                // Contacts List (Only for Admin)
                <div className="w-full flex flex-col overflow-y-auto bg-gray-50/50 p-2 space-y-1">
                  <div className="text-[10px] font-bold text-gray-400 mb-2 px-2 pt-2">اختر المستلم للتواصل الخاص:</div>
                  {contacts.length === 0 && <p className="text-xs text-center p-4 text-gray-400 font-bold font-sans">لا يوجد رسائل أو جهات اتصال</p>}
                  {contacts.map(c => (
                    <button 
                      key={c.phone} 
                      onClick={() => setActiveContact(c)}
                      className="w-full text-right p-3 hover:bg-white bg-transparent rounded-xl transition-all border border-transparent hover:border-gray-100 flex items-center gap-3 cursor-pointer"
                    >
                      <div className="h-8 w-8 rounded-full bg-navy text-gold flex items-center justify-center font-bold text-xs uppercase shadow-xxs">
                        {c.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-bold text-gray-800 font-sans">{c.name}</div>
                        <div className="text-[9px] text-gray-400 font-mono">{c.phone}</div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                // Chat Area (Only for Admin)
                <div className="flex flex-col w-full bg-white">
                  {/* Chat Header */}
                  <div className="flex items-center justify-between p-2 border-b border-gray-100 bg-white">
                    <div className="flex flex-col text-right">
                      <span className="text-xs font-black text-navy font-sans">{activeContact.name}</span>
                      <span className="text-[9px] text-gray-450 text-gray-400 font-mono">{activeContact.phone}</span>
                    </div>
                    <button onClick={() => setActiveContact(null)} className="text-[10px] bg-gray-100 px-2.5 py-1 rounded-md font-bold text-gray-600 hover:bg-gray-200 cursor-pointer">
                      عودة
                    </button>
                  </div>
                  {/* Messages Area */}
                  <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-cream/20">
                    {filteredMessages.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full text-center opacity-35 p-6 animate-pulse">
                        <MessageSquare className="h-10 w-10 mb-2 text-gold" />
                        <p className="text-[10px] font-bold leading-relaxed font-sans">بادر واكتب رسالتك</p>
                        <p className="text-[8px] font-sans">الرسائل تحذف تلقائياً بعد ساعة للخصوصية</p>
                      </div>
                    )}
                    {filteredMessages.map(msg => {
                      const isMe = msg.senderId === 'admin';
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
                            <button 
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="absolute -top-2 -left-2 opacity-0 group-hover:opacity-100 bg-rose-500 text-white rounded-full p-1 text-[8px] z-10 hover:scale-110 transition-all cursor-pointer"
                              title="حذف"
                            >
                              <X className="h-3 w-3" />
                            </button>
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
                              {msg.text && <p className="break-words leading-relaxed">{msg.text}</p>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* Input Area */}
                  <div className="p-3 bg-white border-t border-gray-100 flex flex-col gap-2">
                    <form onSubmit={handleSend} className="flex gap-2">
                      <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="اكتب رسالتك الخاصة للعميل..."
                        className="flex-1 bg-gray-50 border border-transparent focus:border-emerald-500 focus:bg-white rounded-xl px-3 py-1.5 text-xs focus:outline-hidden transition-all text-right font-sans text-gray-850"
                      />
                      <button
                        type="submit"
                        disabled={!input.trim()}
                        className="p-2.5 bg-emerald-500 disabled:bg-gray-200 text-white rounded-xl hover:bg-emerald-600 transition-colors shadow-xs cursor-pointer"
                      >
                        <Send className="h-3.5 w-3.5 rtl:-scale-x-100" />
                      </button>
                    </form>
                    <div className="flex gap-2 justify-end">
                      <label className="text-[10px] font-bold text-gray-500 hover:text-navy cursor-pointer flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                        <ImageIcon className="h-3 w-3" /> صورة
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'image')} />
                      </label>
                      <label className="text-[10px] font-bold text-gray-500 hover:text-navy cursor-pointer flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                        <Video className="h-3 w-3" /> فيديو
                        <input type="file" accept="video/*" className="hidden" onChange={(e) => handleFileUpload(e, 'video')} />
                      </label>
                      <label className="text-[10px] font-bold text-gray-500 hover:text-navy cursor-pointer flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
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
        className="pointer-events-auto h-12 w-12 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all relative cursor-pointer font-sans"
        title="غرفة الرسائل الخاصة"
      >
        <Lock className="h-5 w-5" />
        {unreadMessagesCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white min-w-5 h-5 rounded-full text-[10px] font-mono font-bold flex items-center justify-center border-2 border-white px-1 leading-none animate-bounce flex-wrap">
            {unreadMessagesCount}
          </span>
        )}
      </button>
    </div>
  );
};
