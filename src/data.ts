import { Product, Coupon, CurrencyConfig } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'سماعات رأس لاسلكية إلخيت إلإضافية',
    description: 'سماعات عازلة للضوضاء عالية الجودة مع صوت محيطي ثلاثي الأبعاد وعمر بطارية يصل إلى 40 ساعة.',
    price: 349,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60',
    category: 'إلكترونيات',
    stock: 12,
    rating: 4.8,
    isFeatured: true,
    reviews: [
      { id: '1', username: 'عبدالرحمن العتيبي', rating: 5, comment: 'جودة صوت ممتازة وعزل الضجيج رائع جداً!', date: '2026-05-15' },
      { id: '2', username: 'سميرة الحربي', rating: 4, comment: 'منتج ممتاز وجميل جداً ومريح للرأس للاستماع الطويل.', date: '2026-05-19' }
    ]
  },
  {
    id: 'prod-2',
    name: 'ساعة ذكية رياضية برو',
    description: 'تتبع نشاطك ولياقتك البدنية بمراقبة نبضات القلب ومستوى الأكسجين بالدم مع نظام تحديد المواقع GPS مدمج ومقاومة للماء.',
    price: 599,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60',
    category: 'إلكترونيات',
    stock: 8,
    rating: 4.6,
    isFeatured: true,
    reviews: [
      { id: '1', username: 'محمد الشهري', rating: 5, comment: 'مقاومة الماء ممتازة وخفيفة في اليد جداً وسريعة الاستجابة.', date: '2026-05-12' }
    ]
  },
  {
    id: 'prod-3',
    name: 'عطر دهن العود الفاخر',
    description: 'مزيج فاخر من العود الكمبودي والورد الطائفي والمسك الأبيض ليعطيك رائحة شرقية كلاسيكية تدوم طويلاً.',
    price: 450,
    image: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=500&auto=format&fit=crop&q=60',
    category: 'عطور وبخور',
    stock: 15,
    rating: 4.9,
    isFeatured: true,
    reviews: [
      { id: '1', username: 'فيصل السديري', rating: 5, comment: 'رائحة ملكية فخمة جدا وثبات يدوم لأكثر من يومين داهن عود بمعنى الكلمة.', date: '2026-05-20' }
    ]
  },
  {
    id: 'prod-4',
    name: 'بخور مروكي ملكي غابات غاطس',
    description: 'كسر بخور مروكي طبيعي محسن بنسبة ثبات عالية ورائحة بخورية باردة ومميزة تناسب المناسبات والمساجد.',
    price: 280,
    image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=500&auto=format&fit=crop&q=60',
    category: 'عطور وبخور',
    stock: 20,
    rating: 4.7,
    reviews: []
  },
  {
    id: 'prod-5',
    name: 'ماكينة إسبريسو احترافية منزلية',
    description: 'استمتع بكوب إسبريسو مثالي في منزلك مع ضغط 15 بار وعصا تبخير الحليب لصنع اللاتيه والكابتشينو برغوة مثالية.',
    price: 1250,
    image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500&auto=format&fit=crop&q=60',
    category: 'قهوة ومستلزمات',
    stock: 5,
    rating: 4.9,
    isFeatured: true,
    reviews: [
      { id: '1', username: 'فاطمة الدوسري', rating: 5, comment: 'سهلة ومميزة لاستخدام الصباح السريع والتبخير ممتاز وقوي.', date: '2026-05-14' }
    ]
  },
  {
    id: 'prod-6',
    name: 'حبوب قهوة مختصة كولومبية (250 جرام)',
    description: 'قهوة كولومبية مغسولة من سلالة كاتورا ذات نوتات كرز أحمر، فانيلا، وحلاوة متوازنة. تجفيف مثالي تحت الشمس.',
    price: 65,
    image: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=500&auto=format&fit=crop&q=60',
    category: 'قهوة ومستلزمات',
    stock: 35,
    rating: 4.5,
    reviews: []
  },
  {
    id: 'prod-7',
    name: 'فستان صيفي قطني ناعم',
    description: 'فستان بأكمام طويلة وتصميم بوهيمي أنيق مصنوع من القطن الطبيعي 100% مريح للغاية للاستخدام اليومي والزيارات.',
    price: 189,
    image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=500&auto=format&fit=crop&q=60',
    category: 'ملابس وأزياء',
    stock: 14,
    rating: 4.4,
    reviews: [],
    sizes: ['S', 'M', 'L', 'XL'],
    sizeStock: { 'S': 4, 'M': 5, 'L': 3, 'XL': 2 }
  },
  {
    id: 'prod-8',
    name: 'جاكيت شتوي أنيق مقاوم للماء',
    description: 'جاكيت رجالي مبطن بالفرو الصناعي دافئ وخفيف الوزن ومناسب للأجواء الماطرة والرحلات البرية والشتوية الأنيقة.',
    price: 299,
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&auto=format&fit=crop&q=60',
    category: 'ملابس وأزياء',
    stock: 10,
    rating: 4.7,
    reviews: [],
    sizes: ['M', 'L', 'XL'],
    sizeStock: { 'M': 3, 'L': 5, 'XL': 2 }
  }
];

export const INITIAL_COUPONS: Coupon[] = [
  { code: 'WEL20', discountType: 'percentage', discountValue: 20 },
  { code: 'DDUKAN50', discountType: 'fixed', discountValue: 50, minSpend: 200 },
  { code: 'SAVE10', discountType: 'percentage', discountValue: 10 }
];

export const CATEGORIES = ['الكل', 'إلكترونيات', 'عطور وبخور', 'قهوة ومستلزمات', 'ملابس وأزياء'];

export const CURRENCIES: CurrencyConfig[] = [
  { code: 'YER', symbol: 'ر.ي', rate: 1.0, nameAr: 'ريال يمني' }
];

