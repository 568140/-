import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Store as StoreIcon, ArrowRight, ShieldCheck, 
  Sparkles, Zap, Rocket, Globe, Palette, Layout, Search,
  CheckCircle, Smartphone, MessageSquare, Facebook, Instagram
} from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { Store } from '../types';
import { safeConfirm } from '../utils/safeConfirm';

interface PlatformLandingProps {
  onSelectStore: (storeId: string) => void;
}

export const PlatformLanding: React.FC<PlatformLandingProps> = ({ onSelectStore }) => {
  const [stores, setStores] = useState<Store[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreEmail, setNewStoreEmail] = useState('');
  const [newStoreSlug, setNewStoreSlug] = useState('');
  const [adminUsername, setAdminUsername] = useState('admin');
  const [adminPassword, setAdminPassword] = useState('');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [superAdminPass, setSuperAdminPass] = useState('');
  const [showSuperAdminLogin, setShowSuperAdminLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Custom non-blocking confirmation dialog (prevents iframe sandbox blocks)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const requestConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'stores'));
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Store);
        setStores(list);
      } catch (e) {
        console.error('Error fetching stores list:', e);
      }
    };
    fetchStores();
  }, []);

  const handleSuperAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (superAdminPass === '774919194') { // Root admin password
      setIsSuperAdmin(true);
      setShowSuperAdminLogin(false);
      setSuperAdminPass('');
    } else {
      alert('كلمة مرور خاطئة');
    }
  };

  const toggleStoreStatus = async (storeId: string, currentStatus: string) => {
    if (!isSuperAdmin) return;
    const { doc, updateDoc } = await import('firebase/firestore');
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    try {
      await updateDoc(doc(db, 'stores', storeId), { status: newStatus });
    } catch (e) {
      console.error('Error updating status', e);
    }
  };

  const deleteStore = async (storeId: string) => {
    if (!isSuperAdmin) return;
    requestConfirm('حذف المتجر نهائياً', 'هل أنت متأكد من حذف هذا المتجر نهائياً؟ كافة البيانات والمنتجات والطلبات والعملاء التابعة له سيتم إزالتها ولا يمكن التراجع!', async () => {
      const { doc, deleteDoc } = await import('firebase/firestore');
      try {
        await deleteDoc(doc(db, 'stores', storeId));
      } catch (e) {
        console.error('Error deleting store', e);
      }
    });
  };

  const toggleFeature = async (storeId: string, featureKey: string, currentVal: boolean) => {
    if (!isSuperAdmin) return;
    const { doc, updateDoc } = await import('firebase/firestore');
    try {
      await updateDoc(doc(db, 'stores', storeId), { [featureKey]: !currentVal });
    } catch (e) {
      console.error('Error updating feature', e);
    }
  };

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName || !newStoreEmail || !newStoreSlug) return;

    setIsLoading(true);
    try {
      const slug = newStoreSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-');
      
      // Check if slug taken
      const exists = stores.some(s => s.subdomain === slug);
      if (exists) {
        alert('هذا الرابط مستخدم بالفعل! اختر رابطاً آخر.');
        setIsLoading(false);
        return;
      }

      const storeData: Omit<Store, 'id'> = {
        name: newStoreName,
        ownerEmail: newStoreEmail,
        subdomain: slug,
        createdAt: new Date().toISOString(),
        status: 'active',
        description: 'متجر جديد عالي الجودة على منصة دكان الشرق'
      };

      const docRef = await addDoc(collection(db, 'stores'), storeData);
      
      // Initialize internal settings for the new store
      const { doc, setDoc } = await import('firebase/firestore');
      
      // Save Admin Credentials for this specific store
      await setDoc(doc(db, 'stores', docRef.id, 'settings', 'admin'), {
        username: adminUsername || 'admin',
        password: adminPassword || (Math.random().toString(36).slice(-8))
      });

      // Seeding basic site settings
      await setDoc(doc(db, 'stores', docRef.id, 'site_settings', 'general'), {
        storeName: newStoreName,
        contactEmail: newStoreEmail,
        currency: 'ر.ي',
        footerEmail: newStoreEmail,
        supportHours: '24/7 طوال أيام الأسبوع'
      });
      
      alert('تم إنشاء متجرك بنجاح! سيتم توجيهك الآن.');
      window.location.hash = `#/s/${docRef.id}`;
    } catch (err) {
      console.error(err);
      alert('فشل في إنشاء المتجر. حاول مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStores = stores.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.subdomain.toLowerCase().includes(searchQuery.toLowerCase())
  ).filter(s => isSuperAdmin ? true : s.status === 'active');

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-amber-100 selection:text-amber-900">
      {/* Platform Header */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-600/20">
              <StoreIcon className="text-white h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900">دكّان الشَّرق <span className="text-amber-600">SaaS</span></h1>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Platform & Marketplace</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!isSuperAdmin ? (
              <button 
                onClick={() => setShowSuperAdminLogin(true)}
                className="px-4 py-2 text-slate-400 hover:text-slate-600 font-black text-[10px] uppercase tracking-widest transition-all"
              >
                إدارة المنصة
              </button>
            ) : (
              <button 
                onClick={() => setIsSuperAdmin(false)}
                className="px-4 py-2 text-red-500 hover:text-red-700 font-black text-[10px] uppercase tracking-widest transition-all"
              >
                خروج من الإدارة
              </button>
            )}
            <button 
              onClick={() => setIsCreating(true)}
              className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-amber-600 transition-all flex items-center gap-2 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              أنشئ متجرك الآن
            </button>
          </div>
        </div>
      </nav>

      {/* Super Admin Login Modal */}
      {showSuperAdminLogin && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <div className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl relative">
            <button 
              onClick={() => setShowSuperAdminLogin(false)}
              className="absolute top-6 left-6 p-2 text-gray-300 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold mb-6 text-center">دخول مدير المنصة</h3>
            <form onSubmit={handleSuperAdminLogin}>
              <input 
                type="password" 
                autoFocus
                value={superAdminPass}
                onChange={(e) => setSuperAdminPass(e.target.value)}
                placeholder="كلمة مرور إدارة المنصة"
                className="w-full px-5 py-4 bg-slate-50 border border-gray-100 rounded-2xl text-sm font-bold mb-4 focus:outline-hidden focus:border-amber-400 text-center"
              />
              <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20">
                تحقق ودخول
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-linear-to-b from-amber-50/50 to-transparent pointer-events-none -z-10"></div>
        <div className="max-w-7xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-white border border-amber-100 rounded-full mb-8 shadow-xs"
          >
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span className="text-[11px] font-black text-amber-700">ابدأ تجارتك الإلكترونية في دقائق</span>
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black text-slate-900 leading-tight mb-6"
          >
            حول شغفك إلى <span className="text-amber-600">واقع</span><br />
            مع منصة دكان الشرق المتكاملة
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gray-500 max-w-2xl mx-auto text-sm md:text-md mb-12 leading-relaxed"
          >
            نحن نوفر لك كل ما تحتاجه للنجاح: إدارة المنتجات، تتبع الطلبات، بوابات الدفع، وإحصائيات متقدمة. كل ذلك في لوحة تحكم واحدة احترافية.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <button onClick={() => setIsCreating(true)} className="px-10 py-5 bg-amber-600 text-white rounded-2xl text-md font-black shadow-xl shadow-amber-600/20 hover:scale-105 transition-all flex items-center gap-3">
              أنشئ متجرك مجاناً
              <ArrowRight className="h-5 w-5" />
            </button>
            <a href="#browse-stores" className="px-10 py-5 bg-white text-slate-900 border border-gray-200 rounded-2xl text-md font-black hover:bg-gray-50 transition-all">
              تصفح المتاجر الحالية
            </a>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-2xl font-black text-slate-900">لماذا تختار منصة دكان الشرق؟</h3>
            <div className="w-12 h-1 bg-amber-600 mx-auto mt-4 rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Layout, title: 'تصميم احترافي', desc: 'قوالب عصرية متجاوبة مع كافة الشاشات والأنظمة.' },
              { icon: ShieldCheck, title: 'أمن وموثوقية', desc: 'بياناتك وطلبات عملائك محمية بأعلى مستويات التشفير.' },
              { icon: Zap, title: 'سرعة فائقة', desc: 'تجربة تسوق سريعة وسلسة تجعل عميلك يعود دائماً.' },
              { icon: Palette, title: 'تخصيص كامل', desc: 'تحكم في الألوان، الشعارات، والنصوص بكل سهولة.' },
              { icon: Globe, title: 'دعم العملات', desc: 'دعم كامل للريال السعودي واليمني وغيرهما من العملات.' },
              { icon: MessageSquare, title: 'تواصل مباشر', desc: 'تكامل مع واتساب وتلجرام لسهولة تأكيد الطلبات.' }
            ].map((feat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="p-8 rounded-3xl border border-gray-100 hover:border-amber-200 hover:shadow-xl hover:shadow-amber-100 transition-all group"
              >
                <div className="w-14 h-14 bg-slate-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-amber-600 group-hover:text-white transition-all">
                  <feat.icon className="h-7 w-7" />
                </div>
                <h4 className="text-lg font-black text-slate-900 mb-3">{feat.title}</h4>
                <p className="text-sm text-gray-500 leading-relaxed font-sans">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stores Directory */}
      <section id="browse-stores" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
            <div>
              <h3 className="text-2xl font-black text-slate-900">استعرض المتاجر المميزة</h3>
              <p className="text-sm text-gray-500 font-sans mt-2">انضم إلى قائمة رواد الأعمال الناجحين في منصتنا.</p>
            </div>
            
            <div className="relative w-full md:w-96">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input 
                type="text" 
                placeholder="ابحث عن متجر..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-12 pl-4 py-4 bg-white border border-gray-100 rounded-2xl text-sm focus:outline-hidden focus:border-amber-400 shadow-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredStores.length > 0 ? filteredStores.map(store => (
              <motion.div 
                key={store.id}
                layout
                whileHover={{ y: -5 }}
                className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl transition-all group"
              >
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 overflow-hidden border border-gray-100">
                  {store.logoUrl ? (
                    <img src={store.logoUrl} className="w-full h-full object-cover" alt={store.name} />
                  ) : (
                    <StoreIcon className="h-7 w-7 text-gray-300" />
                  )}
                </div>
                <h4 className="text-lg font-black text-slate-900 mb-1">{store.name}</h4>
                <p className="text-[11px] text-amber-600 font-black mb-4 uppercase tracking-tighter">@{store.subdomain}</p>
                <p className="text-xs text-gray-400 font-sans line-clamp-2 mb-6 h-8">{store.description}</p>
                
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => {
                      window.location.hash = `#/s/${store.id}`;
                      onSelectStore(store.id);
                    }}
                    className="w-full py-3 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-amber-600 transition-all flex items-center justify-center gap-2"
                  >
                    زيارة المتجر
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  {isSuperAdmin && (
                    <div className="grid grid-cols-2 gap-2 mt-2 pt-4 border-t border-gray-50">
                      <button 
                        onClick={() => toggleStoreStatus(store.id, store.status)}
                        className={`py-2.5 px-2 text-[10px] font-black rounded-xl transition-all ${store.status === 'suspended' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}
                      >
                        {store.status === 'suspended' ? 'تفعيل المتجر' : 'توقيف مؤقت'}
                      </button>
                      <button 
                        onClick={() => toggleFeature(store.id, 'disableCommunity', !!(store as any).disableCommunity)}
                        className={`py-2.5 px-2 text-[10px] font-black rounded-xl transition-all ${(store as any).disableCommunity ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-600'}`}
                      >
                        {(store as any).disableCommunity ? 'تفعيل العضوية' : 'تعطيل الدردشة'}
                      </button>
                      <button 
                        onClick={() => deleteStore(store.id)}
                        className="py-2.5 px-2 bg-red-50 text-red-500 text-[10px] font-black rounded-xl hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-1 col-span-2"
                      >
                        <X className="w-3 h-3" />
                        حذف المتجر نهائياً
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )) : (
              <div className="col-span-full py-20 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                  <Search className="h-10 w-10" />
                </div>
                <h4 className="text-lg font-black text-slate-400">لا يوجد متاجر تتبع بحثك حالياً</h4>
                <p className="text-sm text-gray-400 font-sans mt-2">كن الأول في منطقتك وأنشئ متجرك الآن!</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Creation Modal */}
      <AnimatePresence>
        {isCreating && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isLoading && setIsCreating(false)}></div>
            
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-[40px] p-8 md:p-12 relative z-10 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl font-black text-slate-900">أنشئ متجرك اليوم</h3>
                  <p className="text-sm text-gray-400 font-sans mt-1">ابدأ رحلة نجاحك في عالم التجارة</p>
                </div>
                <button onClick={() => setIsCreating(false)} className="p-2 text-gray-400 hover:text-slate-900 transition-colors">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleCreateStore} className="space-y-6">
                <div>
                  <label className="block text-xxs font-black text-slate-400 uppercase tracking-widest mb-2">اسم النشاط التجاري</label>
                  <input 
                    type="text" 
                    required
                    value={newStoreName}
                    onChange={(e) => {
                      setNewStoreName(e.target.value);
                      if (!newStoreSlug) {
                        setNewStoreSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
                      }
                    }}
                    placeholder="مثال: عطور الشرق الفاخرة"
                    className="w-full px-5 py-4 bg-slate-50 border border-gray-100 rounded-2xl text-sm font-bold focus:outline-hidden focus:border-amber-400 transition-all shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xxs font-black text-slate-400 uppercase tracking-widest mb-2">البريد الإلكتروني للإدارة</label>
                  <input 
                    type="email" 
                    required
                    value={newStoreEmail}
                    onChange={(e) => setNewStoreEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-5 py-4 bg-slate-50 border border-gray-100 rounded-2xl text-sm font-bold focus:outline-hidden focus:border-amber-400 transition-all shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xxs font-black text-slate-400 uppercase tracking-widest mb-2">رابط المتجر المخصص (Subdomain)</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      required
                      value={newStoreSlug}
                      onChange={(e) => setNewStoreSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      placeholder="my-luxury-shop"
                      className="w-full px-5 py-4 bg-slate-50 border border-gray-100 rounded-2xl text-sm font-mono font-bold focus:outline-hidden focus:border-amber-400 transition-all shadow-sm"
                      dir="ltr"
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-bold bg-white px-2 py-1 rounded-lg border border-gray-100">
                      /{newStoreSlug}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xxs font-black text-slate-400 uppercase tracking-widest mb-2">اسم مستخدم المدير</label>
                    <input 
                      type="text" 
                      required
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      placeholder="admin"
                      className="w-full px-5 py-3 bg-slate-50 border border-gray-100 rounded-2xl text-sm font-bold focus:outline-hidden focus:border-amber-400 transition-all shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xxs font-black text-slate-400 uppercase tracking-widest mb-2">كلمة مرور الإدارة</label>
                    <input 
                      type="password" 
                      required
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-5 py-3 bg-slate-50 border border-gray-100 rounded-2xl text-sm font-bold focus:outline-hidden focus:border-amber-400 transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full py-5 bg-amber-600 text-white rounded-2xl text-md font-black shadow-xl shadow-amber-600/20 hover:bg-amber-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        جاري تهيئة متجرك المتكامل...
                      </>
                    ) : (
                      <>
                        إطلاق المتجر الآن!
                        <Rocket className="h-5 w-5" />
                      </>
                    )}
                  </button>
                  <p className="text-center text-[10px] text-gray-400 font-sans mt-4">
                    بالنقر على "إطلاق المتجر" أنت توافق على شروط الاستخدام والخصوصية لمنصة دكان الشرق.
                  </p>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Confirmation Dialog */}
      <AnimatePresence>
        {confirmDialog.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-[9999] flex items-center justify-center p-4 font-sans text-right"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 relative overflow-hidden"
              dir="rtl"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
              </div>
              <h3 className="text-base font-black text-slate-900 mb-2">{confirmDialog.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-6">{confirmDialog.message}</p>
              <div className="flex gap-3">
                <button
                  onClick={confirmDialog.onConfirm}
                  className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer"
                >
                  نعم، متأكد
                </button>
                <button
                  onClick={() => setConfirmDialog(p => ({ ...p, isOpen: false }))}
                  className="flex-1 py-3 px-4 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl text-xs font-black border border-slate-150 transition-all cursor-pointer"
                >
                  إلغاء الأمر
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-slate-900 py-12 text-center">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center">
              <StoreIcon className="text-amber-600 h-6 w-6" />
            </div>
            <h4 className="text-white font-black">منصة دكّان الشَّرق البلاتينية</h4>
            <p className="text-gray-500 text-xs font-sans max-w-sm">نحن نبني مستقبل التجارة الإلكترونية في الشرق الأوسط بصورة عصرية واحترافية.</p>
            <div className="flex gap-4 mt-4">
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer">
                <Facebook className="h-4 w-4" />
              </div>
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer">
                <Instagram className="h-4 w-4" />
              </div>
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer">
                <MessageSquare className="h-4 w-4" />
              </div>
            </div>
            <p className="text-[10px] text-gray-600 font-sans mt-8 uppercase tracking-widest">© 2024-2025 ALL RIGHTS RESERVED - DUKKAN EAST PLATFORM</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Add missing icon for the form
const X: React.FC<any> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);
