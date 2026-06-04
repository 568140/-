import React from 'react';
import { ShoppingBag, LayoutDashboard, Store, ClipboardList, Globe, ShieldCheck, Truck, RefreshCw, User, Star, Wallet } from 'lucide-react';
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
              <span>{siteSettings.headerShippingText || 'شحن مجاني لكافة البلدان للطلبات فوق ٤٠٠ ر.س'}</span>
            </span>
            <span className="hidden md:flex items-center space-x-1 space-x-reverse text-gray-400">
              <ShieldCheck className="h-3 w-3 text-emerald-500" />
              <span>{siteSettings.headerPaymentText || 'دفع آمن بالكامل ومحمي ١٠٠٪'}</span>
            </span>
          </div>

          {/* Locked to Yemen & YER indicator */}
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="flex items-center space-x-1.5 space-x-reverse text-amber-500 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20">
              <span className="text-sm">🇾🇪</span>
              <span className="font-bold text-amber-400 text-xs font-sans">
                {siteSettings.headerOffersText || 'عروض متجر اليمن الفاخر بالعملة المحلية (ر.ي) فقط'}
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Main Beautiful Luxury Navigation */}
      <nav id="main-navigation-navbar" className="bg-white/95 backdrop-blur-2xl border-b border-gray-100 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-24 items-center">
            
            {/* Elegant Luxury Logo Concept */}
            <div 
              onClick={() => setCurrentView('store')}
              className="flex items-center space-x-3 space-x-reverse cursor-pointer group"
            >
              <div className="relative flex items-center justify-center">
                {siteSettings.logoUrl ? (
                  <img 
                    src={siteSettings.logoUrl} 
                    alt={siteSettings.storeName} 
                    className="h-16 md:h-20 w-auto max-w-[220px] object-contain group-hover:scale-105 transition-transform duration-500 relative z-10" 
                  />
                ) : (
                  <div className="p-3 bg-linear-to-tr from-navy to-navy-light rounded-2xl shadow-lg group-hover:scale-105 transition-transform duration-300">
                    <ShoppingBag className="h-6 w-6 text-gold" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gold/10 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
              {!siteSettings.logoUrl && (
                <div className="flex flex-col">
                  <span className="text-lg md:text-xl font-black text-navy tracking-tight font-display block group-hover:text-gold transition-colors">
                    {siteSettings.storeName}
                  </span>
                  <span className="text-[8px] md:text-[9px] text-gold font-display block tracking-[0.2em] font-bold uppercase opacity-80">
                    Premium Oriental Goods
                  </span>
                </div>
              )}
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
                <div className="flex items-center space-x-1.5 sm:space-x-3 space-x-reverse">
                  {/* Wallet balances shortcut */}
                  <button
                    onClick={onOpenWallet}
                    className="flex items-center space-x-1 sm:space-x-1.5 space-x-reverse bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 border border-emerald-500/20 px-2 sm:px-3 py-1.5 sm:py-2.5 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-black transition-all cursor-pointer"
                    title="افتح المحفظة"
                  >
                    <Wallet className="h-3.5 w-3.5" />
                    <span className="hidden xs:inline">المحفظة</span>
                  </button>

                  {/* Profile Indicator */}
                  <div className="flex items-center space-x-1 sm:space-x-2 space-x-reverse bg-gray-50 border border-gray-150 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl">
                    <div className="flex items-center justify-center bg-gold text-white w-6 h-6 sm:w-7 sm:h-7 rounded-full font-bold text-xs shadow-inner">
                      {currentUser.name.charAt(0)}
                    </div>
                    <span className="hidden md:inline text-xs text-navy font-bold leading-none">{currentUser.name}</span>
                  </div>

                  {/* Logout Button */}
                  <button
                    onClick={onLogoutCustomer}
                    className="p-1.5 sm:p-2 text-rose-500 hover:text-white bg-rose-50 hover:bg-rose-500 rounded-xl sm:rounded-2xl transition-all cursor-pointer"
                    title="تسجيل الخروج"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </div>
              ) : (
                <button
                  onClick={onOpenCustomerModal}
                  className="flex items-center space-x-1.5 space-x-reverse px-2 sm:px-4 py-2 sm:py-2.5 bg-gold/10 hover:bg-gold text-gold-dark hover:text-navy rounded-xl sm:rounded-2xl text-xs font-black transition-all duration-300 border border-gold/10"
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
