export interface Category {
  name: string;
  subcategories: string[];
  icon?: string;
  image?: string;
  description?: string;
}

export interface ProductReview {
  id: string;
  username: string;
  rating: number;
  comment: string;
  date: string;
}

export interface ProductVariant {
  id: string;
  colorName: string; // اسم اللون (e.g. أزرق، أحمر)
  price?: number; // السعر المخصص لهذا الخيار (إذا كان مختلف)
  stock: number; // المخزون الخاص بهذا الخيار
  sizeStock?: Record<string, number>; // توزيع المقاسات لهذا اللون بالذات
  images: string[]; // ألبوم صور مخصص لهذا اللون بالذات (يدعم حتى أكثر من 15 صورة)
  sizes?: string[]; // المقاسات المتوفرة لهذا اللون بالذات
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  subCategory?: string;
  stock: number;
  rating: number;
  isFeatured?: boolean;
  reviews?: ProductReview[];
  pointsReward?: number;
  videoUrl?: string;
  sizes?: string[];
  sizeStock?: Record<string, number>; // خرائط المقاسات لحفظ كمية كل مقاس
  code?: string; // الرمز الفريد للتنقيب والبحث والمشاركة الفائقة
  images?: string[]; // ألبوم صور إضافي عام للمنتج (يدعم رفع عدد كبير من الصور)
  variants?: ProductVariant[]; // متغيرات وخيارات الألوان والأسعار والمخزون المخصصة
  originalUrl?: string; // رابط المنتج الأصلي (مثل شي إن) للمعاينة والمصداقية
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
  selectedVariantId?: string;
  customPrice?: number; // السعر الفعلي للمتغير المختار وقت الإضافة
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  items: CartItem[];
  totalPrice: number;
  shippingCost: number;
  giftWrap: boolean;
  discountApplied: number;
  paymentMethod: 'visa' | 'mada' | 'applepay' | 'paypal' | 'cod' | 'local_wallet';
  localWalletName?: string;
  currency: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  earnedPoints?: number; // Potential points to be earned on shipment
  pointsAwarded?: boolean; // Whether the points have been awarded (on shipment)
  pointsUsed?: number; // Deducted points used for discount
}

export interface Coupon {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minSpend?: number;
}

export interface LocalWallet {
  id: string;
  name: string;
  accountNumber: string;
  iconUrl?: string; // ألوان الأيقونة أو رابط الصورة للمحفظة
  isActive: boolean;
}

export interface CustomerAccount {
  name: string;
  phone: string;
  password: string;
  points?: number;
  balance?: number;
  transactions?: Transaction[];
}

export interface Transaction {
  id: string;
  type: 'earn' | 'spend' | 'refund' | 'deposit';
  amount: number;
  unit: 'points' | 'currency';
  description: string;
  date: string;
}

export interface SiteSettings {
  storeName: string;
  heroBadge: string;
  heroTitle: string;
  aboutUs: string;
  heroSubtitle: string;
  contactDescription: string;
  contactPhone: string;
  contactWhatsApp: string;
  footerAddress: string;
  footerEmail: string;
  supportHours: string;
  copyrightText: string;
  inventoryTagline: string;
  inventorySubtitle: string;
  logoUrl: string;
  iconUrl: string;
  splashTitle?: string;
  splashSubtitle?: string;
  splashIconUrl?: string;
  splashDuration?: number;
  enableSplash?: boolean;
  splashBgColor?: string;
  splashTextColor?: string;
  seoKeywords: string;
  enableLiveChat: boolean;
  enableSocialProof: boolean;
  enableCommunityChat: boolean;
  enableAds: boolean;
  adScripts: AdScript[];
  promoBanners: PromoBanner[];
  redemptionOptions: PointRedemptionOption[];
  pointsRatio: number; // Points earned per 1 unit of currency (e.g. 1 SAR = 5 Points)
  pointsRedeemRatio: number; // Points needed to get 1 unit of currency discount (e.g. 100 points = 1 SAR)
  headerShippingText?: string;
  headerPaymentText?: string;
  headerOffersText?: string;
  enableCod?: boolean;
  enableLocalWallets?: boolean;
  enableExternalCards?: boolean;
  enableVisa?: boolean;
  enableMada?: boolean;
  enableApplePay?: boolean;
  enablePaypal?: boolean;
  codFeeAmount?: number;
  freeShippingThreshold?: number;
  localWalletsInstruction?: string;
  invoiceTitleAr?: string;
  invoiceTaxNumber?: string;
  invoiceCrNumber?: string;
  invoiceHeaderNotes?: string;
  invoiceFooterNotes?: string;
  invoiceLogoUrl?: string;
  invoiceColorAr?: string;
  invoiceShowQrCode?: boolean;
  invoiceShowPoints?: boolean;
  invoiceShowProductCode?: boolean;
  showCodFirst?: boolean;
  shippingDestinations?: ShippingDestination[]; // قائمة وجهات الشحن المخصصة
}

export interface ShippingDestination {
  id: string;
  cityAr: string;
  costSar: number;
  estDays: string;
  isActive: boolean;
}

export interface PointRedemptionOption {
  id: string;
  title: string;
  pointsRequired: number;
  rewardValue: number;
  rewardType: 'balance' | 'coupon';
  description: string;
  isActive: boolean;
}

export interface AdScript {
  id: string;
  provider: 'AdSense' | 'PropellerAds' | 'Adsterra' | 'Custom';
  location: 'top_header' | 'between_products' | 'sidebar' | 'footer' | 'after_cart';
  code: string;
  isActive: boolean;
}

export interface PromoBanner {
  id: string;
  title: string;
  subtitle: string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  isActive: boolean;
  customHeight?: number;
  customWidth?: 'container' | 'full-width' | '80%' | '70%' | '60%';
  titleColor?: string;
  titleOpacity?: number;
  subtitleColor?: string;
  subtitleOpacity?: number;
  bgColor?: string; // خلفية البنر المخصصة
  textColor?: string; // لون النص العام المخصص
}

export interface VisitorStat {
  date: string; // YYYY-MM-DD
  count: number;
}

export interface VisitorSession {
  id?: string;
  ip: string;
  country: string;
  countryCode: string;
  city: string;
  lat: number;
  lng: number;
  browser: string;
  os: string;
  deviceType: string;
  userAgent: string;
  entryTime: number;
  lastActiveTime: number;
  sessionDuration: number;
  pageViews: number;
}

export interface CurrencyConfig {
  code: string;
  symbol: string;
  rate: number; // rate relative to SAR (Saudi Riyal)
  nameAr: string;
}

export interface Store {
  id: string;
  name: string;
  ownerEmail: string;
  subdomain: string;
  createdAt: string;
  status: string;
  description?: string;
  [key: string]: any;
}

