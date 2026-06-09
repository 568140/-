import { Product, Coupon, CurrencyConfig } from './types';

export const INITIAL_PRODUCTS: Product[] = [];

export const INITIAL_COUPONS: Coupon[] = [];

export const CATEGORIES = ['الكل', 'إلكترونيات', 'عطور وبخور', 'قهوة ومستلزمات', 'ملابس وأزياء'];

export const CURRENCIES: CurrencyConfig[] = [
  { code: 'YER', symbol: 'ر.ي', rate: 1.0, nameAr: 'ريال يمني' }
];

