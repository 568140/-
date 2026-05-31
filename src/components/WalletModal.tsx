import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Wallet, TrendingUp, Gem, Clock, ArrowUpRight, Trophy, Sparkles, ArrowDownLeft, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react';
import { CustomerAccount, Transaction, CurrencyConfig } from '../types';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: CustomerAccount | null;
  selectedCurrency: CurrencyConfig;
  redemptionOptions: import('../types').PointRedemptionOption[];
  onRedeem: (option: import('../types').PointRedemptionOption) => void;
}

const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose, currentUser, selectedCurrency, redemptionOptions, onRedeem }) => {
  if (!currentUser) return null;

  const [confirmingOption, setConfirmingOption] = useState<import('../types').PointRedemptionOption | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [lastRedeemedOption, setLastRedeemedOption] = useState<import('../types').PointRedemptionOption | null>(null);

  const handleRedeemClick = (option: import('../types').PointRedemptionOption) => {
    if ((currentUser.points || 0) < option.pointsRequired) {
      setErrorMessage(`عذراً، تحتاج إلى ${option.pointsRequired} نقطة للحصول على هذه المكافأة.`);
      setTimeout(() => setErrorMessage(null), 4000);
      return;
    }
    setConfirmingOption(option);
  };

  const handleConfirmRedeem = () => {
    if (!confirmingOption) return;
    setLastRedeemedOption(confirmingOption);
    onRedeem(confirmingOption);
    setSuccessMessage(`🎉 تم استبدال النقاط بنجاح! تم الحصول على "${confirmingOption.title}" وإضافتها لمحفظتك.`);
    setConfirmingOption(null);
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
            className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gold/10"
          >
            {/* Absolute Status Overlays */}
            <AnimatePresence>
              {successMessage && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-40 bg-white/95 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center"
                >
                  <motion.div 
                    initial={{ scale: 0.5, type: "spring" }}
                    animate={{ scale: 1 }}
                    className="h-20 w-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-emerald-100/50"
                  >
                    <CheckCircle className="h-10 w-10" />
                  </motion.div>
                  <h3 className="text-lg font-black text-navy mb-2 font-display">عملية ناجحة</h3>
                  <p className="text-xs font-bold text-gray-650 max-w-xs leading-relaxed mb-4">{successMessage}</p>

                  <div className="flex flex-col gap-2 w-full max-w-xs">
                    {lastRedeemedOption && (
                      <button
                        onClick={() => {
                          const targetPhone = "967774919194";
                          const msg = `السلام عليكم ورحمة الله وبركاته يا فندم 🌸،
أنا العميل: ${currentUser.name} 👋
رقم الجوال: ${currentUser.phone}

لقد قمت للتو باستبدال نقاط ولاء من حسابي بنجاح:
- العملية: استبدال نقاط ولاء 💎
- النقاط المستهلكة: ${lastRedeemedOption.pointsRequired} نقطة 🪙
- الجائزة والمكافأة: ${lastRedeemedOption.title} 🎁
- نوع المكافأة: ${lastRedeemedOption.rewardType === 'balance' ? 'رصيد إضافي في المحفظة' : 'كوبون خصم'}

يرجى مراجعة وتجهيز طلبي وتأكيد المعاملة في النظام شاكرين لكم طيب المعاملة.`;
                          const link = `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodeURIComponent(msg)}`;
                          window.open(link, '_blank');
                        }}
                        className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95"
                      >
                        <svg className="h-4 w-4 fill-current shrink-0" viewBox="0 0 24 24">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.45L0 24zm6.59-4.846c1.6.95 3.1 1.458 4.7 1.458 5.411 0 9.811-4.414 9.814-9.83.001-2.621-1.013-5.088-2.86-6.937C16.378 1.993 13.931 1.002 11.99 1.002c-5.41 0-9.812 4.414-9.816 9.83-.001 1.905.496 3.768 1.442 5.378l-1.01 3.682 3.774-1.02a9.75 9.75 0 0 0 5.421 1.623z" />
                        </svg>
                        إرسال مستند الاستبدال للمالك عبر WhatsApp 💬
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setSuccessMessage(null);
                        setLastRedeemedOption(null);
                      }}
                      className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-750 font-bold text-xxs rounded-xl transition-all cursor-pointer"
                    >
                      إغلاق النافذة
                    </button>
                  </div>
                </motion.div>
              )}

              {errorMessage && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-40 bg-white/95 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center"
                >
                  <motion.div 
                    initial={{ scale: 0.5, type: "spring" }}
                    animate={{ scale: 1 }}
                    className="h-20 w-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-rose-100/50"
                  >
                    <AlertTriangle className="h-10 w-10" />
                  </motion.div>
                  <h3 className="text-lg font-black text-navy mb-2 font-display">تنبيه بالنقاط</h3>
                  <p className="text-xs font-bold text-gray-650 max-w-xs leading-relaxed">{errorMessage}</p>
                  <button 
                    onClick={() => setErrorMessage(null)}
                    className="mt-6 px-6 py-2 bg-navy text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-navy-light transition-colors"
                  >
                    موافق، فهمت
                  </button>
                </motion.div>
              )}

              {confirmingOption && (
                <motion.div 
                  initial={{ opacity: 0, y: 100 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 100 }}
                  className="absolute inset-0 z-30 bg-navy/95 text-white flex flex-col items-center justify-center p-6 text-center"
                >
                  <div className="h-16 w-16 bg-gold/10 text-gold rounded-full flex items-center justify-center mb-4">
                    <Trophy className="h-8 w-8" />
                  </div>
                  <h3 className="text-base font-black text-gradient-gold mb-4 font-display">تأكيد استبدال النقاط 🏆</h3>
                  <p className="text-xs font-bold max-w-xs leading-relaxed mb-6">
                    هل أنت متأكد من رغبتك في استبدال <span className="text-gold font-mono font-black">{confirmingOption.pointsRequired} نقطة</span> مقابل:
                    <br />
                    <span className="text-gold font-black mt-2 block bg-white/10 py-2 px-4 rounded-xl">"{confirmingOption.title}"</span>
                  </p>
                  <div className="flex gap-4 w-full max-w-xs">
                    <button 
                      onClick={handleConfirmRedeem}
                      className="flex-1 py-3 bg-gold text-navy font-black text-xs rounded-2xl cursor-pointer hover:bg-gold-light transition-all active:scale-95 shadow-lg shadow-gold/20"
                    >
                      تأكيد الاستبدال
                    </button>
                    <button 
                      onClick={() => setConfirmingOption(null)}
                      className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-2xl cursor-pointer transition-colors"
                    >
                      تراجع
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Header */}
            <div className="bg-navy p-6 text-white relative flex flex-col items-center">
              <button 
                onClick={onClose}
                className="absolute top-4 left-4 p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              
              <div className="h-16 w-16 bg-gold rounded-2xl flex items-center justify-center shadow-lg shadow-gold/20 mb-4">
                <Wallet className="h-8 w-8 text-navy" />
              </div>
              
              <h2 className="text-xl font-black font-display tracking-tight text-gradient-gold">محفظة دكان الشرق</h2>
              <p className="text-[10px] text-gray-400 font-display mt-1 uppercase tracking-widest">تجمع الفخامة والمكافآت</p>
            </div>

             {/* Balance Cards */}
             <div className="p-6">
               <div className="grid grid-cols-2 gap-4 mb-8">
                 <div className="bg-linear-to-br from-navy to-navy-light p-6 rounded-3xl text-white shadow-xl relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                     <Trophy className="h-20 w-20" />
                   </div>
                   <div className="relative z-10">
                     <div className="flex items-center gap-2 mb-2">
                        <Gem className="h-4 w-4 text-gold" />
                        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">النقاط</span>
                     </div>
                     <div className="text-2xl font-black font-mono flex items-baseline gap-2">
                       {currentUser.points || 0}
                       <span className="text-xs font-display text-gold">نقطة</span>
                     </div>
                   </div>
                 </div>

                 <div className="bg-white border-2 border-gray-100 p-6 rounded-3xl text-navy shadow-xs relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                     <Wallet className="h-20 w-20" />
                   </div>
                   <div className="relative z-10">
                     <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-4 w-4 text-emerald-600" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">الرصيد المتاح</span>
                     </div>
                     <div className="text-2xl font-black font-mono flex items-baseline gap-2">
                       {((currentUser.balance || 0) * selectedCurrency.rate).toFixed(2)}
                       <span className="text-xs font-display text-emerald-600">{selectedCurrency.code}</span>
                     </div>
                   </div>
                 </div>
               </div>

              {/* Transaction History */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-xs font-black text-navy flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gold" /> سجل المعاملات
                  </h3>
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">أخر 10 عمليات</span>
                </div>

                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                  {currentUser.transactions && currentUser.transactions.length > 0 ? (
                    currentUser.transactions.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100 hover:border-gold/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${
                            (tx.type === 'earn' || tx.type === 'deposit') ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                          }`}>
                            {(tx.type === 'earn' || tx.type === 'deposit') ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                          </div>
                          <div>
                            <div className="text-[11px] font-black text-navy leading-none mb-1">{tx.description}</div>
                            <div className="text-[9px] text-gray-400 font-mono">{tx.date}</div>
                          </div>
                        </div>
                        <div className={`text-xs font-black font-mono text-left ${
                          (tx.type === 'earn' || tx.type === 'deposit') ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {(tx.type === 'earn' || tx.type === 'deposit') ? '+' : '-'}{tx.amount}
                          <span className="text-[8px] mr-0.5">{tx.unit === 'points' ? 'نقطة' : selectedCurrency.code}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 opacity-20">
                      <Sparkles className="h-8 w-8 mb-2" />
                      <p className="text-[10px] font-bold">لا يوجد سجل معاملات حالياً</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Section */}
              <div className="mt-8">
                <div className="flex items-center gap-2 mb-4 px-2">
                  <Sparkles className="h-4 w-4 text-gold" />
                  <h3 className="text-xs font-black text-navy uppercase tracking-widest">ختر مكافأتك</h3>
                </div>

                <div className="space-y-3">
                  {(redemptionOptions || []).filter(opt => opt.isActive).map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleRedeemClick(option)}
                      disabled={(currentUser.points || 0) < option.pointsRequired}
                      className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all group border ${
                        (currentUser.points || 0) >= option.pointsRequired
                          ? 'bg-navy/5 border-navy/10 hover:border-gold hover:bg-navy/10 cursor-pointer'
                          : 'bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <div className="text-right">
                        <p className="text-xs font-black text-navy mb-0.5">{option.title}</p>
                        <p className="text-[10px] text-gray-500">{option.description}</p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-mono font-black text-gold">{option.pointsRequired} نقطة</span>
                        <div className="text-[8px] font-bold text-navy uppercase tracking-tighter mt-1 px-1.5 py-0.5 bg-gold/10 rounded-md">
                          استبدال الآن
                        </div>
                      </div>
                    </button>
                  ))}
                  
                  {(!redemptionOptions || redemptionOptions.filter(opt => opt.isActive).length === 0) && (
                    <div className="p-10 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                      <Trophy className="h-10 w-10 text-gray-200 mx-auto mb-2" />
                      <p className="text-[10px] font-bold text-gray-400 leading-relaxed italic">
                        لا توجد مكافآت متاحة للحصول عليها حالياً.<br />
                        سيتم إضافة هدايا قريباً من قبل إدارة المتجر!
                      </p>
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
