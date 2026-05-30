import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Search, ClipboardList, Check, Clock, Truck, Home, CircleAlert } from 'lucide-react';
import { Order } from '../types';
import { CURRENCIES } from '../data';

interface MyOrdersProps {
  orders: Order[];
  currentUser: { name: string; phone: string } | null;
}

export function MyOrders({ orders, currentUser }: MyOrdersProps) {
  const [searchQuery, setSearchQuery] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlOrder = params.get('orderId');
      if (urlOrder) return urlOrder;
    }
    return currentUser ? currentUser.phone : '';
  });

  React.useEffect(() => {
    if (currentUser) {
      setSearchQuery(currentUser.phone);
    }
  }, [currentUser]);

  const formatOrderPrice = (sarPrice: number, currencyCode?: string) => {
    const code = currencyCode || 'SAR';
    const curr = CURRENCIES.find(c => c.code === code) || CURRENCIES[0];
    const converted = sarPrice * curr.rate;
    const decimals = curr.code === 'SAR' ? 0 : 2;
    return `${converted.toFixed(decimals)} ${curr.symbol}`;
  };

  // Find all matches based on phone number or email of customer
  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.trim().toLowerCase();
    return orders.filter(o => 
      o.customerEmail.toLowerCase().includes(query) || 
      o.customerPhone.includes(query) ||
      o.customerName.toLowerCase().includes(query) ||
      o.id.toLowerCase().includes(query)
    );
  }, [orders, searchQuery]);

  // Total user orders placed regardless of search (local backup)
  const automaticOrders = useMemo(() => {
    return orders.slice(-3).reverse(); // show last 3 orders automatically to make it easy to see!
  }, [orders]);

  const renderStatusProgress = (status: Order['status']) => {
    const steps: { name: string; statusName: string; icon: any }[] = [
      { name: 'استلام', statusName: 'pending', icon: Clock },
      { name: 'تجهيز', statusName: 'processing', icon: ClipboardList },
      { name: 'شحن', statusName: 'shipped', icon: Truck },
      { name: 'توصيل', statusName: 'delivered', icon: Home },
    ];

    const currentIdx = steps.findIndex(s => s.statusName === status);
    
    if (status === 'cancelled') {
      return (
        <div className="bg-rose-50 border border-rose-100 text-rose-800 rounded-xl p-3 text-center text-xs font-bold font-sans">
          ⚠️ نأسف، لقد تم إلغاء هذا الطلب من قبل الإدارة.
        </div>
      );
    }

    return (
      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xxs font-bold text-gray-400 mb-3 font-mono">حالة شحنتك الحالية:</p>
        <div className="flex justify-between items-center relative">
          
          {/* Progress background line */}
          <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-gray-100 -translate-y-1/2 -z-10" />
          
          {steps.map((step, idx) => {
            const IconComponent = step.icon;
            const isCompleted = idx <= currentIdx;
            const isCurrent = idx === currentIdx;

            return (
              <div key={idx} className="flex flex-col items-center z-10">
                <div className={`h-8 w-8 rounded-full border flex items-center justify-center transition-all ${
                  isCompleted 
                    ? 'bg-amber-600 text-white border-amber-600' 
                    : 'bg-white text-gray-300 border-gray-150'
                } ${isCurrent ? 'ring-4 ring-amber-100 scale-110' : ''}`}>
                  {isCompleted && idx < currentIdx ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <IconComponent className="h-4 w-4" />
                  )}
                </div>
                <span className={`text-xxs font-bold mt-1.5 ${isCompleted ? 'text-amber-900 font-bold' : 'text-gray-400'}`}>
                  {step.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
      
      {currentUser && (
        <div className="bg-amber-600 rounded-3xl p-6 shadow-md mb-8 flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500 rounded-full blur-3xl opacity-50 -z-0"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-amber-700 rounded-full blur-2xl opacity-50 -z-0"></div>
          
          <div className="h-16 w-16 bg-white text-amber-600 rounded-2xl flex items-center justify-center border-4 border-amber-500 shadow-sm z-10 z-[1] shrink-0 font-sans text-xl font-bold">
            {currentUser.name.charAt(0)}
          </div>
          <div className="z-10 z-[1]">
            <h2 className="text-xl font-black text-white font-sans tracking-tight">مرحباً مجدداً، {currentUser.name}</h2>
            <p className="text-amber-100 text-xs mt-1 font-mono">{currentUser.phone}</p>
            <div className="mt-2 inline-flex border border-amber-400 bg-amber-500/30 text-amber-50 px-2 py-0.5 rounded-lg text-xxs font-bold">
              عضو ذهبي نشط
            </div>
          </div>
        </div>
      )}

      <div className="text-center mb-8">
        <div className="h-12 w-12 bg-amber-50 text-amber-700 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-amber-100">
          <ClipboardList className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 font-sans">تتبع حالات طلباتك</h1>
        <p className="text-xs text-gray-400 font-sans mt-1">ابحث سريعاً وتتبع حالة التجهيز والشحن لطلبك الحالي في دُكّان الشرق.</p>
      </div>

      {/* Track Search form */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs mb-8">
        <div className="relative">
          <input
            type="text"
            placeholder="أدخل بريدك الإلكتروني، رقم الجوال أو رقم الطلب (مثال: ORD-...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-11 pl-4 py-3 bg-gray-50 border border-gray-100 focus:border-amber-500 rounded-xl focus:outline-hidden text-xs text-gray-850 placeholder-gray-400 font-sans"
          />
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>
      </div>

      {/* Orders Output */}
      <div className="space-y-6">
        {searchQuery.trim() ? (
          filteredOrders.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-xs text-center">
              <CircleAlert className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-gray-800 font-sans">لم نجد نتائج مطابقة لمصطلح البحث!</p>
              <p className="text-xxs text-gray-400 font-sans mt-1">تأكد من إدخال معلومات الاتصال الصحيحة المرتبطة بطلبك بدقة.</p>
            </div>
          ) : (
            filteredOrders.map(order => (
              <div key={order.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs">
                
                {/* Order Meta details */}
                <div className="flex justify-between items-start pb-4 border-b border-gray-50">
                  <div>
                    <span className="block text-xxs font-bold text-gray-400 font-mono">رقم الفاتورة:</span>
                    <span className="font-mono text-base font-black text-amber-900">{order.id}</span>
                  </div>
                  <div className="text-left font-sans">
                    <span className="block text-xxs font-bold text-gray-400">تاريخ الطلب:</span>
                    <span className="font-mono text-xs text-gray-705">{order.createdAt}</span>
                  </div>
                </div>

                {/* Shipping metadata */}
                <div className="py-4 text-xs text-gray-655 space-y-1">
                  <p><span className="text-gray-400 font-sans">العميل المستلم:</span> <span className="font-semibold text-gray-800">{order.customerName}</span></p>
                  <p><span className="text-gray-400 font-sans">عنوان التوصيل:</span> <span className="font-semibold text-gray-800">{order.customerAddress}</span></p>
                  <p><span className="text-gray-400 font-sans">طريقة الدفع:</span> <span className="font-semibold text-gray-800">{order.paymentMethod === 'local_wallet' ? 'محفظة محلية ' + (order.localWalletName ? `(${order.localWalletName})` : '') : order.paymentMethod.toUpperCase()}</span></p>
                  <p><span className="text-gray-400 font-sans">شحنة بقيمة:</span> <span className="font-mono text-amber-800 font-bold">{formatOrderPrice(order.totalPrice, order.currency)}</span></p>
                </div>

                {/* Pipeline layout output */}
                {renderStatusProgress(order.status)}

              </div>
            ))
          )
        ) : (
          /* Automatic historical listing for current simulator simplicity */
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold text-gray-400 font-sans">آخر طلبيات أجريت مؤخراً</span>
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
            </div>

            {automaticOrders.length === 0 ? (
              <div className="bg-gray-50 rounded-2xl p-8 border border-dashed border-gray-200 text-center">
                <p className="text-xs text-gray-400 font-sans font-medium">سجل مشترياتك خالٍ بالأجهزة المخزنة. تسوّق وأجرِ طلبك الأول!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {automaticOrders.map(order => (
                  <div key={order.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs">
                    
                    <div className="flex justify-between items-start pb-4 border-b border-gray-50">
                      <div>
                        <span className="block text-xxs font-bold text-gray-400 font-mono">رقم الطلب:</span>
                        <span className="font-mono text-base font-black text-amber-900">{order.id}</span>
                      </div>
                      <div className="text-left">
                        <span className="block text-xxs font-bold text-gray-400 font-sans text-left">التاريخ:</span>
                        <span className="font-mono text-xs text-gray-600">{order.createdAt}</span>
                      </div>
                    </div>

                    <div className="py-4 text-xs text-gray-650 space-y-1">
                      <p><span className="text-gray-400">العميل:</span> <span className="font-semibold text-gray-850">{order.customerName}</span></p>
                      <p><span className="text-gray-400">الدفع:</span> <span className="font-semibold text-gray-850">{order.paymentMethod === 'local_wallet' ? 'محفظة محلية ' + (order.localWalletName ? `(${order.localWalletName})` : '') : order.paymentMethod.toUpperCase()}</span></p>
                      <p><span className="text-gray-400">مجموع الفاتورة:</span> <span className="font-mono font-bold text-amber-800">{formatOrderPrice(order.totalPrice, order.currency)}</span></p>
                    </div>

                    {renderStatusProgress(order.status)}

                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
