import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Wallet, Clock, ArrowUpRight, ArrowDownLeft, DollarSign, CheckCircle, Sparkles, MessageSquare } from 'lucide-react';
import { CustomerAccount, CurrencyConfig } from '../types';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: CustomerAccount | null;
  selectedCurrency: CurrencyConfig;
}

const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose, currentUser, selectedCurrency }) => {
  if (!currentUser) return null;

  const handleRequestDeposit = () => {
    const targetPhone = "967774919194";
    const msg = `السلام عليكم ورحمة الله وبركاته يا مدير 🌸،
أنا العميل: ${currentUser.name} 👋
رقم الجوال: ${currentUser.phone}

أود طلب شحن رصيد مالي إضافي في محفظة دكان الشرق الخاصة بي. يرجى تزويدي بطريقة التحويل المعتمدة لتعبئة الرصيد. شاكر لكم جزيل الشكر والتقدير!`;
    const link = `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodeURIComponent(msg)}`;
    window.open(link, '_blank');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-navy/60 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gold/10 text-right font-sans"
          >
            {/* Header */}
            <div className="bg-navy p-6 text-white relative flex flex-col items-center">
              <button 
                onClick={onClose}
                className="absolute top-4 left-4 p-2 hover:bg-white/10 rounded-xl transition-colors shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
              
              <div className="h-16 w-16 bg-gold rounded-2xl flex items-center justify-center shadow-lg shadow-gold/20 mb-4">
                <Wallet className="h-8 w-8 text-navy" />
              </div>
              
              <h2 className="text-xl font-black font-display tracking-tight text-gradient-gold">محفظة دكان الشرق الرقمية</h2>
              <p className="text-[10px] text-gray-450 font-display mt-1 uppercase tracking-widest">تتبع وإدارة رصيدك المالي الفاخر</p>
            </div>

            {/* Content Container */}
            <div className="p-6 space-y-6">
              
              {/* Wallet Balance Widget */}
              <div className="bg-linear-to-br from-navy to-navy-light p-6 rounded-3xl text-white shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                  <Wallet className="h-20 w-20" />
                </div>
                <div className="relative z-10 space-y-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gold shrink-0" />
                    <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">الرصيد المتاح للاستخدام</span>
                  </div>
                  <div className="text-3xl font-black font-mono flex items-baseline gap-2">
                    {((currentUser.balance || 0) * selectedCurrency.rate).toFixed(2)}
                    <span className="text-xs font-bold font-display text-gold">{selectedCurrency.code}</span>
                  </div>
                </div>
              </div>

              {/* Deposit Action Banner */}
              <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-200/50 space-y-3">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-black text-navy leading-none mb-1">شحن وتعبئة الرصيد الفوري</h4>
                    <p className="text-[10px] text-gray-500 leading-relaxed">
                      يمكنك طلب تعبئة محفظتك عبر نقرات بسيطة من خلال التحويل المباشر لخدمة العملاء. انقر على الزر للتواصل الهاتفي السريع عبر الواتساب لتعبئة رصيدك الآن.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleRequestDeposit}
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[11px] rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  طلب تعبئة رصيد محفظة 🌟
                </button>
              </div>

              {/* Transaction History section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-black text-navy flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gold" /> سجل المعاملات والمدفوعات
                  </h3>
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">المعاملات المالية</span>
                </div>

                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
                  {currentUser.transactions && currentUser.transactions.filter(t => t.unit === 'currency').length > 0 ? (
                    currentUser.transactions.filter(t => t.unit === 'currency').map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100 hover:border-gold/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${
                            (tx.type === 'earn' || tx.type === 'deposit') ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                          }`}>
                            {(tx.type === 'earn' || tx.type === 'deposit') ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                          </div>
                          <div>
                            <div className="text-[10px] font-black text-navy leading-none mb-1">{tx.description}</div>
                            <div className="text-[8px] text-gray-400 font-mono">{tx.date}</div>
                          </div>
                        </div>
                        <div className={`text-xs font-black font-mono text-left ${
                          (tx.type === 'earn' || tx.type === 'deposit') ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {(tx.type === 'earn' || tx.type === 'deposit') ? '+' : '-'}{(tx.amount * selectedCurrency.rate).toFixed(1)}
                          <span className="text-[8px] mr-1">{selectedCurrency.code}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 opacity-40">
                      <Wallet className="h-7 w-7 text-gray-300 mb-1" />
                      <p className="text-[10px] font-bold text-gray-400">لا يوجد حركات مالية مسجلة بعد</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default WalletModal;
