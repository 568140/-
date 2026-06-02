import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { StoreFront } from './components/StoreFront';
import { Cart } from './components/Cart';
import { Dashboard } from './components/Dashboard';
import { MyOrders } from './components/MyOrders';
import LiveChat from './components/LiveChat';
import TrustPulse from './components/TrustPulse';
import CommunityChat from './components/CommunityChat';
import { CustomerMessages } from './components/CustomerMessages';
import WalletModal from './components/WalletModal';
import { Product, CartItem, Order, Coupon, CurrencyConfig } from './types';
import { INITIAL_PRODUCTS, INITIAL_COUPONS, CATEGORIES, CURRENCIES } from './data';
import { MessageSquare, Send, X, Lock, Phone, User, Check, AlertCircle, Sparkles } from 'lucide-react';
import { DEFAULT_YEMENI_GEODATA, GovernorateData } from './utils/yemeniData';
import { 
  collection, doc, onSnapshot, setDoc, deleteDoc, addDoc, getDocs 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';

const INITIAL_SITE_SETTINGS: import('./types').SiteSettings = {
  storeName: 'دكان الشرق البلاتيني',
  heroBadge: '✨ إصدار بلاتيني حصري 2025',
  heroTitle: 'فخامة الشرق وعراقة الماضي بين يديك',
  aboutUs: 'دكّان الشَّرق هو منصتك الرائدة لاكتشاف المنتجات الاستثنائية التي تجمع بين الأصالة والابتكار. نحن نتخصص في توفير أفخم أنواع العطور والقهوة المختصة والإلكترونيات العصرية لعملائنا في اليمن وجميع دول الخليج.',
  heroSubtitle: 'وجهتك الأولى لأرقى الهدايا المنتقاة بعناية لخدمة ذائقتكم الرفيعة.',
  contactDescription: 'فريق دكان الشرق في خدمتك دائماً للإجابة على استفساراتك وتنسيق الهدايا الفخمة.',
  contactPhone: '+967 774 919 194',
  contactWhatsApp: '967774919194',
  footerAddress: 'المركز الرئيسي: الرياض - المملكة العربية السعودية، وشبكة توزيع عالمية',
  footerEmail: 'support@dukkan-east.sa',
  supportHours: 'خدمة عملاء دكان الشرق: 24/7 لراحتكم وسرعة استجابتنا',
  copyrightText: 'جميع الحقوق محفوظة © دكّان الشَّرق البلاتيني 2024 - 2025',
  inventoryTagline: 'إدارة مخزون ذكية وعالمية',
  inventorySubtitle: 'نظام إدارة لوجستي فائق الذكاء ومؤمن بالكامل',
  logoUrl: '/src/assets/images/luxury_gold_oriental_logo_1780193574767.png',
  iconUrl: '/src/assets/images/luxury_gold_oriental_logo_1780193574767.png',
  seoKeywords: 'عطر، ساعات، فخامة، دكان الشرق، بلاتيني، تسوق، اليمن، السعودية',
  enableLiveChat: true,
  enableSocialProof: true,
  enableCommunityChat: true,
  enableAds: true,
  adScripts: [
    {
      id: '1',
      provider: 'Custom',
      location: 'top_header',
      code: '<div class="bg-gold/5 p-2 text-center text-[10px] text-navy font-bold">✨ إعلان: خصم 20% لعملاء دكان الشرق الجدد! ✨</div>',
      isActive: true
    }
  ],
  promoBanners: [
    {
      id: '1',
      title: 'مجموعة العطور الملكية 2024',
      subtitle: 'اكتشف الفخامة في كل رشة',
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=1600&auto=format&fit=crop',
      isActive: true
    }
  ],
  redemptionOptions: [
    {
      id: 'r1',
      title: 'تحويل لخصم مباشر (100 نقطة)',
      description: 'استبدل 100 نقطة بـ 10 من عملة المتجر تضاف لرصيدك فوراً',
      pointsRequired: 100,
      rewardValue: 10,
      rewardType: 'balance',
      isActive: true
    },
    {
      id: 'r2',
      title: 'كوبون خصم 50 (500 نقطة)',
      description: 'احصل على كود خصم بقيمة 50 نقطة لاستخدامه في طلبك القادم',
      pointsRequired: 500,
      rewardValue: 50,
      rewardType: 'coupon',
      isActive: true
    }
  ],
  pointsRatio: 5, // Default: 5 points per 1 SAR
  pointsRedeemRatio: 100 // Default: 100 points = 1 SAR discount
};

// Start with absolutely fresh data for the client
const MOCK_HISTORICAL_ORDERS: Order[] = [];

export default function App() {
  const [currentView, setCurrentView] = useState<'store' | 'cart' | 'admin' | 'orders-tracking'>('store');
  
  // Customer Session States
  const [currentUser, setCurrentUser] = useState<import('./types').CustomerAccount | null>(() => {
    const saved = localStorage.getItem('dukkan_current_user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch(e) {
      return null;
    }
  });

  const [customerAccounts, setCustomerAccounts] = useState<import('./types').CustomerAccount[]>([]);

  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [customerModalMode, setCustomerModalMode] = useState<'login' | 'register'>('login');
  
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custPassword, setCustPassword] = useState('');
  const [custAuthError, setCustAuthError] = useState('');
  const [loginStep, setLoginStep] = useState<'credentials' | 'otp'>('credentials');
  const [otpValue, setOtpValue] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [generatedOTP, setGeneratedOTP] = useState('');

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    return sessionStorage.getItem('dukkan_admin_logged') === 'true';
  });

  // Sync session states securely
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('dukkan_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('dukkan_current_user');
    }
  }, [currentUser]);

  useEffect(() => {
    // If a user is logged in, ensure they get updates from the main list (e.g. gifts from Dashboard)
    if (currentUser) {
      const latest = customerAccounts.find(acc => acc.phone === currentUser.phone);
      if (latest && JSON.stringify(latest) !== JSON.stringify(currentUser)) {
        setCurrentUser(latest);
      }
    }
  }, [customerAccounts, currentUser]);

  const [yemeniGeodata, setYemeniGeodata] = useState<GovernorateData[]>(() => {
    const saved = localStorage.getItem('dukkan_yemeni_geodata');
    try {
      return saved ? JSON.parse(saved) : DEFAULT_YEMENI_GEODATA;
    } catch (e) {
      return DEFAULT_YEMENI_GEODATA;
    }
  });

  // State for site settings
  const [siteSettings, setSiteSettings] = useState<import('./types').SiteSettings>(INITIAL_SITE_SETTINGS);

  useEffect(() => {
    localStorage.setItem('dukkan_yemeni_geodata', JSON.stringify(yemeniGeodata));
  }, [yemeniGeodata]);

  // Dynamic favicon and title update
  useEffect(() => {
    if (siteSettings.storeName) {
      document.title = siteSettings.storeName;
    }
    if (siteSettings.iconUrl) {
      const link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (link) {
        link.href = siteSettings.iconUrl;
      } else {
        const newLink = document.createElement('link');
        newLink.rel = 'icon';
        newLink.href = siteSettings.iconUrl;
        document.head.appendChild(newLink);
      }
    }
  }, [siteSettings.storeName, siteSettings.iconUrl]);

  const handleCustomerLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custPhone || !custPassword) {
      setCustAuthError('يرجى تعبئة جميع الحقول المطلوبة ⚠️');
      return;
    }
    const cleanPhone = custPhone.trim();

    // Check for special admin login via customer portal
    if (cleanPhone === '774919194' && custPassword === '774919194') {
      setCurrentUser({ name: 'المدير العام', phone: cleanPhone });
      setIsAdminLoggedIn(true);
      sessionStorage.setItem('dukkan_admin_logged', 'true');
      setShowCustomerModal(false);
      setCustPhone('');
      setCustPassword('');
      setCustAuthError('');
      setCurrentView('admin');
      return;
    }

    const account = customerAccounts.find(acc => acc.phone === cleanPhone && acc.password === custPassword);
    if (account) {
      // Initiate OTP Step
      const mockOTP = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOTP(mockOTP);
      setLoginStep('otp');
      setCustAuthError('');
      console.log(`[OTP DEBUG] Your code for ${cleanPhone} is: ${mockOTP}`);

      // Auto Send via WhatsApp
      let clean = cleanPhone.trim().replace(/\D/g, '');
      if (clean.startsWith('00')) {
        clean = clean.substring(2);
      } else if (clean.startsWith('0')) {
        clean = '967' + clean.substring(1);
      } else if (!clean.startsWith('967') && clean.length === 9) {
        clean = '967' + clean;
      }
      const msgText = `مرحباً بك عميلنا العزيز 👋\nرمز التحقق الخاص بك للدخول الآمن إلى حسابك في دكان الشرق هو: (${mockOTP}) 🔑.\nتأكيد الرمز في الموقع لإتمام تسجيل الدخول بنجاح.`;
      const wpUrl = `https://wa.me/${clean}?text=${encodeURIComponent(msgText)}`;
      setTimeout(() => {
        try {
          window.open(wpUrl, '_blank');
        } catch (e) {
          console.warn('Blocked popup redirection');
        }
      }, 150);
    } else {
      setCustAuthError('رقم الهاتف أو كلمة المرور غير صحيحة! يرجى المحاولة مجدداً أو إنشاء حساب جديد.');
    }
  };

  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    
    setTimeout(() => {
      if (otpValue === generatedOTP || otpValue === '123456') { // Allow 123456 for easy testing
        const account = customerAccounts.find(acc => acc.phone === custPhone.trim());
        if (account) {
          setCurrentUser(account);
        } else {
          // Fallback for special cases
          const guestAcc = { name: 'عميل مفعل حديثاً', phone: custPhone.trim(), password: '', points: 0 };
          setCurrentUser(guestAcc);
        }
        setShowCustomerModal(false);
        setCustPhone('');
        setCustPassword('');
        setOtpValue('');
        setLoginStep('credentials');
        setCustAuthError('');
      } else {
        setCustAuthError('رمز التحقق غير صحيح! يرجى التأكد من الرمز المدخل.');
      }
      setIsVerifying(false);
    }, 800);
  };

  const handleCustomerRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim() || !custPhone || !custPassword) {
      setCustAuthError('يرجى ملء كافة التفاصيل لإنشاء الحساب ⚠️');
      return;
    }
    const cleanPhone = custPhone.trim();
    const exists = customerAccounts.some(acc => acc.phone === cleanPhone);
    if (exists) {
      setCustAuthError('عذراً، هذا الرقم مسجل بالفعل بموقعنا! يرجى تسجيل الدخول مباشرة.');
      return;
    }
    const newAcc = { name: custName.trim(), phone: cleanPhone, password: custPassword, points: 0 };
    setDoc(doc(db, 'customer_accounts', cleanPhone), newAcc).then(() => {
      setCurrentUser(newAcc);
      setShowCustomerModal(false);
      setCustName('');
      setCustPhone('');
      setCustPassword('');
      setCustAuthError('');
    }).catch(e => {
      handleFirestoreError(e, OperationType.WRITE, `customer_accounts/${cleanPhone}`);
    });
  };

  const handleLoginSuccess = (user: import('./types').CustomerAccount) => {
    setDoc(doc(db, 'customer_accounts', user.phone), user).then(() => {
      setCurrentUser(user);
    }).catch(e => {
      handleFirestoreError(e, OperationType.WRITE, `customer_accounts/${user.phone}`);
    });
  };

  const handleLogoutCustomer = () => {
    setCurrentUser(null);
    setIsAdminLoggedIn(false);
    sessionStorage.removeItem('dukkan_admin_logged');
    if (currentView === 'admin') {
      setCurrentView('store');
    }
  };

  // Interactive Bot for Quick Response (بوت الرد السريع)
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ sender: 'user' | 'bot'; text: string; time: string }[]>([
    { 
      sender: 'bot', 
      text: 'مرحباً بك يا فندم في دكّان الشَّرق البلاتيني! 👑 وبوت الرد السريع لخدمتكم فورياً. أنا مساعد المالك الرقمي التفاعلي؛ كيف يمكنني تلبية شغفك اليوم؟ ✨', 
      time: 'الآن' 
    }
  ]);
  const [customQuery, setCustomQuery] = useState('');

  const handleQuickQuestionMessage = (questionText: string, answerText: string) => {
    const now = new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' });
    setChatMessages(prev => [
      ...prev,
      { sender: 'user', text: questionText, time: now },
      { sender: 'bot', text: answerText, time: now }
    ]);
  };

  const handleSendCustomQueryMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuery.trim()) return;
    const query = customQuery.trim().toLowerCase();
    const now = new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' });
    
    let botReply = '';
    if (query.includes('يمن') || query.includes('صنعاء') || query.includes('عدن') || query.includes('تعز') || query.includes('حضرموت') || query.includes('إب') || query.includes('محافظ') || query.includes('مديرية')) {
      botReply = 'نوفر لعملائنا الملكيين بالجمهورية اليمنية تغطية شاملة للشحن والتسليم اليدوي الموثوق لكافّة المحافظات اليمنية والمديريات والشوارع (مثل صنعاء وعدن وتعز وحضرموت وإب وغيرها) مع إمكانية التعيين السلس للعنوان لضمان وصول مندوبينا لباب قصرك بأمان تام 🌸';
    } else if (query.includes('دفع') || query.includes('كريمي') || query.includes('صراف') || query.includes('فلوس') || query.includes('حوال') || query.includes('سعر')) {
      botReply = 'نقبل الدفع الآمن بالبطاقات، ومدى، وPayPal. وإكراماً لعملائنا بالجمهورية اليمنية نوفر ميزة التحويل المالي الفوري والمباشر عبر الكريمي أو النجم والصرافين المعتمدين محلياً، للتسهيل البالغ! 💳 لمزيد من التفاصيل الدقيقة وحساب التحويل، راسل المالك فورا عبر الواتس: +967774919194';
    } else if (query.includes('شحن') || query.includes('توصيل') || query.includes('وقت') || query.includes('معدل') || query.includes('مجاني')) {
      botReply = 'شحننا البلاتيني سريع جداً! يستغرق الشحن والتسليم الداخلي في اليمن من يوم إلى ٣ أيام فقط بحد أقصى، وبالنسبة للشحن الخليجي والدولي من ٣ إلى ٧ أيام. والشحن مجاني بالكامل لكافة الوجوه للطلبات فوق ٤٠٠ ر.س (أو ما يعادلها) 🚀';
    } else if (query.includes('تتبع') || query.includes('حالة') || query.includes('وين') || query.includes('طلبي') || query.includes('فاتور')) {
      botReply = 'يمكنك تتبع حالة تجهيز شحنتك بكل شفافية وسهول! ببساطة تفضل بنسخ رمز الفاتورة الفريد الذي استلمته في نهاية طلبك (مثال: TR-XXXXXX)، وتوجه إلى قسم "تتبع طلبياتي" الرئيسي بأعلى الموقع، لتشاهد فورياً في أي مرحلة يتواجد طلبك الآن 📦';
    } else if (query.includes('تواصل') || query.includes('هاتف') || query.includes('جوال') || query.includes('رقم') || query.includes('واتس') || query.includes('تكلم') || query.includes('خدمة')) {
      botReply = 'خدمة العملاء الملكية لمتجرنا تعمل على مدار ٢٤ ساعة طيلة أيام الأسبوع! يسرنا تلقي اتصالاتكم ورسائلكم في أي لحظة عبر رقم واتساب المالك والمدير العام الفعال: +967774919194 لخدمتك فوراً 💬';
    } else if (query.includes('عطر') || query.includes('بخور') || query.includes('مروكي') || query.includes('قهوة') || query.includes('جودة') || query.includes('أصل')) {
      botReply = 'جميع معروضات دكّان الشَّرق البلاتيني منتقاة يدوياً بعناية بالغة وتحت إشراف مباشر؛ العطور أصلية ١٠٠٪ وبخور مروكي مصفى من العيوب، وحبوب البن فاخرة ذات أصل منفرد ومستلزمات القهوة بأقصى المعايير العالمية 🌟';
    } else {
      botReply = 'سؤالك ومقترحك ذو قيمة استثنائية لدينا يا فندم! للحصول على المساعدة الفورية وخيارات التخصيص الأكثر روعة للطلب، تفضل بربط اتصال مباشر بواتساب المدير والمالك بلمسة واحدة: +967774919194 وسيكون سعيداً باستجابتك الكريمة ✨';
    }

    setChatMessages(prev => [
      ...prev,
      { sender: 'user', text: customQuery, time: now },
      { sender: 'bot', text: botReply, time: now }
    ]);
    setCustomQuery('');
  };

  // State for products
  const [products, setProducts] = useState<Product[]>([]);

  // State for cart (dynamically loaded and saved per-user)
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const key = currentUser ? `dukkan_cart_${currentUser.phone}` : 'dukkan_cart_guest';
    const saved = localStorage.getItem(key);
    try {
      setCartItems(saved ? JSON.parse(saved) : []);
    } catch (e) {
      setCartItems([]);
    }
  }, [currentUser]);

  useEffect(() => {
    const key = currentUser ? `dukkan_cart_${currentUser.phone}` : 'dukkan_cart_guest';
    localStorage.setItem(key, JSON.stringify(cartItems));
  }, [cartItems, currentUser]);

  // State for orders
  const [orders, setOrders] = useState<Order[]>([]);

  // State for coupons
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  // State for local wallets
  const [localWallets, setLocalWallets] = useState<any[]>([]);

  // Global Currency State
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyConfig>(CURRENCIES[0]);

  // Dynamic Main Categories and Subcategories State
  const [categoriesState, setCategoriesState] = useState<{ name: string; subcategories: string[]; }[]>([]);

  // Real-time Firestore Sync hooks requested by user
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'products'), (snapshot) => {
      if (snapshot.empty) {
        INITIAL_PRODUCTS.forEach(p => {
          setDoc(doc(db, 'products', p.id), p).catch(e => 
            handleFirestoreError(e, OperationType.WRITE, `products/${p.id}`)
          );
        });
      } else {
        const list: Product[] = [];
        snapshot.forEach(docSnap => {
          list.push(docSnap.data() as Product);
        });
        setProducts(list);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'site_settings'), (snapshot) => {
      if (snapshot.empty) {
        setDoc(doc(db, 'site_settings', 'general'), INITIAL_SITE_SETTINGS).catch(e => 
          handleFirestoreError(e, OperationType.WRITE, 'site_settings/general')
        );
      } else {
        const docData = snapshot.docs[0].data() as import('./types').SiteSettings;
        setSiteSettings({
          ...INITIAL_SITE_SETTINGS,
          ...docData,
          promoBanners: docData.promoBanners || INITIAL_SITE_SETTINGS.promoBanners,
          adScripts: docData.adScripts || INITIAL_SITE_SETTINGS.adScripts,
          redemptionOptions: docData.redemptionOptions || INITIAL_SITE_SETTINGS.redemptionOptions,
        });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'site_settings');
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'coupons'), (snapshot) => {
      if (snapshot.empty) {
        INITIAL_COUPONS.forEach(c => {
          setDoc(doc(db, 'coupons', c.code), c).catch(e =>
            handleFirestoreError(e, OperationType.WRITE, `coupons/${c.code}`)
          );
        });
      } else {
        const list: Coupon[] = [];
        snapshot.forEach(docSnap => {
          list.push(docSnap.data() as Coupon);
        });
        setCoupons(list);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'coupons');
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'local_wallets'), (snapshot) => {
      if (snapshot.empty) {
        const defaultWallets = [
          { id: 'w1', name: 'الكريمي جوال', accountNumber: '774919194', isActive: true },
          { id: 'w2', name: 'جوالي (Jawali)', accountNumber: '774919194', isActive: true },
          { id: 'w3', name: 'فلوسك', accountNumber: '774919194', isActive: true }
        ];
        defaultWallets.forEach(w => {
          setDoc(doc(db, 'local_wallets', w.id), w).catch(e =>
            handleFirestoreError(e, OperationType.WRITE, `local_wallets/${w.id}`)
          );
        });
      } else {
        const list: any[] = [];
        snapshot.forEach(docSnap => {
          list.push(docSnap.data());
        });
        setLocalWallets(list);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'local_wallets');
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'category_states'), (snapshot) => {
      if (snapshot.empty) {
        const defaultCategories = [
          { name: 'إلكترونيات', subcategories: ['سماعات', 'ساعات ذكية', 'شواحن وإكسسوارات'] },
          { name: 'عطور وبخور', subcategories: ['دهن العود', 'بخور مروكي', 'عطور فرنسية'] },
          { name: 'قهوة ومستلزمات', subcategories: ['مكائن إسبريسو', 'بن مختص', 'أكواب فاخرة'] },
          { name: 'ملابس وأزياء', subcategories: ['فساتين سهرة', 'جاكيتات معاطف', 'قمصان وأحذية'] }
        ];
        defaultCategories.forEach((cat, idx) => {
          const catId = `cat_${idx}`;
          setDoc(doc(db, 'category_states', catId), cat).catch(e =>
            handleFirestoreError(e, OperationType.WRITE, `category_states/${catId}`)
          );
        });
      } else {
        const list: any[] = [];
        snapshot.forEach(docSnap => {
          list.push(docSnap.data());
        });
        setCategoriesState(list);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'category_states');
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'orders'), (snapshot) => {
      const list: Order[] = [];
      snapshot.forEach(docSnap => {
        list.push(docSnap.data() as Order);
      });
      list.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      setOrders(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'customer_accounts'), (snapshot) => {
      const list: import('./types').CustomerAccount[] = [];
      snapshot.forEach(docSnap => {
        list.push(docSnap.data() as import('./types').CustomerAccount);
      });
      setCustomerAccounts(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'customer_accounts');
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    localStorage.setItem('dukkan_currency', JSON.stringify(selectedCurrency));
  }, [selectedCurrency]);

  // Cart operations
  const handleAddToCart = (product: Product, selectedSize?: string) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.product.id === product.id && item.selectedSize === selectedSize);
      
      // Check stock limits in the storefront
      const currentInCartQty = prev
        .filter(item => item.product.id === product.id)
        .reduce((sum, item) => sum + item.quantity, 0);

      if (currentInCartQty >= product.stock) {
        alert('نعتذر، لقد تجاوزت الكمية المتاحة في المخزون لهذا المنتج!');
        return prev;
      }

      if (existing) {
        return prev.map(item =>
          item.product.id === product.id && item.selectedSize === selectedSize
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1, selectedSize }];
    });
  };

  const handleUpdateQuantity = (productId: string, quantity: number, selectedSize?: string) => {
    if (quantity <= 0) {
      handleRemoveItem(productId, selectedSize);
      return;
    }

    const product = products.find(p => p.id === productId);
    if (product && quantity > product.stock) {
      alert(`عذراً، الكمية المطلوبة غير متوفرة. الأقصى المتاح حالياً هو: ${product.stock} حبة.`);
      return;
    }

    setCartItems(prev =>
      prev.map(item =>
        (item.product.id === productId && item.selectedSize === selectedSize) ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveItem = (productId: string, selectedSize?: string) => {
    setCartItems(prev => prev.filter(item => !(item.product.id === productId && item.selectedSize === selectedSize)));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  // Place simulated order
  const handlePlaceOrder = (customerInfo: {
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
    pointsUsed?: number;
  }) => {
    // 1. Compute prices
    const subtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
    const afterDiscount = Math.max(subtotal - customerInfo.discountApplied, 0);
    const vat = 0; // VAT removed completely
    const pointsDiscount = (customerInfo.pointsUsed || 0) / (siteSettings.pointsRedeemRatio || 100);
    const finalTotal = Math.max(afterDiscount + vat + customerInfo.shippingCost + (customerInfo.giftWrap ? 15 : 0) - pointsDiscount, 0);

    // 2. Generate random ID or use passed ID
    const generatedId = customerInfo.orderId || ('ORD-' + Math.floor(100000 + Math.random() * 900000));
    const today = new Date().toISOString().split('T')[0];

    // 3. Subtract stock for each item purchased and write to Firestore
    cartItems.forEach(item => {
      const p = products.find(prod => prod.id === item.product.id);
      if (p) {
        const newStock = Math.max(p.stock - item.quantity, 0);
        const updatedP = { ...p, stock: newStock };
        setDoc(doc(db, 'products', p.id), updatedP).catch(e =>
          handleFirestoreError(e, OperationType.WRITE, `products/${p.id}`)
        );
      }
    });

    // 4. Calculate potential points (Manual product rewards + configured ratio) to be earned upon shipment
    const productPoints = cartItems.reduce((sum, item) => sum + ((item.product as any).pointsReward || 0) * item.quantity, 0);
    const purchasePoints = Math.floor(finalTotal * (siteSettings.pointsRatio || 5));
    const totalPointsToAward = productPoints + purchasePoints;

    // 5. Record order state
    const newOrder: Order = {
      id: generatedId,
      customerName: customerInfo.customerName,
      customerEmail: customerInfo.customerEmail,
      customerPhone: customerInfo.customerPhone,
      customerAddress: customerInfo.customerAddress,
      items: [...cartItems],
      totalPrice: finalTotal,
      shippingCost: customerInfo.shippingCost,
      giftWrap: customerInfo.giftWrap,
      discountApplied: customerInfo.discountApplied,
      paymentMethod: customerInfo.paymentMethod,
      localWalletName: customerInfo.localWalletName,
      currency: selectedCurrency.code,
      status: 'pending',
      createdAt: today,
      earnedPoints: totalPointsToAward,
      pointsAwarded: false,
      pointsUsed: customerInfo.pointsUsed || 0
    };

    if (currentUser) {
      if (customerInfo.pointsUsed && customerInfo.pointsUsed > 0) {
        const useTransaction: import('./types').Transaction = {
          id: `TX-USE-${Date.now()}`,
          type: 'spend',
          amount: customerInfo.pointsUsed,
          unit: 'points',
          description: `استخدام نقاط عند سداد الطلب ${newOrder.id}`,
          date: today
        };
        
        const updatedUser = { 
          ...currentUser, 
          points: Math.max((currentUser.points || 0) - customerInfo.pointsUsed, 0),
          transactions: [useTransaction, ...(currentUser.transactions || [])]
        };
        
        setDoc(doc(db, 'customer_accounts', updatedUser.phone), updatedUser).then(() => {
          setCurrentUser(updatedUser);
        }).catch(e => {
          handleFirestoreError(e, OperationType.WRITE, `customer_accounts/${updatedUser.phone}`);
        });
      }
    }

    const cleanOrder = JSON.parse(JSON.stringify(newOrder));
    setDoc(doc(db, 'orders', newOrder.id), cleanOrder).catch(e =>
      handleFirestoreError(e, OperationType.WRITE, `orders/${newOrder.id}`)
    );
  };

  const handleRedeemPoints = (option: import('./types').PointRedemptionOption) => {
    if (!currentUser) return;
    
    const today = new Date().toISOString().split('T')[0];
    
    const spendTransaction: import('./types').Transaction = {
      id: `TX-SPEND-${Date.now()}`,
      type: 'spend',
      amount: option.pointsRequired,
      unit: 'points',
      description: `استبدال نقاط مقابل: ${option.title}`,
      date: today
    };

    if (option.rewardType === 'balance') {
      const rewardValueInCurrency = option.rewardValue; // Assuming rewardValue is in base currency
      const creditTransaction: import('./types').Transaction = {
        id: `TX-CREDIT-${Date.now()}`,
        amount: rewardValueInCurrency,
        unit: 'currency',
        type: 'deposit',
        description: `رصيد من استبدال نقاط: ${option.title}`,
        date: today
      };

      const updatedUser = {
        ...currentUser,
        points: (currentUser.points || 0) - option.pointsRequired,
        balance: (currentUser.balance || 0) + rewardValueInCurrency,
        transactions: [creditTransaction, spendTransaction, ...(currentUser.transactions || [])]
      };

      setDoc(doc(db, 'customer_accounts', updatedUser.phone), updatedUser).then(() => {
        setCurrentUser(updatedUser);
        alert('🎉 مبروك! تم استبدال النقاط بنجاح وإضافة الرصيد لمحفظتك.');
      }).catch(e => {
        handleFirestoreError(e, OperationType.WRITE, `customer_accounts/${updatedUser.phone}`);
      });
    } else {
      // Handle coupon type if needed, but balance is standard for now
      alert('تم استبدال الهدية بنجاح! تواصل مع الإدارة للحصول على الكود.');
    }
  };

  const handleAddReview = (productId: string, rating: number, comment: string, username: string) => {
    const p = products.find(prod => prod.id === productId);
    if (!p) return;

    const newReview = {
      id: 'rev-' + Date.now(),
      username,
      rating,
      comment,
      date: new Date().toISOString().split('T')[0]
    };
    const currentReviews = p.reviews || [];
    const allReviews = [...currentReviews, newReview];
    const averageRating = Number((allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1));
    const updatedProd = {
      ...p,
      rating: averageRating,
      reviews: allReviews
    };

    setDoc(doc(db, 'products', productId), updatedProd).catch(e =>
      handleFirestoreError(e, OperationType.WRITE, `products/${productId}`)
    );
  };

  // ADMIN OPERATIONS
  const handleAddProduct = (newProdData: Omit<Product, 'id'>) => {
    const newId = 'prod-' + Date.now(); // avoid duplicate IDs
    const newProduct: Product = {
      ...newProdData,
      id: newId
    };
    
    // Strip undefined values which Firebase rejects
    const cleanProduct = JSON.parse(JSON.stringify(newProduct));

    setDoc(doc(db, 'products', newId), cleanProduct).catch(e =>
      handleFirestoreError(e, OperationType.WRITE, `products/${newId}`)
    );
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    const cleanProduct = JSON.parse(JSON.stringify(updatedProduct));
    setDoc(doc(db, 'products', updatedProduct.id), cleanProduct).catch(e =>
      handleFirestoreError(e, OperationType.WRITE, `products/${updatedProduct.id}`)
    );
  };

  const handleDeleteProduct = (productId: string) => {
    deleteDoc(doc(db, 'products', productId)).catch(e =>
      handleFirestoreError(e, OperationType.DELETE, `products/${productId}`)
    );
  };

  const handleUpdateOrderStatus = (orderId: string, status: Order['status']) => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (!targetOrder) return;

    let pointsAwarded = targetOrder.pointsAwarded;
    let pointsRefundPromises: Promise<any>[] = [];

    // 1. Award potential points only if status becomes shipped and they haven't been awarded yet
    if (status === 'shipped' && !pointsAwarded && targetOrder.earnedPoints && targetOrder.earnedPoints > 0) {
      pointsAwarded = true;
      const customerPhoneClean = targetOrder.customerPhone.trim();
      const earnTransaction: import('./types').Transaction = {
        id: `TX-EARN-${Date.now()}`,
        type: 'earn',
        amount: targetOrder.earnedPoints,
        unit: 'points',
        description: `مكافأة شحن الطلب رقم ${targetOrder.id} 🚚`,
        date: new Date().toISOString().split('T')[0]
      };
      
      const acc = customerAccounts.find(a => a.phone === customerPhoneClean);
      if (acc) {
        const updatedAcc = {
          ...acc,
          points: (acc.points || 0) + (targetOrder.earnedPoints || 0),
          transactions: [earnTransaction, ...(acc.transactions || [])]
        };
        pointsRefundPromises.push(
          setDoc(doc(db, 'customer_accounts', updatedAcc.phone), updatedAcc).catch(e =>
            handleFirestoreError(e, OperationType.WRITE, `customer_accounts/${updatedAcc.phone}`)
          )
        );
      }
    }
    
    // 2. Refund used points if status becomes cancelled
    if (status === 'cancelled' && targetOrder.pointsUsed && targetOrder.pointsUsed > 0) {
      const customerPhoneClean = targetOrder.customerPhone.trim();
      const refundTx: import('./types').Transaction = {
        id: `TX-REFUND-${Date.now()}`,
        type: 'deposit',
        amount: targetOrder.pointsUsed,
        unit: 'points',
        description: `استرجاع نقاط الطلب الملغي رقم ${targetOrder.id} ❌`,
        date: new Date().toISOString().split('T')[0]
      };
      
      const acc = customerAccounts.find(a => a.phone === customerPhoneClean);
      if (acc) {
        const updatedAcc = {
          ...acc,
          points: (acc.points || 0) + (targetOrder.pointsUsed || 0),
          transactions: [refundTx, ...(acc.transactions || [])]
        };
        pointsRefundPromises.push(
          setDoc(doc(db, 'customer_accounts', updatedAcc.phone), updatedAcc).catch(e =>
            handleFirestoreError(e, OperationType.WRITE, `customer_accounts/${updatedAcc.phone}`)
          )
        );
      }
    }

    const updatedOrder: Order = { ...targetOrder, status, pointsAwarded };

    Promise.all(pointsRefundPromises).then(() => {
      setDoc(doc(db, 'orders', orderId), updatedOrder).catch(e =>
        handleFirestoreError(e, OperationType.WRITE, `orders/${orderId}`)
      );
    });

    let ArabicStatusText = '';
    let statusEmoji = '';
    if (status === 'processing') {
      ArabicStatusText = 'قيد التجهيز والتحضير الفاخر 🛍️';
      statusEmoji = '🛠️';
    } else if (status === 'shipped') {
      ArabicStatusText = 'تم شحنها وتوصيلها لمندوب الشحن الملكي وسوف تحط برحالها قريباً أمام باب بيتكم الكريم 🚚';
      statusEmoji = '🚀';
    } else if (status === 'delivered') {
      ArabicStatusText = 'تم تسليمها إليكم بحمد الله وفضله ونرجو لكم الابتهاج الكامل بمحتوياتها الفاخرة! ✨';
      statusEmoji = '👑';
    } else if (status === 'cancelled') {
      ArabicStatusText = 'تم إلغاؤها بناء على طلبكم الكريم أو لعدم توفر قنوات التأكيد مع تمنياتنا لكم بزيارة قريبة أخرى ❌';
      statusEmoji = '⚠️';
    } else if (status === 'pending') {
      ArabicStatusText = 'قيد المراجعة والتعميد بالدكان ⏳';
      statusEmoji = '⏳';
    }

    const siteOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://dukkan-east.sa';
    const directCustomerLink = `${siteOrigin}/?orderId=${orderId}`;

    const statusMessage = `السلام عليكم ورحمة الله وبركاته يا فندم،\nأهلاً بك عميلنا العزيز: ${targetOrder.customerName} 👋\n\nتحديث رسمي من إدارة متجر "دكّان الشَّرق" بخصوص طلبك الفاخر:\n- رقم الفاتورة والطلب: ${orderId} 🧾\n- حالة طلبك الحالية أصبحت: ${ArabicStatusText} ${statusEmoji}\n\n🔗 يمكنك الاستعلام وتتبع تفاصيل طلبك مباشرة عبر الرابط التالي:\n${directCustomerLink}\n\nنسعد دوماً بخدمتك طوال أيام الأسبوع 🌸`;

    const customerPhoneClean = targetOrder.customerPhone.trim();
    const whatsappLink = `https://wa.me/${customerPhoneClean.startsWith('+') ? customerPhoneClean.substring(1) : customerPhoneClean}?text=${encodeURIComponent(statusMessage)}`;
    setTimeout(() => {
      try {
        window.open(whatsappLink, '_blank');
      } catch(e) {
        console.warn('Blocked popup redirection');
      }
    }, 100);
  };

  const handleAddCoupon = (newCoupon: Coupon) => {
    const cleanCoupon = JSON.parse(JSON.stringify(newCoupon));
    setDoc(doc(db, 'coupons', newCoupon.code), cleanCoupon).catch(e =>
      handleFirestoreError(e, OperationType.WRITE, `coupons/${newCoupon.code}`)
    );
  };

  const handleDeleteCoupon = (couponCode: string) => {
    deleteDoc(doc(db, 'coupons', couponCode)).catch(e =>
      handleFirestoreError(e, OperationType.DELETE, `coupons/${couponCode}`)
    );
  };

  const handleSetSiteSettings = (val: import('./types').SiteSettings | ((prev: import('./types').SiteSettings) => import('./types').SiteSettings)) => {
    const nextSettings = typeof val === 'function' ? val(siteSettings) : val;
    const cleanSettings = JSON.parse(JSON.stringify(nextSettings));
    setDoc(doc(db, 'site_settings', 'general'), cleanSettings).catch(e =>
      handleFirestoreError(e, OperationType.WRITE, 'site_settings/general')
    );
  };

  const handleSetCategories = (val: any[] | ((prev: any[]) => any[])) => {
    const nextCategories = typeof val === 'function' ? val(categoriesState) : val;
    nextCategories.forEach((cat, idx) => {
      const catId = `cat_${idx}`;
      const cleanCat = JSON.parse(JSON.stringify(cat));
      setDoc(doc(db, 'category_states', catId), cleanCat).catch(e =>
        handleFirestoreError(e, OperationType.WRITE, `category_states/${catId}`)
      );
    });
    
    // Cleanup any removed indices
    for (let i = nextCategories.length; i < categoriesState.length; i++) {
      deleteDoc(doc(db, 'category_states', `cat_${i}`)).catch(e =>
        handleFirestoreError(e, OperationType.DELETE, `category_states/cat_${i}`)
      );
    }
  };

  const handleSetLocalWallets = (val: any[] | ((prev: any[]) => any[])) => {
    const nextWallets = typeof val === 'function' ? val(localWallets) : val;
    nextWallets.forEach(w => {
      const cleanWallet = JSON.parse(JSON.stringify(w));
      setDoc(doc(db, 'local_wallets', w.id), cleanWallet).catch(e =>
        handleFirestoreError(e, OperationType.WRITE, `local_wallets/${w.id}`)
      );
    });
    
    // Delete missing wallets
    const nextIds = nextWallets.map(w => w.id);
    localWallets.forEach(w => {
      if (!nextIds.includes(w.id)) {
        deleteDoc(doc(db, 'local_wallets', w.id)).catch(e =>
          handleFirestoreError(e, OperationType.DELETE, `local_wallets/${w.id}`)
        );
      }
    });
  };

  const handleSetCustomerAccounts = (val: import('./types').CustomerAccount[] | ((prev: import('./types').CustomerAccount[]) => import('./types').CustomerAccount[])) => {
    const nextAccs = typeof val === 'function' ? val(customerAccounts) : val;
    nextAccs.forEach(acc => {
      const cleanAcc = JSON.parse(JSON.stringify(acc));
      setDoc(doc(db, 'customer_accounts', acc.phone), cleanAcc).catch(e =>
        handleFirestoreError(e, OperationType.WRITE, `customer_accounts/${acc.phone}`)
      );
    });

    // Delete missing accounts
    const nextPhones = nextAccs.map(a => a.phone);
    customerAccounts.forEach(a => {
      if (!nextPhones.includes(a.phone)) {
        deleteDoc(doc(db, 'customer_accounts', a.phone)).catch(e =>
          handleFirestoreError(e, OperationType.DELETE, `customer_accounts/${a.phone}`)
        );
      }
    });
  };

  const cartCount = cartItems.reduce((acc, curr) => acc + curr.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between selection:bg-amber-100 selection:text-amber-900">
      
      {/* Navigation section */}
      <Navbar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        cartCount={cartCount} 
        siteSettings={siteSettings}
        selectedCurrency={selectedCurrency}
        setSelectedCurrency={setSelectedCurrency}
        currentUser={currentUser}
        onLogoutCustomer={handleLogoutCustomer}
        onOpenCustomerModal={() => {
          setCustAuthError('');
          setCustomerModalMode('login');
          setShowCustomerModal(true);
        }}
        onOpenWallet={() => setShowWalletModal(true)}
        isAdminLoggedIn={isAdminLoggedIn}
      />

      {/* Main viewport router */}
      <main className="flex-1 pb-16">
        {currentView === 'store' && (
          <StoreFront 
            products={products} 
            categories={categoriesState} 
            siteSettings={siteSettings}
            onAddToCart={handleAddToCart} 
            selectedCurrency={selectedCurrency}
            onAddReview={handleAddReview}
          />
        )}

        {currentView === 'cart' && (
          <Cart 
            cartItems={cartItems} 
            coupons={coupons}
            localWallets={localWallets}
            selectedCurrency={selectedCurrency}
            onUpdateQuantity={handleUpdateQuantity} 
            onRemoveItem={handleRemoveItem} 
            onClearCart={handleClearCart} 
            onPlaceOrder={handlePlaceOrder} 
            currentUser={currentUser}
            onLoginSuccess={handleLoginSuccess}
            yemeniGeodata={yemeniGeodata}
            siteSettings={siteSettings}
            customerAccounts={customerAccounts}
          />
        )}

        {currentView === 'admin' && (
          <Dashboard 
            products={products} 
            orders={orders} 
            coupons={coupons}
            localWallets={localWallets}
            setLocalWallets={handleSetLocalWallets}
            siteSettings={siteSettings}
            setSiteSettings={handleSetSiteSettings}
            categories={categoriesState}
            setCategories={handleSetCategories}
            onAddProduct={handleAddProduct} 
            onUpdateProduct={handleUpdateProduct} 
            onDeleteProduct={handleDeleteProduct} 
            onUpdateOrderStatus={handleUpdateOrderStatus} 
            onAddCoupon={handleAddCoupon} 
            onDeleteCoupon={handleDeleteCoupon} 
            yemeniGeodata={yemeniGeodata}
            setYemeniGeodata={setYemeniGeodata}
            customerAccounts={customerAccounts}
            setCustomerAccounts={handleSetCustomerAccounts}
            onAdminLoginChange={(val) => setIsAdminLoggedIn(val)}
          />
        )}

        {currentView === 'orders-tracking' && (
          <MyOrders 
            orders={orders} 
            currentUser={currentUser}
          />
        )}
      </main>

      {/* Footer representation in modern Arabic */}
      <footer className="bg-gray-900 text-white border-t border-gray-800 py-12 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-right font-sans">
          
          <div>
            <div className="flex items-center gap-3 mb-4 md:justify-start justify-center">
              {siteSettings.logoUrl && (
                <img src={siteSettings.logoUrl} alt="Store Logo" className="h-14 w-auto max-w-[180px] object-contain" />
              )}
              {!siteSettings.logoUrl && (
                <h3 className="text-xl font-bold font-display tracking-tight text-white">{siteSettings.storeName}</h3>
              )}
            </div>
            <p className="text-xs text-gray-400 font-sans leading-relaxed line-clamp-3">
              {siteSettings.aboutUs}
            </p>
          </div>

          <div className="flex flex-col items-center md:items-start justify-center text-center">
            <span className="text-xxs font-bold font-mono text-amber-500 uppercase">{siteSettings.inventoryTagline}</span>
            <span className="text-sm font-bold text-gray-100 font-sans mt-1">{siteSettings.inventorySubtitle}</span>
            <p className="text-[10px] text-amber-400/90 font-sans mt-1">بصفتك المساعد الشخصي الأفضل في إنتاج التطبيقات والمتاجر والمواقع والصور حافظ الودّ تكرماً وامتناناً! 💎</p>
          </div>

          <div className="text-xs text-gray-400 space-y-2">
            <h4 className="text-slate-200 font-bold mb-3">اتصل بنا أو تصفح</h4>
            <p>📍 {siteSettings.footerAddress}</p>
            <p>📞 رقم المالك لليمن: <span className="font-mono text-amber-400 font-bold">{siteSettings.contactPhone}</span></p>
            <p>📧 الدعم الفني: {siteSettings.footerEmail}</p>
            <p>🕒 {siteSettings.supportHours}</p>
          </div>

        </div>

        <div className="max-w-7xl mx-auto border-t border-gray-800 mt-8 pt-6 flex flex-col md:flex-row items-center justify-between text-center text-xxs text-gray-500 font-mono gap-4">
          <div>{siteSettings.copyrightText}</div>
          <button 
            onClick={() => setCurrentView('admin')} 
            className="text-gray-600 hover:text-gold cursor-pointer transition-colors px-3 py-1 rounded-md hover:bg-gray-800"
          >
            بوابة الإدارة
          </button>
        </div>
      </footer>

      {/* Customer Auth Modal (Popup) */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-100 text-right font-sans">
            <div className="bg-linear-to-r from-amber-600 to-amber-500 p-5 text-white flex justify-between items-center">
              <button 
                onClick={() => setShowCustomerModal(false)}
                className="text-white/80 hover:text-white p-1 hover:bg-white/10 rounded-full cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="flex items-center space-x-2 space-x-reverse">
                <User className="h-5 w-5 text-amber-100" />
                <h3 className="text-lg font-black font-sans">
                  {customerModalMode === 'login' ? 'الدخول للحساب الشخصي' : 'إنشاء حساب عميل جديد'}
                </h3>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {custAuthError && (
                <div className="bg-rose-50 border border-rose-100 text-rose-800 p-3 rounded-xl text-xs font-bold flex items-center space-x-2 space-x-reverse">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{custAuthError}</span>
                </div>
              )}

              {loginStep === 'otp' ? (
                <form onSubmit={handleVerifyOTP} className="space-y-6">
                  <div className="text-center space-y-2">
                    <p className="text-sm font-black text-navy font-display">تأكيد رمز التحقق 🔑</p>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      لقد أرسلنا رمزاً مكوناً من 6 أرقام إلى الرقم:
                      <br />
                      <span className="font-mono text-amber-600 font-extrabold text-sm" dir="ltr">{custPhone}</span>
                    </p>
                  </div>

                  {/* Golden Interactive OTP Display Box */}
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200/60 rounded-2xl p-4 text-center space-y-3 shadow-xs">
                    <div className="text-[10px] text-amber-850 font-bold tracking-wide">الرمز الممنوح لك حالياً للتجربة والتحقق السريع:</div>
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-2xl font-black font-mono text-amber-900 tracking-wider bg-white px-4 py-1 rounded-xl border border-amber-200 shadow-sm col-span-2">
                        {generatedOTP}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(generatedOTP);
                          alert('تم نسخ الرمز بنجاح 📋');
                        }}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xxs rounded-lg transition-all cursor-pointer shadow-xs active:scale-95"
                      >
                        نسخ الرمز 📋
                      </button>
                    </div>

                    <div className="pt-1 flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          let clean = custPhone.trim().replace(/\D/g, '');
                          if (clean.startsWith('00')) {
                            clean = clean.substring(2);
                          } else if (clean.startsWith('0')) {
                            clean = '967' + clean.substring(1);
                          } else if (!clean.startsWith('967') && clean.length === 9) {
                            clean = '967' + clean;
                          }
                          const msgText = `مرحباً بك عميلنا العزيز 👋\nرمز التحقق الخاص بك للدخول الآمن إلى حسابك في دكان الشرق هو: (${generatedOTP}) 🔑.\nتأكيد الرمز في الموقع لإتمام تسجيل الدخول بنجاح.`;
                          const wpUrl = `https://wa.me/${clean}?text=${encodeURIComponent(msgText)}`;
                          window.open(wpUrl, '_blank');
                        }}
                        className="w-full py-2 bg-emerald-605 hover:bg-emerald-700 text-white font-extrabold text-xxs rounded-xl duration-200 transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                      >
                        <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                        إرسال الرمز مباشرة إلى رقمي عبر WhatsApp 💬
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setOtpValue(generatedOTP);
                        }}
                        className="w-full py-1.5 bg-amber-100 hover:bg-amber-150 text-amber-900 font-extrabold text-xxs rounded-xl duration-200 transition-colors cursor-pointer flex items-center justify-center gap-1.5 border border-amber-200"
                      >
                        ⚡ تعبئة تلقائية للرمز للتجربة الفورية
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-center" dir="ltr">
                    <input 
                      type="text" 
                      maxLength={6}
                      required
                      autoFocus
                      placeholder="000000"
                      value={otpValue}
                      onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                      className="w-40 text-center text-2xl font-black tracking-[10px] py-3 bg-gray-50 border-2 border-gray-100 focus:border-amber-500 rounded-2xl focus:outline-hidden text-amber-600 font-mono"
                    />
                  </div>

                  <div className="space-y-3 pt-2">
                    <button
                      type="submit"
                      disabled={isVerifying}
                      className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-sm rounded-xl transition-all cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isVerifying ? (
                        <>
                          <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          جاري التحقق الملكي...
                        </>
                      ) : (
                        'تأكيد الدخول الآمن'
                      )}
                    </button>

                    <div className="flex flex-col gap-2">
                      <button 
                        type="button"
                        onClick={() => {
                          const mockOTP = Math.floor(100000 + Math.random() * 900000).toString();
                          setGeneratedOTP(mockOTP);
                          alert(`تم إعادة إرسال الرمز الجديد عبر WhatsApp: ${mockOTP}`);
                        }}
                        className="text-xxs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        <MessageSquare className="h-3 w-3" />
                        إرسال الرمز مجدداً عبر WhatsApp
                      </button>
                      <button 
                        type="button"
                        onClick={() => setLoginStep('credentials')}
                        className="text-xxs font-bold text-gray-400 hover:text-gray-600 underline cursor-pointer"
                      >
                        تغيير رقم الهاتف أو كلمة المرور
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <form 
                  onSubmit={customerModalMode === 'login' ? handleCustomerLoginSubmit : handleCustomerRegisterSubmit}
                  className="space-y-4"
                >
                  {customerModalMode === 'register' && (
                    <div>
                      <label className="block text-xxs font-bold text-gray-500 mb-1">الاسم الكامل للعميل</label>
                      <input 
                        type="text" 
                        required
                        placeholder="مثال: عبدالرحمن الفضلي"
                        value={custName}
                        onChange={(e) => setCustName(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 focus:border-amber-550 rounded-xl focus:outline-hidden text-xs text-gray-800 text-right"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xxs font-bold text-gray-500 mb-1">رقم الهاتف (مفتاح التتبع)</label>
                    <input 
                      type="tel" 
                      required
                      placeholder="رقم الهاتف الخاص بك"
                      value={custPhone}
                      onChange={(e) => setCustPhone(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 focus:border-amber-550 rounded-xl focus:outline-hidden text-xs text-gray-800 text-right font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xxs font-bold text-gray-500 mb-1">كلمة المرور المشفرة</label>
                    <input 
                      type="password" 
                      required
                      placeholder="•••••••••"
                      value={custPassword}
                      onChange={(e) => setCustPassword(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 focus:border-amber-550 rounded-xl focus:outline-hidden text-xs text-gray-800 text-right"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all cursor-pointer shadow-sm mt-2"
                  >
                    {customerModalMode === 'login' ? 'إرسال رمز التحقق' : 'عرض تسجيل الحساب وتأكيد العضوية'}
                  </button>
                </form>
              )}

              <div className="pt-2 border-t border-gray-100 text-center text-xs">
                {customerModalMode === 'login' ? (
                  <p className="text-gray-500">
                    أليس لديك حساب مسجل؟{' '}
                    <button 
                      onClick={() => { setCustAuthError(''); setCustomerModalMode('register'); }}
                      className="text-amber-600 hover:text-amber-800 underline font-extrabold cursor-pointer"
                    >
                      إنشاء حساب الآن
                    </button>
                  </p>
                ) : (
                  <p className="text-gray-500">
                    مسجل وتملك حساب مسبق؟{' '}
                    <button 
                      onClick={() => { setCustAuthError(''); setCustomerModalMode('login'); }}
                      className="text-amber-600 hover:text-amber-800 underline font-extrabold cursor-pointer"
                    >
                      تفضل بتسجيل الدخول
                    </button>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Wallet Modal */}
      <WalletModal 
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        currentUser={currentUser}
        selectedCurrency={selectedCurrency}
        redemptionOptions={siteSettings.redemptionOptions}
        onRedeem={handleRedeemPoints}
      />

      {/* Floating Smart Chatbot UI */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end">
        {/* Chat window panel */}
        {isChatOpen && (
          <div className="bg-white rounded-3xl w-80 sm:w-96 h-[450px] shadow-2xl border border-gray-100 flex flex-col overflow-hidden mb-3 animate-fade-in text-right font-sans">
            {/* Header */}
            <div className="bg-linear-to-r from-gray-950 via-gray-900 to-amber-950 p-4 text-white flex justify-between items-center border-b border-amber-500/20">
              <button 
                onClick={() => setIsChatOpen(false)}
                className="text-gray-400 hover:text-white p-1 hover:bg-white/5 rounded-full cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="flex items-center space-x-2 space-x-reverse">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <div className="flex flex-col">
                  <span className="text-xs font-black text-white font-sans">المساعد الرقمي لـ دكّان الشَّرق</span>
                  <span className="text-[9px] text-amber-500 font-mono">الرد السريع التفاعلي الفاخر</span>
                </div>
              </div>
            </div>

            {/* Message window */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
              {chatMessages.map((msg, index) => (
                <div 
                  key={index}
                  className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                    msg.sender === 'user' 
                      ? 'bg-blue-50 text-blue-900 rounded-tr-none' 
                      : 'bg-white text-gray-800 rounded-tl-none border border-amber-100 shadow-xxs'
                  }`}>
                    <p className="font-sans font-medium whitespace-pre-wrap">{msg.text}</p>
                    <span className="block text-[8px] text-gray-400 mt-1 font-mono text-left">{msg.time}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Preset clickable quick options */}
            <div className="px-3 py-2 bg-gray-50 border-t border-gray-100">
              <p className="text-[9px] text-gray-400 font-bold mb-1 font-sans">اختر سؤالاً سريعاً مجاباً فورياً:</p>
              <div className="flex flex-wrap gap-1 justify-end">
                <button 
                  onClick={() => handleQuickQuestionMessage('كيف أتتبع طلبي ومكانه؟', 'تتبع شحنتك غاية في البساطة! يرجى نسخ كود الطلب الذي يظهر لك بعد الشراء (مثال: TR-XXXXXX) والانتقال إلى قسم تتبع طلبياتي بالأعلى وإدخاله لترى الحالة حية ثانية بثانية! 📦')}
                  className="bg-white hover:bg-amber-50 border border-gray-200 text-[10px] text-gray-700 font-sans font-semibold rounded-lg px-2 py-0.5 cursor-pointer transition-colors"
                >
                  🔍 تتبع الطلب
                </button>
                <button 
                  onClick={() => handleQuickQuestionMessage('ما هي طرق الدفع المتوفرة باليمن؟', 'نحن نوفر الدفع بمختلف بطاقات مدى، الائتمان، وPayPal. وللأعزاء باليمن، يمكنك ببساطة التحويل المباشر وبسرعة عبر كريمي أو صراف النجم وتأكيد طلبك هاتفياً! 💳')}
                  className="bg-white hover:bg-amber-50 border border-gray-200 text-[10px] text-gray-700 font-sans font-semibold rounded-lg px-2 py-0.5 cursor-pointer transition-colors"
                >
                  🇾🇪 الدفع باليمن والتحويل
                </button>
                <button 
                  onClick={() => handleQuickQuestionMessage('كيف أتحدث فورياً مع المالك؟', 'يمكنك الاتصال والدردشة مع مالك متجر دكان الشرق والمدير العام في أي وقت عبر واتساب بالضغط على الأيقونة الخضراء أو هذا الرقم: +967774919194 لطلبيتك الخاصة! 📞')}
                  className="bg-white hover:bg-amber-50 border border-gray-200 text-[10px] text-gray-700 font-sans font-semibold rounded-lg px-2 py-0.5 cursor-pointer transition-colors"
                >
                  💬 تواصل بالمالك مباشرة
                </button>
                <button 
                  onClick={() => handleQuickQuestionMessage('هل الشحن مجاني لليمن والدول؟', 'نعم يا فندم! نوفر شحناً فاخراً ومجانياً بالكامل لكافة البلدان (اليمن والخليج والعالم) عند جعل قيمة مشترياتك الإجمالية فوق ٤٠٠ ر.س فقط! 🚀')}
                  className="bg-white hover:bg-amber-50 border border-gray-200 text-[10px] text-gray-700 font-sans font-semibold rounded-lg px-2 py-0.5 cursor-pointer transition-colors"
                >
                  🚀 الشحن المجاني الملكي
                </button>
              </div>
            </div>

            {/* Custom search query input form */}
            <form onSubmit={handleSendCustomQueryMessage} className="p-3 border-t border-gray-150 flex bg-white">
              <button 
                type="submit"
                className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl px-3 py-2 cursor-pointer transition-colors"
              >
                <Send className="h-3.5 w-3.5 rotate-180" />
              </button>
              <input 
                type="text"
                placeholder="اكتب استفسارك بالتفصيل (يمن، دفع، شحن...)"
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                className="flex-1 bg-gray-50 border border-gray-150 rounded-xl px-3 py-1.5 text-xs text-gray-800 text-right focus:outline-hidden focus:border-amber-500 font-sans"
              />
            </form>
          </div>
        )}

        {siteSettings.enableSocialProof && <TrustPulse products={products} />}
        {siteSettings.enableLiveChat && <LiveChat />}
        {siteSettings.enableCommunityChat && <CommunityChat currentUser={currentUser} />}
        <CustomerMessages 
          currentUser={currentUser} 
          customerAccounts={customerAccounts} 
          isAdmin={isAdminLoggedIn} 
        />
      </div>
    </div>
  );
}
