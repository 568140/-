import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, ShoppingBag, Users, DollarSign, Package, BadgePercent, 
  Plus, Edit, Trash2, Eye, CircleAlert, Check, X, Search, ChevronLeft, SlidersHorizontal, Sparkles, MapPin, Map, PlusCircle, Settings, ClipboardList, Wallet, MessageSquare, Upload, Globe, ShieldCheck, PlayCircle, Video, CheckCircle, Trophy, Gem
} from 'lucide-react';
import { Product, Order, Coupon, LocalWallet, Transaction, CustomerAccount } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { CATEGORIES } from '../data';
import { GovernorateData } from '../utils/yemeniData';
import { CustomerMessages } from './CustomerMessages';

const compressImage = (file: File, maxSize: number = 600): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height *= maxSize / width;
              width = maxSize;
            } else {
              width *= maxSize / height;
              height = maxSize;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.6));
        };
        img.src = event.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  });
};

interface CategoryConfig {
  name: string;
  subcategories: string[];
}

interface DashboardProps {
  products: Product[];
  orders: Order[];
  coupons: Coupon[];
  localWallets?: LocalWallet[];
  setLocalWallets?: React.Dispatch<React.SetStateAction<LocalWallet[]>>;
  categories: CategoryConfig[];
  setCategories: React.Dispatch<React.SetStateAction<CategoryConfig[]>>;
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onUpdateOrderStatus: (orderId: string, status: Order['status']) => void;
  onAddCoupon: (coupon: Coupon) => void;
  onDeleteCoupon: (code: string) => void;
  siteSettings: import('../types').SiteSettings;
  setSiteSettings: (val: import('../types').SiteSettings) => void;
  yemeniGeodata: GovernorateData[];
  setYemeniGeodata: React.Dispatch<React.SetStateAction<GovernorateData[]>>;
  customerAccounts?: import('../types').CustomerAccount[];
  setCustomerAccounts?: React.Dispatch<React.SetStateAction<import('../types').CustomerAccount[]>>;
  onAdminLoginChange?: (loggedIn: boolean) => void;
}

export function Dashboard({
  products,
  orders,
  coupons,
  localWallets,
  setLocalWallets,
  categories,
  setCategories,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onUpdateOrderStatus,
  onAddCoupon,
  onDeleteCoupon,
  siteSettings,
  setSiteSettings,
  yemeniGeodata,
  setYemeniGeodata,
  customerAccounts,
  setCustomerAccounts,
  onAdminLoginChange,
}: DashboardProps) {
  // File Upload Handling
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('حجم الملف كبير جداً. يرجى اختيار صورة أقل من 2 ميجابايت');
        return;
      }
      try {
        const compressedBase64 = await compressImage(file, 400);
        setSiteSettings({ ...siteSettings, logoUrl: compressedBase64 });
      } catch (err) {
        console.error('Failed to compress logo:', err);
      }
    }
  };

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        alert('حجم الملف كبير جداً. يرجى اختيار صورة أقل من 1 ميجابايت');
        return;
      }
      try {
        const compressedBase64 = await compressImage(file, 150);
        setSiteSettings({ ...siteSettings, iconUrl: compressedBase64 });
      } catch (err) {
        console.error('Failed to compress icon:', err);
      }
    }
  };

  const [activeTab, setActiveTab] = useState<'metrics' | 'products' | 'categories' | 'orders' | 'users' | 'coupons' | 'settings' | 'geodata' | 'wallets' | 'layout' | 'marketing' | 'ads' | 'private-messages'>('metrics');
  
  // Admin Authentication / Credentials Configuration
  const [adminUsername, setAdminUsername] = useState(() => {
    return localStorage.getItem('dukkan_admin_user') || 'admin';
  });
  const [adminPassword, setAdminPassword] = useState(() => {
    return localStorage.getItem('dukkan_admin_pass') || '123456';
  });
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return sessionStorage.getItem('dukkan_admin_logged') === 'true';
  });

  // Login Form Input States
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');

  // Settings Credentials Input States
  const [newAdminUser, setNewAdminUser] = useState(adminUsername);
  const [newAdminPass, setNewAdminPass] = useState(adminPassword);
  const [showCredSuccess, setShowCredSuccess] = useState(false);

  // Modals / Form states
  const [searchProductQuery, setSearchProductQuery] = useState('');
  const [showProductModal, setShowProductModal] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Create / Edit Product Form
  const [prodName, setProdName] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodPrice, setProdPrice] = useState(0);
  const [prodCategory, setProdCategory] = useState(categories[0]?.name || 'إلكترونيات');
  const [prodSubCategory, setProdSubCategory] = useState('');
  const [prodSizesInput, setProdSizesInput] = useState('');
  const [imageMethod, setImageMethod] = useState<'url' | 'upload'>('url');
  const [prodStock, setProdStock] = useState(1);
  const [prodImage, setProdImage] = useState('');
  const [prodRating, setProdRating] = useState(4.5);
  const [prodIsFeatured, setProdIsFeatured] = useState(false);
  const [prodPointsReward, setProdPointsReward] = useState(0);
  const [prodVideoUrl, setProdVideoUrl] = useState('');
  const [prodSizeStock, setProdSizeStock] = useState<Record<string, number>>({});
  const [prodCode, setProdCode] = useState('');

  // Order search query state for Owner lookup
  const [orderSearchQuery, setOrderSearchQuery] = useState('');

  // Gift Giving Custom Modal states
  const [giftingAccount, setGiftingAccount] = useState<CustomerAccount | null>(null);
  const [giftType, setGiftType] = useState<'points' | 'product' | 'deduct' | 'reset'>('points');
  const [giftPoints, setGiftPoints] = useState<string>('');
  const [giftProduct, setGiftProduct] = useState<string>('');
  const [giftSuccessMsg, setGiftSuccessMsg] = useState<string | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<CustomerAccount | null>(null);

  // Categories addition states
  const [addCategoryType, setAddCategoryType] = useState<'main' | 'sub'>('main');
  const [newMainCatName, setNewMainCatName] = useState('');
  const [selectedMainCatForSub, setSelectedMainCatForSub] = useState(categories[0]?.name || '');
  const [newSubCatName, setNewSubCatName] = useState('');

  // New Coupon Form
  const [copCode, setCopCode] = useState('');
  const [copType, setCopType] = useState<'percentage' | 'fixed'>('percentage');
  const [copValue, setCopValue] = useState(10);
  const [copMinSpend, setCopMinSpend] = useState<number>(0);

  // Yemeni Geodata Management States
  const [addGovName, setAddGovName] = useState('');
  const [addGovDistricts, setAddGovDistricts] = useState('');
  const [addGovStreets, setAddGovStreets] = useState('');

  const [editingGovId, setEditingGovId] = useState<string | null>(null);
  const [editingGovName, setEditingGovName] = useState('');
  const [editingGovDistricts, setEditingGovDistricts] = useState('');
  const [editingGovStreets, setEditingGovStreets] = useState('');

  // Order detail viewer modal
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

  // Interactive Stats States
  const [statTimeRange, setStatTimeRange] = useState<'all' | '30days' | '7days'>('all');
  const [statMetric, setStatMetric] = useState<'sales' | 'orders' | 'points'>('sales');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // Filter orders by selected time range
  const filteredOrdersByTime = useMemo(() => {
    return orders.filter(o => {
      if (statTimeRange === 'all') return true;
      const orderDate = new Date(o.createdAt);
      const diffTime = Math.abs(new Date().getTime() - orderDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (statTimeRange === '30days') return diffDays <= 30;
      if (statTimeRange === '7days') return diffDays <= 7;
      return true;
    });
  }, [orders, statTimeRange]);

  // Compute interactive stats based on filteredTime
  const interactiveSales = useMemo(() => {
    return filteredOrdersByTime
      .filter(o => o.status !== 'cancelled')
      .reduce((acc, curr) => acc + curr.totalPrice, 0);
  }, [filteredOrdersByTime]);

  const interactiveOrdersCount = useMemo(() => {
    return filteredOrdersByTime.length;
  }, [filteredOrdersByTime]);

  const interactivePointsUsed = useMemo(() => {
    return filteredOrdersByTime
      .filter(o => o.status !== 'cancelled')
      .reduce((acc, curr) => acc + (curr.pointsUsed || 0), 0);
  }, [filteredOrdersByTime]);

  const interactivePointsAwarded = useMemo(() => {
    return filteredOrdersByTime
      .filter(o => o.status !== 'cancelled')
      .reduce((acc, curr) => acc + (curr.earnedPoints || 0), 0);
  }, [filteredOrdersByTime]);

  const productAnalytics = useMemo(() => {
    const data: Record<string, { id: string; name: string; category: string; unitsSold: number; totalRev: number; image: string }> = {};
    
    filteredOrdersByTime.forEach(o => {
      if (o.status === 'cancelled') return;
      o.items.forEach(item => {
        const id = item.product.id;
        const cat = item.product.category;
        if (selectedCategoryFilter !== 'all' && cat !== selectedCategoryFilter) return;

        if (!data[id]) {
          data[id] = { 
            id, 
            name: item.product.name, 
            category: cat, 
            unitsSold: 0, 
            totalRev: 0, 
            image: item.product.image 
          };
        }
        data[id].unitsSold += item.quantity;
        data[id].totalRev += item.product.price * item.quantity;
      });
    });
    
    return Object.values(data).sort((a, b) => b.totalRev - a.totalRev);
  }, [filteredOrdersByTime, selectedCategoryFilter]);

  const timelineData = useMemo(() => {
    const dailyData: Record<string, { date: string; sales: number; orders: number; points: number }> = {};
    
    const sortedOrders = [...filteredOrdersByTime].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    
    sortedOrders.forEach(o => {
      if (o.status === 'cancelled') return;
      const date = o.createdAt;
      if (!dailyData[date]) {
        dailyData[date] = { date, sales: 0, orders: 0, points: 0 };
      }
      dailyData[date].sales += Number(o.totalPrice.toFixed(2));
      dailyData[date].orders += 1;
      dailyData[date].points += (o.pointsUsed || 0);
    });
    
    return Object.values(dailyData);
  }, [filteredOrdersByTime]);

  // Computed metrics
  const totalSales = useMemo(() => {
    return orders
      .filter(o => o.status !== 'cancelled')
      .reduce((acc, curr) => acc + curr.totalPrice, 0);
  }, [orders]);

  const salesByCategory = useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    orders.forEach(order => {
      if (order.status === 'cancelled') return;
      order.items.forEach(item => {
        const cat = item.product.category;
        categoryTotals[cat] = (categoryTotals[cat] || 0) + (item.product.price * item.quantity);
      });
    });
    return categoryTotals;
  }, [orders]);

  const activeOrdersCount = useMemo(() => {
    return orders.filter(o => o.status === 'pending' || o.status === 'processing').length;
  }, [orders]);

  const outOfStockCount = useMemo(() => {
    return products.filter(p => p.stock <= 0).length;
  }, [products]);

  // Product sorting / filtering
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const name = p.name || '';
      const category = p.category || '';
      return name.toLowerCase().includes(searchProductQuery.toLowerCase()) || 
             category.toLowerCase().includes(searchProductQuery.toLowerCase());
    });
  }, [products, searchProductQuery]);

  // Order sorting / filtering by User/Owner search (Phone, customerName, or unique order code)
  const filteredOrders = useMemo(() => {
    if (!orderSearchQuery.trim()) return orders;
    const q = orderSearchQuery.toLowerCase().trim();
    return orders.filter(o => 
      o.id.toLowerCase().includes(q) || 
      o.customerName.toLowerCase().includes(q) || 
      o.customerPhone.includes(q) ||
      o.customerEmail.toLowerCase().includes(q)
    );
  }, [orders, orderSearchQuery]);

  // Dynamic parsed sizes array
  const parsedSizesArray = useMemo(() => {
    return prodSizesInput
      ? prodSizesInput.split(/[,,،]/).map(s => s.trim()).filter(Boolean)
      : [];
  }, [prodSizesInput]);

  // Handle open Product modal for Create
  const handleOpenCreate = () => {
    setEditingProduct(null);
    setProdName('');
    setProdDesc('');
    setProdPrice(99);
    setProdCategory(categories[0]?.name || 'إلكترونيات');
    setProdSubCategory(categories[0]?.subcategories[0] || '');
    setProdSizesInput('S, M, L, XL');
    setProdSizeStock({ 'S': 10, 'M': 10, 'L': 10, 'XL': 10 });
    setImageMethod('url');
    setProdStock(40);
    setProdImage('https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=60');
    setProdRating(4.5);
    setProdIsFeatured(false);
    setProdPointsReward(10);
    setProdVideoUrl('');
    setProdCode('LX-' + Math.floor(10000 + Math.random() * 90000));
    setShowProductModal(true);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      
      const rows = text.split('\n');
      const isHeader = rows[0].includes('name') || rows[0].includes('الاسم');
      const startIdx = isHeader ? 1 : 0;
      let imported = 0;

      for (let i = startIdx; i < rows.length; i++) {
        const row = rows[i].trim();
        if (!row) continue;
        
        const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        
        if (cols.length >= 4) {
          const name = cols[0].replace(/^"|"$/g, '').trim();
          const desc = cols[1].replace(/^"|"$/g, '').trim();
          const price = parseFloat(cols[2]) || 0;
          const category = cols[3].replace(/^"|"$/g, '').trim();
          const stock = cols.length > 4 ? (parseInt(cols[4]) || 50) : 50;
          const image = cols.length > 5 ? cols[5].replace(/^"|"$/g, '').trim() : 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=60';
          
          if (name && price > 0) {
            onAddProduct({
              name,
              description: desc || 'منتج مستورد',
              price,
              category: category || 'عام',
              stock,
              image,
              rating: 4.5,
              isFeatured: false,
              pointsReward: 0
            });
            imported++;
          }
        }
      }
      alert(`تم استيراد ${imported} منتج بنجاح`);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Handle open Product modal for Edit
  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setProdName(p.name);
    setProdDesc(p.description);
    setProdPrice(p.price);
    setProdCategory(p.category);
    setProdSubCategory(p.subCategory || '');
    setProdSizesInput(p.sizes ? p.sizes.join(', ') : '');
    setProdSizeStock(p.sizeStock || {});
    setImageMethod(p.image.startsWith('data:') ? 'upload' : 'url');
    setProdStock(p.stock);
    setProdImage(p.image);
    setProdRating(p.rating);
    setProdIsFeatured(!!p.isFeatured);
    setProdPointsReward(p.pointsReward || 0);
    setProdVideoUrl(p.videoUrl || '');
    setProdCode(p.code || ('LX-' + Math.floor(10000 + Math.random() * 90000)));
    setShowProductModal(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || !prodDesc || !prodImage || prodPrice <= 0) {
      alert('الرجاء التأكد من ملء جميع الحقول بصور وتفاصيل صالحة.');
      return;
    }

    const parsedSizes = prodSizesInput
      ? prodSizesInput.split(/[,,،]/).map(s => s.trim()).filter(Boolean)
      : undefined;

    // Filter state dictionary to only currently active sizes
    const filteredSizeStock: Record<string, number> = {};
    if (parsedSizes) {
      parsedSizes.forEach(sz => {
        filteredSizeStock[sz] = typeof prodSizeStock[sz] !== 'undefined' ? prodSizeStock[sz] : 10;
      });
    }

    // Calculate total stock as the sum of size stock quantities (if sizes are present)
    const computedTotalStock = parsedSizes && parsedSizes.length > 0
      ? parsedSizes.reduce((sum, sz) => sum + (filteredSizeStock[sz] || 0), 0)
      : Number(prodStock);

    if (editingProduct) {
      onUpdateProduct({
        ...editingProduct,
        name: prodName,
        description: prodDesc,
        price: Number(prodPrice),
        category: prodCategory,
        subCategory: prodSubCategory || undefined,
        stock: computedTotalStock,
        image: prodImage,
        rating: Number(prodRating),
        isFeatured: prodIsFeatured,
        pointsReward: Number(prodPointsReward),
        videoUrl: prodVideoUrl,
        sizes: parsedSizes,
        sizeStock: filteredSizeStock,
        code: prodCode
      });
    } else {
      onAddProduct({
        name: prodName,
        description: prodDesc,
        price: Number(prodPrice),
        category: prodCategory,
        subCategory: prodSubCategory || undefined,
        stock: computedTotalStock,
        image: prodImage,
        rating: Number(prodRating),
        isFeatured: prodIsFeatured,
        pointsReward: Number(prodPointsReward),
        videoUrl: prodVideoUrl,
        sizes: parsedSizes,
        sizeStock: filteredSizeStock,
        code: prodCode
      });
    }
    setShowProductModal(false);
  };

  // Dynamic Category Creators
  const handleAddMainCategory = () => {
    const trimmed = newMainCatName.trim();
    if (!trimmed) {
      alert('الرجاء إدخال اسم القسم الرئيسي!');
      return;
    }
    const exists = categories.find(c => c.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      alert('هذا القسم الرئيسي متواجد بالفعل!');
      return;
    }
    setCategories(prev => [...prev, { name: trimmed, subcategories: [] }]);
    setNewMainCatName('');
    alert(`تم إضافة القسم الرئيسي "${trimmed}" بنجاح!`);
  };

  const handleAddSubCategory = () => {
    const trimmed = newSubCatName.trim();
    if (!trimmed) {
      alert('الرجاء إدخال اسم القسم الفرعي!');
      return;
    }
    if (!selectedMainCatForSub) {
      alert('الرجاء اختيار القسم الرئيسي المتبوع أولاً!');
      return;
    }
    setCategories(prev => prev.map(c => {
      if (c.name === selectedMainCatForSub) {
        const subExists = c.subcategories.includes(trimmed);
        if (subExists) {
          alert('هذا القسم الفرعي موجود بالفعل تحت مسمى هذا القسم الرئيسي!');
          return c;
        }
        return {
          ...c,
          subcategories: [...c.subcategories, trimmed]
        };
      }
      return c;
    }));
    setNewSubCatName('');
    alert(`تم ربط القسم الفرعي "${trimmed}" بالقسم الرئيسي "${selectedMainCatForSub}"!`);
  };

  const handleSaveCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!copCode || copValue <= 0) {
      alert('الرجاء تعبئة بيانات الكوبون بشكل صحيح.');
      return;
    }
    onAddCoupon({
      code: copCode.toUpperCase().trim(),
      discountType: copType,
      discountValue: Number(copValue),
      minSpend: copMinSpend > 0 ? Number(copMinSpend) : undefined
    });

    // Reset Form
    setCopCode('');
    setCopValue(10);
    setCopMinSpend(0);
  };

  if (!isLoggedIn) {
    const handleLoginSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (loginUser.trim() === adminUsername && loginPass === adminPassword) {
        setIsLoggedIn(true);
        sessionStorage.setItem('dukkan_admin_logged', 'true');
        onAdminLoginChange?.(true);
        setLoginError('');
      } else {
        setLoginError('خطأ في اسم المستخدم أو كلمة المرور! يرجى التحقق وإعادة المحاولة.');
      }
    };

    return (
      <div className="py-16 px-4 max-w-lg mx-auto text-right">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-150 relative overflow-hidden"
        >
          {/* Decorative luxury gradient outline */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-charcoal via-gold to-charcoal-dark" />
          
          <div className="text-center mb-8">
            <div className="h-20 w-20 bg-charcoal text-gold rounded-full flex items-center justify-center mx-auto mb-4 border border-gold/20 shadow-xl">
              <Package className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-black text-charcoal font-display">بوابة النخبة | دُكَّان الشَّرق</h2>
            <p className="text-xxs text-gray-400 font-display mt-2 uppercase tracking-[0.2em]">Restricted Access Area</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {loginError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-rose-50 border border-rose-150 text-rose-800 p-3.5 rounded-2xl text-xxs font-bold text-center leading-relaxed"
              >
                {loginError}
              </motion.div>
            )}

            <div>
              <label className="block text-xxs font-bold text-gray-400 mb-2 font-display uppercase text-right tracking-wider">اسم مستخدم المسؤول</label>
              <input
                type="text"
                required
                placeholder="Username"
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-sans text-right focus:outline-hidden focus:border-gold focus:bg-white transition-all font-bold text-charcoal"
              />
            </div>

            <div>
              <label className="block text-xxs font-bold text-gray-400 mb-2 font-display uppercase text-right tracking-wider">رمز المرور الخاص</label>
              <input
                type="password"
                required
                placeholder="•••••••••"
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-sans text-right focus:outline-hidden focus:border-gold focus:bg-white transition-all font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-charcoal hover:bg-charcoal-light text-gold font-black text-sm rounded-2xl shadow-xl transition-all duration-300 cursor-pointer text-center hover:scale-[1.02] active:scale-[0.98]"
            >
              دخول الإدارة
            </button>
          </form>

          <p className="text-[10px] text-gray-400 text-center mt-6 leading-relaxed">
            الافتراضي للإعداد الأولي للمالك:<br />
            اسم المستخدم: <span className="font-mono text-gray-700 font-bold">tr25</span> | كلمة المرور: <span className="font-mono text-gray-700 font-bold">774919194</span>
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      
      {/* Header Banner */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 font-sans tracking-tight">لوحة تحكم دُكّان الشرق</h1>
          <p className="text-xs text-gray-500 font-sans">إدارة المنتجات، تتبع طلبيات العملاء بشكل فوري، وتحليل أداء المبيعات والكوبونات.</p>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-150 self-start flex-wrap gap-1">
          <button
            onClick={() => setActiveTab('metrics')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'metrics'
                ? 'bg-white text-gray-950 shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            الإحصائيات والأداء
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'products'
                ? 'bg-white text-gray-950 shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            المنتجات ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'categories'
                ? 'bg-white text-gray-950 shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            الأقسام والفرعيات ({categories.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'orders'
                ? 'bg-white text-gray-950 shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            الطلبات ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'users'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            👥 إدارة العملاء ({(customerAccounts || []).length})
          </button>
          <button
            onClick={() => setActiveTab('private-messages')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'private-messages'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            💬 رسائل العملاء الخاصة
          </button>
          <button
            onClick={() => setActiveTab('coupons')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'coupons'
                ? 'bg-white text-gray-950 shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            الكوبونات ({coupons.length})
          </button>
          <button
            onClick={() => setActiveTab('wallets')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'wallets'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            💳 محافظ الدفع ({(localWallets || []).length})
          </button>
          <button
            onClick={() => setActiveTab('geodata')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'geodata'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            🇾🇪 تعديل المحافظات ({yemeniGeodata.length})
          </button>
          <button
            onClick={() => setActiveTab('layout')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'layout'
                ? 'bg-navy text-gold shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            🎨 تخصيص المتجر
          </button>
          <button
            onClick={() => setActiveTab('ads')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'ads'
                ? 'bg-gold text-navy shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            📢 إدارة الإعلانات (Ads Manager)
          </button>
          <button
            onClick={() => setActiveTab('marketing')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'marketing'
                ? 'bg-gold text-navy shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            🚀 التسويق والـ SEO
          </button>
          <button
            onClick={() => {
              setNewAdminUser(adminUsername);
              setNewAdminPass(adminPassword);
              setActiveTab('settings');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'settings'
                ? 'bg-amber-650 text-amber-900 bg-amber-50 border-amber-200 shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            ⚙️ حساب المالك
          </button>
          <button
            onClick={() => {
              setIsLoggedIn(false);
              sessionStorage.removeItem('dukkan_admin_logged');
              onAdminLoginChange?.(false);
              setActiveTab('metrics');
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-all border border-transparent hover:border-rose-100"
          >
            تسجيل الخروج
          </button>
        </div>
      </div>

      {/* METRICS & OVERALL PERFORMANCE VIEW */}
      {activeTab === 'metrics' && (
        <div className="space-y-8 font-sans">
          
          {/* Interactive Filtering Dashboard Controls */}
          <div className="bg-linear-to-r from-navy to-navy-light p-6 rounded-3xl text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-white/5">
            <div>
              <h2 className="text-base font-black text-gradient-gold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-gold" /> مركز البيانات والإحصائيات التفاعلي
              </h2>
              <p className="text-xxs text-gray-305 mt-1 font-sans">تحكم بمدخلات ومخططات متجرك بنقرة واحدة واحصل على تحليلات دقيقة وفورية.</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {/* Time Range Selector */}
              <div className="flex bg-white/10 p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => setStatTimeRange('all')}
                  className={`px-3 py-1.5 rounded-lg text-xxs font-bold transition-all cursor-pointer ${
                    statTimeRange === 'all' ? 'bg-gold text-navy font-black shadow-sm' : 'text-gray-350 hover:text-white'
                  }`}
                >
                  الكل
                </button>
                <button
                  onClick={() => setStatTimeRange('30days')}
                  className={`px-3 py-1.5 rounded-lg text-xxs font-bold transition-all cursor-pointer ${
                    statTimeRange === '30days' ? 'bg-gold text-navy font-black shadow-sm' : 'text-gray-350 hover:text-white'
                  }`}
                >
                  آخر 30 يوم
                </button>
                <button
                  onClick={() => setStatTimeRange('7days')}
                  className={`px-3 py-1.5 rounded-lg text-xxs font-bold transition-all cursor-pointer ${
                    statTimeRange === '7days' ? 'bg-gold text-navy font-black shadow-sm' : 'text-gray-350 hover:text-white'
                  }`}
                >
                  آخر 7 أيام
                </button>
              </div>

              {/* Metric View Selector */}
              <div className="flex bg-white/10 p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => setStatMetric('sales')}
                  className={`px-3 py-1.5 rounded-lg text-xxs font-bold transition-all cursor-pointer ${
                    statMetric === 'sales' ? 'bg-white text-navy font-black shadow-sm' : 'text-gray-350 hover:text-white'
                  }`}
                >
                  المبيعات
                </button>
                <button
                  onClick={() => setStatMetric('orders')}
                  className={`px-3 py-1.5 rounded-lg text-xxs font-bold transition-all cursor-pointer ${
                    statMetric === 'orders' ? 'bg-white text-navy font-black shadow-sm' : 'text-gray-350 hover:text-white'
                  }`}
                >
                  الطلبات
                </button>

              </div>
            </div>
          </div>

          {/* Interactive KPI Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* KPI 1: Dynamic Sales */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs flex items-center justify-between hover:shadow-md transition-all group">
              <div>
                <span className="block text-xxs font-extrabold text-gray-400 font-sans uppercase mb-1 tracking-wider">المبيعات بالتصفية</span>
                <span className="text-2xl font-black text-navy font-mono">{interactiveSales.toFixed(2)}</span>
                <span className="text-xs font-bold text-gold font-display pr-1">ر.س</span>
                <p className="text-[9px] text-emerald-600 font-sans font-semibold mt-1">
                  {statTimeRange === 'all' ? 'لجميع الأوقات بالمتجر' : `خلال ${statTimeRange === '30days' ? '٣٠ يوماً' : '٧ أيام'}`}
                </p>
              </div>
              <div className="p-3 bg-gold/10 text-gold-dark rounded-2xl border border-gold/10 group-hover:scale-110 transition-transform">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>

            {/* KPI 2: Dynamic Orders */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs flex items-center justify-between hover:shadow-md transition-all group">
              <div>
                <span className="block text-xxs font-extrabold text-gray-400 font-sans uppercase mb-1 tracking-wider">عدد الطلبيات المفلترة</span>
                <span className="text-2xl font-black text-navy font-mono">{interactiveOrdersCount}</span>
                <span className="text-xs font-bold text-gray-400 font-sans pr-1">طلب</span>
                <p className="text-[9px] text-indigo-600 font-sans font-semibold mt-1">تداول مالي نشط بالمعدل</p>
              </div>
              <div className="p-3 bg-navy/5 text-navy rounded-2xl border border-navy/5 group-hover:scale-110 transition-transform">
                <ShoppingBag className="h-6 w-6" />
              </div>
            </div>

            {/* KPI 3: Registered Customers */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs flex items-center justify-between hover:shadow-md transition-all group">
              <div>
                <span className="block text-xxs font-extrabold text-gray-400 font-sans uppercase mb-1 tracking-wider">إجمالي العملاء المسجلين</span>
                <span className="text-2xl font-black text-amber-600 font-mono">{(customerAccounts || []).length}</span>
                <span className="text-xs font-bold text-gray-450 font-sans pr-1">حساب</span>
                <p className="text-[9px] text-amber-700 font-sans font-semibold mt-1">مشترك مالي مسجل بالمتجر</p>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100 group-hover:scale-110 transition-transform">
                <Users className="h-6 w-6" />
              </div>
            </div>

            {/* KPI 4: Active Coupons */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs flex items-center justify-between hover:shadow-md transition-all group">
              <div>
                <span className="block text-xxs font-extrabold text-gray-400 font-sans uppercase mb-1 tracking-wider">الكوبونات الملكية الفعالة</span>
                <span className="text-2xl font-black text-emerald-600 font-mono">{(coupons || []).length}</span>
                <span className="text-xs font-bold text-gray-450 font-sans pr-1">كوبون</span>
                <p className="text-[9px] text-emerald-700 font-sans font-semibold mt-1">عروض ترويجية نشطة حالياً</p>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 group-hover:scale-110 transition-transform">
                <BadgePercent className="h-6 w-6" />
              </div>
            </div>

          </div>

          {/* Interactive Charts and Timelines Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Chart 1: Interactive Temporal Trend Area Chart */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900 font-sans">
                    {statMetric === 'sales' && 'مخطط اتجاه المبيعات (ر.س)'}
                    {statMetric === 'orders' && 'مخطط ووتيرة الطلبيات (طلب)'}
                    {statMetric === 'points' && 'إحصائية استرداد واستهلاك نقاط الولاء'}
                  </h3>
                  <span className="text-[9px] font-black uppercase text-gold bg-gold/10 px-2 py-0.5 rounded-md font-sans">تفاعلي بالزمن</span>
                </div>
                <p className="text-xxs text-gray-450 font-sans mb-6">مخطط تفاعلي ديناميكي يعبر عن حيز النشاط لجميع الأيام المصنفة بالتاريخ.</p>
              </div>

              <div className="w-full h-72 -ml-4 pr-4">
                {timelineData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-10">
                    <CircleAlert className="h-8 w-8 text-gray-300 mb-2 animate-pulse" />
                    <p className="subtext text-xxs font-bold text-gray-400">لا توجد بيانات مخطط كافية لعرض الجدول الزمني الحالي.</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timelineData}>
                      <defs>
                        <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={statMetric === 'sales' ? '#d4af37' : statMetric === 'orders' ? '#312e81' : '#10b981'} stopOpacity={0.2}/>
                          <stop offset="95%" stopColor={statMetric === 'sales' ? '#d4af37' : statMetric === 'orders' ? '#312e81' : '#10b981'} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'monospace' }}
                        dy={8}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'monospace' }}
                        width={35}
                      />
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', backgroundColor: '#ffffff', fontFamily: 'sans-serif', fontSize: '11px', direction: 'rtl'}}
                        itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey={statMetric === 'sales' ? 'sales' : statMetric === 'orders' ? 'orders' : 'points'} 
                        name={statMetric === 'sales' ? 'المبيعات اليومية' : statMetric === 'orders' ? 'عدد العمليات' : 'النقاط المستهلكة'}
                        stroke={statMetric === 'sales' ? '#d4af37' : statMetric === 'orders' ? '#312e81' : '#10b981'} 
                        fillOpacity={1} 
                        fill="url(#colorMetric)"
                        strokeWidth={3} 
                        animationDuration={1200}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Chart 2: Category distribution Bar Chart with Interactive drill down trigger */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900 font-sans mb-1">توزيع المبيعات المالي حسب صنف المنتج</h3>
                <p className="text-xxs text-gray-400 font-sans mb-6">انقر على أي تصنيف لتحديث جدول مبيعات المنتجات بالأسفل تفاعلياً.</p>
              </div>

              <div className="w-full h-72 -ml-4 pr-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categories.map(cat => ({ 
                    name: cat.name, 
                    المبيعات: filteredOrdersByTime
                      .filter(o => o.status !== 'cancelled')
                      .reduce((sum, ord) => {
                        const catItemsSum = ord.items
                          .filter(item => item.product.category === cat.name)
                          .reduce((itemSum, item) => itemSum + (item.product.price * item.quantity), 0);
                        return sum + catItemsSum;
                      }, 0)
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'sans-serif' }}
                      dy={8}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'monospace' }}
                      width={35}
                    />
                    <RechartsTooltip 
                      cursor={{ fill: 'rgba(212, 175, 55, 0.05)' }}
                      contentStyle={{ borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', backgroundColor: '#ffffff', fontFamily: 'sans-serif', fontSize: '11px', direction: 'rtl'}}
                    />
                    <Bar 
                      dataKey="المبيعات" 
                      name="مبيعات القسم (ر.س)"
                      fill="#312e81" 
                      radius={[8, 8, 0, 0]}
                      barSize={24}
                      className="cursor-pointer"
                      onClick={(data) => {
                        if (data && data.name) {
                          setSelectedCategoryFilter(data.name === selectedCategoryFilter ? 'all' : data.name);
                        }
                      }}
                      animationDuration={1500}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Interactive Products Analytics & Deep Drill Down list */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Drilling Down Rank List Section */}
            <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 font-sans">قائمة المنتجات الأكثر مبيعاً بالتصفية</h3>
                  <p className="text-xxs text-gray-400 font-sans mt-0.5">ترتيب تنازلي لأكثر الأصناف تحقيقاً للأرباح بناءً على الفتلرة الزمنية وقسم المنتج.</p>
                </div>

                {/* Drilldown Category Picker */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xxs font-bold text-gray-400 font-sans ml-1">تصفية سريعة بالصنف:</span>
                  <button
                    onClick={() => setSelectedCategoryFilter('all')}
                    className={`px-3 py-1 rounded-full text-xxs font-bold transition-all cursor-pointer ${
                      selectedCategoryFilter === 'all'
                        ? 'bg-navy text-white font-black'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    الكل
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.name}
                      onClick={() => setSelectedCategoryFilter(cat.name)}
                      className={`px-3 py-1 rounded-full text-xxs font-bold transition-all cursor-pointer ${
                        selectedCategoryFilter === cat.name
                          ? 'bg-gold text-navy font-black'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {productAnalytics.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Package className="h-12 w-12 text-gray-200 mb-2 animate-bounce" />
                  <p className="text-xs font-bold text-gray-400">لا توجد بيانات مبيعات للمنتجات في هذا الاختيار.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 text-xxs font-bold text-gray-400 uppercase tracking-wider">
                        <th className="pb-3 pt-1">المنتج</th>
                        <th className="pb-3 pt-1 text-center">تصنيف الصنف</th>
                        <th className="pb-3 pt-1 text-center">الوحدات المباعة</th>
                        <th className="pb-3 pt-1 text-left">إجمالي الإيرادات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {productAnalytics.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                          <td className="py-3 flex items-center gap-3">
                            <img 
                              src={item.image} 
                              alt={item.name} 
                              className="h-10 w-10 object-cover rounded-xl border border-gray-100 shadow-xxs"
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <p className="text-xs font-bold text-navy group-hover:text-gold-dark transition-colors">{item.name}</p>
                              <p className="text-xxs text-gray-450 font-mono">ID: {item.id}</p>
                            </div>
                          </td>
                          <td className="py-3 text-center">
                            <span className="inline-block text-xxs px-2.5 py-0.5 rounded-full bg-navy/5 text-navy font-bold">{item.category}</span>
                          </td>
                          <td className="py-3 text-center">
                            <span className="text-xs font-mono font-black text-gray-900">{item.unitsSold} حبة</span>
                          </td>
                          <td className="py-3 text-left">
                            <span className="text-xs font-mono font-black text-gold-dark">{item.totalRev.toFixed(2)} ر.س</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Recent Orders timeline list */}
            <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col">
              <div>
                <h3 className="text-sm font-bold text-gray-900 font-sans mb-1">آخر الطلبيات والنشاط</h3>
                <p className="text-xxs text-gray-400 font-sans mb-4">نشاطات المشتريات الأخيرة المسجلة بالتصفية الزمنية.</p>
              </div>

              {filteredOrdersByTime.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 py-8 text-center">
                  <CircleAlert className="h-10 w-10 text-gray-300 mb-2" />
                  <p className="text-xs text-gray-400 font-sans font-semibold">لم تسجل طلبيات في هذا النطاق الزمني.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50 overflow-y-auto max-h-96 pr-2 custom-scrollbar">
                  {filteredOrdersByTime.slice().reverse().map((order) => (
                    <div key={order.id} className="py-3 flex justify-between items-center hover:bg-gray-50/50 rounded-xl px-1.5 transition-colors">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <span className="w-8 h-8 rounded-full bg-amber-50 text-amber-850 text-xxs font-bold flex items-center justify-center font-mono border border-amber-100 select-none">
                          {order.items.reduce((sum, i) => sum + i.quantity, 0)}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-gray-800 font-sans leading-tight">{order.customerName}</p>
                          <p className="text-xxs text-gray-400 font-mono mt-0.5">{order.id} ● {order.createdAt}</p>
                        </div>
                      </div>

                      <div className="text-left">
                        <span className="block text-xs font-bold text-amber-900 font-mono tracking-tight">{order.totalPrice.toFixed(2)} ر.س</span>
                        {order.pointsUsed && order.pointsUsed > 0 ? (
                          <span className="block text-[8px] font-black text-amber-600 font-sans mt-0.5">🪙 استخدم {order.pointsUsed} نقطة</span>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* CATEGORIES & SUBCATEGORIES MANAGEMENT VIEW */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-sans">
          {/* Add Category Form */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-gray-100 shadow-xs">
            <h2 className="text-sm font-bold text-gray-900 mb-4 font-sans">إضافة تصنيف أو قسم جديد</h2>
            
            <div className="space-y-4">
              {/* Type selector: Add main category or Sub category */}
              <div>
                <label className="block text-xxs font-bold text-gray-400 mb-1.5 uppercase font-sans">نوع القسم الجديد</label>
                <div className="grid grid-cols-2 gap-2 bg-gray-50 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setAddCategoryType('main')}
                    className={`py-1.5 rounded-lg text-xxs font-bold transition-all ${
                      addCategoryType === 'main'
                        ? 'bg-white text-gray-900 shadow-xxs font-black border border-gray-100'
                        : 'text-gray-400 hover:text-gray-800'
                    }`}
                  >
                    قسم رئيسي
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddCategoryType('sub')}
                    className={`py-1.5 rounded-lg text-xxs font-bold transition-all ${
                      addCategoryType === 'sub'
                        ? 'bg-white text-gray-900 shadow-xxs font-black border border-gray-100'
                        : 'text-gray-400 hover:text-gray-800'
                    }`}
                  >
                    قسم فرعي
                  </button>
                </div>
              </div>

              {addCategoryType === 'main' ? (
                <div>
                  <label className="block text-xxs font-bold text-gray-400 mb-1.5 uppercase font-sans">اسم القسم الرئيسي الجديد</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: أحذية وملحقات رياضية"
                    value={newMainCatName}
                    onChange={(e) => setNewMainCatName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-850 focus:outline-hidden focus:border-amber-500 font-sans"
                  />
                  <button
                    type="button"
                    onClick={handleAddMainCategory}
                    className="w-full mt-3 py-2.5 bg-gray-950 hover:bg-gray-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer font-sans"
                  >
                    إضافة القسم الرئيسي
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xxs font-bold text-gray-400 mb-1.5 uppercase font-sans">اختر القسم الرئيسي المتبوع له</label>
                    <select
                      value={selectedMainCatForSub}
                      onChange={(e) => setSelectedMainCatForSub(e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-850 focus:outline-hidden font-sans"
                    >
                      <option value="">-- اختر قسم رئيسي --</option>
                      {categories.map(c => (
                        <option key={c.name} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xxs font-bold text-gray-400 mb-1.5 uppercase font-sans">اسم القسم الفرعي الجديد</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: أحذية أديداس، كنزات قطنية"
                      value={newSubCatName}
                      onChange={(e) => setNewSubCatName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-850 focus:outline-hidden focus:border-amber-500 font-sans"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSubCategory}
                    className="w-full py-2.5 bg-gray-950 hover:bg-gray-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer font-sans"
                  >
                    ربط وإضافة القسم الفرعي
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* List Categories Tree */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-gray-100 shadow-xs">
            <h2 className="text-sm font-bold text-gray-900 border-b border-gray-50 pb-3 mb-4 font-sans">هيكلية الأقسام والفرعيات الحالية</h2>
            <div className="space-y-4 divide-y divide-gray-50">
              {categories.map((cat) => (
                <div key={cat.name} className="pt-4 first:pt-0">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-black text-gray-950 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-lg font-sans">
                      {cat.name}
                    </span>
                    <button
                      onClick={() => {
                        if (window.confirm(`هل أنت متأكد من حذف القسم الرئيسي "${cat.name}" وجميع أقسامه الفرعية؟`)) {
                          setCategories(prev => prev.filter(c => c.name !== cat.name));
                        }
                      }}
                      className="text-xxs font-bold text-rose-500 hover:text-rose-700 hover:underline font-sans"
                    >
                      حذف الرئيسي
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 py-2 pr-3">
                    {cat.subcategories.length === 0 ? (
                      <span className="text-[10px] font-medium text-gray-400 italic font-sans animate-pulse">لا توجد أقسام فرعية حالياً.</span>
                    ) : (
                      cat.subcategories.map((sub) => (
                        <span key={sub} className="inline-flex items-center space-x-1 space-x-reverse bg-gray-50 border border-gray-150 px-2 py-0.5 rounded-lg text-xxs text-gray-650 group font-sans">
                          <span>{sub}</span>
                          <button
                            onClick={() => {
                              if (window.confirm(`هل أنت متأكد من حذف القسم الفرعي "${sub}"؟`)) {
                                setCategories(prev => prev.map(c => {
                                  if (c.name === cat.name) {
                                    return {
                                      ...c,
                                      subcategories: c.subcategories.filter(s => s !== sub)
                                    };
                                  }
                                  return c;
                                }));
                              }
                            }}
                            className="text-gray-400 hover:text-rose-600 font-bold pr-1 text-xxs leading-none cursor-pointer"
                          >
                            ×
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PRODUCTS MANAGEMENT VIEW */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
          
          <div className="p-5 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            <div className="relative w-full sm:max-w-xs">
              <input
                type="text"
                placeholder="ابحث عن المنتجات بالاسم أو القسم..."
                value={searchProductQuery}
                onChange={(e) => setSearchProductQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-2 bg-gray-50 border border-gray-100 focus:border-amber-500 rounded-xl focus:outline-hidden text-xs text-gray-850 transition-colors text-right font-semibold"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>

            <div className="flex gap-2">
              <label className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-xs rounded-xl flex items-center space-x-1.5 space-x-reverse cursor-pointer shadow-xs border border-gray-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                <span>استيراد CSV</span>
                <input type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />
              </label>

              <button
                onClick={handleOpenCreate}
                className="px-4 py-2 bg-gray-950 hover:bg-gray-800 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 space-x-reverse cursor-pointer shadow-xs"
              >
                <Plus className="h-4 w-4" />
                <span>إضافة منتج جديد</span>
              </button>
            </div>
          </div>

          {/* Products Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-400 text-xxs font-bold uppercase tracking-wider border-b border-gray-150">
                  <th className="p-4 font-sans">المنتج</th>
                  <th className="p-4 font-sans">القسم</th>
                  <th className="p-4 font-sans">السعر</th>
                  <th className="p-4 font-sans">المخزون (الكمية)</th>
                  <th className="p-4 font-sans">التقييم</th>
                  <th className="p-4 text-center font-sans">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50">
                    <td className="p-4 font-sans text-right">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        {p.image && <img src={p.image} alt={p.name} className="h-10 w-10 object-cover rounded-xl bg-gray-100 border border-gray-50" referrerPolicy="no-referrer" />}
                        <div>
                          <div className="flex items-center gap-1.5 justify-start">
                            <p className="font-bold text-gray-900 text-right">{p.name}</p>
                            {p.code && (
                              <span className="text-[9px] font-mono leading-none font-bold bg-amber-55 text-amber-900 border border-amber-150 px-1 py-0.5 rounded">
                                {p.code}
                              </span>
                            )}
                          </div>
                          <p className="text-xxs text-gray-400 font-sans truncate max-w-xs text-right">{p.description}</p>
                          {p.sizes && p.sizes.length > 0 && (
                            <div className="flex gap-1 items-center mt-1 flex-wrap justify-start">
                              <span className="text-[9px] text-gray-400 font-bold col-span-full">المقاسات:</span>
                              {p.sizes.map(sz => {
                                const q = p.sizeStock?.[sz] ?? 0;
                                return (
                                  <span key={sz} className="text-[9px] bg-amber-50 text-amber-900 border border-amber-150 px-1.5 py-0.2 rounded font-mono font-bold">
                                    {sz} ({q <= 0 ? 'نفذت' : `${q} متوفر`})
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-sans text-right">
                      <div className="flex flex-col gap-0.5 items-start">
                        <span className="bg-amber-50 text-amber-805 border border-amber-100 px-2.5 py-0.5 rounded-md font-bold text-xxs block w-max">{p.category}</span>
                        {p.subCategory && (
                          <span className="bg-gray-100 text-gray-600 border border-gray-150 px-1.5 py-0.2 rounded text-[10px] uppercase font-semibold block w-max mt-0.5">{p.subCategory}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 font-mono font-bold text-gray-950 text-right">{p.price} ر.س</td>
                    <td className="p-4 text-right">
                      <span className={`font-mono font-semibold ${p.stock <= 0 ? 'text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded' : 'text-gray-801'}`}>
                        {p.stock <= 0 ? 'نفذت الكمية الكلية' : `${p.stock} حبة`}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-amber-700 text-right">★ {p.rating}</td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center space-x-2 space-x-reverse">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1 px-2.5 bg-gray-55 hover:bg-amber-50 text-gray-650 hover:text-amber-700 border border-gray-150 rounded-lg font-bold text-xxs transition-colors font-sans cursor-pointer"
                        >
                          تعديل
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('هل أنت متأكد من رغبتك في حذف هذا المنتج نهائياً من المتجر؟')) {
                              onDeleteProduct(p.id);
                            }
                          }}
                          className="p-1.5 text-rose-600 hover:bg-rose-55 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}


      {/* ORDERS TRACKING AND CHANGING STATUS VIEW */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-gray-50">
            <h2 className="text-sm font-bold text-gray-900 font-sans">إدارة طلبات المشتريات</h2>
            <p className="text-xxs text-gray-400 font-sans">اضغط على زر التحكم أو المشاهدة للمتابعة وتغيير حالة التوصيل الفورية.</p>
          </div>

          <div className="overflow-x-auto font-sans">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-400 text-xxs font-bold uppercase tracking-wider border-b border-gray-150">
                  <th className="p-4">معرّف الطلب</th>
                  <th className="p-4">العميل</th>
                  <th className="p-4">السلع</th>
                  <th className="p-4">الإجمالي</th>
                  <th className="p-4">الحالة الفورية</th>
                  <th className="p-4 text-center">الإجراء والتحكم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                {orders.slice().reverse().map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50/50">
                    <td className="p-4 font-mono font-bold text-amber-900">{o.id}</td>
                    <td className="p-4">
                      <div>
                        <p className="font-bold text-gray-900">{o.customerName}</p>
                        <p className="text-xxs text-gray-400 font-mono">{o.customerPhone}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-gray-700">
                        {o.items.reduce((sum, i) => sum + i.quantity, 0)} قطع
                      </span>
                    </td>
                    <td className="p-4 font-mono font-bold text-gray-800">{o.totalPrice.toFixed(2)} ر.س</td>
                    <td className="p-4">
                      <span className={`inline-block text-xxs px-2.5 py-1 rounded-full font-bold border ${
                        o.status === 'pending' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                        o.status === 'processing' ? 'bg-indigo-50 text-indigo-800 border-indigo-200' :
                        o.status === 'shipped' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                        o.status === 'delivered' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                        'bg-rose-50 text-rose-850 border-rose-200'
                      }`}>
                        {o.status === 'pending' ? 'انتظار الموافقة' :
                         o.status === 'processing' ? 'قيد التجهيز' :
                         o.status === 'shipped' ? 'جاري الشحن' :
                         o.status === 'delivered' ? 'تم التوصيل' : 'ملغي'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center space-x-2 space-x-reverse">
                        <button
                          onClick={() => setViewingOrder(o)}
                          className="p-1 px-2.5 bg-gray-50 hover:bg-gray-100 text-gray-750 border border-gray-150 rounded-lg text-xxs font-bold inline-flex items-center space-x-1 space-x-reverse"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>تفاصيل</span>
                        </button>

                        <select
                          value={o.status}
                          onChange={(e) => onUpdateOrderStatus(o.id, e.target.value as Order['status'])}
                          className="bg-gray-55 text-xxs border border-gray-150 rounded-lg px-2 py-1 font-bold text-gray-600 focus:outline-hidden"
                        >
                          <option value="pending">معلق</option>
                          <option value="processing">تجهيز</option>
                          <option value="shipped">مشحون</option>
                          <option value="delivered">مكتمل</option>
                          <option value="cancelled">ملغي</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DISCOUNT COUPONS ADMINISTRATION VIEW */}
      {activeTab === 'coupons' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Create Coupon Input form */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-gray-100 shadow-xs">
            <h2 className="text-sm font-bold text-gray-900 mb-4 font-sans">إصدار كوبون جديد</h2>
            
            <form onSubmit={handleSaveCoupon} className="space-y-4">
              <div>
                <label className="block text-xxs font-bold text-gray-400 font-mono mb-1.5 uppercase">رمز الكوبون</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: SAVE30"
                  value={copCode}
                  onChange={(e) => setCopCode(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-mono text-gray-800 uppercase focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xxs font-bold text-gray-400 font-mono mb-1.5 uppercase">النوع</label>
                  <select
                    value={copType}
                    onChange={(e) => setCopType(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-800 focus:outline-hidden focus:border-amber-500 font-sans"
                  >
                    <option value="percentage">نسبة مئوية (%)</option>
                    <option value="fixed">مبلغ ثابت (ر.س)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xxs font-bold text-gray-400 font-mono mb-1.5 uppercase">قيمة الخصم</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={copValue}
                    onChange={(e) => setCopValue(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-850 font-mono focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xxs font-bold text-gray-400 font-mono mb-1.5 uppercase">الحد الأدنى للإنفاق (اختياري)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="اتركه فارغاً أو صفر"
                  value={copMinSpend}
                  onChange={(e) => setCopMinSpend(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-mono text-gray-800 focus:outline-hidden"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gray-950 hover:bg-gray-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer transform hover:-translate-y-0.5"
              >
                تفعيل وإصدار الكوبون الفوري
              </button>
            </form>
          </div>

          {/* Active Coupons table */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-gray-100 shadow-xs">
            <h2 className="text-sm font-bold text-gray-900 border-b border-gray-50 pb-3 mb-4 font-sans">الكوبونات النشطة والفعّالة</h2>

            <div className="divide-y divide-gray-100 font-sans">
              {coupons.map((c) => (
                <div key={c.code} className="py-3.5 flex items-center justify-between">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="p-2 bg-amber-50 rounded-xl border border-amber-100 text-amber-800">
                      <BadgePercent className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900 font-mono">{c.code}</p>
                      <p className="text-xxs text-gray-400">
                        {c.discountType === 'percentage' ? `خصم مئوي بنسبة ${c.discountValue}%` : `خصم ثابت بقيمة ${c.discountValue} ر.س`}
                        {c.minSpend && c.minSpend > 0 ? ` ● الحد الأدنى للإنفاق: ${c.minSpend} ر.س` : ''}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => onDeleteCoupon(c.code)}
                    className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* WALLETS MANAGEMENT TAB */}
      {activeTab === 'wallets' && (
        <div className="space-y-6 text-right font-sans mx-auto w-full">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs flex justify-between items-center">
            <div>
              <h2 className="text-lg font-black text-gray-900 border-b border-gray-100 py-3 flex items-center gap-2">
                <Wallet className="h-5 w-5 text-amber-600" />
                <span>محافظ الدفع المحلية</span>
              </h2>
              <p className="text-xxs text-gray-400 font-sans mt-2">قم بإضافة وتعديل بيانات محافظ الدفع واسم الحساب لتمكين العملاء من الدفع محلياً.</p>
            </div>
            <button
              onClick={() => {
                if (setLocalWallets) {
                  setLocalWallets(prev => [...prev, { id: 'w' + Date.now(), name: 'محفظة جديدة', accountNumber: '', isActive: true }]);
                }
              }}
              className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors text-xs font-bold shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>إضافة محفظة</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {(localWallets || []).map((wallet) => (
              <div key={wallet.id} className={`bg-white rounded-2xl p-6 border ${wallet.isActive ? 'border-amber-200 shadow-md relative overflow-hidden' : 'border-gray-200 bg-gray-50 opacity-75'}`}>
                {wallet.isActive && <div className="absolute top-0 right-0 w-1.5 h-full bg-amber-500 rounded-r-2xl"></div>}
                
                <div className="space-y-4 pr-3">
                  <div>
                    <label className="block text-xxs font-bold text-gray-500 mb-1">اسم المحفظة / الخدمة</label>
                    <input 
                      type="text" 
                      value={wallet.name}
                      onChange={(e) => {
                        if (setLocalWallets) {
                          setLocalWallets(prev => prev.map(w => w.id === wallet.id ? { ...w, name: e.target.value } : w));
                        }
                      }}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 focus:border-amber-400 rounded-lg text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xxs font-bold text-gray-500 mb-1">رقم الحساب / الجوال</label>
                    <input 
                      type="text" 
                      value={wallet.accountNumber}
                      onChange={(e) => {
                        if (setLocalWallets) {
                          setLocalWallets(prev => prev.map(w => w.id === wallet.id ? { ...w, accountNumber: e.target.value } : w));
                        }
                      }}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 focus:border-amber-400 rounded-lg text-xs font-mono font-bold"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <label className="flex items-center space-x-2 space-x-reverse cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={wallet.isActive}
                        onChange={(e) => {
                          if (setLocalWallets) {
                            setLocalWallets(prev => prev.map(w => w.id === wallet.id ? { ...w, isActive: e.target.checked } : w));
                          }
                        }}
                        className="rounded border-gray-300 text-amber-600 focus:ring-amber-500 w-4 h-4"
                      />
                      <span className="text-xs font-bold text-gray-700">مفعلة للسداد للعملاء</span>
                    </label>

                    <button 
                      onClick={() => {
                        if (setLocalWallets) {
                          setLocalWallets(prev => prev.filter(w => w.id !== wallet.id));
                        }
                      }}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                      title="حذف المحفظة"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* YEMENI GEODATA ADDD/EDIT MANAGEMENT TAB */}
      {activeTab === 'geodata' && (
        <div className="space-y-6 text-right font-sans max-w-5xl mx-auto">
          
          <div className="bg-white rounded-2xl p-6 border border-gray-150 shadow-xs">
            <h2 className="text-sm font-black text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
              <Map className="h-5 w-5 text-amber-600" />
              <span>إضافة محافظة يمنية جديدة ومخصصة 🇾🇪</span>
            </h2>
            <p className="text-xxs text-gray-400 mt-1">تتيح لك هذه اللوحة إضافة أي محافظة يمنية جديدة مع تحديد مديرياتها وشوارعها لتظهر فوراً للعملاء في صفحة الشحن.</p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!addGovName.trim()) {
                  alert('الرجاء إدخال اسم المحافظة!');
                  return;
                }
                const cleanId = 'gov_' + Date.now();
                const distList = addGovDistricts.split(',').map(d => d.trim()).filter(Boolean);
                const streetList = addGovStreets.split(',').map(s => s.trim()).filter(Boolean);

                const newGov: GovernorateData = {
                  id: cleanId,
                  name: addGovName.trim(),
                  districts: distList.length ? distList : ['المركز الرئيسي'],
                  streets: streetList.length ? [...streetList, 'أخرى (كتابة شارع مخصص)'] : ['شارع عام الرئيسي', 'أخرى (كتابة شارع مخصص)']
                };

                setYemeniGeodata(prev => [...prev, newGov]);
                setAddGovName('');
                setAddGovDistricts('');
                setAddGovStreets('');
                alert('تم إضافة المحافظة الجديدة لقائمة الشحن بنجاح! 🎉');
              }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4"
            >
              <div className="space-y-1">
                <label className="block text-xxs font-bold text-gray-500">اسم المحافظة أو النطاق الجديد *</label>
                <input
                  type="text"
                  required
                  value={addGovName}
                  onChange={(e) => setAddGovName(e.target.value)}
                  placeholder="مثال: محافظة المهرة الحرة"
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-250 rounded-xl text-xs text-gray-800 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xxs font-bold text-gray-500">المديريات (افصل بينها بفاصلة كوما ,) *</label>
                <input
                  type="text"
                  required
                  value={addGovDistricts}
                  onChange={(e) => setAddGovDistricts(e.target.value)}
                  placeholder="مثال: الغيضة, حوف, شحن, قشن"
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-250 rounded-xl text-xs text-gray-850 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xxs font-bold text-gray-500">الشوارع/الأحياء (افصل بينها بفاصلة ,) *</label>
                <input
                  type="text"
                  required
                  value={addGovStreets}
                  onChange={(e) => setAddGovStreets(e.target.value)}
                  placeholder="مثال: الشارع العام, حي السوق, جولة المطار"
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-250 rounded-xl text-xs text-gray-850 focus:outline-hidden"
                />
              </div>

              <div className="md:col-span-3 flex justify-end pt-2">
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>تثبيت المحافظة الجديدة فوراً لقائمة الشحن والعملاء 🇾🇪</span>
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-150 shadow-xs">
            <h2 className="text-sm font-black text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-amber-600" />
              <span>قائمة المحافظات والمديريات الحالية والتحكم السريع ({yemeniGeodata.length} محافظات يمنية)</span>
            </h2>

            <div className="grid grid-cols-1 gap-4">
              {yemeniGeodata.map((gov) => {
                const isEditing = editingGovId === gov.id;
                return (
                  <div key={gov.id} className="border border-gray-100 bg-gray-50/50 p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all hover:bg-gray-50">
                    {isEditing ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
                        <div className="space-y-1">
                          <label className="block text-[10px] text-gray-400 font-bold">اسم المحافظة</label>
                          <input
                            type="text"
                            value={editingGovName}
                            onChange={(e) => setEditingGovName(e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] text-gray-400 font-bold">المديريات (فاصلة ,)</label>
                          <input
                            type="text"
                            value={editingGovDistricts}
                            onChange={(e) => setEditingGovDistricts(e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] text-gray-400 font-bold">الشوارع (فاصلة ,)</label>
                          <input
                            type="text"
                            value={editingGovStreets}
                            onChange={(e) => setEditingGovStreets(e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                          />
                        </div>

                        <div className="md:col-span-3 flex justify-end gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (!editingGovName.trim()) {
                                alert('الاسم مطلوب!');
                                return;
                              }
                              const dists = editingGovDistricts.split(',').map(d => d.trim()).filter(Boolean);
                              const strs = editingGovStreets.split(',').map(s => s.trim()).filter(Boolean);

                              setYemeniGeodata(prev => prev.map(item => item.id === gov.id ? {
                                ...item,
                                name: editingGovName.trim(),
                                districts: dists.length ? dists : item.districts,
                                streets: strs.length ? strs : item.streets
                              } : item));

                              setEditingGovId(null);
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xxs font-bold px-3 py-1.5 rounded-lg cursor-pointer"
                          >
                            تعديل وحفظ التغييرات 💾
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingGovId(null)}
                            className="bg-gray-300 hover:bg-gray-400 text-gray-700 text-xxs font-bold px-3 py-1.5 rounded-lg cursor-pointer"
                          >
                            إلغاء
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-1.5 flex-1">
                          <h3 className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                            <span className="text-amber-600">🇾🇪</span>
                            <span>{gov.name}</span>
                          </h3>
                          <div className="text-xxs text-gray-500 leading-relaxed space-y-1 font-sans">
                            <p><strong>المديريات المشمولة:</strong> {gov.districts.join(' ، ')}</p>
                            <p><strong>الشوارع أو الأحياء الرئيسية:</strong> {gov.streets.join(' ، ')}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingGovId(gov.id);
                              setEditingGovName(gov.name);
                              setEditingGovDistricts(gov.districts.join(', '));
                              setEditingGovStreets(gov.streets.join(', '));
                            }}
                            className="p-1 px-3 bg-white hover:bg-amber-50 text-amber-800 border border-gray-200 hover:border-amber-400 text-xxs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Edit className="h-3.5 w-3.5" />
                            <span>تعديل سريع</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (yemeniGeodata.length <= 1) {
                                alert('لا يمكنك حذف جميع المحافظات، يرجى إبقاء محافظة واحدة على الأقل!');
                                return;
                              }
                              if (window.confirm(`هل أنت متأكد من رغبتك في حذف محافظة (${gov.name}) نهائياً من المتجر؟`)) {
                                setYemeniGeodata(prev => prev.filter(item => item.id !== gov.id));
                              }
                            }}
                            className="p-1 px-3 bg-white hover:bg-rose-50 text-rose-600 border border-gray-200 hover:border-rose-300 text-xxs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>حذف</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* USERS MANAGEMENT TAB */}
      {activeTab === 'users' && customerAccounts && setCustomerAccounts && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 text-right font-sans"
        >
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <Users className="h-5 w-5 text-amber-600" />
                  إدارة عملاء المتجر
                </h2>
                <p className="text-xs text-gray-500 mt-1">كافة الحسابات المسجلة للعملاء، يمكنك الاطلاع عليها أو حذفها عند الحاجة.</p>
              </div>
              <div className="bg-amber-50 text-amber-700 px-3 py-1 rounded-lg text-xxs font-bold border border-amber-100">
                إجمالي المسجلين: {customerAccounts?.length || 0}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="bg-gray-50 text-gray-500 text-xxs uppercase font-black tracking-wider">
                  <tr>
                    <th className="px-6 py-4">اسم العميل</th>
                    <th className="px-6 py-4">رقم الهاتف</th>
                    <th className="px-6 py-4">كلمة المرور</th>
                    <th className="px-6 py-4 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {customerAccounts && customerAccounts.length > 0 ? (
                    customerAccounts.map((account, index) => (
                      <tr key={account.phone} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-gray-900">{account.name}</td>
                        <td className="px-6 py-4 font-mono text-gray-600" dir="ltr">{account.phone}</td>
                        <td className="px-6 py-4 font-mono text-gray-400">••••••••</td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-2">
                            <button 
                              onClick={() => {
                                setGiftingAccount(account);
                                setGiftType('points');
                                setGiftPoints('');
                                setGiftProduct('');
                                setGiftSuccessMsg(null);
                              }}
                              className="p-2 text-gold hover:bg-gold/5 rounded-lg transition-colors border border-transparent hover:border-gold/20"
                              title="إهداء نقاط أو منتجات"
                            >
                              <Sparkles className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => setDeletingAccount(account)}
                              className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                              title="حذف الحساب"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                        <div className="flex flex-col items-center">
                          <Users className="h-12 w-12 opacity-10 mb-2" />
                          <p>لا يوجد عملاء مسجلون حالياً في المتجر.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* PRIVATE MESSAGES TAB */}
      {activeTab === 'private-messages' && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 text-right font-sans"
        >
          <CustomerMessages 
            currentUser={null}
            customerAccounts={customerAccounts || []}
            isAdmin={true}
            embedInDashboard={true}
          />
        </motion.div>
      )}

      {/* STORE LAYOUT CUSTOMIZATION TAB */}
      {activeTab === 'layout' && siteSettings && setSiteSettings && (
        <div className="space-y-6 text-right font-sans mx-auto max-w-4xl">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs">
            <h2 className="text-lg font-black text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-600" />
              <span>تخصيص واجهة المتجر والنصوص</span>
            </h2>
            <p className="text-xxs text-gray-400 font-sans mt-2">تعديل المسميات والعناوين التي تظهر للعملاء في الصفحة الرئيسية.</p>
            
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">الشعار (Logo) - رابط أو رفع ملف</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={siteSettings.logoUrl}
                      onChange={(e) => setSiteSettings({ ...siteSettings, logoUrl: e.target.value })}
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:border-amber-400 focus:outline-hidden text-sm font-mono"
                      dir="ltr"
                      placeholder="https://..."
                    />
                    <label className="flex items-center justify-center p-2 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer transition-colors text-gray-600">
                      <Upload className="h-4 w-4" />
                      <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                    </label>
                  </div>
                  {siteSettings.logoUrl && (
                    <div className="mt-2 p-2 bg-gray-50 rounded-lg flex items-center justify-between border border-dashed border-gray-200">
                      <img src={siteSettings.logoUrl} alt="Logo Preview" className="h-10 object-contain" />
                      <button 
                        onClick={() => setSiteSettings({ ...siteSettings, logoUrl: '' })}
                        className="p-1 text-gray-400 hover:text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">الأيقونة (Icon) - رابط أو رفع ملف</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={siteSettings.iconUrl}
                      onChange={(e) => setSiteSettings({ ...siteSettings, iconUrl: e.target.value })}
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:border-amber-400 focus:outline-hidden text-sm font-mono"
                      dir="ltr"
                      placeholder="https://..."
                    />
                    <label className="flex items-center justify-center p-2 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer transition-colors text-gray-600">
                      <Upload className="h-4 w-4" />
                      <input type="file" className="hidden" accept="image/*" onChange={handleIconUpload} />
                    </label>
                  </div>
                  {siteSettings.iconUrl && (
                    <div className="mt-2 p-2 bg-gray-50 rounded-lg flex items-center justify-between border border-dashed border-gray-200">
                      <img src={siteSettings.iconUrl} alt="Icon Preview" className="h-10 w-10 object-contain rounded-full" />
                      <button 
                        onClick={() => setSiteSettings({ ...siteSettings, iconUrl: '' })}
                        className="p-1 text-gray-400 hover:text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">اسم المتجر العام (الشريط العلوي)</label>
                <input 
                  type="text" 
                  value={siteSettings.storeName}
                  onChange={(e) => setSiteSettings({ ...siteSettings, storeName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-amber-400 focus:outline-hidden text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">الجملة الترويجية الصغيرة (فوق العنوان الرئيسي)</label>
                <input 
                  type="text" 
                  value={siteSettings.heroBadge}
                  onChange={(e) => setSiteSettings({ ...siteSettings, heroBadge: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-amber-400 focus:outline-hidden text-sm"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">العنوان الرئيسي البارز</label>
                <textarea 
                  value={siteSettings.heroTitle}
                  onChange={(e) => setSiteSettings({ ...siteSettings, heroTitle: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-amber-400 focus:outline-hidden text-sm resize-none"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">الوصف الفرعي (تحت العنوان الرئيسي)</label>
                <textarea 
                  value={siteSettings.heroSubtitle}
                  onChange={(e) => setSiteSettings({ ...siteSettings, heroSubtitle: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-amber-400 focus:outline-hidden text-sm resize-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">قصة المتجر (من نحن)</label>
                <textarea 
                  value={siteSettings.aboutUs}
                  onChange={(e) => setSiteSettings({ ...siteSettings, aboutUs: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-amber-400 focus:outline-hidden text-sm resize-none"
                  rows={4}
                />
              </div>

              <hr className="my-6 border-gray-100" />

              <h3 className="font-bold text-gray-800 mb-3 text-sm flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-amber-500" /> معلومات التواصل والدعم
              </h3>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">وصف قسم التواصل</label>
                <textarea 
                  value={siteSettings.contactDescription}
                  onChange={(e) => setSiteSettings({ ...siteSettings, contactDescription: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-amber-400 focus:outline-hidden text-sm resize-none"
                  rows={3}
                />
              </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">رقم الهاتف (للعرض)</label>
                  <input 
                    type="text" 
                    value={siteSettings.contactPhone}
                    onChange={(e) => setSiteSettings({ ...siteSettings, contactPhone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-amber-400 focus:outline-hidden text-sm font-mono text-left"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">رقم الواتساب (لفتح المحادثة، بدون مسافات)</label>
                  <input 
                    type="text" 
                    value={siteSettings.contactWhatsApp}
                    onChange={(e) => setSiteSettings({ ...siteSettings, contactWhatsApp: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-amber-400 focus:outline-hidden text-sm font-mono text-left"
                    dir="ltr"
                    placeholder="ex: 967774919194"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <h3 className="font-bold text-gray-800 mb-3 text-sm flex items-center gap-2">
                   تذييل الصفحة (Footer) والمعلومات العامة
                </h3>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">عنوان المقر أو التواجد</label>
                <input 
                  type="text" 
                  value={siteSettings.footerAddress}
                  onChange={(e) => setSiteSettings({ ...siteSettings, footerAddress: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-amber-400 focus:outline-hidden text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">البريد الإلكتروني للدعم</label>
                  <input 
                    type="email" 
                    value={siteSettings.footerEmail}
                    onChange={(e) => setSiteSettings({ ...siteSettings, footerEmail: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-amber-400 focus:outline-hidden text-sm font-mono"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">ساعات العمل والخدمة</label>
                  <input 
                    type="text" 
                    value={siteSettings.supportHours}
                    onChange={(e) => setSiteSettings({ ...siteSettings, supportHours: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-amber-400 focus:outline-hidden text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">شعار حماية الجرد (نص صغير)</label>
                  <input 
                    type="text" 
                    value={siteSettings.inventoryTagline}
                    onChange={(e) => setSiteSettings({ ...siteSettings, inventoryTagline: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-amber-400 focus:outline-hidden text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">وصف نظام التحكم (تحت الشعار)</label>
                  <input 
                    type="text" 
                    value={siteSettings.inventorySubtitle}
                    onChange={(e) => setSiteSettings({ ...siteSettings, inventorySubtitle: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-amber-400 focus:outline-hidden text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">حقوق الطبع والنشر</label>
                <input 
                  type="text" 
                  value={siteSettings.copyrightText}
                  onChange={(e) => setSiteSettings({ ...siteSettings, copyrightText: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-amber-400 focus:outline-hidden text-sm"
                />
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ADS MANAGEMENT TAB */}
      {activeTab === 'ads' && siteSettings && setSiteSettings && (
        <motion.div
           initial={{ opacity: 0, scale: 0.98 }}
           animate={{ opacity: 1, scale: 1 }}
           className="space-y-6 text-right font-sans"
        >
          <div className="bg-white rounded-3xl p-8 border border-gold/10 shadow-2xl">
            <div className="flex items-center justify-between mb-8 border-b border-gray-50 pb-6">
              <div>
                <h2 className="text-xl font-black text-navy flex items-center gap-2">
                   📢 مدير الإعلانات الذكي (Ads Manager)
                </h2>
                <p className="text-xs text-gray-500 mt-1">تحكم في ظهور إعلانات Google AdSense و PropellerAds و Adsterra في متجرك.</p>
              </div>
              <button 
                onClick={() => {
                  const newAd = {
                    id: Date.now().toString(),
                    provider: 'Custom' as const,
                    location: 'between_products' as const,
                    code: '<div class="p-4 bg-gray-50 text-center text-[10px]">مساحة إعلانية مخصصة</div>',
                    isActive: true
                  };
                  setSiteSettings({ ...siteSettings, adScripts: [...(siteSettings.adScripts || []), newAd] });
                }}
                className="px-4 py-2 bg-navy text-gold rounded-xl text-xs font-black flex items-center gap-2 hover:bg-navy-light transition-all cursor-pointer"
              >
                <Plus className="h-4 w-4" /> إضافة وحدة إعلانية
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {siteSettings.adScripts && siteSettings.adScripts.map((ad) => (
                <div key={ad.id} className="bg-gray-50 rounded-3xl p-6 border border-gray-200 relative group transition-all hover:bg-white hover:shadow-md">
                  <button 
                    onClick={() => {
                      const updated = (siteSettings.adScripts || []).filter(a => a.id !== ad.id);
                      setSiteSettings({ ...siteSettings, adScripts: updated });
                    }}
                    className="absolute top-4 left-4 p-2 bg-rose-50 text-rose-500 hover:bg-rose-100 rounded-xl transition-all cursor-pointer"
                    title="حذف الوحدة الإعلانية"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">جهة الإعلان</label>
                      <select 
                        value={ad.provider}
                        onChange={(e) => {
                          const updated = siteSettings.adScripts.map(a => a.id === ad.id ? { ...a, provider: e.target.value as any } : a);
                          setSiteSettings({ ...siteSettings, adScripts: updated });
                        }}
                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-navy focus:outline-hidden"
                      >
                        <option value="AdSense">Google AdSense</option>
                        <option value="PropellerAds">PropellerAds</option>
                        <option value="Adsterra">Adsterra</option>
                        <option value="Custom">كود مخصص (HTML/JS)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">مكان العرض</label>
                      <select 
                        value={ad.location}
                        onChange={(e) => {
                          const updated = siteSettings.adScripts.map(a => a.id === ad.id ? { ...a, location: e.target.value as any } : a);
                          setSiteSettings({ ...siteSettings, adScripts: updated });
                        }}
                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-navy focus:outline-hidden"
                      >
                        <option value="top_header">أعلى الهيدر (فوق كل شيء)</option>
                        <option value="between_products">بين المنتجات (في المتجر)</option>
                        <option value="sidebar">القائمة الجانبية</option>
                        <option value="footer">أسفل الموقع (الفوتير)</option>
                        <option value="after_cart">بعد إتمام الطلب</option>
                      </select>
                    </div>

                    <div className="flex items-end">
                      <button 
                        onClick={() => {
                          const updated = siteSettings.adScripts.map(a => a.id === ad.id ? { ...a, isActive: !a.isActive } : a);
                          setSiteSettings({ ...siteSettings, adScripts: updated });
                        }}
                        className={`w-full py-2.5 rounded-xl text-[10px] font-black transition-all border cursor-pointer ${ad.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-gray-100 text-gray-400 border-gray-200'}`}
                      >
                        {ad.isActive ? 'الوحدة مفعلة حالياً ✅' : 'الوحدة معطلة ❌'}
                      </button>
                    </div>

                    <div className="md:col-span-3">
                      <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">كود الإعلان (Script / HTML Code)</label>
                      <textarea 
                        value={ad.code}
                        dir="ltr"
                        onChange={(e) => {
                          const updated = siteSettings.adScripts.map(a => a.id === ad.id ? { ...a, code: e.target.value } : a);
                          setSiteSettings({ ...siteSettings, adScripts: updated });
                        }}
                        className="w-full bg-gray-900 text-emerald-400 font-mono text-[10px] p-4 rounded-2xl resize-none h-24 focus:outline-hidden border border-navy shadow-inner"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {(!siteSettings.adScripts || siteSettings.adScripts.length === 0) && (
                <div className="py-20 text-center flex flex-col items-center justify-center opacity-30 border-2 border-dashed border-gray-200 rounded-3xl">
                  <PlayCircle className="h-12 w-12 mb-4" />
                  <p className="text-xs font-black">لا توجد وحدات إعلانية حالياً. ابدأ بإضافة وحدتك الأولى!</p>
                </div>
              )}
            </div>

            <div className="mt-8 pt-8 border-t border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2 text-gold">
                <ShieldCheck className="h-4 w-4" />
                <span className="text-[10px] font-bold">نظام حماية من غلق الحسابات مفعل</span>
              </div>
              <button 
                onClick={() => alert('تم حفظ إعدادات الإعلانات وجدولة عرضها بنجاح!')}
                className="bg-navy text-gold px-10 py-3 rounded-2xl text-xs font-black shadow-xl hover:bg-navy-light transition-all cursor-pointer"
              >
                تحديث التغييرات
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* MARKETING & SEO TAB */}
      {activeTab === 'marketing' && siteSettings && setSiteSettings && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 text-right font-sans mx-auto max-w-4xl"
        >
          <div className="bg-white rounded-3xl p-8 border border-gold/10 shadow-2xl shadow-navy/5">
            <div className="flex items-center justify-between border-b border-gray-50 pb-6 mb-8">
              <div>
                <h2 className="text-xl font-black text-navy flex items-center gap-2">
                  <TrendingUp className="h-6 w-6 text-gold" />
                  أدوات النمو والظهور (Marketing & SEO)
                </h2>
                <p className="text-xs text-gray-500 mt-1">عزز ثقة عملائك وارفع ترتيب متجرك في عيون محركات البحث العالمية.</p>
              </div>
              <div className="flex gap-2">
                <span className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-[10px] font-black border border-emerald-100 flex items-center gap-1">
                  <Check className="h-3 w-3" /> نظام النمو نشط
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* SEO Section */}
              <div className="space-y-6">
                <div className="bg-navy/5 p-6 rounded-3xl border border-navy/5">
                  <h3 className="text-sm font-black text-navy mb-4 flex items-center gap-2">
                    <Globe className="h-5 w-5 text-gold" /> تهيئة محركات البحث (SEO)
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xxs font-black text-gray-400 uppercase tracking-widest mb-2">كلمات البحث المفتاحية (Keywords)</label>
                      <textarea
                        value={siteSettings.seoKeywords}
                        onChange={(e) => setSiteSettings({ ...siteSettings, seoKeywords: e.target.value })}
                        placeholder="عطر، ساعات، فخامة، دكان الشرق..."
                        className="w-full px-4 py-3 bg-white border border-gray-150 rounded-2xl text-xs font-sans text-right focus:outline-hidden focus:border-gold transition-all resize-none shadow-xs"
                        rows={4}
                      />
                      <p className="text-[9px] text-gray-400 mt-2 leading-relaxed">
                        * افصل بين الكلمات بفواصل. هذه الكلمات تساعد Google و Bing في العثور على متجرك عند بحث العملاء.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-50/30 p-6 rounded-3xl border border-emerald-100/50">
                  <h3 className="text-sm font-black text-emerald-900 mb-2 flex items-center gap-2">
                    <Check className="h-5 w-5 text-emerald-600" /> نصيحة العبقري للنمو
                  </h3>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    استخدم كلمات تصف "الشعور" وليس فقط المنتج. بدلاً من "عطور"، جرب "أفخم العطور الشرقية في اليمن". هذا يزيد من جودة الزيارات لمتجرك بنسبة 40%.
                  </p>
                </div>
              </div>

              {/* Interaction Section */}
              <div className="space-y-6">
                <div className="bg-gold/5 p-6 rounded-3xl border border-gold/10">
                  <h3 className="text-sm font-black text-navy mb-4 flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-gold" /> أدوات التفاعل والدردشة
                  </h3>
                  
                  <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-xs hover:border-gold transition-colors group">
                        <div>
                          <span className="block text-xs font-black text-navy">الدردشة الحية (Live Chat)</span>
                          <span className="text-[10px] text-gray-400">تفعيل نافذة الدعم المباشر الفوري</span>
                        </div>
                        <button
                          onClick={() => setSiteSettings({ ...siteSettings, enableLiveChat: !siteSettings.enableLiveChat })}
                          className={`w-12 h-6 rounded-full transition-all relative ${siteSettings.enableLiveChat ? 'bg-navy shadow-lg shadow-navy/20' : 'bg-gray-200'}`}
                        >
                          <motion.div
                            animate={{ x: siteSettings.enableLiveChat ? 24 : 4 }}
                            className={`absolute top-1 w-4 h-4 rounded-full shadow-sm ${siteSettings.enableLiveChat ? 'bg-gold' : 'bg-white'}`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-xs hover:border-gold transition-colors group">
                        <div>
                          <span className="block text-xs font-black text-navy">دردشة الزوار (Community Chat)</span>
                          <span className="text-[10px] text-gray-400">تفعيل التواصل التفاعلي بين جميع العملاء</span>
                        </div>
                        <button
                          onClick={() => setSiteSettings({ ...siteSettings, enableCommunityChat: !siteSettings.enableCommunityChat })}
                          className={`w-12 h-6 rounded-full transition-all relative ${siteSettings.enableCommunityChat ? 'bg-navy shadow-lg shadow-navy/20' : 'bg-gray-200'}`}
                        >
                          <motion.div
                            animate={{ x: siteSettings.enableCommunityChat ? 24 : 4 }}
                            className={`absolute top-1 w-4 h-4 rounded-full shadow-sm ${siteSettings.enableCommunityChat ? 'bg-gold' : 'bg-white'}`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-xs hover:border-gold transition-colors group">
                        <div>
                          <span className="block text-xs font-black text-navy">إشعارات الثقة الجارية (Trust Pulse)</span>
                          <span className="text-[10px] text-gray-400">إظهار عمليات الشراء المباشرة وبناء التفاعل</span>
                        </div>
                        <button
                        onClick={() => setSiteSettings({ ...siteSettings, enableSocialProof: !siteSettings.enableSocialProof })}
                        className={`w-12 h-6 rounded-full transition-all relative ${siteSettings.enableSocialProof ? 'bg-navy shadow-lg shadow-navy/20' : 'bg-gray-200'}`}
                      >
                        <motion.div
                          animate={{ x: siteSettings.enableSocialProof ? 24 : 4 }}
                          className={`absolute top-1 w-4 h-4 rounded-full shadow-sm ${siteSettings.enableSocialProof ? 'bg-gold' : 'bg-white'}`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-navy p-6 rounded-3xl text-white shadow-xl">
                  <div className="flex items-center gap-3 mb-3 text-gold">
                    <ShieldCheck className="h-6 w-6" />
                    <span className="text-xs font-black uppercase tracking-widest">Platinum Security</span>
                  </div>
                  <p className="text-[11px] text-blue-100 leading-relaxed font-sans">
                    كافة بيانات الدردشة والتفاعل مشفرة بالكامل. دكان الشرق يلتزم بأعلى معايير الخصوصية لعملائه ولإدارة المتجر.
                  </p>
                </div>
              </div>
            </div>



            {/* Banners Management section */}
            <div className="mt-8 border-t border-gray-100 pt-8">
              <h3 className="text-sm font-black text-navy mb-6 flex items-center gap-2">
                <PlayCircle className="h-5 w-5 text-gold" /> إدارة بنرات العروض والخصومات (Promo Banners)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(siteSettings.promoBanners || []).map(banner => (
                  <div key={banner.id} className="bg-gray-50 rounded-2xl p-4 border border-gray-100 relative group transition-all hover:bg-white hover:shadow-md">
                    <button 
                      onClick={() => {
                        const newBanners = siteSettings.promoBanners.filter(b => b.id !== banner.id);
                        setSiteSettings({ ...siteSettings, promoBanners: newBanners });
                      }}
                      className="absolute top-2 left-2 p-1.5 bg-rose-50 text-rose-500 rounded-lg shadow-xs hover:bg-rose-100 transition-colors"
                      title="حذف البانر"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    
                    <div className="flex gap-4">
                      <div className="h-20 w-20 bg-gray-200 rounded-xl overflow-hidden border border-gray-200 shrink-0">
                        {banner.mediaType === 'image' ? (
                          banner.mediaUrl && <img src={banner.mediaUrl} className="h-full w-full object-cover" alt="" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-navy text-gold">
                            <Video className="h-6 w-6" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <input 
                          value={banner.title}
                          onChange={(e) => {
                            const newBanners = siteSettings.promoBanners.map(b => b.id === banner.id ? { ...b, title: e.target.value } : b);
                            setSiteSettings({ ...siteSettings, promoBanners: newBanners });
                          }}
                          className="block w-full bg-transparent font-black text-xs text-navy focus:outline-hidden mb-1"
                        />
                        <div className="flex items-center gap-2">
                          <input 
                            value={banner.mediaUrl}
                            onChange={(e) => {
                              const newBanners = siteSettings.promoBanners.map(b => b.id === banner.id ? { ...b, mediaUrl: e.target.value } : b);
                              setSiteSettings({ ...siteSettings, promoBanners: newBanners });
                            }}
                            className="block w-full bg-transparent text-[10px] text-gray-400 font-mono focus:outline-hidden"
                            placeholder={banner.mediaType === "image" ? "رابط الصورة المباشر..." : "رابط فيديو خارجي مباشر (مثال: mp4/web/youtube)..."}
                          />
                          {banner.mediaType === 'image' ? (
                            <label className="shrink-0 bg-gray-100 text-gray-600 px-2 py-1 rounded cursor-pointer text-[9px] font-bold transition hover:bg-gray-200">
                              رفع صورة
                              <input 
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    try {
                                      const compressedBase64 = await compressImage(file, 500);
                                      const newBanners = siteSettings.promoBanners.map(b => b.id === banner.id ? { ...b, mediaUrl: compressedBase64 } : b);
                                      setSiteSettings({ ...siteSettings, promoBanners: newBanners });
                                    } catch (err) {
                                      console.error('Failed to compress banner image:', err);
                                      alert('حدث خطأ أثناء معالجة الصورة');
                                    }
                                  }
                                }}
                              />
                            </label>
                          ) : (
                            <div className="shrink-0 bg-amber-50 text-amber-800 border border-amber-200/50 px-2.5 py-1.5 rounded-lg text-[9px] font-extrabold select-none">
                               استضافة خارجية 🌐
                             </div>
                          )}
                        </div>
                        <div className="mt-2 flex gap-2">
                           <button 
                            onClick={() => {
                              const newBanners = siteSettings.promoBanners.map(b => b.id === banner.id ? { ...b, isActive: !b.isActive } : b);
                              setSiteSettings({ ...siteSettings, promoBanners: newBanners });
                            }}
                            className={`px-2 py-1 rounded-md text-[9px] font-black ${banner.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'}`}
                           >
                            {banner.isActive ? 'مفعل' : 'معطل'}
                           </button>
                           <button 
                            onClick={() => {
                              const newBanners = siteSettings.promoBanners.map(b => b.id === banner.id ? ({ ...b, mediaType: b.mediaType === 'image' ? 'video' as const : 'image' as const } as import('../types').PromoBanner) : b);
                              setSiteSettings({ ...siteSettings, promoBanners: newBanners });
                            }}
                            className="bg-navy/5 text-navy px-2 py-1 rounded-md text-[9px] font-black"
                           >
                            {banner.mediaType === 'image' ? 'صورة' : 'فيديو'}
                           </button>
                        </div>

                        {/* Custom Height / Width control slots */}
                        <div className="mt-4 pt-3 border-t border-gray-200/50 space-y-3">
                          <div className="flex items-center justify-between text-xxs font-black text-navy">
                            <span>طول البانر الإعلاني (الارتفاع):</span>
                            <span className="font-mono text-gold-dark">{banner.customHeight || 550}px</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <input 
                              type="range"
                              min="300"
                              max="800"
                              step="50"
                              value={banner.customHeight || 550}
                              onChange={(e) => {
                                const newBanners = siteSettings.promoBanners.map(b => b.id === banner.id ? { ...b, customHeight: Number(e.target.value) } : b);
                                setSiteSettings({ ...siteSettings, promoBanners: newBanners });
                              }}
                              className="w-full accent-gold cursor-pointer"
                            />
                          </div>

                          <div className="text-xxs font-black text-navy mb-1 block">عرض ومساحة البانر:</div>
                          <div className="grid grid-cols-5 gap-1">
                            {(['container', 'full-width', '80%', '70%', '60%'] as const).map((w) => (
                              <button
                                key={w}
                                type="button"
                                onClick={() => {
                                  const newBanners = siteSettings.promoBanners.map(b => b.id === banner.id ? { ...b, customWidth: w } : b);
                                  setSiteSettings({ ...siteSettings, promoBanners: newBanners });
                                }}
                                className={`py-1 text-[8px] font-bold rounded-md transition-all cursor-pointer border ${
                                  (banner.customWidth || 'container') === w 
                                    ? 'bg-navy text-white font-black border-navy' 
                                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                {w === 'container' ? 'مؤطر' : w === 'full-width' ? 'كامل' : w}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                  <button 
                    onClick={() => {
                      const newBanner: import('../types').PromoBanner = {
                        id: Date.now().toString(),
                        title: 'إعلان جديد',
                        subtitle: 'وصف الإعلان',
                        mediaType: 'image' as const,
                        mediaUrl: '',
                        isActive: true,
                        customHeight: 550,
                        customWidth: 'container'
                      };
                      setSiteSettings({ ...siteSettings, promoBanners: [...siteSettings.promoBanners, newBanner] });
                    }}
                    className="border-2 border-dashed border-gray-200 rounded-2xl p-4 flex flex-col items-center justify-center text-gray-400 hover:border-gold hover:text-gold transition-all"
                  >
                  <PlusCircle className="h-6 w-6 mb-2" />
                  <span className="text-[10px] font-black">إضافة بانر إعلاني جديد</span>
                </button>
              </div>
            </div>

            <div className="mt-10 pt-8 border-t border-gray-50 flex items-center justify-between max-sm:flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gold/10 rounded-2xl flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-gold" />
                </div>
                <div>
                  <p className="text-xs font-black text-navy">لوحة التسويق البلاتينية</p>
                  <p className="text-[10px] text-gray-400">جميع التغييرات تطبق فوراً للعملاء</p>
                </div>
              </div>
              <button
                onClick={() => alert('تم تحديث إعدادات النمو والظهور بنجاح!')}
                className="px-8 py-3 bg-navy text-gold font-black text-xs rounded-2xl hover:bg-navy-light transition-all shadow-xl shadow-navy/20 active:scale-95"
              >
                تحديث وحفظ الكل
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* OWNER PRIVATE SETTINGS TAB */}
      {activeTab === 'settings' && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-xs max-w-2xl mx-auto p-6 md:p-8 text-right font-sans"
        >
          <div className="flex items-center space-x-3 space-x-reverse border-b border-gray-50 pb-5 mb-6">
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-amber-800">
              <SlidersHorizontal className="h-6 w-6 text-amber-700" />
            </div>
            <div>
              <h2 className="text-base font-black text-gray-900 leading-none mr-3">إعدادات حساب المالك الفاخر</h2>
              <p className="text-xxs text-gray-400 mt-1 mr-3">تعديل اسم المستخدم وكلمة المرور الخاصة بلوحة التحكم وبوابة الإدارة.</p>
            </div>
          </div>

          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (!newAdminUser.trim() || !newAdminPass.trim()) {
                alert('الرجاء التأكد من إدخال اسم مستخدم وكلمة مرور صالحة!');
                return;
              }
              setAdminUsername(newAdminUser);
              setAdminPassword(newAdminPass);
              localStorage.setItem('dukkan_admin_user', newAdminUser.trim());
              localStorage.setItem('dukkan_admin_pass', newAdminPass.trim());
              setShowCredSuccess(true);
              setTimeout(() => setShowCredSuccess(false), 3000);
            }} 
            className="space-y-4"
          >
            {showCredSuccess && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-emerald-50 border border-emerald-150 text-emerald-800 p-4 rounded-xl text-xxs font-extrabold text-center flex items-center justify-center space-x-1 space-x-reverse"
              >
                <Check className="h-4.5 w-4.5 text-emerald-700 ml-1" />
                <span>تم تحديث وبث بيانات المالك الجديدة بنجاح! سيتم تطبيق التغييرات فوراً.</span>
              </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xxs font-bold text-gray-500 mb-1.5 uppercase">اسم مستخدم المالك الجديد</label>
                <input
                  type="text"
                  required
                  value={newAdminUser}
                  onChange={(e) => setNewAdminUser(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-150 rounded-xl text-xs font-sans text-right focus:outline-hidden focus:border-amber-500 font-bold text-gray-800"
                />
              </div>

              <div>
                <label className="block text-xxs font-bold text-gray-500 mb-1.5 uppercase">كلمة مرور المالك الجديدة</label>
                <input
                  type="text"
                  required
                  value={newAdminPass}
                  onChange={(e) => setNewAdminPass(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-150 rounded-xl text-xs font-sans text-right focus:outline-hidden focus:border-amber-500 font-mono text-gray-800"
                />
              </div>
            </div>

            <button
              type="submit"
              className="py-3 px-6 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-md inline-block font-sans"
            >
              حفظ وتطبيق بيانات المالك
            </button>
          </form>

        </motion.div>
      )}


      {/* Modal for Creating / Editing Products */}
      <AnimatePresence>
        {showProductModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-lg overflow-hidden border border-gray-100 shadow-2xl relative"
            >
              <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-sm font-bold text-gray-900 font-sans">
                  {editingProduct ? 'تعديل بيانات المنتج المعروض' : 'إضافة منتج جديد للمتجر'}
                </h3>
                <button
                  onClick={() => setShowProductModal(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="p-6 space-y-4 max-h-160 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xxs font-bold text-gray-400 uppercase font-sans mb-1.5">اسم المنتج الفخم *</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: عطر جافانا الملكي"
                      value={prodName || ''}
                      onChange={(e) => setProdName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-sans text-gray-800 focus:outline-hidden focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xxs font-bold text-gray-400 uppercase font-sans mb-1.5">الرمز الفريد للصنف (توليد تلقائي) *</label>
                    <input
                      type="text"
                      required
                      placeholder="LX-XXXX"
                      value={prodCode || ''}
                      onChange={(e) => setProdCode(e.target.value.toUpperCase())}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-mono text-amber-900 border-amber-500/20 font-bold focus:outline-hidden focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xxs font-bold text-gray-400 uppercase font-sans mb-1.5">الوصف والتفاصيل الكاملة *</label>
                    <textarea
                      required
                      placeholder="اكتب مواصفات وتفاصيل المنتج الفاخر وتجربة الاستخدام بالتفصيل..."
                      value={prodDesc || ''}
                      onChange={(e) => setProdDesc(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-sans text-gray-800 focus:outline-hidden focus:border-amber-500 resize-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xxs font-bold text-gray-400 uppercase font-sans mb-1.5">القسم الرئيسي (التصنيف)</label>
                    <select
                      value={prodCategory || ''}
                      onChange={(e) => {
                        const newCat = e.target.value;
                        setProdCategory(newCat);
                        const subCats = categories.find(c => c.name === newCat)?.subcategories || [];
                        setProdSubCategory(subCats[0] || '');
                      }}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-800 focus:outline-hidden font-sans"
                    >
                      {categories.map(cat => (
                        <option key={cat.name} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xxs font-bold text-gray-400 uppercase font-sans mb-1.5">القسم الفرعي الموصول</label>
                    <select
                      value={prodSubCategory || ''}
                      onChange={(e) => setProdSubCategory(e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-800 focus:outline-hidden font-sans"
                    >
                      <option value="">لا يوجد قسم فرعي (رئيسي فقط)</option>
                      {(categories.find(c => c.name === prodCategory)?.subcategories || []).map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xxs font-bold text-gray-400 uppercase font-sans mb-1.5">السعر بالريال (ر.س)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="350"
                      value={prodPrice ?? 0}
                      onChange={(e) => setProdPrice(Number(e.target.value))}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-mono text-gray-800 focus:outline-hidden focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xxs font-bold text-gray-400 uppercase font-sans mb-1.5">نقاط المكافأة عند الشراء</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="مثال: 10"
                      value={prodPointsReward}
                      onChange={(e) => setProdPointsReward(Number(e.target.value))}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gold/20 rounded-xl text-xs font-mono text-navy focus:outline-hidden focus:border-gold"
                    />
                    <p className="text-[9px] text-gold mt-1 font-display">يحصل عليها العميل في محفظته</p>
                  </div>

                  <div>
                    <label className="block text-xxs font-bold text-gray-400 uppercase font-sans mb-1.5">رابط فيديو المنتج (MP4/YouTube)</label>
                    <input
                      type="text"
                      placeholder="https://..."
                      value={prodVideoUrl}
                      onChange={(e) => setProdVideoUrl(e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gold/20 rounded-xl text-xs font-mono text-navy focus:outline-hidden focus:border-gold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xxs font-bold text-gray-400 uppercase font-sans mb-1.5">المقاسات المتاحة (مفصولة بفواصل)</label>
                    <input
                      type="text"
                      placeholder="مثال: S, M, L, XL أو 38, 40, 42"
                      value={prodSizesInput || ''}
                      onChange={(e) => setProdSizesInput(e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-800 focus:outline-hidden focus:border-amber-500 font-sans"
                    />
                  </div>
                </div>

                {/* Dynamic Per-Size Stock Entry Field */}
                {parsedSizesArray.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-amber-50/40 p-4 rounded-xl border border-amber-100/70 space-y-3"
                  >
                    <span className="block text-[10px] font-bold text-amber-900 font-sans">
                      🛍️ حدد الكمية المتوفرة في المستودع لكل مقاس:
                    </span>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {parsedSizesArray.map((sz) => (
                        <div key={sz} className="bg-white p-2 rounded-lg border border-gray-150">
                          <span className="block text-[10px] text-gray-400 font-bold mb-1">المقاس {sz}</span>
                          <input
                            type="number"
                            min="0"
                            required
                            value={prodSizeStock[sz] ?? 10}
                            onChange={(e) => {
                              const val = Math.max(0, Number(e.target.value));
                              setProdSizeStock(prev => ({ ...prev, [sz]: val }));
                            }}
                            className="w-full p-1.5 bg-gray-50 border border-gray-100 rounded-md text-xs font-mono text-gray-850 text-center focus:outline-hidden focus:border-amber-500"
                          />
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xxs font-bold text-gray-400 uppercase font-sans mb-1.5">المخزون المتوفر المجمع</label>
                    <input
                      type="number"
                      required
                      min="0"
                      disabled={parsedSizesArray.length > 0}
                      placeholder="10"
                      value={parsedSizesArray.length > 0 ? parsedSizesArray.reduce((sum, sz) => sum + (prodSizeStock[sz] ?? 10), 0) : (prodStock ?? 0)}
                      onChange={(e) => setProdStock(Number(e.target.value))}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-mono text-gray-800 focus:outline-hidden focus:border-amber-500 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                    />
                    {parsedSizesArray.length > 0 && (
                      <p className="text-[9px] text-amber-600 mt-0.5 font-sans leading-relaxed">يُحسب تلقائياً بجمع كميات المقاسات المدخلة</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xxs font-bold text-gray-400 uppercase font-sans mb-1.5">تقييم مبدئي</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="5"
                      value={prodRating ?? 4.5}
                      onChange={(e) => setProdRating(Number(e.target.value))}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-mono text-gray-800 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xxs font-bold text-gray-400 uppercase font-sans mb-1.5">صورة المنتج (رابط أو رفع ملف محلي)</label>
                  
                  <div className="grid grid-cols-2 gap-2 bg-gray-50 p-1 rounded-xl mb-3">
                    <button
                      type="button"
                      onClick={() => setImageMethod('url')}
                      className={`py-1.5 rounded-lg text-xxs font-bold transition-all ${
                        imageMethod === 'url'
                          ? 'bg-white text-gray-900 shadow-xxs font-black border border-gray-100'
                          : 'text-gray-400 hover:text-gray-850'
                      }`}
                    >
                      رابط مباشر (URL)
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageMethod('upload')}
                      className={`py-1.5 rounded-lg text-xxs font-bold transition-all ${
                        imageMethod === 'upload'
                          ? 'bg-white text-gray-900 shadow-xxs font-black border border-gray-100'
                          : 'text-gray-400 hover:text-gray-850'
                      }`}
                    >
                      رفع ملف محلي (Upload)
                    </button>
                  </div>

                  {imageMethod === 'url' ? (
                    <div>
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/..."
                        value={prodImage || ''}
                        onChange={(e) => setProdImage(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-mono text-gray-800 focus:outline-hidden focus:border-amber-500"
                      />
                      <p className="text-xxs text-gray-400 mt-1 font-sans">انسخ وألصق عنوان رابط صحيح للصورة من الويب.</p>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-200 hover:border-amber-500 rounded-2xl p-4 text-center cursor-pointer transition-colors relative bg-gray-51 hover:bg-amber-50/10">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              const compressedBase64 = await compressImage(file, 600);
                              setProdImage(compressedBase64);
                            } catch (err) {
                              console.error('Failed to compress image:', err);
                            }
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <ShoppingBag className="mx-auto h-6 w-6 text-gray-400 mb-1" />
                      <p className="text-xxs text-gray-500 font-bold mb-0.5 font-sans">اضغط هنا أو اسحب الملف للتحميل</p>
                      <p className="text-[10px] text-gray-400 font-sans">يدعم الصور PNG، JPG، WebP</p>
                    </div>
                  )}

                  {prodImage && (
                    <div className="mt-2.5 flex items-center space-x-2 space-x-reverse bg-amber-50/50 p-2 rounded-xl border border-amber-100/50">
                      <img src={prodImage} className="h-8 w-8 object-cover rounded-lg border border-gray-100" referrerPolicy="no-referrer" />
                      <div className="overflow-hidden">
                        <p className="text-xxs font-bold text-gray-600 font-sans">تم حفظ الصورة المعتمدة بنجاح.</p>
                        <p className="text-[9px] text-amber-900 font-mono truncate max-w-xs">{prodImage}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 space-x-reverse pt-2">
                  <input
                    type="checkbox"
                    id="isFeatured"
                    checked={prodIsFeatured}
                    onChange={(e) => setProdIsFeatured(e.target.checked)}
                    className="h-4 w-4 text-amber-600 border-gray-300 rounded-sm focus:ring-amber-500 accent-amber-600 cursor-pointer"
                  />
                  <label htmlFor="isFeatured" className="text-xs text-gray-700 cursor-pointer font-sans select-none">تمثيل المنتج كمنتج مميز (Featured) بالصفحة الرئيسية</label>
                </div>

                <div className="border-t border-gray-150 pt-5 mt-4 flex justify-end space-x-2 space-x-reverse">
                  <button
                    type="button"
                    onClick={() => setShowProductModal(false)}
                    className="px-4 py-2.5 border border-gray-150 text-gray-500 rounded-xl hover:bg-gray-50 transition-colors text-xs font-bold"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-gray-950 hover:bg-gray-800 text-white rounded-xl transition-colors text-xs font-bold"
                  >
                    حفظ التغييرات
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* Modal for Order detailed parameters */}
      <AnimatePresence>
        {viewingOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-lg overflow-hidden border border-gray-100 shadow-2xl relative p-6"
            >
              <button
                onClick={() => setViewingOrder(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-1"
              >
                <X className="h-5 w-5" />
              </button>

              <h3 className="text-base font-bold text-gray-900 font-sans border-b border-gray-50 pb-3 mb-4 flex items-center space-x-2 space-x-reverse">
                <span>تفاصيل الفاتورة والطلب:</span>
                <span className="font-mono text-amber-700">{viewingOrder.id}</span>
              </h3>

              <div className="space-y-4 text-xs">
                {/* Customer specifics */}
                <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                  <p className="flex justify-between">
                    <span className="text-gray-400">العميل:</span>
                    <span className="font-bold text-gray-800">{viewingOrder.customerName}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-400">البريد الإلكتروني:</span>
                    <span className="font-mono text-gray-800">{viewingOrder.customerEmail}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-400">الجوال:</span>
                    <span className="font-mono text-gray-800">{viewingOrder.customerPhone}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-400">العنوان:</span>
                    <span className="font-sans text-gray-800 font-bold">{viewingOrder.customerAddress}</span>
                  </p>
                </div>

                {/* Items list */}
                <div>
                  <p className="font-bold text-gray-700 mb-2">المنتجات المطلوبة:</p>
                  <div className="divide-y divide-gray-100 max-h-40 overflow-y-auto pr-1">
                    {viewingOrder.items.map((item) => (
                      <div key={item.product.id} className="py-2.5 flex justify-between items-center">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          {item.product.image && <img src={item.product.image} className="h-8 w-8 object-cover rounded-md" />}
                          <div>
                            <p className="font-semibold text-gray-900 font-sans">{item.product.name}</p>
                            <p className="text-xxs text-gray-400 font-mono">الكمية: {item.quantity}</p>
                          </div>
                        </div>
                        <span className="font-mono text-amber-700 font-bold">{item.product.price * item.quantity} ر.س</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total computation */}
                <div className="border-t border-gray-150 pt-3 flex justify-between items-center text-sm font-bold">
                  <span>إجمالي المبلغ</span>
                  <span className="font-mono text-base text-amber-900">{viewingOrder.totalPrice.toFixed(2)} ر.س</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Gift Giver Modal (IFrame compatible) */}
      <AnimatePresence>
         {giftingAccount && (
           <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
           >
             <motion.div
               initial={{ scale: 0.95 }}
               animate={{ scale: 1 }}
               exit={{ scale: 0.95 }}
               className="bg-white rounded-3xl w-full max-w-md overflow-hidden border border-gray-100 shadow-2xl relative p-6 text-right font-sans"
             >
               <button
                 type="button"
                 onClick={() => setGiftingAccount(null)}
                 className="absolute top-4 left-4 text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
               >
                 <X className="h-5 w-5" />
               </button>

               <h3 className="text-base font-black text-gray-950 pb-3 border-b border-gray-100 mb-4 flex items-center justify-start gap-2">
                 <Sparkles className="h-5 w-5 text-amber-600" />
                 <span>إهداء وتعديل نقاط العميل: {giftingAccount.name} 💎</span>
               </h3>

               {giftSuccessMsg ? (
                 <div className="py-8 text-center space-y-3">
                   <div className="h-14 w-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                     <CheckCircle className="h-8 w-8 text-emerald-600" />
                   </div>
                   <p className="text-sm font-black text-emerald-800">{giftSuccessMsg}</p>
                 </div>
               ) : (
                 <form onSubmit={(e) => {
                   e.preventDefault();
                   const today = new Date().toISOString().split('T')[0];
                    if (giftType === 'points') {
                      const amountToAdd = Number(giftPoints);
                      if (isNaN(amountToAdd) || amountToAdd === 0) return;
                      const giftTransaction: Transaction = {
                        id: `GIFT-${Date.now()}`,
                        type: 'deposit',
                        amount: amountToAdd,
                        unit: 'currency',
                        description: 'شحن رصيد إضافي من إدارة المتجر 💰',
                        date: today
                      };
                      const updatedAccount: CustomerAccount = { 
                        ...giftingAccount, 
                        balance: (giftingAccount.balance || 0) + amountToAdd,
                        transactions: [giftTransaction, ...(giftingAccount.transactions || [])]
                      };
                      setCustomerAccounts?.(prev => prev.map(a => a.phone === giftingAccount.phone ? updatedAccount : a));
                      setGiftSuccessMsg(`تم شحن رصيد المحفظة بقيمة ${amountToAdd} ر.س بنجاح! 💰`);
                      setTimeout(() => {
                        setGiftingAccount(null);
                        setGiftSuccessMsg(null);
                      }, 2500);
                    } else if (giftType === 'deduct') {
                      const amountToDeduct = Number(giftPoints);
                      if (isNaN(amountToDeduct) || amountToDeduct === 0) return;
                      const currentBalance = giftingAccount.balance || 0;
                      const newBalance = Math.max(0, currentBalance - amountToDeduct);
                      const giftTransaction: Transaction = {
                        id: `DEDUCT-${Date.now()}`,
                        type: 'spend',
                        amount: amountToDeduct,
                        unit: 'currency',
                        description: 'سحب وخصم رصيد يدوي من الإدارة ⚠️',
                        date: today
                      };
                      const updatedAccount: CustomerAccount = { 
                        ...giftingAccount, 
                        balance: newBalance,
                        transactions: [giftTransaction, ...(giftingAccount.transactions || [])]
                      };
                      setCustomerAccounts?.(prev => prev.map(a => a.phone === giftingAccount.phone ? updatedAccount : a));
                      setGiftSuccessMsg(`تم خصم ${amountToDeduct} ر.س بنجاح! الرصيد المتبقي: ${newBalance} ر.س 💎`);
                      setTimeout(() => {
                        setGiftingAccount(null);
                        setGiftSuccessMsg(null);
                      }, 2500);
                    } else if (giftType === 'reset') {
                      const currentBalance = giftingAccount.balance || 0;
                      const giftTransaction: Transaction = {
                        id: `RESET-${Date.now()}`,
                        type: 'spend',
                        amount: currentBalance,
                        unit: 'currency',
                        description: 'تصفير رصيد المحفظة بالكامل 🗑️',
                        date: today
                      };
                      const updatedAccount: CustomerAccount = { 
                        ...giftingAccount, 
                        balance: 0,
                        transactions: [giftTransaction, ...(giftingAccount.transactions || [])]
                      };
                      setCustomerAccounts?.(prev => prev.map(a => a.phone === giftingAccount.phone ? updatedAccount : a));
                      setGiftSuccessMsg(`تم تصفير جميع رصيد المحفظة للعميل بنجاح! 🗑️`);
                      setTimeout(() => {
                        setGiftingAccount(null);
                        setGiftSuccessMsg(null);
                      }, 2500);
                    } else {
                     if (!giftProduct.trim()) return;
                     const giftTransaction: Transaction = {
                       id: `GIFT-PROD-${Date.now()}`,
                       type: 'earn',
                       amount: 1,
                       unit: 'currency',
                       description: `هدية منتج: ${giftProduct.trim()} 🎁`,
                       date: today
                     };
                     const updatedAccount: CustomerAccount = { 
                       ...giftingAccount, 
                       transactions: [giftTransaction, ...(giftingAccount.transactions || [])]
                     };
                     setCustomerAccounts?.(prev => prev.map(a => a.phone === giftingAccount.phone ? updatedAccount : a));
                     setGiftSuccessMsg(`تم إهداء العميل منتج: "${giftProduct.trim()}" بنجاح! 🎁`);
                     setTimeout(() => {
                       setGiftingAccount(null);
                       setGiftSuccessMsg(null);
                     }, 2500);
                   }
                 }} className="space-y-4">
                   <div>
                     <label className="block text-xs font-bold text-gray-500 mb-2">نوع الإجراء المرغوب</label>
                     <div className="grid grid-cols-2 gap-2">
                       <button
                         type="button"
                         onClick={() => setGiftType('points')}
                         className={`py-2 text-[11px] font-bold rounded-xl border cursor-pointer transition-all ${
                           giftType === 'points'
                             ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-xxs font-black'
                             : 'bg-white border-gray-150 text-gray-500 hover:bg-gray-50'
                         }`}
                       >
                         شحن رصيد إيجابي
                       </button>
                       <button
                         type="button"
                         onClick={() => setGiftType('deduct')}
                         className={`py-2 text-[11px] font-bold rounded-xl border cursor-pointer transition-all ${
                           giftType === 'deduct'
                             ? 'bg-rose-50 border-rose-305 text-rose-900 shadow-xxs font-black'
                             : 'bg-white border-gray-150 text-gray-550 hover:bg-gray-50'
                         }`}
                       >
                         سحب/خصم رصيد
                       </button>
                       <button
                         type="button"
                         onClick={() => setGiftType('reset')}
                         className={`py-2 text-[11px] font-bold rounded-xl border cursor-pointer transition-all ${
                           giftType === 'reset'
                             ? 'bg-red-50 border-red-300 text-red-900 shadow-xxs font-black'
                             : 'bg-white border-gray-150 text-gray-550 hover:bg-gray-50'
                         }`}
                       >
                         تصفير رصيد المحفظة
                       </button>
                       <button
                         type="button"
                         onClick={() => setGiftType('product')}
                         className={`py-2 text-[11px] font-bold rounded-xl border cursor-pointer transition-all ${
                           giftType === 'product'
                             ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-xxs font-black'
                             : 'bg-white border-gray-150 text-gray-500 hover:bg-gray-50'
                         }`}
                       >
                         منتج أو كوبون خاص
                       </button>
                     </div>
                   </div>

                   {giftType === 'points' && (
                     <div>
                       <div className="flex items-center justify-between mb-1.5">
                         <span className="text-xxs text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded">رصيد المحفظة الحالي: {giftingAccount.balance || 0} ر.س</span>
                         <label className="block text-xs font-bold text-gray-500">المبلغ المراد إيداعه بحساب العميل</label>
                       </div>
                       <input
                         type="number"
                         required
                         placeholder="أدخل المبلغ بالريال السعودي (مثلاً: 100)"
                         value={giftPoints}
                         onChange={(e) => setGiftPoints(e.target.value)}
                         className="w-full text-right p-3 bg-gray-50 border border-gray-150 focus:border-amber-500 focus:outline-hidden rounded-xl font-bold font-mono"
                       />
                     </div>
                   )}

                   {giftType === 'deduct' && (
                     <div>
                       <div className="flex items-center justify-between mb-1.5">
                         <span className="text-xxs text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded">رصيد المحفظة الحالي: {giftingAccount.balance || 0} ر.س</span>
                         <label className="block text-xs font-bold text-gray-500">المبلغ المراد خصمه من حساب العميل</label>
                       </div>
                       <input
                         type="number"
                         required
                         placeholder="أدخل المبلغ لخصمه"
                         value={giftPoints}
                         onChange={(e) => setGiftPoints(e.target.value)}
                         className="w-full text-right p-3 bg-gray-50 border border-gray-150 focus:border-rose-500 focus:outline-hidden rounded-xl font-bold font-mono"
                       />
                     </div>
                   )}

                   {giftType === 'reset' && (
                     <div className="p-4 bg-red-50/50 rounded-2xl border border-red-150 space-y-2">
                       <p className="text-xs text-red-800 font-bold leading-relaxed">
                         ⚠️ ستؤدي هذه العملية إلى مسح وتصفير كافة رصيد محفظة العميل ({giftingAccount.balance || 0} ر.س) نهائياً دون حذف حساب العميل بالكامل.
                       </p>
                       <p className="text-[10px] text-gray-500">
                         هذه هي الطريقة الآمنة لإعادة الرصيد للصفر لتصحيح القيود المالية.
                       </p>
                     </div>
                   )}

                   {giftType === 'product' && (
                     <div>
                       <label className="block text-xs font-bold text-gray-500 mb-1">اسم أو تفاصيل الهدية</label>
                       <input
                         type="text"
                         required
                         placeholder="مثال: ساعة ذكية مجانية أو شحن مجاني"
                         value={giftProduct}
                         onChange={(e) => setGiftProduct(e.target.value)}
                         className="w-full text-right p-3 bg-gray-50 border border-gray-150 focus:border-amber-500 focus:outline-hidden rounded-xl font-bold font-sans"
                       />
                     </div>
                   )}

                   <div className="flex gap-3 pt-2">
                     <button
                       type="submit"
                       className={`flex-1 py-3 text-white font-extrabold text-xs rounded-xl shadow-lg cursor-pointer text-center ${
                         giftType === 'reset' || giftType === 'deduct'
                           ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/10'
                           : 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 shadow-amber-600/10'
                       }`}
                     >
                       {giftType === 'reset' ? 'تأكيد تصفير رصيد المحفظة 🗑️' : giftType === 'deduct' ? 'تأكيد الخصم الفوري ⚠️' : 'منح وإجراء التحديث الآن 🎁'}
                     </button>
                     <button
                       type="button"
                       onClick={() => setGiftingAccount(null)}
                       className="px-5 py-3 bg-gray-105 hover:bg-gray-150 text-gray-600 font-bold text-xs rounded-xl cursor-pointer"
                     >
                       إلغاء
                     </button>
                   </div>
                 </form>
               )}
             </motion.div>
           </motion.div>
          )}

        </AnimatePresence>

         {/* Custom Delete Account Confirm Modal */}
         <AnimatePresence>
         {deletingAccount && (
           <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
           >
             <motion.div
               initial={{ scale: 0.95 }}
               animate={{ scale: 1 }}
               exit={{ scale: 0.95 }}
               className="bg-white rounded-3xl w-full max-w-sm overflow-hidden border border-gray-100 shadow-2xl relative p-6 text-right font-sans"
             >
               <h3 className="text-base font-black text-rose-950 pb-3 border-b border-gray-100 mb-4 flex items-center justify-start gap-2">
                 <Trash2 className="h-5 w-5 text-rose-600" />
                 <span>تأكيد الحذف النهائي</span>
               </h3>

               <p className="text-xs font-bold text-gray-600 leading-relaxed mb-6">
                 هل أنت متأكد من رغبتك في حذف حساب العميل <span className="text-rose-650 font-black">({deletingAccount.name})</span> ذو الرقم <span className="font-mono">{deletingAccount.phone}</span> نهائياً؟ 
                 <br />
                 <span className="text-xxs text-rose-500 mt-2 block font-normal">(تحذير: هذا القرار لا يمكن التراجع عنه وبحذف الحساب ستفقد كافة نقاط الولاء والمعاملات التابعة!)</span>
               </p>

               <div className="flex gap-3">
                 <button
                   onClick={() => {
                     setCustomerAccounts?.(prev => prev.filter(a => a.phone !== deletingAccount.phone));
                     setDeletingAccount(null);
                   }}
                   className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-rose-600/15 cursor-pointer text-center"
                 >
                   نعم، احذف الحساب 🗑️
                 </button>
                 <button
                   onClick={() => setDeletingAccount(null)}
                   className="px-5 py-3 bg-gray-105 hover:bg-gray-150 text-gray-600 font-bold text-xs rounded-xl cursor-pointer"
                 >
                   تراجع
                 </button>
               </div>
             </motion.div>
           </motion.div>
         )}
      </AnimatePresence>

    </div>
  );
}
