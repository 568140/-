export interface ProductReview {
  id: string;
  username: string;
  rating: number;
  comment: string;
  date: string;
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
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize?: string;
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
}

export interface CurrencyConfig {
  code: string;
  symbol: string;
  rate: number; // rate relative to SAR (Saudi Riyal)
  nameAr: string;
}

