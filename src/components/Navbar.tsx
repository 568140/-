import React from 'react';
import { ShoppingBag, LayoutDashboard, Store, ClipboardList, Globe, ShieldCheck, Truck, RefreshCw } from 'lucide-react';
import { CurrencyConfig, SiteSettings } from '../types';
import { CURRENCIES } from '../data';

interface NavbarProps {
  currentView: 'store' | 'cart' | 'admin' | 'orders-tracking';
  setCurrentView: (view: 'store' | 'cart' | 'admin' | 'orders-tracking') => void;
  cartCount: number;
  siteSettings: SiteSettings;
  selectedCurrency: CurrencyConfig;
  setSelectedCurrency: (currency: CurrencyConfig) => void;
  currentUser: { name: string; phone: string } | null;
  onLogoutCustomer: () => void;
  onOpenCustomerModal: () => void;
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
      <nav id="main-navigation-navbar" className="bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            
            {/* Elegant Luxury Logo Concept */}
            <div 
              onClick={() => setCurrentView('store')}
              className="flex items-center space-x-3 space-x-reverse cursor-pointer group"
            >
              {siteSettings.logoUrl ? (
                <img 
                  src={siteSettings.logoUrl} 
                  alt={siteSettings.storeName} 
                  className="h-12 object-contain group-hover:scale-105 transition-transform duration-300" 
                />
              ) : (
                <>
                  <div className="p-3 bg-linear-to-tr from-amber-600 to-amber-500 rounded-2xl shadow-xs group-hover:scale-105 transition-transform duration-300">
                    <ShoppingBag className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <span className="text-xl font-extrabold text-gray-900 tracking-tight font-sans block group-hover:text-amber-600 transition-colors">
                      {siteSettings.storeName}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono block tracking-wider">
                      PREMIUM QUALITY STORE
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Navigation Buttons Row */}
            <div className="flex items-center space-x-1 sm:space-x-2 space-x-reverse">
              
              <button
                onClick={() => setCurrentView('store')}
                className={`flex items-center space-x-2 space-x-reverse px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 ${
                  currentView === 'store'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-905'
                }`}
              >
                <Store className="h-4 w-4" />
                <span>المعرض العام</span>
              </button>

              <button
                onClick={() => setCurrentView('orders-tracking')}
                className={`flex items-center space-x-2 space-x-reverse px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 ${
                  currentView === 'orders-tracking'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-905'
                }`}
              >
                <ClipboardList className="h-4 w-4" />
                <span className="hidden sm:inline">تتبع طلبياتي</span>
                <span className="inline sm:hidden">طلباتي</span>
              </button>

              {isAdminLoggedIn && (
                <button
                  onClick={() => setCurrentView('admin')}
                  className={`flex items-center space-x-2 space-x-reverse px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 ${
                    currentView === 'admin'
                      ? 'bg-gray-950 text-white shadow-xs'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <LayoutDashboard className={`h-4 w-4 ${currentView === 'admin' ? 'text-white' : 'text-amber-500'}`} />
                  <span>لوحة التحكم</span>
                </button>
              )}

              {/* Separator */}
              <div className="h-6 w-px bg-gray-200 mx-1 sm:mx-2"></div>

              {/* Customer Account Button */}
              {currentUser ? (
                <div className="flex items-center space-x-3 space-x-reverse bg-white border border-amber-200 shadow-xs px-3 py-2 rounded-xl group transition-all hover:border-amber-300 hover:shadow-md">
                  <div className="flex items-center justify-center bg-amber-100 text-amber-700 w-8 h-8 rounded-full font-bold text-sm shadow-inner group-hover:bg-amber-200 transition-colors">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-[10px] text-gray-400 font-bold font-sans tracking-wide">العميل الفاخر</span>
                    <span className="text-xs text-slate-800 font-black font-sans leading-none mt-0.5">{currentUser.name}</span>
                  </div>
                  <div className="pr-2 border-r border-amber-100 mr-2">
                    <button
                      onClick={onLogoutCustomer}
                      className="text-[11px] text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded-lg font-bold transition-colors shadow-xs"
                      title="تسجيل الخروج من الحساب"
                    >
                      خروج
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={onOpenCustomerModal}
                  className="flex items-center space-x-1.5 space-x-reverse px-3 py-2 bg-amber-600/10 hover:bg-amber-600/20 text-amber-900 rounded-xl text-xs font-bold transition-all duration-300 border border-amber-600/10 cursor-pointer"
                >
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                  <span>دخول العميل</span>
                </button>
              )}

              {/* Separator */}
              <div className="h-6 w-px bg-gray-200 mx-1 sm:mx-2"></div>

              {/* Shopping Cart Trigger */}
              <button
                onClick={() => setCurrentView('cart')}
                className={`relative flex items-center space-x-2 space-x-reverse px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 ${
                  currentView === 'cart'
                    ? 'bg-amber-50 text-amber-900 border border-amber-200 shadow-xs scale-105'
                    : 'bg-gray-50 text-gray-700 hover:bg-amber-50 hover:text-amber-850 hover:border-amber-100 border border-transparent'
                }`}
              >
                <div className="relative">
                  <ShoppingBag className="h-5 w-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-3.5 -right-3.5 bg-rose-600 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center animate-bounce shadow-xs">
                      {cartCount}
                    </span>
                  )}
                </div>
                <span className="hidden md:inline pr-1 font-extrabold">السلة</span>
              </button>

            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
