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
  sizes?: string[];
  sizeStock?: Record<string, number>; // خرائط المقاسات لحفظ كمية كل مقاس
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
}

export interface CurrencyConfig {
  code: string;
  symbol: string;
  rate: number; // rate relative to SAR (Saudi Riyal)
  nameAr: string;
}

