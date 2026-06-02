import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Star, SlidersHorizontal, ArrowUpDown, Plus, Check, ShoppingBag, X, MessageSquare, Send, User, Sparkles, ShieldCheck, Truck, PlayCircle, Trophy, Video } from 'lucide-react';
import { Product, CurrencyConfig, PromoBanner } from '../types';

interface StoreFrontProps {
  products: Product[];
  categories: { name: string; subcategories: string[]; }[];
  siteSettings: import('../types').SiteSettings;
  onAddToCart: (product: Product, selectedSize?: string) => void;
  selectedCurrency: CurrencyConfig;
  onAddReview: (productId: string, rating: number, comment: string, username: string) => void;
}

export function StoreFront({ 
  products, 
  categories, 
  siteSettings,
  onAddToCart,
  selectedCurrency,
  onAddReview
}: StoreFrontProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [selectedSubCategory, setSelectedSubCategory] = useState('الكل');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSizeForModal, setSelectedSizeForModal] = useState<string>('');
  const [sortBy, setSortBy] = useState<'recommended' | 'price-asc' | 'price-desc' | 'rating'>('recommended');
  const [priceRange, setPriceRange] = useState<number>(2000);
  const [notification, setNotification] = useState<{ name: string; size?: string } | null>(null);

  // New review form states
  const [newReviewName, setNewReviewName] = useState('');
  const [newReviewRating, setNewReviewRating] = useState<number>(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Convert prices dynamically helper
  const formatPrice = (sarPrice: number) => {
    const converted = sarPrice * selectedCurrency.rate;
    // Show 2 decimals for non-SAR currencies, or round if needed
    const decimals = selectedCurrency.code === 'SAR' ? 0 : 2;
    return `${converted.toFixed(decimals)} ${selectedCurrency.symbol}`;
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setSelectedSizeForModal(product.sizes?.[0] || '');
  };

  // Filter and sort computation
  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        const matchesCategory = selectedCategory === 'الكل' || product.category === selectedCategory;
        const matchesSubCategory = selectedSubCategory === 'الكل' || !product.subCategory || product.subCategory === selectedSubCategory;
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              product.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPrice = product.price <= priceRange;
        return matchesCategory && matchesSubCategory && matchesSearch && matchesPrice;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'rating') return b.rating - a.rating;
        // Default to isFeatured first, then ID
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return 0;
      });
  }, [products, searchQuery, selectedCategory, selectedSubCategory, sortBy, priceRange]);

  const handleAddToCartWithAlert = (product: Product, size?: string) => {
    const chosenSize = size || product.sizes?.[0] || '';
    onAddToCart(product, chosenSize);
    setNotification({ name: product.name, size: chosenSize });
    setTimeout(() => {
      setNotification(null);
    }, 2500);
  };

  const handleReviewSubmit = (e: React.FormEvent, productId: string) => {
    e.preventDefault();
    if (!newReviewName.trim() || !newReviewComment.trim()) return;

    onAddReview(productId, newReviewRating, newReviewComment, newReviewName);
    
    // Update local modal state immediately so rating stays correct
    if (selectedProduct && selectedProduct.id === productId) {
      const updatedReviews = selectedProduct.reviews ? [...selectedProduct.reviews] : [];
      const newDetailReview = {
        id: String(Date.now()),
        username: newReviewName,
        rating: newReviewRating,
        comment: newReviewComment,
        date: new Date().toISOString().split('T')[0]
      };
      
      const newAverageRating = Number(
        ((updatedReviews.reduce((sum, r) => sum + r.rating, 0) + newReviewRating) / (updatedReviews.length + 1)).toFixed(1)
      );

      setSelectedProduct({
        ...selectedProduct,
        rating: newAverageRating,
        reviews: [...updatedReviews, newDetailReview]
      });
    }

    setNewReviewName('');
    setNewReviewComment('');
    setNewReviewRating(5);
    setReviewSuccess(true);
    setTimeout(() => setReviewSuccess(false), 3000);
  };

  // HERO SECTION - Now includes Dynamic Promo Banners
  // Ad rendering helper
  const renderAds = (location: 'top_header' | 'between_products' | 'sidebar' | 'footer' | 'after_cart') => {
    const activeAds = (siteSettings?.adScripts || []).filter(ad => ad.isActive && ad.location === location);
    if (activeAds.length === 0) return null;

    return (
      <div className={`ad-container ad-${location} my-4 space-y-4`}>
        {activeAds.map(ad => (
          <div 
            key={ad.id} 
            className="flex items-center justify-center overflow-hidden rounded-xl bg-gray-50/50 backdrop-blur-sm border border-gray-100"
            dangerouslySetInnerHTML={{ __html: ad.code }} 
          />
        ))}
      </div>
    );
  };

  const activeBanners = (siteSettings?.promoBanners || []).filter(b => b.isActive);

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {renderAds('top_header')}
      
      {/* Dynamic Add to Cart Notification bar */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-24 left-4 right-4 md:left-auto md:right-8 z-55 p-4 bg-gray-900 border border-amber-500/35 text-white rounded-2xl shadow-xl flex items-center justify-between space-x-3 space-x-reverse max-w-md"
          >
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className="p-1.5 bg-amber-500 rounded-lg">
                <Check className="h-4 w-4 text-black" />
              </span>
              <div>
                <p className="text-[10px] text-amber-400 font-mono">أُضيف بنجاح إلى حقيبتك الفخمة</p>
                <p className="text-xs font-bold font-sans">{notification.name}</p>
                {notification.size && (
                  <p className="text-[10px] text-amber-200 mt-0.5 font-sans">المقاس: {notification.size}</p>
                )}
              </div>
            </div>
            <button 
              onClick={() => setNotification(null)}
              className="text-gray-400 hover:text-white p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Promo Banners Slider / Hero */}
      <div className="relative mb-12">
        {activeBanners.length > 0 ? (
          <div className="space-y-6">
            {activeBanners.map((banner, index) => {
              const customHeightVal = banner.customHeight || 550;
              const isFullWidth = banner.customWidth === 'full-width';
              const customWidthVal = banner.customWidth && banner.customWidth !== 'container' ? banner.customWidth : '100%';

              const dynamicStyle: React.CSSProperties = {
                minHeight: '300px',
                height: `${customHeightVal}px`,
                width: isFullWidth ? '100vw' : customWidthVal,
                maxWidth: isFullWidth ? '100vw' : '100%',
                marginLeft: isFullWidth ? 'calc(-50vw + 50%)' : 'auto',
                marginRight: isFullWidth ? 'calc(-50vw + 50%)' : 'auto',
                borderRadius: isFullWidth ? '0' : '2rem',
              };

              return (
                <motion.div 
                  key={banner.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={dynamicStyle}
                  className="relative overflow-hidden bg-navy text-white flex items-center shadow-2xl border border-gold/10 group"
                >
                {banner.mediaType === 'video' ? (
                  banner.mediaUrl && (
                    <video 
                      src={banner.mediaUrl}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
                    />
                  )
                ) : (
                  banner.mediaUrl && (
                    <img 
                      src={banner.mediaUrl}
                      alt={banner.title}
                      className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay group-hover:scale-105 transition-transform duration-10000"
                    />
                  )
                )}
                <div className="absolute inset-0 bg-linear-to-r from-navy via-navy/60 to-transparent pointer-events-none" />
                
                <div className="relative z-10 max-w-3xl p-6 md:p-16 text-right">
                  <motion.span 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 bg-gold/10 rounded-full text-[10px] md:text-xs font-bold text-gold tracking-widest font-display mb-6 border border-gold/20 backdrop-blur-sm shadow-lg shadow-gold/10"
                  >
                    <Sparkles className="h-3 w-3" /> عرض بلاتيني حصري
                  </motion.span>
                  <h1 className="text-4xl md:text-7xl font-black font-display tracking-tight mb-6 leading-[1.1] text-gradient-gold">
                    {banner.title}
                  </h1>
                  <p className="text-gray-200 text-sm md:text-lg font-sans mb-10 leading-relaxed max-w-xl opacity-90 font-medium">
                    {banner.subtitle}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                    <a 
                      href="#products-list"
                      className="px-10 py-5 bg-gold text-navy font-black font-display text-[13px] rounded-2xl hover:bg-white transition-all shadow-2xl hover:shadow-gold/40 hover:-translate-y-1 text-center group"
                    >
                      تسوق المجموعة الآن
                      <ArrowUpDown className="inline-block mr-2 h-4 w-4 group-hover:rotate-180 transition-transform" />
                    </a>
                  </div>
                </div>
              </motion.div>
            ); })}
          </div>
        ) : (
          /* Fallback Hero if no banners are active */
          <div className="relative rounded-[2rem] overflow-hidden bg-navy text-white min-h-[450px] md:min-h-[550px] flex items-center shadow-2xl border border-gold/10 group">
            <img 
              src="/src/assets/images/luxury_oriental_hero_display_1780193593782.png" 
              alt="Hero Display" 
              className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay"
            />
             <div className="absolute inset-0 bg-linear-to-r from-navy via-navy/80 to-transparent pointer-events-none" />
            <div className="relative z-10 max-w-3xl p-6 md:p-16 text-right">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-gold/10 rounded-full text-[10px] md:text-xs font-bold text-gold tracking-widest font-display mb-6 border border-gold/20 backdrop-blur-sm">
                <Sparkles className="h-3 w-3" /> {siteSettings.heroBadge}
              </span>
              <h1 className="text-3xl md:text-6xl font-black font-display tracking-tight mb-6 leading-[1.2] text-gradient-gold">
                {siteSettings.heroTitle}
              </h1>
              <p className="text-gray-300 text-sm md:text-lg font-sans mb-10 leading-relaxed max-w-xl opacity-90">
                {siteSettings.heroSubtitle}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                <a 
                  href="#products-list"
                  className="px-8 py-4 bg-gold text-navy font-black font-display text-sm rounded-2xl hover:bg-gold-light transition-all shadow-xl hover:shadow-gold/20 hover:-translate-y-1 text-center"
                >
                  اكتشف المجموعة البلاتينية
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter and Search Panels */}
      <div id="products-list" className="bg-white rounded-2xl p-6 shadow-xs border border-gray-150 mb-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Real-time search */}
          <div className="lg:col-span-5 relative">
            <input
              type="text"
              placeholder="ابحث بالاسم، الوصف أو التصنيف الفاخر..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-11 pl-4 py-3 bg-gray-50 border border-gray-150 focus:border-amber-500 rounded-xl focus:outline-hidden text-sm text-gray-800 placeholder-gray-400 font-sans transition-colors"
            />
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-600" />
          </div>

          {/* Pricing slider and sort filter layout */}
          <div className="lg:col-span-7 flex flex-wrap gap-4 justify-between items-center">
            {/* Price range selector */}
            <div className="w-full sm:w-auto flex items-center space-x-4 space-x-reverse bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-150">
              <SlidersHorizontal className="h-4 w-4 text-amber-700" />
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-400 font-bold font-mono">الحد الأقصى للسعر</span>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <input
                    type="range"
                    min="50"
                    max="2000"
                    step="50"
                    value={priceRange}
                    onChange={(e) => setPriceRange(Number(e.target.value))}
                    className="w-24 sm:w-32 accent-amber-600 cursor-pointer h-1.5 bg-gray-200 rounded-lg appearance-none"
                  />
                  <span className="text-xs font-bold text-amber-800 font-mono">{formatPrice(priceRange)}</span>
                </div>
              </div>
            </div>

            {/* Sorting choices */}
            <div className="w-full sm:w-auto flex items-center space-x-3 space-x-reverse bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-150">
              <ArrowUpDown className="h-4 w-4 text-amber-700" />
              <div className="flex items-center space-x-1.5 space-x-reverse">
                <span className="text-xs text-gray-500 font-sans">معيار الترتيب:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent border-0 font-bold text-xs text-gray-800 focus:outline-hidden cursor-pointer"
                >
                  <option value="recommended">الموصى به دولياً</option>
                  <option value="price-asc">السعر: الأدنى للأعلى</option>
                  <option value="price-desc">السعر: الأعلى للأدنى</option>
                  <option value="rating">بناءً على تقييمات العملاء</option>
                </select>
              </div>
            </div>
          </div>

        </div>
        
        {renderAds('sidebar')}

        {/* Categories Pills */}
        <div className="mt-8 flex flex-wrap gap-3 border-t border-gray-100 pt-8">
          <button
            onClick={() => {
              setSelectedCategory('الكل');
              setSelectedSubCategory('الكل');
            }}
            className={`px-6 py-2.5 rounded-2xl text-xs font-bold transition-all duration-500 transform ${
              selectedCategory === 'الكل'
                ? 'bg-charcoal text-gold shadow-lg scale-105'
                : 'bg-gray-100/50 hover:bg-gray-200/50 text-gray-500 hover:text-charcoal'
            }`}
          >
            الكل
          </button>
          {categories.map((catObj) => (
            <button
              key={catObj.name}
              onClick={() => {
                setSelectedCategory(catObj.name);
                setSelectedSubCategory('الكل');
              }}
              className={`px-6 py-2.5 rounded-2xl text-xs font-bold transition-all duration-500 transform ${
                selectedCategory === catObj.name
                  ? 'bg-charcoal text-gold shadow-lg scale-105'
                  : 'bg-gray-100/50 hover:bg-gray-200/50 text-gray-500 hover:text-charcoal'
              }`}
            >
              {catObj.name}
            </button>
          ))}
        </div>

        {/* Dynamic Subcategories Row */}
        {selectedCategory !== 'الكل' && (categories.find(c => c.name === selectedCategory)?.subcategories.length || 0) > 0 && (
          <div className="mt-3.5 flex flex-wrap items-center gap-1.5 bg-gray-50/50 p-2.5 rounded-2xl border border-gray-100">
            <span className="text-[10px] font-bold text-gray-400 ml-2 font-sans">الأقسام الفرعية:</span>
            <button
              onClick={() => setSelectedSubCategory('الكل')}
              className={`px-3 py-1.5 rounded-xl text-xxs font-bold transition-all cursor-pointer ${
                selectedSubCategory === 'الكل'
                  ? 'bg-amber-100/70 text-amber-900 border border-amber-200'
                  : 'bg-white hover:bg-gray-100/70 border border-gray-150 text-gray-500'
              }`}
            >
              الكل في {selectedCategory}
            </button>
            {(categories.find(c => c.name === selectedCategory)?.subcategories || []).map((sub) => (
              <button
                key={sub}
                onClick={() => setSelectedSubCategory(sub)}
                className={`px-3 py-1.5 rounded-xl text-xxs font-bold transition-all cursor-pointer ${
                  selectedSubCategory === sub
                    ? 'bg-amber-500 text-white shadow-xs border border-amber-600'
                    : 'bg-white hover:bg-gray-100/70 border border-gray-150 text-gray-500'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Products Grid Area */}
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-lg font-bold text-navy font-display flex items-center space-x-2 space-x-reverse">
          <span className="border-r-4 border-gold pr-2">الكتالوج الحصري</span>
          <span className="text-xs font-bold text-gray-400 font-mono bg-gray-100 px-3 py-1 rounded-full">{filteredProducts.length} منتج فاخر</span>
        </h2>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-dashed border-gray-200 max-w-xl mx-auto my-12">
          <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-800 font-sans mb-2">عذراً، لم نجد نتائج مطابقة لطلبك!</h3>
          <p className="text-xs text-gray-400 font-sans mb-6">يرجى تجربة كلمات بحث أخرى أو تغيير الفلاتر المحددة للبحث عن منتجك.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('الكل');
              setPriceRange(2000);
            }}
            className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-medium hover:bg-gray-800 transition-colors"
          >
            إعادة تعيين الفلاتر
          </button>
        </div>
      ) : (
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {filteredProducts.map((product, index) => (
            <React.Fragment key={product.id}>
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 }
                }}
                layout
                id={`product-card-${product.id}`}
                className="group bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col"
              >
                {/* Product Image Panel */}
                <div className="relative aspect-square overflow-hidden bg-gray-50 cursor-pointer" onClick={() => handleSelectProduct(product)}>
                  {product.image && (
                    <img
                      src={product.image}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  )}
                  
                  {product.isFeatured && (
                    <span className="absolute top-3 right-3 bg-gradient-to-r from-amber-600 to-amber-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-md">
                      مختارات النخبة
                    </span>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const shareText = `شاهد هذا المنتج الرائع: ${product.name}\nالسعر: ${product.price}\n\nزر موقع دكان الشرق لشرائه الآن!`;
                      const fallbackCopy = () => {
                        navigator.clipboard.writeText(shareText);
                        alert('تم نسخ تفاصيل المنتج ومشاركته');
                      };
                      if (navigator.share) {
                        navigator.share({
                          title: product.name,
                          text: shareText,
                          url: window.location.href,
                        }).catch((err) => {
                           console.error(err);
                           fallbackCopy();
                        });
                      } else {
                        fallbackCopy();
                      }
                    }}
                    className="absolute top-3 left-3 bg-white/90 backdrop-blur-md p-1.5 rounded-full text-navy shadow-lg hover:bg-gold transition-all cursor-pointer z-20"
                    title="مشاركة المنتج"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                  </button>

                  {product.stock === 0 && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center font-bold text-sm text-white">
                      نفذت من المخازن الدولية
                    </div>
                  )}
                  
                  <div className="absolute bottom-3 left-3 flex flex-col gap-1 items-end">
                    <span className="bg-white/95 backdrop-blur-md text-gray-850 text-[10px] font-black px-2 py-0.5 rounded-md border border-gray-100 font-sans shadow-sm">
                      {product.category}
                    </span>
                    {product.subCategory && (
                      <span className="bg-amber-600/90 backdrop-blur-md text-white text-[9px] font-bold px-1.5 py-0.2 rounded font-sans shadow-xs">
                        {product.subCategory}
                      </span>
                    )}
                    {product.videoUrl && (
                      <div className="bg-gold text-navy p-1.5 rounded-lg shadow-lg border border-white/50 animate-pulse">
                        <PlayCircle className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Product Info Section */}
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-1 space-x-reverse text-gold">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      <span className="text-xs font-bold font-mono text-navy">{product.rating}</span>
                    </div>
                    {product.pointsReward && product.pointsReward > 0 && (
                      <div className="flex items-center gap-1 bg-gold/10 text-gold-dark px-2 py-0.5 rounded-full border border-gold/10">
                        <Trophy className="h-2.5 w-2.5" />
                        <span className="text-[9px] font-black">{product.pointsReward} نقطة</span>
                      </div>
                    )}
                  </div>

                  <h3 
                    onClick={() => handleSelectProduct(product)}
                    className="text-sm md:text-base font-black text-navy font-display mb-2 group-hover:text-gold transition-colors cursor-pointer line-clamp-1"
                  >
                    {product.name}
                  </h3>
                  
                  <p className="text-[10px] md:text-xs text-gray-400 font-sans mb-4 line-clamp-2 flex-1 leading-relaxed opacity-80">
                    {product.description}
                  </p>

                  <div className="flex justify-between items-center border-t border-gray-100 pt-4 mt-auto">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 font-display uppercase tracking-widest">Price</span>
                      <span className="text-base md:text-lg font-black text-navy font-mono">
                        {formatPrice(product.price)}
                      </span>
                    </div>

                    <button
                      disabled={product.stock === 0}
                      onClick={() => handleAddToCartWithAlert(product)}
                      className={`p-2.5 md:p-3 rounded-2xl transition-all duration-300 cursor-pointer ${
                        product.stock === 0
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gold/10 text-navy hover:bg-navy hover:text-gold border border-gold/10'
                      }`}
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>

                </div>
              </motion.div>
              {/* Insert ad after every 4 products (row) */}
              {(index + 1) % 4 === 0 && (
                <div className="col-span-full">
                  {renderAds('between_products')}
                </div>
              )}
            </React.Fragment>
          ))}
        </motion.div>
      )}

      {/* Brand Identity & Contact Us (من نحن وتواصل معنا) */}
      {renderAds('footer')}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-gray-150 pt-16">
        {/* Story Section: About us */}
        <div id="about-us-section" className="bg-white rounded-3xl p-8 border border-gray-150/70 shadow-sm text-right font-sans">
          <div className="flex items-center space-x-3 space-x-reverse mb-4">
            <span className="p-2.5 bg-amber-50 rounded-2xl text-amber-600">
              <Sparkles className="h-5 w-5" />
            </span>
            <h3 className="text-md sm:text-lg font-black text-gray-900">حكايتنا وقصتنا (من نحن)</h3>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed font-sans whitespace-pre-wrap">
            {siteSettings.aboutUs}
          </p>
        </div>

        {/* Support Section: Contact us */}
        <div id="contact-us-section" className="bg-gradient-to-br from-gray-950 to-amber-950 text-white rounded-3xl p-8 border border-amber-500/20 shadow-md text-right font-sans flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-3 space-x-reverse mb-4">
              <span className="p-2.5 bg-amber-500/10 rounded-2xl text-amber-500">
                <MessageSquare className="h-5 w-5" />
              </span>
              <h3 className="text-md sm:text-lg font-black text-amber-100">تواصلوا مع الإدارة والمالك</h3>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed font-sans mb-6">
              {siteSettings.contactDescription}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between border-t border-white/10 pt-4">
            <div className="flex flex-col mb-2 sm:mb-0">
              <span className="text-[10px] text-gray-400 font-mono">رقم التواصل الموحد</span>
              <span className="text-xs sm:text-sm font-black text-amber-400 font-mono tracking-wide">{siteSettings.contactPhone}</span>
            </div>
            
            <a 
              href={`https://api.whatsapp.com/send?phone=${siteSettings.contactWhatsApp.replace(/[\s\+\-\(\)]/g, '')}&text=${encodeURIComponent('السلام عليكم يا فندم، أنا مهتم بالحصول على معروضات وخدمات دكان الشرق الفاخرة.')}`}
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl transition-all duration-300 flex items-center gap-1.5 shadow-sm scale-102 hover:scale-105"
            >
              <span>محادثة واتساب مخصصة فورية</span>
              <span>💬</span>
            </a>
          </div>
        </div>
      </div>

      {/* Product Information Dialog (Modal) */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div 
            id="product-details-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 30 }}
              className="bg-white rounded-3xl w-full max-w-4xl relative overflow-hidden shadow-2xl border border-gray-100 my-8 flex flex-col max-h-[90vh]"
            >
              <button
                onClick={() => {
                  setSelectedProduct(null);
                  setNewReviewName('');
                  setNewReviewComment('');
                }}
                className="absolute top-4 right-4 z-10 bg-white/90 hover:bg-white text-gray-700 p-2.5 rounded-full border border-gray-100 shadow-sm transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="overflow-y-auto flex-1 p-6 md:p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  
                  {/* Image/Video Column */}
                  <div>
                    <div className="aspect-square bg-gray-50 relative rounded-2xl overflow-hidden shadow-xs border border-gray-100">
                      {selectedProduct.videoUrl ? (
                         <div className="relative w-full h-full">
                            {selectedProduct.videoUrl && (
                              <video 
                                src={selectedProduct.videoUrl} 
                                controls 
                                autoPlay 
                                className="w-full h-full object-cover"
                              />
                            )}
                            <div className="absolute top-4 left-4 bg-navy/80 backdrop-blur-md text-gold text-[10px] px-3 py-1 rounded-full font-black border border-gold/20 flex items-center gap-2">
                              <Video className="h-3 w-3" /> فيديو تعريفي حصري
                            </div>
                         </div>
                      ) : (
                        selectedProduct.image && (
                          <img
                            src={selectedProduct.image}
                            alt={selectedProduct.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        )
                      )}
                      
                      {selectedProduct.stock > 0 && selectedProduct.stock < 5 && (
                        <span className="absolute bottom-4 right-4 bg-rose-650 bg-rose-600 text-white text-xs font-bold px-3 py-1 rounded-md">
                          مخزون حرج ({selectedProduct.stock} قطع متبقية)
                        </span>
                      )}
                    </div>
                  </div>
                    
                    {/* Multi-points technical specs */}
                    <div className="mt-6 bg-amber-50/40 border border-amber-500/10 rounded-xl p-4">
                      <h4 className="text-xs font-bold text-amber-900 mb-2">✨ معايير الجودة والضمان الفاخر:</h4>
                      <ul className="text-[11px] text-gray-600 space-y-1.5 list-disc list-inside">
                        <li>أصلي ١٠٠٪ مع كود التحقق من الشركة المصنعة.</li>
                        <li>مشمول بضمان دكان الشرق الذهبي لمدة عامين كاملين.</li>
                        <li>شحن آمن في طبقات عزل هوائي مضادة للصدمات.</li>
                      </ul>
                    </div>

                  {/* Information Details Column */}
                  <div className="flex flex-col justify-between">
                    <div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="inline-block px-3 py-1 bg-amber-50 text-amber-850 border border-amber-200 rounded-lg text-xs font-bold font-sans">
                          {selectedProduct.category}
                        </span>
                        {selectedProduct.subCategory && (
                          <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 border border-gray-150 rounded-lg text-xs font-bold font-sans">
                            {selectedProduct.subCategory}
                          </span>
                        )}
                      </div>

                      <h2 className="text-2xl font-black text-gray-900 font-sans mb-2 leading-snug">
                        {selectedProduct.name}
                      </h2>

                      <div className="flex items-center space-x-2 space-x-reverse mb-4">
                        <div className="flex items-center text-amber-450 text-amber-500">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`h-4 w-4 ${i < Math.floor(selectedProduct.rating) ? 'fill-current' : 'text-gray-200'}`} 
                            />
                          ))}
                        </div>
                        <span className="text-xs font-bold text-gray-700 font-mono">({selectedProduct.rating}) - {selectedProduct.reviews?.length || 0} تقييم المشتريين</span>
                      </div>

                      <p className="text-xs text-gray-600 leading-relaxed mb-4 border-b border-gray-100 pb-4">
                        {selectedProduct.description}
                      </p>

                      {/* Brand marketing promotion & purchase intent (رغبة الشراء والترويج الذكي) */}
                      <div className="mb-6 p-4 bg-linear-to-r from-amber-500/5 via-amber-500/10 to-orange-500/5 rounded-2xl border border-amber-500/10 space-y-2 text-right">
                        <div className="flex items-center gap-1.5 text-rose-600 animate-pulse text-xxs font-extrabold font-sans">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-600"></span>
                          <span>شائع الاستكشاف: يتابعه الآن ١٨ شخصاً، وتم إكمال شراء ٣ قطع منه في أقاليم اليمن والخليج مؤخراً! 🔥</span>
                        </div>
                        <div className="text-[10px] text-gray-700 leading-normal font-sans font-medium">
                          <span className="text-amber-700 font-extrabold pr-1">✨ عرض النخبة الذكي الساري:</span> 
                          <span>اشترِ قطعتين أو أكثر اليوم للحصول على شحن بلاتيني مجاني وتأمين تغليف هدايا ملكي بالحرير مجاناً.</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-400 font-sans">القيمة والعملة الحالية</span>
                          <span className="text-2xl font-black text-amber-950 font-mono">
                            {formatPrice(selectedProduct.price)}
                          </span>
                        </div>

                        <div className="text-left md:text-right">
                          <span className="block text-[10px] text-gray-400 font-sans">حالة التوفر</span>
                          <span className={`text-xs font-bold ${selectedProduct.stock > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                            {selectedProduct.stock > 0 ? `جاهز للشحن الفوري (${selectedProduct.stock} حبات)` : 'نفذ بالكامل'}
                          </span>
                        </div>
                      </div>

                      {/* Product Sizing Option Selector inside StoreFront Details Modal */}
                      {selectedProduct.sizes && selectedProduct.sizes.length > 0 && (
                        <div className="mb-6 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                          <label className="block text-[10px] font-bold text-gray-400 mb-2 font-sans">اختر مقاسك الفخم المفصل:</label>
                          <div className="flex flex-wrap gap-2">
                            {selectedProduct.sizes.map((sz) => (
                              <button
                                key={sz}
                                type="button"
                                onClick={() => setSelectedSizeForModal(sz)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition-all duration-200 cursor-pointer border ${
                                  selectedSizeForModal === sz
                                    ? 'bg-amber-600 text-white border-amber-700 shadow-sm scale-102'
                                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-350 hover:bg-gray-50'
                                }`}
                              >
                                {sz}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      disabled={selectedProduct.stock === 0}
                      onClick={() => {
                        handleAddToCartWithAlert(selectedProduct, selectedSizeForModal);
                        setSelectedProduct(null);
                      }}
                      className="w-full py-4.5 bg-gray-950 hover:bg-gray-900 text-amber-400 font-extrabold text-sm rounded-xl hover:text-white shadow-md transition-all duration-300 flex items-center justify-center space-x-2 space-x-reverse cursor-pointer disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      <ShoppingBag className="h-5 w-5 text-amber-400" />
                      <span>إضافة الفورية لحقيبة التسوق</span>
                    </button>
                  </div>

                </div>

                {/* International Reviews Panel & Reviews Generator */}
                <div className="mt-8 pt-8 border-t border-gray-150">
                  <h3 className="text-md font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-amber-500" />
                    <span>تجارب وآراء عملائنا المستوردين</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* Read Reviews list */}
                    <div className="space-y-4">
                      {(!selectedProduct.reviews || selectedProduct.reviews.length === 0) ? (
                        <p className="text-xs text-gray-400 italic">كن أول من يقيم هذا المنتج العالمي ويبدي رأيه الموثوق!</p>
                      ) : (
                        <div className="space-y-3 max-h-76 overflow-y-auto pr-2">
                          {selectedProduct.reviews.map((rev) => (
                            <div key={rev.id} className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs font-bold text-gray-800 flex items-center gap-1">
                                  <User className="h-3 w-3 text-amber-600 bg-amber-50 rounded-full p-0.5" />
                                  {rev.username}
                                </span>
                                <span className="text-[10px] text-gray-400 font-mono">{rev.date}</span>
                              </div>
                              <div className="flex items-center text-amber-400 mb-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star 
                                    key={i} 
                                    className={`h-3 w-3 ${i < rev.rating ? 'fill-current' : 'text-gray-200'}`} 
                                  />
                                ))}
                              </div>
                              <p className="text-[11px] text-gray-650 text-gray-600 leading-normal">{rev.comment}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Write Review Form */}
                    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-150">
                      <h4 className="text-xs font-bold text-gray-800 mb-3">شارك تجربتك مع دكان الشرق:</h4>
                      
                      {reviewSuccess && (
                        <div className="mb-3 p-2.5 bg-emerald-50 text-emerald-800 rounded-lg text-xxs font-semibold">
                          ✓ نشكرك على تقييمك! تم إدراج تقييمك وتحديث جودة المنتج بنجاح.
                        </div>
                      )}

                      <form onSubmit={(e) => handleReviewSubmit(e, selectedProduct.id)} className="space-y-3">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-650 mb-1">الاسم الكامل لحضرتكم</label>
                          <input
                            type="text"
                            required
                            placeholder="أحمد العلي"
                            value={newReviewName}
                            onChange={(e) => setNewReviewName(e.target.value)}
                            className="w-full px-3 py-2 text-xs bg-white border border-gray-150 rounded-lg focus:outline-hidden focus:border-amber-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-gray-655 mb-1">اختر التقييم بالنجوم</label>
                          <div className="flex items-center space-x-1 space-x-reverse">
                            {[1, 2, 3, 4, 5].map((num) => (
                              <button
                                type="button"
                                key={num}
                                onClick={() => setNewReviewRating(num)}
                                className="p-1 cursor-pointer"
                              >
                                <Star className={`h-5 w-5 ${num <= newReviewRating ? 'text-amber-500 fill-current' : 'text-gray-300'}`} />
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-gray-655 mb-1">تعليقك وتقييمك للمنتج</label>
                          <textarea
                            rows={2}
                            required
                            placeholder="اكتب ملاحظاتك الصادقة حول الجودة، سرعة التسليم وملمس السلعة..."
                            value={newReviewComment}
                            onChange={(e) => setNewReviewComment(e.target.value)}
                            className="w-full px-3 py-2 text-xs bg-white border border-gray-150 rounded-lg focus:outline-hidden focus:border-amber-500 resize-none"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xxs font-bold flex items-center justify-center space-x-1.5 space-x-reverse transition-colors cursor-pointer"
                        >
                          <Send className="h-3 w-3" />
                          <span>إرسال التقييم الموثق</span>
                        </button>
                      </form>
                    </div>

                  </div>
                </div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
