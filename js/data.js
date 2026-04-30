/**
 * willdstore — data.js
 * Единый источник данных: товары, категории, промокоды.
 * Структура товара совместима с будущей схемой PostgreSQL.
 * TODO: Supabase API — заменить PRODUCTS на fetch('/api/products')
 */

/* ══════════════════════════════════════
   ТОВАРЫ
   Поля: id, slug, name, brand, category, price, oldPrice,
         image, rating, reviewCount, isNew, isHit, inStock,
         description, sizes, specs, tags
   ══════════════════════════════════════ */
const PRODUCTS = [
  {
    id: 1,
    slug: "polo-ralph-lauren-sweater",
    name: "Свитер Polo Ralph Lauren",
    brand: "Polo Ralph Lauren",
    category: "clothes",
    price: 2490,
    oldPrice: 3200,
    image: "https://placehold.co/400x500/1a1a2e/ffffff?text=Polo+Sweater",
    rating: 4.8,
    reviewCount: 37,
    isNew: false,
    isHit: true,
    inStock: true,
    description: "Классический свитер Polo Ralph Lauren из премиального хлопка. Вышитый логотип, рёберный трикотаж на манжетах и воротнике. Проверено швы и фурнитура перед отправкой.",
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    specs: { "Материал": "100% хлопок", "Страна": "США", "Уход": "Стирка 30°C" },
    tags: ["свитер", "polo", "ralph lauren", "джемпер"]
  },
  {
    id: 2,
    slug: "santa-barbara-bag",
    name: "Сумка Santa Barbara",
    brand: "Santa Barbara",
    category: "bags",
    price: 3490,
    oldPrice: 4800,
    image: "https://placehold.co/400x500/16213e/ffffff?text=Santa+Barbara+Bag",
    rating: 4.6,
    reviewCount: 19,
    isNew: true,
    isHit: false,
    inStock: true,
    description: "Стильная сумка Santa Barbara из экокожи. Вместительное отделение, несколько карманов, регулируемый ремень.",
    sizes: ["ONE SIZE"],
    specs: { "Материал": "Экокожа", "Размер": "35×25×12 см", "Застёжка": "Молния" },
    tags: ["сумка", "santa barbara", "кожа"]
  },
  {
    id: 3,
    slug: "vivienne-westwood-scarf",
    name: "Шарф Vivienne Westwood",
    brand: "Vivienne Westwood",
    category: "accessories",
    price: 2790,
    oldPrice: 3500,
    image: "https://placehold.co/400x500/0f3460/ffffff?text=VW+Scarf",
    rating: 4.7,
    reviewCount: 14,
    isNew: false,
    isHit: true,
    inStock: true,
    description: "Роскошный шарф Vivienne Westwood с фирменным принтом. Мягкая шерсть с шёлком, тонкая бахрома по краям.",
    sizes: ["ONE SIZE"],
    specs: { "Материал": "80% шерсть, 20% шёлк", "Длина": "180 см", "Страна": "Великобритания" },
    tags: ["шарф", "vivienne westwood", "аксессуар", "зима"]
  },
  {
    id: 4,
    slug: "nefor-hat",
    name: "Шапка нефорская",
    brand: "willdstore",
    category: "accessories",
    price: 690,
    oldPrice: 990,
    image: "https://placehold.co/400x500/533483/ffffff?text=Nefor+Hat",
    rating: 4.3,
    reviewCount: 11,
    isNew: false,
    isHit: false,
    inStock: true,
    description: "Яркая шапка в неформальном streetwear стиле. Плотный трикотаж, удобная посадка для города.",
    sizes: ["ONE SIZE"],
    specs: { "Материал": "Акрил", "Сезон": "Зима/Осень", "Стиль": "Streetwear" },
    tags: ["шапка", "неформал", "streetwear", "зима"]
  },
  {
    id: 5,
    slug: "hellstar-tshirt",
    name: "Футболка Hellstar",
    brand: "Hellstar",
    category: "clothes",
    price: 1290,
    oldPrice: 1800,
    image: "https://placehold.co/400x500/1b1b2f/ffffff?text=Hellstar+Tee",
    rating: 4.9,
    reviewCount: 27,
    isNew: true,
    isHit: true,
    inStock: true,
    description: "Культовая оверсайз-футболка Hellstar с графическим принтом. 100% хлопок, 220 г/м². Обязательная вещь для ценителей streetwear.",
    sizes: ["S", "M", "L", "XL", "XXL"],
    specs: { "Материал": "100% хлопок, 220 г/м²", "Крой": "Оверсайз", "Уход": "Стирка 30°C" },
    tags: ["футболка", "hellstar", "streetwear", "oversize"]
  },
  {
    id: 6,
    slug: "vivienne-westwood-wallet",
    name: "Кошелёк Vivienne Westwood",
    brand: "Vivienne Westwood",
    category: "accessories",
    price: 1290,
    oldPrice: 1800,
    image: "https://placehold.co/400x500/2d132c/ffffff?text=VW+Wallet",
    rating: 4.5,
    reviewCount: 22,
    isNew: false,
    isHit: false,
    inStock: true,
    description: "Компактный кошелёк Vivienne Westwood из натуральной кожи. Орбитальная фурнитура, 8 кармашков для карт.",
    sizes: ["ONE SIZE"],
    specs: { "Материал": "Натуральная кожа", "Карманы для карт": "8", "Размер": "10×8 см" },
    tags: ["кошелёк", "vivienne westwood", "кожа"]
  },
  {
    id: 7,
    slug: "psd-boxers",
    name: "Трусы PSD",
    brand: "PSD",
    category: "clothes",
    price: 1420,
    oldPrice: 1900,
    image: "https://placehold.co/400x500/162447/ffffff?text=PSD+Boxers",
    rating: 4.4,
    reviewCount: 18,
    isNew: false,
    isHit: false,
    inStock: true,
    description: "Боксёры PSD с брендовым принтом. Широкая резинка, влагоотводящий материал Modal+Spandex, анатомический крой.",
    sizes: ["S", "M", "L", "XL", "XXL"],
    specs: { "Материал": "Modal+Spandex", "Крой": "Боксёры", "Уход": "Машинная стирка" },
    tags: ["трусы", "psd", "бельё", "underwear"]
  },
  {
    id: 8,
    slug: "polo-ralph-lauren-pants",
    name: "Штаны Polo Ralph Lauren",
    brand: "Polo Ralph Lauren",
    category: "clothes",
    price: 2790,
    oldPrice: 3600,
    image: "https://placehold.co/400x500/1c1c3b/ffffff?text=Polo+Pants",
    rating: 4.7,
    reviewCount: 35,
    isNew: false,
    isHit: true,
    inStock: true,
    description: "Классические брюки Polo Ralph Lauren. Прямой силуэт, хлопково-полиэстерная смесь, вышитый логотип.",
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    specs: { "Материал": "60% хлопок, 40% полиэстер", "Крой": "Прямой", "Страна": "США" },
    tags: ["штаны", "polo", "ralph lauren", "брюки"]
  },
  {
    id: 9,
    slug: "uspa-hat",
    name: "Шапка USPA",
    brand: "USPA",
    category: "accessories",
    price: 1590,
    oldPrice: 2100,
    image: "https://placehold.co/400x500/2c3e50/ffffff?text=USPA+Hat",
    rating: 4.6,
    reviewCount: 27,
    isNew: true,
    isHit: false,
    inStock: true,
    description: "Вязаная шапка US Polo Assn. Тёплая акриловая смесь, вышитый логотип, универсальный фасон.",
    sizes: ["ONE SIZE"],
    specs: { "Материал": "Акрил", "Бренд": "USPA", "Сезон": "Зима/Осень" },
    tags: ["шапка", "uspa", "us polo", "зима"]
  },
  {
    id: 10,
    slug: "chrome-hearts-hat",
    name: "Шапка Chrome Hearts",
    brand: "Chrome Hearts",
    category: "accessories",
    price: 1590,
    oldPrice: 2200,
    image: "https://placehold.co/400x500/2f1b69/ffffff?text=Chrome+Hearts+Hat",
    rating: 4.9,
    reviewCount: 17,
    isNew: true,
    isHit: true,
    inStock: true,
    description: "Шапка Chrome Hearts с фирменным крестом. Премиальный мерино-вул, вышивка серебряной нитью.",
    sizes: ["ONE SIZE"],
    specs: { "Материал": "100% мерино", "Вышивка": "Серебряная нить", "Страна": "США" },
    tags: ["шапка", "chrome hearts", "люкс", "streetwear"]
  },
  {
    id: 11,
    slug: "hermes-wallet",
    name: "Портмоне Hermes",
    brand: "Hermes",
    category: "accessories",
    price: 4490,
    oldPrice: 5900,
    image: "https://placehold.co/400x500/8b6914/ffffff?text=Hermes+Wallet",
    rating: 5.0,
    reviewCount: 12,
    isNew: false,
    isHit: true,
    inStock: true,
    description: "Портмоне Hermes из зернистой телячьей кожи. 8 кармашков для карт, потайной карман, фирменная гравировка.",
    sizes: ["ONE SIZE"],
    specs: { "Материал": "Телячья кожа", "Карманы": "8+1", "Размер": "11×9 см" },
    tags: ["портмоне", "hermes", "кожа", "люкс"]
  },
  {
    id: 12,
    slug: "hermes-luggage",
    name: "Чемодан Hermes",
    brand: "Hermes",
    category: "bags",
    price: 6490,
    oldPrice: 8500,
    image: "https://placehold.co/400x500/704214/ffffff?text=Hermes+Luggage",
    rating: 4.8,
    reviewCount: 9,
    isNew: false,
    isHit: false,
    inStock: true,
    description: "Дорожный чемодан Hermes. Поликарбонат, бесшумные колёса 360°, замок TSA, объём 65 л.",
    sizes: ["ONE SIZE"],
    specs: { "Материал": "Поликарбонат", "Объём": "65 л", "Замок": "TSA", "Колёса": "360°" },
    tags: ["чемодан", "hermes", "дорожный", "люкс"]
  },
  {
    id: 13,
    slug: "zara-bag",
    name: "Сумка Zara",
    brand: "Zara",
    category: "bags",
    price: 1290,
    oldPrice: 1800,
    image: "https://placehold.co/400x500/22223b/ffffff?text=Zara+Bag",
    rating: 4.5,
    reviewCount: 31,
    isNew: true,
    isHit: false,
    inStock: true,
    description: "Трендовая сумка Zara из матовой экокожи. Магнитная застёжка, внутренний карман на молнии, съёмный ремень.",
    sizes: ["ONE SIZE"],
    specs: { "Материал": "Экокожа", "Размер": "30×22×10 см", "Застёжка": "Магнитная" },
    tags: ["сумка", "zara", "тренд", "экокожа"]
  }
];

/* ══════════════════════════════════════
   КАТЕГОРИИ
   ══════════════════════════════════════ */
const CATEGORIES = [
  { id: "all",         label: "Все товары",  icon: "fa-th" },
  { id: "clothes",     label: "Одежда",      icon: "fa-tshirt" },
  { id: "bags",        label: "Сумки",       icon: "fa-shopping-bag" },
  { id: "accessories", label: "Аксессуары",  icon: "fa-hat-cowboy" }
];

/* ══════════════════════════════════════
   ПРОМОКОДЫ
   ══════════════════════════════════════ */
const PROMO_CODES = {
  "WILD10":  { discount: 0.10, label: "Скидка 10%" },
  "SAVE20":  { discount: 0.20, label: "Скидка 20%" },
  "FIRST15": { discount: 0.15, label: "Скидка 15% для новых" }
};

/* ══════════════════════════════════════
   ОТЗЫВЫ — готова к подгрузке из БД
   TODO: Supabase API → fetch('/api/reviews')
   ══════════════════════════════════════ */
const REVIEWS = [
  {
    id: 1,
    name: "Дмитрий К.",
    city: "Москва",
    rating: 5,
    text: "Заказал футболку Hellstar — пришла за день, упакована идеально. Проверили швы, всё аккуратно. Буду брать ещё!",
    avatar: null, // TODO: Supabase Storage URL
    productId: 5,
    createdAt: "2025-04-10T10:00:00Z"
  },
  {
    id: 2,
    name: "Алина М.",
    city: "Санкт-Петербург",
    rating: 5,
    text: "Сумка Santa Barbara выглядит точь-в-точь как на фото. Качество отличное, отправили трек-номер в Telegram за 1,5 часа после заказа.",
    avatar: null,
    productId: 2,
    createdAt: "2025-04-08T14:30:00Z"
  },
  {
    id: 3,
    name: "Игорь В.",
    city: "Казань",
    rating: 4,
    text: "Штаны Polo Ralph Lauren пришли чуть дольше обычного, но качество на высоте. Служба поддержки ответила сразу в WhatsApp.",
    avatar: null,
    productId: 8,
    createdAt: "2025-04-05T09:15:00Z"
  },
  {
    id: 4,
    name: "Карина Ш.",
    city: "Екатеринбург",
    rating: 5,
    text: "Шапка Chrome Hearts — просто огонь! Упаковка премиальная, без брака. Возврат не понадобился, но знаю, что там всё просто.",
    avatar: null,
    productId: 10,
    createdAt: "2025-04-02T16:45:00Z"
  }
];

/* ══════════════════════════════════════
   ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
   ══════════════════════════════════════ */

/** Получить товар по ID */
function getProductById(id) {
  return PRODUCTS.find(p => p.id === +id) || null;
}

/** Получить товар по slug */
function getProductBySlug(slug) {
  return PRODUCTS.find(p => p.slug === slug) || null;
}

/** Похожие товары (та же категория, другой ID) */
function getSimilar(product, limit = 4) {
  return PRODUCTS
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, limit);
}

/**
 * Фильтрация + сортировка товаров
 * Используется каталогом и поиском.
 * @param {object} opts
 * @param {string} opts.category  - "all" | "clothes" | "bags" | "accessories"
 * @param {string} opts.brand     - "all" | название бренда
 * @param {number} opts.minPrice  - минимальная цена
 * @param {number} opts.maxPrice  - максимальная цена
 * @param {string} opts.sort      - "default" | "price-asc" | "price-desc" | "rating" | "new"
 * @param {string} opts.search    - строка поиска
 * @returns {Array} отфильтрованный массив товаров
 */
function filterProducts({
  category = "all",
  brand    = "all",
  minPrice = 0,
  maxPrice = Infinity,
  sort     = "default",
  search   = ""
} = {}) {
  let result = PRODUCTS.filter(p => {
    const q        = search.toLowerCase().trim();
    const catOk    = category === "all" || p.category === category;
    const brandOk  = brand    === "all" || p.brand    === brand;
    const priceOk  = p.price >= minPrice && p.price <= maxPrice;
    const searchOk = !q ||
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.tags.some(t => t.includes(q));
    return catOk && brandOk && priceOk && searchOk;
  });

  switch (sort) {
    case "price-asc":  result.sort((a, b) => a.price - b.price);              break;
    case "price-desc": result.sort((a, b) => b.price - a.price);              break;
    case "rating":     result.sort((a, b) => b.rating - a.rating);            break;
    case "new":        result.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0)); break;
    default: break;
  }
  return result;
}

/** Форматирование цены */
function formatPrice(n) {
  return n.toLocaleString("ru-RU") + "\u00a0₽"; // неразрывный пробел
}

/** HTML звёзд рейтинга */
function starsHtml(rating) {
  return Array.from({ length: 5 }, (_, i) => {
    if (i < Math.floor(rating)) return '<i class="fas fa-star" aria-hidden="true"></i>';
    if (i < rating)             return '<i class="fas fa-star-half-alt" aria-hidden="true"></i>';
    return                             '<i class="far fa-star" aria-hidden="true"></i>';
  }).join("");
}

/** Уникальные бренды для фильтра */
function getUniqueBrands() {
  return [...new Set(PRODUCTS.map(p => p.brand))].sort();
}

/**
 * Хиты продаж — только isHit, без пересечения с «только isNew»
 * Чтобы избежать дублей: хиты = isHit; новинки = isNew && !isHit
 */
function getHits(limit = 6)   { return PRODUCTS.filter(p => p.isHit).slice(0, limit); }
function getNewArrivals(limit = 6) { return PRODUCTS.filter(p => p.isNew && !p.isHit).slice(0, limit); }
