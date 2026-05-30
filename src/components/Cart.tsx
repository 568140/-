import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, ShoppingBag, Plus, Minus, Tag, Check, CreditCard, ChevronRight, User, Mail, Phone, MapPin, Gift, Truck, Globe, Smile, Sparkles, Lock, AlertCircle, ShoppingCart } from 'lucide-react';
import { CartItem, Coupon, Order, CurrencyConfig, LocalWallet } from '../types';
import { GovernorateData } from '../utils/yemeniData';

interface CartProps {
  cartItems: CartItem[];
  localWallets?: LocalWallet[];
  onUpdateQuantity: (productId: string, quantity: number, selectedSize?: string) => void;
  onRemoveItem: (productId: string, selectedSize?: string) => void;
  onClearCart: () => void;
  onPlaceOrder: (customerInfo: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    customerAddress: string;
    discountApplied: number;
    couponCode: string;
    paymentMethod: Order['paymentMethod'];
    localWalletName?: string;
    shippingCost: number;
    giftWrap: boolean;
    orderId?: string;
  }) => void;
  coupons: Coupon[];
  selectedCurrency: CurrencyConfig;
  currentUser: { name: string; phone: string; } | null;
  onLoginSuccess: (user: { name: string; phone: string }) => void;
  yemeniGeodata: GovernorateData[];
}

const GLOBAL_DESTINATIONS = [
  { id: 'yem', cityAr: 'اليمن (توصيل آمن وباب البيت في كافة المحافظات اليمنية)', region: 'international', costSar: 2500, estDays: '١-٣ أيام شحن سريع' },
];

export function Cart({
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onPlaceOrder,
  coupons,
  selectedCurrency,
  currentUser,
  onLoginSuccess,
  yemeniGeodata,
  localWallets = [],
}: CartProps) {
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<boolean>(false);
  const [lastGeneratedWhatsappUrl, setLastGeneratedWhatsappUrl] = useState('');

  // Customer Account Direct Handler States
  const [authTab, setAuthTab] = useState<'login' | 'register'>('register');
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  const handleCartAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    
    const cleanedPhone = authPhone.trim();
    if (cleanedPhone.length < 9) {
      setAuthError('الرجاء كتابة رقم هاتف صحيح (9 أرقام على الأقل)');
      return;
    }

    const savedAccounts = localStorage.getItem('dukkan_customer_accounts');
    const accounts: { name: string; phone: string; password?: string }[] = savedAccounts ? JSON.parse(savedAccounts) : [];

    if (authTab === 'register') {
      if (!authName.trim()) {
        setAuthError('الرجاء كتابة الاسم الكامل لتسهيل طلبك');
        return;
      }
      const exists = accounts.find(acc => acc.phone === cleanedPhone);
      if (exists) {
        setAuthError('عذراً، رقم الهاتف هذا مسجل مسبقاً لدينا! جرب تسجيل الدخول.');
        return;
      }

      const newAcc = { name: authName.trim(), phone: cleanedPhone, password: authPassword };
      accounts.push(newAcc);
      localStorage.setItem('dukkan_customer_accounts', JSON.stringify(accounts));
      localStorage.setItem('dukkan_current_user', JSON.stringify(newAcc));
      onLoginSuccess(newAcc);
    } else {
      const found = accounts.find(acc => acc.phone === cleanedPhone);
      if (!found) {
        setAuthError('رقم الهاتف هذا غير مسجل لدينا. يرجى إنشاء حساب جديد أولاً!');
        return;
      }
      if (authPassword && found.password && found.password !== authPassword) {
        setAuthError('كلمة المرور غير صحيحة! يرجى التحقق وإعادة المحاولة.');
        return;
      }

      localStorage.setItem('dukkan_current_user', JSON.stringify(found));
      onLoginSuccess(found);
    }
  };

  // Computed map from flat array for seamless compatibility inside the component
  const geodataMap = React.useMemo(() => {
    const map: Record<string, GovernorateData> = {};
    yemeniGeodata.forEach(gov => {
      map[gov.id] = gov;
    });
    return map;
  }, [yemeniGeodata]);

  // Yemeni Address drop-down states
  const [yemeniGov, setYemeniGov] = useState(() => yemeniGeodata[0]?.id || 'sanaa');
  const [yemeniDist, setYemeniDist] = useState(() => yemeniGeodata[0]?.districts[0] || '');
  const [yemeniStreet, setYemeniStreet] = useState(() => yemeniGeodata[0]?.streets[0] || '');
  const [customYemeniStreet, setCustomYemeniStreet] = useState('');

  // Auto-switch children dropdown options when Governorates shift
  React.useEffect(() => {
    if (geodataMap[yemeniGov]) {
      setYemeniDist(geodataMap[yemeniGov].districts[0] || '');
      setYemeniStreet(geodataMap[yemeniGov].streets[0] || '');
    }
  }, [yemeniGov, geodataMap]);

  // Autofill verified user data from profile system
  React.useEffect(() => {
    if (currentUser) {
      setCustomerName(currentUser.name);
      setCustomerPhone(currentUser.phone);
    }
  }, [currentUser]);

  // Advanced order customization states
  const [giftWrap, setGiftWrap] = useState(false);
  const [selectedDestId, setSelectedDestId] = useState(GLOBAL_DESTINATIONS[0].id);

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  
  // Simulated Card Payment States
  const [paymentMethod, setPaymentMethod] = useState<Order['paymentMethod']>('visa');
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVV, setCardCVV] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [paypalEmail, setPaypalEmail] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState<string | null>(null); // Contains Order ID on success

  // Conversion rates calculations helper
  const formatPrice = (sarPrice: number) => {
    const converted = sarPrice * selectedCurrency.rate;
    const decimals = selectedCurrency.code === 'SAR' ? 0 : 2;
    return `${converted.toFixed(decimals)} ${selectedCurrency.symbol}`;
  };

  // Compute pricing
  const subtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  
  const discountAmount = appliedCoupon
    ? appliedCoupon.discountType === 'percentage'
      ? (subtotal * appliedCoupon.discountValue) / 100
      : appliedCoupon.discountValue
    : 0;

  const actualDiscount = Math.min(discountAmount, subtotal);
  const remainingAfterDiscount = Math.max(subtotal - actualDiscount, 0);
  
  // Shipping charge calc based on destination
  const destObj = GLOBAL_DESTINATIONS.find(d => d.id === selectedDestId) || GLOBAL_DESTINATIONS[0];
  // If subtotal is more than 400, shipping is free!
  const shippingCost = subtotal > 400 ? 0 : destObj.costSar;
  const giftWrapCost = giftWrap ? 15 : 0; // 15 SAR for custom wrapping with elegant ribbon card
  
  const vatAmount = remainingAfterDiscount * 0.15; // 15% VAT
  const totalAmount = remainingAfterDiscount + vatAmount + shippingCost + giftWrapCost;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null);
    setCouponSuccess(false);

    const coupon = coupons.find((c) => c.code.toUpperCase() === couponInput.trim().toUpperCase());
    
    if (!coupon) {
      setCouponError('رمز الكوبون هذا غير صالح أو منتهي الصلاحية!');
      setAppliedCoupon(null);
      return;
    }

    if (coupon.minSpend && subtotal < coupon.minSpend) {
      setCouponError(`الحد الأدنى لتطبيق هذا الكوبون هو ${formatPrice(coupon.minSpend)}`);
      setAppliedCoupon(null);
      return;
    }

    setAppliedCoupon(coupon);
    setCouponSuccess(true);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponSuccess(false);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const isYemen = selectedDestId === 'yem';
    const finalAddress = isYemen
      ? `محافظة ${geodataMap[yemeniGov]?.name || yemeniGov} - مديرية ${yemeniDist} - شارع/حي ${yemeniStreet.includes('أخرى') ? customYemeniStreet : yemeniStreet}`
      : customerAddress;

    if (!customerName.trim() || !customerEmail.trim() || !customerPhone.trim()) {
      alert('الرجاء تعبئة الاسم والبريد ورقم الهاتف للتواصل.');
      return;
    }

    if (!isYemen && !customerAddress.trim()) {
      alert('الرجاء كتابة العنوان بالتفصيل.');
      return;
    }

    if (isYemen && yemeniStreet.includes('أخرى') && !customYemeniStreet.trim()) {
      alert('الرجاء كتابة اسم الشارع المخصص.');
      return;
    }

    // Payment validation check simulation
    if ((paymentMethod === 'visa' || paymentMethod === 'mada') && (!cardNumber || cardNumber.length < 15)) {
      alert('الرجاء إدخال تفاصيل بطاقة الائتمان الصالحة بشكل كامل.');
      return;
    }
    if (paymentMethod === 'local_wallet' && !selectedWalletId) {
      alert('الرجاء اختيار احدى المحافظ المحلية لإتمام الطلب.');
      return;
    }

    setIsSubmitting(true);
    // Simulate real high-security bank payment authorization
    setTimeout(() => {
      const generatedOrderId = 'TR-' + Math.floor(100000 + Math.random() * 900000);
      
      onPlaceOrder({
        customerName,
        customerEmail,
        customerPhone,
        customerAddress: isYemen ? finalAddress : `${destObj.cityAr} - ${customerAddress}`,
        discountApplied: actualDiscount,
        couponCode: appliedCoupon?.code || '',
        paymentMethod,
        localWalletName: paymentMethod === 'local_wallet' && selectedWalletId 
          ? localWallets?.find(w => w.id === selectedWalletId)?.name 
          : undefined,
        shippingCost,
        giftWrap,
        orderId: generatedOrderId,
      });

      // Format complete order metrics for WhatsApp message
      const itemsString = cartItems
        .map(
          (item) =>
            `• ${item.product.name} ${item.selectedSize ? `(مقاس ${item.selectedSize})` : ''} × ${item.quantity} حبة`
        )
        .join('\n');

      const siteOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://dukkan-east.sa';
      const directRedirectionLink = `${siteOrigin}/?orderId=${generatedOrderId}`;

      const whatsappMessage = `السلام عليكم ورحمة الله وبركاته،
لقد قمت بإتمام طلبي بنجاح من متجر "دكّان الشَّرق"! 🌟

🛍️ تفاصيل الطلب والمجموع:
- الرمز المميز للطلب (المعرف الفريد): ${generatedOrderId}
- العميل: ${customerName}
- رقم الجوال للتواصل: ${customerPhone}
- البريد الإلكتروني: ${customerEmail}
- عنوان التوصيل الفاخر: ${isYemen ? finalAddress : `${destObj.cityAr} - ${customerAddress}`}

📦 المنتجات المشتراة:
${itemsString}

💳 الفاتورة والحساب:
- الإجمالي الكلي للطلب: ${formatPrice(totalAmount)}
- طريقة الدفع المستخدمة: ${paymentMethod === 'local_wallet' ? 'محفظة محلية ' + (localWallets?.find(w => w.id === selectedWalletId)?.name || '') : paymentMethod.toUpperCase()}
- الخصم المطبق: ${formatPrice(actualDiscount)}
- قيمة الشحن والتوصيل: ${shippingCost === 0 ? 'شحن مجاني' : formatPrice(shippingCost)}
- تغليف هدايا ملكي: ${giftWrap ? 'نعم (مرفق بطاقة إهداء)' : 'لا'}

🔗 رابط تتبع وإدارة الطلب فورياً في الموقع (اضغط للانتقال مباشرة للموقع):
${directRedirectionLink}

ملاحظة للمالك: يرجى استعراض وتجهيز هذا الطلب من لوحة التحكم باستخدام الرمز المميز الفريد الخاص بي: ${generatedOrderId}`;

      const targetPhone = "967774919194";
      const whatsappLink = `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodeURIComponent(whatsappMessage)}`;
      
      setLastGeneratedWhatsappUrl(whatsappLink);
      setOrderComplete(generatedOrderId);
      setIsSubmitting(false);

      // Attempt automatic tab redirection
      try {
        window.open(whatsappLink, '_blank');
      } catch (e) {
        console.warn('Blocked by browser pop-up block logic.');
      }

      onClearCart();
    }, 2000);
  };

  // Success view
  if (orderComplete) {
    return (
      <div className="py-16 px-4 max-w-2xl mx-auto text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl p-8 md:p-12 shadow-2xl border border-gray-150 flex flex-col items-center"
        >
          <div className="h-20 w-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-6 border border-emerald-100 shadow-md">
            <Check className="h-10 w-10 text-emerald-600" />
          </div>

          <h2 className="text-2xl font-black text-gray-900 font-sans mb-2">تم تأكيد وتعميد طلبك الفاخر بنجاح!</h2>
          <p className="text-sm text-gray-500 font-sans mb-8 leading-relaxed max-w-lg">
            أهلاً بك في خدمات النخبة، لقد تم معالجة دفعتك بنجاح عبر النظام البنكي المصاحب برقم مرجعي <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md">{orderComplete}</span>. سنقوم بشحن السلع وتوصيلها فوراً إلى عنوانكم المحدد.
          </p>

          <div className="w-full bg-gray-50 rounded-2xl p-6 mb-8 text-right space-y-3.5 text-xs text-gray-700 border border-gray-100 font-sans">
            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span className="text-gray-400">الرمز المميز الفريد لطلبك (TR-XXX):</span>
              <span className="font-mono font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-sm">{orderComplete}</span>
            </div>
            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span className="text-gray-400">المستلم الفاخر:</span>
              <span className="font-sans font-bold text-gray-900">{customerName}</span>
            </div>
            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span className="text-gray-405 text-gray-400">عنوان الشحنة الدولية:</span>
              <span className="font-sans text-gray-900 text-left md:text-right font-extrabold">{destObj.cityAr} - {customerAddress}</span>
            </div>
            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span className="text-gray-404 text-gray-405 text-gray-400">قيمة الدفعة عبر ({paymentMethod === 'local_wallet' ? localWallets?.find(w => w.id === selectedWalletId)?.name : paymentMethod.toUpperCase()}):</span>
              <span className="font-mono text-amber-900 font-extrabold">{formatPrice(totalAmount)}</span>
            </div>
            {giftWrap && (
              <div className="flex justify-between font-bold text-amber-800">
                <span>تغليف الهدايا المميز:</span>
                <span>✓ جاهز للهدايا مع بطاقة الإهداء الفخمة</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3.5 w-full">
            {/* WhatsApp Luxury Send Option */}
            <a
              href={lastGeneratedWhatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm rounded-xl transition-all shadow-md inline-flex items-center justify-center space-x-2 space-x-reverse cursor-pointer font-sans"
            >
              <Smile className="h-5 w-5" />
              <span>إرسال جميع تفاصيل الفاتورة فوراً عبر واتساب للمالك</span>
            </a>

            <button
              onClick={() => {
                setOrderComplete(null);
                setCustomerName('');
                setCustomerEmail('');
                setCustomerPhone('');
                setCustomerAddress('');
                setAppliedCoupon(null);
                setCouponInput('');
                setCouponSuccess(false);
                setGiftWrap(false);
                setLastGeneratedWhatsappUrl('');
                setCardNumber('');
                setCardExpiry('');
                setCardCVV('');
                setCardHolder('');
                setPaypalEmail('');
              }}
              className="w-full py-3 bg-gray-950 hover:bg-gray-900 text-amber-400 font-extrabold text-xs sm:text-sm rounded-xl transition-colors cursor-pointer font-sans"
            >
              متابعة التسوق العام بالمتجر
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Empty cart view
  if (cartItems.length === 0) {
    return (
      <div className="py-16 px-4 max-w-lg mx-auto text-center">
        <div className="bg-white rounded-3xl p-12 shadow-xs border border-gray-100">
          <ShoppingBag className="h-16 w-16 text-amber-600 mx-auto mb-6" />
          <h2 className="text-xl font-bold text-gray-950 font-sans mb-2">سلة مشترياتك فارغة!</h2>
          <p className="text-xs text-gray-400 font-sans mb-8 leading-relaxed">
            العديد من المنتجات المميزة والعروض الرائعة بانتظارك في صفحة التسوق الرئيسية. ابدأ بالتسوق الآن لإضافة المنتجات إلى السلة والدفع.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded-xl transition-colors cursor-pointer"
          >
            تصفح المنتجات المعروضة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex items-center space-x-2 space-x-reverse mb-8">
        <h1 className="text-2xl font-black text-gray-950 font-sans">بوابة السداد والشحن الدولي</h1>
        <span className="text-xxs font-mono bg-amber-100 text-amber-800 px-2 py-0.5 rounded-sm font-bold animate-pulse">
          100% SECURE CHECKOUT
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Cart items list section */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-150 shadow-xs">
            <h2 className="text-xs font-bold text-gray-800 border-b border-gray-100 pb-3 mb-4 flex items-center justify-between">
              <span>السلع المختارة لطلبيتك ({cartItems.length} أنواع)</span>
              <button 
                onClick={onClearCart} 
                className="text-[10px] text-rose-600 hover:underline font-bold transition-all"
              >
                تفريغ السلة بالكامل
              </button>
            </h2>

            <div className="divide-y divide-gray-100">
              {cartItems.map((item) => (
                <div key={`${item.product.id}-${item.selectedSize || 'none'}`} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      referrerPolicy="no-referrer"
                      className="h-16 w-16 object-cover rounded-xl bg-gray-50 flex-none border border-gray-100"
                    />
                    <div>
                      <h3 className="text-xs font-bold text-gray-900 font-sans line-clamp-1">
                        {item.product.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5 mb-1 flex-wrap">
                        <span className="text-[10px] text-gray-400 font-sans">{item.product.category}</span>
                        {item.product.subCategory && (
                          <span className="text-[10px] text-gray-450 bg-gray-100 px-1 py-0.2 rounded text-gray-500">{item.product.subCategory}</span>
                        )}
                        {item.selectedSize && (
                          <span className="text-[10px] bg-amber-50 text-amber-800 px-1.5 py-0.2 rounded border border-amber-100 font-bold">
                            مقاس: {item.selectedSize}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-bold text-gray-500 font-mono">
                        {formatPrice(item.product.price)} / للقطعة الواحد
                      </span>
                    </div>
                  </div>

                  {/* Increment/Decrement controls & Delete */}
                  <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
                    <div className="flex items-center space-x-1 space-x-reverse bg-gray-50 px-2 py-1.5 rounded-xl border border-gray-150">
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1, item.selectedSize)}
                        className="p-1 text-gray-500 hover:text-amber-800 transition-colors cursor-pointer"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold font-mono text-gray-800">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1, item.selectedSize)}
                        className="p-1 text-gray-500 hover:text-amber-800 transition-colors cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center space-x-3 space-x-reverse">
                      <span className="text-sm font-extrabold font-mono text-amber-950">
                        {formatPrice(item.product.price * item.quantity)}
                      </span>

                      <button
                        onClick={() => onRemoveItem(item.product.id, item.selectedSize)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 transition-colors rounded-lg hover:bg-rose-50 cursor-pointer"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Checkout shipping info form */}
          {currentUser ? (
          <form id="shipping-form" onSubmit={handleSubmitOrder} className="bg-white rounded-2xl p-6 border border-gray-150 shadow-xs space-y-4">
            <h2 className="text-xs font-extrabold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-1.5">
              <Truck className="h-4.5 w-4.5 text-amber-600" />
              <span>تفاصيل شحن عميل النخبة والعنوان الفاخر</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-[10px] text-gray-400 font-mono mb-1.5 font-bold uppercase">اسم المستلم الكامل *</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="عبدالرحمن فيصل الفاضل"
                    className="w-full pr-10 pl-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-hidden focus:border-amber-500"
                  />
                  <User className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-600" />
                </div>
              </div>

              <div className="relative">
                <label className="block text-[10px] text-gray-400 font-mono mb-1.5 font-bold uppercase">البريد الإلكتروني المعتمد *</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="abdulrahman@faisal.com"
                    className="w-full pr-10 pl-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-hidden focus:border-amber-500 font-mono"
                  />
                  <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-600" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-[10px] text-gray-400 font-mono mb-1.5 font-bold uppercase">رقم الجوال الفعال للتوصيل *</label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+966 5X XXX XXXX"
                    className="w-full pr-10 pl-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-hidden focus:border-amber-500 font-mono"
                  />
                  <Phone className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-600" />
                </div>
              </div>

              {/* Destination region and calculations */}
              <div className="relative">
                <label className="block text-[10px] text-gray-400 font-mono mb-1.5 font-bold uppercase">مدينة التسليم المعتمدة بالدول *</label>
                <select
                  value={selectedDestId}
                  onChange={(e) => setSelectedDestId(e.target.value)}
                  className="w-full pr-4 pl-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-hidden focus:border-amber-500 cursor-pointer"
                >
                  {GLOBAL_DESTINATIONS.map((dest) => (
                    <option key={dest.id} value={dest.id}>
                      {dest.cityAr} ({dest.estDays} - {dest.costSar === 0 || subtotal > 400 ? 'شحن مجاني' : `${dest.costSar} ر.س`})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedDestId === 'yem' ? (
              <div className="space-y-4 border border-amber-500/10 bg-amber-50/10 p-4 rounded-2xl text-right animate-fade-in">
                <h4 className="text-xs font-black text-amber-900 mb-1 flex items-center gap-1">
                  <span className="text-sm">🇾🇪</span>
                  <span>تفاصيل عنوان الشحن لمحافظات ومديريات اليمن</span>
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[9px] text-gray-400 font-bold mb-1">المحافظة اليمنية *</label>
                    <select
                      value={yemeniGov}
                      onChange={(e) => setYemeniGov(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-850 focus:outline-hidden focus:border-amber-500 cursor-pointer"
                    >
                      {yemeniGeodata.map((gov) => (
                        <option key={gov.id} value={gov.id}>{gov.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] text-gray-400 font-bold mb-1">المديرية / المنطقة *</label>
                    <select
                      value={yemeniDist}
                      onChange={(e) => setYemeniDist(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-850 focus:outline-hidden focus:border-amber-500 cursor-pointer"
                    >
                      {geodataMap[yemeniGov]?.districts.map((dist) => (
                        <option key={dist} value={dist}>{dist}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] text-gray-400 font-bold mb-1">الشارع أو الحي الرئيسي *</label>
                    <select
                      value={yemeniStreet}
                      onChange={(e) => setYemeniStreet(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-850 focus:outline-hidden focus:border-amber-500 cursor-pointer"
                    >
                      {geodataMap[yemeniGov]?.streets.map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {yemeniStreet.includes('أخرى') && (
                  <div className="animate-fade-in relative">
                    <label className="block text-[10px] text-amber-900 font-sans mb-1 font-extrabold">يرجى كتابة اسم الشارع المخصص أو الحي بالتفصيل *</label>
                    <input
                      type="text"
                      required
                      value={customYemeniStreet}
                      onChange={(e) => setCustomYemeniStreet(e.target.value)}
                      placeholder="اكتب اسم الشارع التفصيلي ورقم المنزل هنا"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-hidden focus:border-amber-500"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="relative">
                <label className="block text-[10px] text-gray-400 font-mono mb-1.5 font-bold uppercase">العنوان السكني / رقم البيت والشارع التفصيلي *</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="فيلا ٣٤، حي النرجس، شارع الملقا الرئيسي"
                    className="w-full pr-10 pl-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-hidden focus:border-amber-500"
                  />
                  <MapPin className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-600" />
                </div>
              </div>
            )}

            {/* Custom Extras: Wrapping Choice */}
            <div className="mt-4 pt-4 border-t border-gray-150 bg-amber-50/20 p-4 rounded-2xl border border-amber-500/10">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="giftwrap"
                  checked={giftWrap}
                  onChange={(e) => setGiftWrap(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded-sm border-gray-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <label htmlFor="giftwrap" className="text-xs cursor-pointer">
                  <span className="font-extrabold text-amber-950 flex items-center gap-1">
                    <Gift className="h-4 w-4 text-amber-600 inline" />
                    <span>تغليف السلعة كهدية راقية (+ {formatPrice(15)})</span>
                  </span>
                  <span className="block text-[10px] text-gray-500 mt-1">سوف نلف طلبك ببطاقات مغلفة فخمة ومخمل أسود ملائم للمناسبات الخاصة مع كتابة كود مخصص.</span>
                </label>
              </div>
            </div>
            
            {/* Payment simulated gateway choice and detailed simulated card screen */}
            <div className="mt-6 pt-6 border-t border-gray-150">
              <h3 className="text-xs font-bold text-gray-900 mb-4 flex items-center gap-1.5">
                <CreditCard className="h-4.5 w-4.5 text-amber-600" />
                <span>اختر قنوات وطرق الدفع المؤمنة عالمياً</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
                {[
                  { id: 'visa', labelAr: 'فيزا / ماستر' },
                  { id: 'mada', labelAr: 'مدى' },
                  { id: 'applepay', labelAr: 'Apple Pay' },
                  { id: 'paypal', labelAr: 'PayPal' },
                  { id: 'cod', labelAr: 'الدفع نقداً' },
                  { id: 'local_wallet', labelAr: 'محافظ محلية' },
                ].map((pm) => (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setPaymentMethod(pm.id as any)}
                    className={`py-2 px-1 text-center font-sans font-bold text-[11px] rounded-lg transition-all border cursor-pointer ${
                      paymentMethod === pm.id
                        ? 'bg-amber-100 text-amber-950 border-amber-500 scale-102 font-extrabold'
                        : 'bg-white text-gray-600 border-gray-200'
                    }`}
                  >
                    {pm.labelAr}
                  </button>
                ))}
              </div>

              {/* Real-time details simulated placeholders */}
              <AnimatePresence mode="wait">
                {(paymentMethod === 'visa' || paymentMethod === 'mada') && (
                  <motion.div
                    key="card"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden bg-gray-50 rounded-xl p-4 border border-gray-150 space-y-3"
                  >
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-3">
                        <label className="block text-[9px] font-bold text-gray-500 mb-1">اسم حامل البطاقة</label>
                        <input
                          type="text"
                          required
                          value={cardHolder}
                          onChange={(e) => setCardHolder(e.target.value)}
                          placeholder="ABDULRAHMAN F ALFAISAL"
                          className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-mono uppercase focus:outline-hidden"
                        />
                      </div>
                      <div className="col-span-3 pb-1">
                        <label className="block text-[9px] font-bold text-gray-500 mb-1">رقم البطاقة الائتمانية</label>
                        <input
                          type="text"
                          maxLength={19}
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          placeholder="4000 1234 5678 9010"
                          required
                          className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-mono focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-gray-500 mb-1">تاريخ الانتهاء</label>
                        <input
                          type="text"
                          maxLength={5}
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          placeholder="12/28"
                          required
                          className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-mono text-center focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-gray-500 mb-1">الرمز السري CVV</label>
                        <input
                          type="password"
                          maxLength={3}
                          value={cardCVV}
                          onChange={(e) => setCardCVV(e.target.value)}
                          placeholder="***"
                          required
                          className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-mono text-center focus:outline-hidden"
                        />
                      </div>
                      <div className="flex items-end justify-center">
                        <span className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1 mb-1.5">
                          🛡️ مؤمّن PCI
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {paymentMethod === 'applepay' && (
                  <motion.div
                    key="apple"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden bg-black text-white rounded-xl p-4 text-center cursor-pointer hover:bg-neutral-900 transition-colors"
                  >
                    <p className="text-xs font-sans font-bold flex items-center justify-center gap-1">
                      <span> دفع سريع بنقرة واحدة عبر Apple Pay</span>
                    </p>
                  </motion.div>
                )}

                {paymentMethod === 'paypal' && (
                  <motion.div
                    key="paypal"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden bg-blue-50 text-blue-900 rounded-xl p-4 border border-blue-200 space-y-2"
                  >
                    <label className="block text-[9px] font-bold text-blue-800">بريد حساب PayPal الإلكتروني لحضرتكم</label>
                    <input
                      type="email"
                      value={paypalEmail}
                      onChange={(e) => setPaypalEmail(e.target.value)}
                      placeholder="paypal@yourdomain.com"
                      className="w-full px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-xs font-mono"
                    />
                  </motion.div>
                )}

                {paymentMethod === 'cod' && (
                  <motion.div
                    key="cod"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden bg-amber-50 rounded-xl p-4 border border-amber-200"
                  >
                    <p className="text-[11px] text-amber-900 font-sans leading-relaxed">
                      ✓ الدفع نقداً عند الاستلام. تنطبق رسوم كود إضافية بسيطة للخدمة من شركات النقل الدولية.
                    </p>
                  </motion.div>
                )}

                {paymentMethod === 'local_wallet' && (
                  <motion.div
                    key="local_wallet"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden bg-green-50 rounded-xl p-4 border border-green-200 space-y-3"
                  >
                    <p className="text-[11px] text-green-900 font-sans leading-relaxed mb-2 font-bold">
                      ✓ الدفع المباشر عبر المحافظ المحلية السريعة (الكريمي، جوالي، فلوسك وغيرها). يرجى إرسال المبلغ لأحد الحسابات التالية ورفع إيصال الحوالة بعد تأكيد الطلب.
                    </p>
                    {localWallets?.filter(w => w.isActive).length === 0 ? (
                      <p className="text-rose-600 text-[11px] font-bold">عذراً، لاتوجد محافظ محلية مفعلة حالياً.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {localWallets?.filter(w => w.isActive).map(wallet => (
                          <label key={wallet.id} className={`flex items-start space-x-2 space-x-reverse p-3 rounded-xl border cursor-pointer transition-all ${selectedWalletId === wallet.id ? 'bg-green-100 border-green-500 shadow-xs' : 'bg-white border-gray-200 hover:border-green-300'}`}>
                            <input 
                              type="radio" 
                              name="local_wallet" 
                              value={wallet.id}
                              checked={selectedWalletId === wallet.id}
                              onChange={(e) => setSelectedWalletId(e.target.value)}
                              className="mt-1 text-green-600 focus:ring-green-500"
                            />
                            <div>
                              <span className="block text-xs font-black text-gray-900">{wallet.name}</span>
                              <span className="block text-[11px] text-gray-600 font-mono mt-0.5">{wallet.accountNumber}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </form>
          ) : (
            <div className="bg-white rounded-2xl p-6 border border-amber-600/20 shadow-lg space-y-4 text-right">
              <div className="bg-amber-50 p-4 rounded-xl flex items-start gap-3 border border-amber-100">
                <Lock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <h3 className="text-sm font-black text-amber-900">إنشاء حساب أو تسجيل الدخول السريع لإتمام طلبك</h3>
                  <p className="text-xs text-amber-800/80 leading-relaxed mt-1 font-sans">
                    عميلنا الكريم، لشراء المنتجات يرجى تسجيل الدخول أو إنشاء حساب بالاسم ورقم الهاتف مجانًا لحماية طلباتكم وتأمين شحناتكم الدولية والداخلية باليمن.
                  </p>
                </div>
              </div>

              {/* Direct Tab Chooser */}
              <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-150 gap-1">
                <button
                  type="button"
                  onClick={() => { setAuthTab('register'); setAuthError(null); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-300 cursor-pointer ${authTab === 'register' ? 'bg-amber-600 text-white shadow-xs' : 'text-gray-500 hover:text-gray-950 hover:bg-gray-100'}`}
                >
                  إنشاء حساب جديد بالكامل
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthTab('login'); setAuthError(null); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-300 cursor-pointer ${authTab === 'login' ? 'bg-amber-600 text-white shadow-xs' : 'text-gray-500 hover:text-gray-950 hover:bg-gray-100'}`}
                >
                  مستخدم مسجل (تسجيل الدخول)
                </button>
              </div>

              {authError && (
                <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs p-3 rounded-xl flex items-start gap-2 animate-fade-in font-sans">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleCartAuthSubmit} className="space-y-4 pt-2">
                {authTab === 'register' && (
                  <div className="space-y-1">
                    <label className="block text-[10px] text-gray-500 font-bold mb-1 font-sans">الاسم الكريم بالكامل *</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={authName}
                        onChange={(e) => setAuthName(e.target.value)}
                        placeholder="أدخل اسمك الثلاثي كاملاً"
                        className="w-full pr-10 pl-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-850 focus:outline-hidden focus:border-amber-500 font-sans"
                      />
                      <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500" />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] text-gray-500 font-bold mb-1 font-sans">رقم الهاتف اليمني المعتمد *</label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        value={authPhone}
                        onChange={(e) => setAuthPhone(e.target.value)}
                        placeholder="مثال: 777123456"
                        className="w-full pr-10 pl-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-850 focus:outline-hidden focus:border-amber-500 font-sans text-left"
                        dir="ltr"
                      />
                      <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] text-gray-500 font-bold mb-1 font-sans">كلمة مرور مخصصة لحسابك *</label>
                    <div className="relative">
                      <input
                        type="password"
                        required
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pr-10 pl-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-850 focus:outline-hidden focus:border-amber-500 font-sans text-left"
                        dir="ltr"
                      />
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500" />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-amber-600 hover:bg-amber-700 active:scale-98 text-white font-black py-3 rounded-xl shadow-xs transition-all duration-200 text-xs flex items-center justify-center gap-1.5 cursor-pointer mt-4"
                >
                  <Sparkles className="h-4 w-4 text-amber-100 animate-spin-pulse" />
                  <span>
                    {authTab === 'register' ? 'إنشاء حسابك الملكي وتفعيل العنوان 🔒' : 'تسجيل دخول وفتح بوابة العنوان 🔑'}
                  </span>
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Price Breakdowns and Coupons side panel */}
        <div className="lg:col-span-5 space-y-4">
          {/* Coupon field */}
          <div className="bg-white rounded-2xl p-5 border border-gray-150 shadow-xs">
            <h2 className="text-xs font-bold text-gray-900 mb-3 font-sans">تطبيق كود الخصم الفعال</h2>
            
            {!appliedCoupon ? (
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="أدخل الرمز الترويجي للخصم..."
                    className="w-full pr-4 pl-4 py-2.5 bg-gray-50 border border-gray-200 focus:border-amber-500 rounded-xl focus:outline-hidden text-xs text-gray-800 placeholder-gray-400 font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  تفعيل
                </button>
              </form>
            ) : (
              <div className="bg-emerald-50 border border-emerald-150 rounded-xl px-4 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-2 space-x-reverse text-emerald-800 text-xs">
                  <Tag className="h-4 w-4 text-emerald-600" />
                  <span className="font-bold">كوبون مفعّل ({appliedCoupon.code})</span>
                  <span className="text-emerald-600 font-mono">
                    (-{appliedCoupon.discountType === 'percentage' ? `${appliedCoupon.discountValue}%` : formatPrice(appliedCoupon.discountValue)})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="text-xxs text-rose-600 font-bold hover:underline transition-all cursor-pointer"
                >
                  إلغاء الخصم
                </button>
              </div>
            )}

            {couponError && (
              <p className="text-rose-600 text-xxs mt-2 font-bold">{couponError}</p>
            )}

            {couponSuccess && (
              <p className="text-emerald-700 text-xxs mt-2 font-bold flex items-center space-x-1 space-x-reverse">
                <Check className="h-3 w-3" />
                <span>تم خصم القيمة بنجاح من المجموع!</span>
              </p>
            )}

            {/* Hint of available coupons for easy checkout test */}
            <div className="mt-3 bg-amber-50/50 rounded-lg p-2.5 border border-amber-200/40">
              <span className="block text-xxs font-bold text-amber-950 mb-1">🎁 أكواد متاحة للتجربة:</span>
              <div className="flex flex-wrap gap-2 text-xxs">
                <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-mono font-bold">WEL20</span>
                <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-mono font-bold">DDUKAN50</span>
                <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-mono font-bold">SAVE10</span>
              </div>
            </div>
          </div>

          {/* Pricing breakdowns card */}
          <div className="bg-white rounded-2xl p-6 border border-gray-150 shadow-xs space-y-4">
            <h2 className="text-xs font-bold text-gray-900 border-b border-gray-100 pb-3 font-sans">
              تفاصيل الفاتورة ومجموع الحساب بالكامل
            </h2>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-gray-500">
                <span className="font-sans">مجموع المنتجات والسلع</span>
                <span className="font-mono text-gray-800 font-bold">{formatPrice(subtotal)}</span>
              </div>

              {appliedCoupon && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span className="font-sans font-bold">المنتجات بعد الخصم المطبق</span>
                  <span className="font-mono">-{formatPrice(actualDiscount)}</span>
                </div>
              )}

              <div className="flex justify-between text-gray-500">
                <span className="font-sans text-gray-400">شحن دولي مؤمّن ({destObj.cityAr.split('،')[0]})</span>
                <span className="font-mono text-gray-800 font-semibold">
                  {subtotal > 400 ? (
                    <span className="text-emerald-600 font-bold">مجاني (عرض خاص)</span>
                  ) : (
                    formatPrice(shippingCost)
                  )}
                </span>
              </div>

              {giftWrap && (
                <div className="flex justify-between text-amber-800 font-semibold">
                  <span>صندوق هدايا فخم مع طقم الإهداء</span>
                  <span className="font-mono">{formatPrice(giftWrapCost)}</span>
                </div>
              )}

              <div className="flex justify-between text-gray-500">
                <span className="font-sans">ضريبة القيمة المضافة الحكومية (15%)</span>
                <span className="font-mono text-gray-800 font-semibold">{formatPrice(vatAmount)}</span>
              </div>

              <div className="border-t border-gray-100 my-2 pt-3 flex justify-between items-center text-sm">
                <span className="font-bold text-gray-950 font-sans">قيمة الحساب الكلي</span>
                <span className="font-mono text-xl text-amber-950 font-black">
                  {formatPrice(totalAmount)}
                </span>
              </div>
            </div>

            <button
              type="submit"
              form="shipping-form"
              disabled={isSubmitting}
              className="w-full py-4 bg-gray-950 hover:bg-neutral-900 text-amber-400 font-extrabold text-sm rounded-xl shadow-md hover:text-white transition-all duration-300 flex items-center justify-center space-x-2 space-x-reverse cursor-pointer disabled:bg-gray-150 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              <CreditCard className="h-4.5 w-4.5" />
              <span>{isSubmitting ? 'جاري معالجة وتأكيد الدفعة الآمنة...' : 'موافقة والدفع الإلكتروني المباشر'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
