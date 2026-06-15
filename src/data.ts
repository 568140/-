import { Product, Coupon, CurrencyConfig, Category } from './types';

export const INITIAL_PRODUCTS: Product[] = [];

export const INITIAL_COUPONS: Coupon[] = [
  { code: 'WEL20', discountType: 'percentage', discountValue: 20 },
  { code: 'DDUKAN50', discountType: 'fixed', discountValue: 50, minSpend: 200 },
  { code: 'SAVE10', discountType: 'percentage', discountValue: 10 }
];

export const CATEGORIES: Category[] = [
  { name: 'الأزياء الراقية', subcategories: ['الملابس التقليدية', 'فساتين سهرة', 'بدلات رسمية', 'عبايات ملكية'] },
  { name: 'العطور والعود', subcategories: ['أدهان العود الصافية', 'البخور واللبان', 'عطور النيش', 'عطورات فرنسية'] },
  { name: 'المجوهرات والساعات', subcategories: ['ساعات سويسرية', 'مجوهرات زفاف', 'أطقم إكسسوارات', 'أقلام وكبكات'] },
  { name: 'الجمال والعناية', subcategories: ['عناية بالبشرة', 'مكياج ماركات كبرى', 'منتجات الجسم', 'أجهزة الجمال'] },
  { name: 'المنزل واللايف ستايل', subcategories: ['ديكورات فاخرة', 'قهوة مختصة', 'أدوات مائدة وكريستال', 'معطرات منزلية'] },
  { name: 'ركن الهدايا', subcategories: ['صناديق هدايا VIP', 'تغليف ملكي', 'بطاقات إلكترونية'] }
];

export const CURRENCIES: CurrencyConfig[] = [
  { code: 'YER', symbol: 'ر.ي', rate: 1.0, nameAr: 'ريال يمني' }
];

