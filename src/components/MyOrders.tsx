import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, ClipboardList, Check, Clock, Truck, Home, CircleAlert } from 'lucide-react';
import { Order } from '../types';
import { CURRENCIES } from '../data';

import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

interface MyOrdersProps {
  currentUser: { name: string; phone: string } | null;
}

export function MyOrders({ currentUser }: MyOrdersProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlOrder = params.get('orderId');
      if (urlOrder) return urlOrder;
    }
    return currentUser ? currentUser.phone : '';
  });

  const handleSearch = async (val: string) => {
    if (!val.trim()) {
      setOrders([]);
      return;
    }

    setIsLoading(true);
    try {
      const q = collection(db, 'orders');
      const results: Order[] = [];
      const v = val.trim();
      
      // We try to match by ID, phone, or email. Since Firestore doesn't support OR across multiple fields easily
      // without complex setup, we'll do targeted searches.
      
      // 1. By ID (primary)
      const qId = query(q, where('id', '==', v));
      const sId = await getDocs(qId);
      sId.forEach(d => results.push(d.data() as Order));

      if (results.length === 0) {
        // 2. By Phone
        const qPhone = query(q, where('customerPhone', '==', v), limit(20));
        const sPhone = await getDocs(qPhone);
        sPhone.forEach(d => results.push(d.data() as Order));
      }

      if (results.length === 0) {
        // 3. By Email
        const qEmail = query(q, where('customerEmail', '==', v.toLowerCase()), limit(20));
        const sEmail = await getDocs(qEmail);
        sEmail.forEach(d => results.push(d.data() as Order));
      }

      // De-duplicate if needed
      const unique = Array.from(new Map(results.map(o => [o.id, o])).values());
      unique.sort((a,b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setOrders(unique);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'orders_search');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (searchQuery) {
      handleSearch(searchQuery);
    }
  }, []);

  React.useEffect(() => {
    if (currentUser) {
      setSearchQuery(currentUser.phone);
      handleSearch(currentUser.phone);
    }
  }, [currentUser]);

  const formatOrderPrice = (sarPrice: number, currencyCode?: string) => {
    const code = currencyCode || 'SAR';
    const curr = CURRENCIES.find(c => c.code === code) || CURRENCIES[0];
    const converted = sarPrice * curr.rate;
    const decimals = curr.code === 'SAR' ? 0 : 2;
    return `${converted.toFixed(decimals)} ${curr.symbol}`;
  };

  const filteredOrders = useMemo(() => {
    return orders;
  }, [orders]);

  // Total user orders placed regardless of search (local backup)
  const automaticOrders = useMemo(() => {
    // Only show if we have a search query or a logged in user matched by phone
    return []; 
  }, []);

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
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
            className="w-full pr-11 pl-4 py-3 bg-gray-50 border border-gray-100 focus:border-amber-500 rounded-xl focus:outline-hidden text-xs text-gray-850 placeholder-gray-400 font-sans"
          />
          <button 
            onClick={() => handleSearch(searchQuery)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer"
          >
            <Search className={`h-5 w-5 ${isLoading ? 'text-amber-500 animate-spin' : 'text-gray-400'}`} />
          </button>
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
                  <p><span className="text-gray-400 font-sans">طريقة الدفع:</span> <span className="font-semibold text-gray-800">{order.paymentMethod === 'local_wallet' ? 'محفظة محلية ' + (order.localWalletName ? `(${order.localWalletName})` : '') : order.paymentMethod === 'cod' ? 'الدفع نقداً عند الاستلام' : order.paymentMethod.toUpperCase()}</span></p>
                  <p><span className="text-gray-400 font-sans">شحنة بقيمة:</span> <span className="font-mono text-amber-850 font-bold">{formatOrderPrice(order.totalPrice, order.currency)}</span></p>
                </div>

                {/* Ordered Items List */}
                {order.items && order.items.length > 0 && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                    <span className="block text-[10px] text-gray-400 font-bold font-sans mb-1">📦 السلع والأقسام المشمولة بالطلب:</span>
                    <div className="divide-y divide-gray-200/60">
                      {order.items.map((it, idx) => {
                        const activeItemPrice = it.customPrice || it.product.price;
                        return (
                          <div key={idx} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2.5">
                              {it.product.image && (
                                <img src={it.product.image} className="w-10 h-10 object-cover rounded-lg border border-gray-150" referrerPolicy="no-referrer" />
                              )}
                              <div className="flex flex-col text-right">
                                <span className="font-bold text-gray-800 font-sans line-clamp-1">{it.product.name}</span>
                                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                  {it.product.code && (
                                    <span className="text-[9px] text-gray-400 font-mono bg-white px-1 border border-gray-100 rounded">كود: {it.product.code}</span>
                                  )}
                                  {it.selectedColor && (
                                    <span className="text-[9px] text-amber-700 bg-amber-50 border border-amber-200/50 px-1 rounded font-bold">اللون: {it.selectedColor}</span>
                                  )}
                                  {it.selectedSize && (
                                    <span className="text-[9px] text-blue-700 bg-blue-50 border border-blue-200/50 px-1 rounded font-bold">المقاس: {it.selectedSize}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-left font-mono">
                              <span className="text-gray-500 font-medium">{it.quantity} حبة × </span>
                              <span className="text-amber-900 font-extrabold">{formatOrderPrice(activeItemPrice, order.currency)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

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
                <p className="text-xs text-gray-400 font-sans font-medium">أدخل رقم الهاتف أو رقم الطلب أعلاه لعرض تفاصيل شحنتك بدقة.</p>
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

                    <div className="py-4 text-xs text-gray-655 space-y-1">
                      <p><span className="text-gray-400">العميل المستلم:</span> <span className="font-semibold text-gray-850">{order.customerName}</span></p>
                      <p><span className="text-gray-400">طريقة الدفع:</span> <span className="font-semibold text-gray-850">{order.paymentMethod === 'local_wallet' ? 'محفظة محلية ' + (order.localWalletName ? `(${order.localWalletName})` : '') : order.paymentMethod === 'cod' ? 'الدفع نقداً عند الاستلام' : order.paymentMethod.toUpperCase()}</span></p>
                      <p><span className="text-gray-400">مجموع الفاتورة:</span> <span className="font-mono font-bold text-amber-800">{formatOrderPrice(order.totalPrice, order.currency)}</span></p>
                    </div>

                    {/* Ordered Items List */}
                    {order.items && order.items.length > 0 && (
                      <div className="mb-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                        <span className="block text-[10px] text-gray-400 font-bold font-sans mb-1">📦 السلع والأقسام المشمولة بالطلب:</span>
                        <div className="divide-y divide-gray-200/60 font-sans">
                          {order.items.map((it, idx) => {
                            const activeItemPrice = it.customPrice || it.product.price;
                            return (
                              <div key={idx} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs font-sans">
                                <div className="flex items-center gap-2.5">
                                  {it.product.image && (
                                    <img src={it.product.image} className="w-10 h-10 object-cover rounded-lg border border-gray-150" referrerPolicy="no-referrer" />
                                  )}
                                  <div className="flex flex-col text-right">
                                    <span className="font-bold text-gray-800 font-sans line-clamp-1">{it.product.name}</span>
                                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                      {it.product.code && (
                                        <span className="text-[9px] text-gray-400 font-mono bg-white px-1 border border-gray-100 rounded font-sans">كود: {it.product.code}</span>
                                      )}
                                      {it.selectedColor && (
                                        <span className="text-[9px] text-amber-700 bg-amber-50 border border-amber-200/50 px-1 rounded font-bold">اللون: {it.selectedColor}</span>
                                      )}
                                      {it.selectedSize && (
                                        <span className="text-[9px] text-blue-700 bg-blue-50 border border-blue-200/50 px-1 rounded font-bold">المقاس: {it.selectedSize}</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-left font-mono">
                                  <span className="text-gray-500 font-medium">{it.quantity} حبة × </span>
                                  <span className="text-amber-900 font-extrabold">{formatOrderPrice(activeItemPrice, order.currency)}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

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
