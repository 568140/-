import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Star, ShieldCheck, CheckCircle, Globe, Sparkles } from 'lucide-react';
import { Product } from '../types';

interface Notification {
  id: string;
  user: string;
  city: string;
  productName: string;
  type: 'purchase' | 'review' | 'view';
  time: string;
}

const cities = ['الرياض', 'جدة', 'عدن', 'تعز', 'صنعاء', 'المكلا', 'الدوحة', 'دبي', 'المنامة', 'مسقط'];
const users = ['أحمد', 'محمد', 'عبدالله', 'خالد', 'سارة', 'ريم', 'نورة', 'فيصل', 'عمر', 'سلطان'];

const TrustPulse: React.FC<{ products: Product[] }> = ({ products }) => {
  const [notification, setNotification] = useState<Notification | null>(null);

  useEffect(() => {
    const showNext = () => {
      if (products.length === 0) return;

      const randomProduct = products[Math.floor(Math.random() * products.length)];
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomCity = cities[Math.floor(Math.random() * cities.length)];
      
      const newNotif: Notification = {
        id: Math.random().toString(36).substr(2, 9),
        user: randomUser,
        city: randomCity,
        productName: randomProduct.name,
        type: 'purchase',
        time: 'منذ لحظات'
      };

      setNotification(newNotif);

      // Dismiss after 6 seconds
      setTimeout(() => {
        setNotification(null);
      }, 6000);
    };

    // Initial delay
    const initialDelay = setTimeout(showNext, 10000);

    // Dynamic interval
    const interval = setInterval(showNext, 25000 + Math.random() * 20000);

    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, [products]);

  return (
    <div className="fixed bottom-24 left-6 z-40 pointer-events-none sm:bottom-6">
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, x: -50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -50, scale: 0.9 }}
            className="pointer-events-auto bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-gold/10 flex items-center gap-4 max-w-[320px]"
          >
            <div className="h-12 w-12 bg-navy rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-navy/10">
              <ShoppingBag className="h-6 w-6 text-gold" />
            </div>
            
            <div className="flex-1 text-right">
              <div className="flex items-center gap-1.5 justify-end mb-0.5">
                <span className="text-[10px] text-emerald-600 font-black font-display uppercase tracking-wider flex items-center gap-1">
                   الآن <CheckCircle className="h-3 w-3" />
                </span>
              </div>
              <p className="text-[11px] font-sans text-gray-500 leading-tight">
                <span className="font-black text-navy">{notification.user}</span> من <span className="font-bold text-navy">{notification.city}</span> اشترى للتو
              </p>
              <h4 className="text-xs font-black text-charcoal font-display mt-0.5 line-clamp-1">
                {notification.productName}
              </h4>
              <div className="flex items-center justify-end gap-2 mt-1.5 opacity-60">
                <span className="text-[9px] font-mono text-gray-400">{notification.time}</span>
                <div className="h-1 w-1 bg-gray-300 rounded-full" />
                <span className="text-[9px] font-display text-gold flex items-center gap-1">
                  <ShieldCheck className="h-2.5 w-2.5" /> مؤمن بنسبة 100%
                </span>
              </div>
            </div>

            <div className="absolute -top-1.5 -right-1.5 bg-gold text-navy rounded-full p-1 border-2 border-white shadow-sm">
              <Sparkles className="h-3 w-3" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TrustPulse;
