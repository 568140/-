import React from 'react';
import { ShoppingBag, LayoutDashboard, Store, ClipboardList, Globe, ShieldCheck, Truck, RefreshCw, User, Star } from 'lucide-react';
import { CurrencyConfig, SiteSettings } from '../types';
import { CURRENCIES } from '../data';

interface NavbarProps {
  currentView: 'store' | 'cart' | 'admin' | 'orders-tracking';
  setCurrentView: (view: 'store' | 'cart' | 'admin' | 'orders-tracking') => void;
  cartCount: number;
  siteSettings: SiteSettings;
  selectedCurrency: CurrencyConfig;
  setSelectedCurrency: (currency: CurrencyConfig) => void;
  currentUser: { name: string; phone: string; points?: number } | null;
  onLogoutCustomer: () => void;
  onOpenCustomerModal: () => void;
  onOpenWallet?: () => void;
  isAdminLoggedIn: boolean;
}

export function Navbar({ 
  currentView, 
  setCurrentView, 
  cartCount,
  siteSettings,
  selectedCurrency,
  setSelectedCurrency,
  currentUser,
  onLogoutCustomer,
  onOpenCustomerModal,
  onOpenWallet,
  isAdminLoggedIn,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Upper Announcement & Currency Bar */}
      <div className="bg-gray-950 text-white text-[11px] font-sans border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-10 flex items-center justify-between">
          
          {/* Announcement scrolling items with micro icons */}
          <div className="flex items-center space-x-4 space-x-reverse text-gray-300">
            <span className="flex items-center space-x-1 space-x-reverse bg-amber-600/20 text-amber-400 px-2 py-0.5 rounded-md font-bold text-[10px]">
              <Truck className="h-3 w-3" />
              <span>شحن مجاني لكافة البلدان للطلبات فوق ٤٠٠ ر.س</span>
            </span>
            <span className="hidden md:flex items-center space-x-1 space-x-reverse text-gray-400">
              <ShieldCheck className="h-3 w-3 text-emerald-500" />
              <span>دفع آمن بالكامل ومحمي ١٠٠٪</span>
            </span>
          </div>

          {/* Locked to Yemen & YER indicator */}
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="flex items-center space-x-1.5 space-x-reverse text-amber-500 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20">
              <span className="text-sm">🇾🇪</span>
              <span className="font-bold text-amber-400 text-xs font-sans">عروض متجر اليمن الفاخر بالعملة المحلية (ر.ي) فقط</span>
            </div>
          </div>

        </div>
      </div>

      {/* Main Beautiful Luxury Navigation */}
      <nav id="main-navigation-navbar" className="bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            
            {/* Elegant Luxury Logo Concept */}
            <div 
              onClick={() => setCurrentView('store')}
              className="flex items-center space-x-3 space-x-reverse cursor-pointer group"
            >
              <div className="relative">
                {siteSettings.logoUrl ? (
                  <img 
                    src={siteSettings.logoUrl} 
                    alt={siteSettings.storeName} 
                    className="h-10 w-10 md:h-14 md:w-14 object-contain group-hover:scale-110 transition-transform duration-500 relative z-10" 
                  />
                ) : (
                  <div className="p-2 md:p-3 bg-linear-to-tr from-navy to-navy-light rounded-2xl shadow-lg group-hover:scale-105 transition-transform duration-300">
                    <ShoppingBag className="h-5 w-5 md:h-6 md:w-6 text-gold" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gold/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg md:text-xl font-black text-navy tracking-tight font-display block group-hover:text-gold transition-colors">
                  {siteSettings.storeName}
                </span>
                <span className="text-[8px] md:text-[9px] text-gold font-display block tracking-[0.2em] font-bold uppercase opacity-80">
                  Premium Oriental Goods
                </span>
              </div>
            </div>

            {/* Navigation Buttons Row */}
            <div className="flex items-center space-x-1 sm:space-x-3 space-x-reverse">
              
              <button
                onClick={() => setCurrentView('store')}
                className={`flex items-center space-x-2 space-x-reverse px-3 sm:px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-300 ${
                  currentView === 'store'
                    ? 'bg-navy text-gold shadow-lg shadow-navy/20'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Store className="h-4 w-4" />
                <span className="hidden sm:inline">المعرض</span>
              </button>

              <button
                onClick={() => setCurrentView('orders-tracking')}
                className={`flex items-center space-x-2 space-x-reverse px-3 sm:px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-300 ${
                  currentView === 'orders-tracking'
                    ? 'bg-navy text-gold shadow-lg shadow-navy/20'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <ClipboardList className="h-4 w-4" />
                <span className="hidden sm:inline">تتبع طلبياتي</span>
                <span className="inline sm:hidden">طلباتي</span>
              </button>

              {isAdminLoggedIn && (
                <button
                  onClick={() => setCurrentView('admin')}
                  className={`flex items-center space-x-2 space-x-reverse px-3 sm:px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-300 ${
                    currentView === 'admin'
                      ? 'bg-navy text-white shadow-lg'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <LayoutDashboard className={`h-4 w-4 ${currentView === 'admin' ? 'text-white' : 'text-gold'}`} />
                  <span className="hidden sm:inline">لوحة التحكم</span>
                </button>
              )}

              {/* Separator */}
              <div className="h-6 w-px bg-gray-200/50 mx-1 sm:mx-2"></div>

              {/* Customer Account Button */}
              {currentUser ? (
                <div className="flex items-center space-x-3 space-x-reverse bg-white border border-gold/20 shadow-sm px-4 py-2.5 rounded-2xl group transition-all hover:border-gold/40 hover:shadow-lg">
                  <div className="flex items-center justify-center bg-gold/10 text-gold-dark w-9 h-9 rounded-full font-bold text-sm shadow-inner group-hover:bg-gold/20 transition-colors">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="flex flex-col text-right">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-gray-400 font-bold font-display uppercase tracking-widest leading-none">VIP</span>
                      <button 
                        onClick={onOpenWallet}
                        className="flex items-center gap-0.5 bg-gold/10 hover:bg-gold hover:text-navy text-gold-dark text-[9px] px-1.5 py-0.5 rounded-full font-bold transition-all"
                        title="افتح المحفظة"
                      >
                        <Star className="h-2 w-2 fill-current" /> {currentUser.points || 0} نقطة
                      </button>
                    </div>
                    <span className="text-xs text-navy font-bold font-sans mt-1">{currentUser.name}</span>
                  </div>
                  <div className="pr-3 border-r border-gray-100 mr-2">
                    <button
                      onClick={onLogoutCustomer}
                      className="text-[10px] text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded-xl font-bold transition-colors"
                      title="خروج"
                    >
                      خروج
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={onOpenCustomerModal}
                  className="flex items-center space-x-2 space-x-reverse px-3 sm:px-5 py-2.5 bg-gold/10 hover:bg-gold text-gold-dark hover:text-navy rounded-2xl text-xs font-bold transition-all duration-300 border border-gold/20"
                >
                  <User className="h-4 w-4" />
                  <span className="hidden xs:inline">دخول العميل</span>
                </button>
              )}

              {/* Separator */}
              <div className="h-6 w-px bg-gray-200/50 mx-1 sm:mx-2"></div>

              {/* Shopping Cart Trigger */}
              <button
                onClick={() => setCurrentView('cart')}
                className={`relative flex items-center space-x-2 space-x-reverse px-3 sm:px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-300 ${
                  currentView === 'cart'
                    ? 'bg-gold text-navy shadow-lg shadow-gold/20 scale-105'
                    : 'bg-gray-50 text-gray-700 hover:bg-gold hover:text-navy border border-transparent'
                }`}
              >
                <div className="relative">
                  <ShoppingBag className="h-5 w-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-3.5 -right-3.5 bg-rose-600 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center animate-bounce shadow-lg">
                      {cartCount}
                    </span>
                  )}
                </div>
                <span className="hidden md:inline pr-1 font-black">السلة</span>
              </button>

            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
