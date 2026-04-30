/**
 * willdstore — ui.js
 * Все функции рендера страниц и UI-компонентов.
 * Разделение: ui.js = вёрстка; cart.js = данные; app.js = init.
 */

/* ══════════════════════════════════════
   ВСПОМОГАТЕЛЬНЫЕ UI-КОМПОНЕНТЫ
   ══════════════════════════════════════ */

/** Хлебные крошки (BreadcrumbList Schema.org) */
function breadcrumbHtml(items) {
  const schemaItems = items.map((it, idx) => ({
    "@type": "ListItem",
    "position": idx + 1,
    "name": it.label,
    "item": it.href ? `https://willdstore.ru/${it.href}` : undefined
  }));
  injectJsonLd({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": schemaItems
  });

  return `<nav class="breadcrumb" aria-label="Навигация по сайту">
    <ol class="breadcrumb__list">
      ${items.map((it, idx) => `
        <li class="breadcrumb__item ${idx === items.length - 1 ? "breadcrumb__item--current" : ""}">
          ${it.href
            ? `<a href="${it.href}" class="breadcrumb__link">${it.label}</a>`
            : `<span aria-current="page">${it.label}</span>`}
          ${idx < items.length - 1 ? '<span class="breadcrumb__sep" aria-hidden="true">/</span>' : ""}
        </li>`).join("")}
    </ol>
  </nav>`;
}

/** Карточка товара */
function productCardHtml(p) {
  const isFav      = Favorites.has(p.id);
  const discount   = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
  const inCartQty  = Cart.load().find(i => i.productId === p.id)?.qty || 0;

  return `
  <article class="product-card" data-product-id="${p.id}"
    itemscope itemtype="https://schema.org/Product">
    <meta itemprop="name" content="${p.name}">
    <meta itemprop="brand" content="${p.brand}">
    <meta itemprop="price" content="${p.price}">
    <meta itemprop="priceCurrency" content="RUB">

    <!-- Бейджи -->
    <div class="product-card__badges" aria-label="Метки товара">
      ${p.isNew && !p.isHit ? '<span class="badge badge--new">New</span>' : ""}
      ${p.isHit             ? '<span class="badge badge--hit">Хит</span>'  : ""}
      ${discount            ? `<span class="badge badge--sale">−${discount}%</span>` : ""}
    </div>

    <!-- Избранное -->
    <button
      class="product-card__fav ${isFav ? "is-active" : ""}"
      onclick="toggleFav(${p.id}, this)"
      aria-label="${isFav ? "Убрать из избранного" : "Добавить в избранное"}"
      aria-pressed="${isFav}">
      <i class="${isFav ? "fas" : "far"} fa-heart" aria-hidden="true"></i>
    </button>

    <!-- Фото -->
    <a href="#/product/${p.id}" class="product-card__img-wrap" tabindex="-1" aria-label="${p.name}">
      <img
        src="${p.image}"
        alt="${p.name} — купить в willdstore"
        class="product-card__img"
        loading="lazy"
        decoding="async"
        width="400"
        height="500"
        itemprop="image">
    </a>

    <!-- Тело -->
    <div class="product-card__body">
      <p class="product-card__brand">${p.brand}</p>
      <a href="#/product/${p.id}" class="product-card__title-link">
        <h3 class="product-card__name">${p.name}</h3>
      </a>

      <!-- Рейтинг -->
      <div class="product-card__rating"
        itemprop="aggregateRating"
        itemscope itemtype="https://schema.org/AggregateRating">
        <span class="stars" aria-label="Рейтинг ${p.rating} из 5">${starsHtml(p.rating)}</span>
        <span class="product-card__reviews" itemprop="reviewCount">(${p.reviewCount})</span>
        <meta itemprop="ratingValue" content="${p.rating}">
      </div>

      <!-- Цена + кнопка -->
      <div class="product-card__footer">
        <div class="product-card__prices">
          <span class="product-card__price">${formatPrice(p.price)}</span>
          ${p.oldPrice ? `<span class="product-card__old-price">${formatPrice(p.oldPrice)}</span>` : ""}
        </div>
        <button
          class="btn btn--icon btn--primary product-card__add ${inCartQty ? "is-in-cart" : ""}"
          onclick="addToCart(${p.id})"
          aria-label="Добавить ${p.name} в корзину">
          <i class="${inCartQty ? "fas fa-check" : "fas fa-plus"}" aria-hidden="true"></i>
        </button>
      </div>
    </div>
  </article>`;
}

/* ══════════════════════════════════════
   ГЛОБАЛЬНЫЕ ХЕНДЛЕРЫ (вызываются из HTML)
   ══════════════════════════════════════ */

/** Добавить в корзину (из карточки или страницы товара) */
function addToCart(id, qty = 1, size = null) {
  const p = getProductById(id);
  if (!p) return;

  // Если товар с размерами — берём выбранный
  if (size === null && p.sizes.length > 1 && p.sizes[0] !== "ONE SIZE") {
    const activeSizeBtn = document.querySelector(".size-btn.is-active");
    size = activeSizeBtn ? activeSizeBtn.dataset.size : p.sizes[0];
  }

  Cart.add(id, qty, size);
  updateCartBadge();
  Toast.show(`«${p.name}» добавлен в корзину`, "success");

  // Анимируем кнопку
  const btn = document.querySelector(`[data-product-id="${id}"] .product-card__add`);
  if (btn) {
    btn.classList.add("is-in-cart");
    btn.querySelector("i").className = "fas fa-check";
  }
}

/** Переключить избранное */
function toggleFav(id, btn) {
  const isNowFav = Favorites.toggle(id);
  btn.classList.toggle("is-active", isNowFav);
  btn.setAttribute("aria-pressed", isNowFav);
  btn.setAttribute("aria-label", isNowFav ? "Убрать из избранного" : "Добавить в избранное");
  btn.querySelector("i").className = isNowFav ? "fas fa-heart" : "far fa-heart";
  Toast.show(isNowFav ? "Добавлено в избранное" : "Удалено из избранного",
    isNowFav ? "success" : "info");
  updateFavBadge();
}

/** Обновить бейдж корзины во всех точках */
function updateCartBadge() {
  const cnt = Cart.count();
  document.querySelectorAll(".cart-badge").forEach(el => {
    el.textContent   = cnt;
    el.style.display = cnt > 0 ? "flex" : "none";
    el.setAttribute("aria-label", `Товаров в корзине: ${cnt}`);
  });
}

/** Обновить бейдж избранного */
function updateFavBadge() {
  const cnt = Favorites.count();
  document.querySelectorAll(".fav-badge").forEach(el => {
    el.textContent   = cnt;
    el.style.display = cnt > 0 ? "flex" : "none";
  });
}

/** Обновить кнопку авторизации в шапке */
function updateAuthBtn() {
  const user   = Auth.current();
  const authEl = document.getElementById("header-auth-btn");
  if (!authEl) return;
  if (user) {
    authEl.innerHTML = `
      <span class="header__user-avatar" aria-hidden="true">${user.name[0].toUpperCase()}</span>`;
    authEl.title     = user.name;
    authEl.setAttribute("aria-label", `Личный кабинет — ${user.name}`);
  } else {
    authEl.innerHTML = `<i class="fas fa-user" aria-hidden="true"></i>`;
    authEl.title     = "Войти";
    authEl.setAttribute("aria-label", "Войти в аккаунт");
  }
}

/* ══════════════════════════════════════
   СТРАНИЦА: ГЛАВНАЯ
   ══════════════════════════════════════ */
function renderHome() {
  setMeta({
    title:       "Купить брендовую одежду и аксессуары с доставкой по России",
    description: "Оригинальный стиль, проверка качества перед отправкой, быстрая доставка по РФ. Футболки, худи, аксессуары топовых брендов.",
    keywords:    "брендовая одежда, polo ralph lauren, hellstar, chrome hearts, hermes, купить онлайн"
  });
  setActiveNav("#/");

  // Хиты и новинки БЕЗ пересечений
  const hits     = getHits(6);
  const newItems = getNewArrivals(6);

  document.getElementById("app").innerHTML = `

  <!-- ── HERO ── -->
  <section class="hero" aria-label="Главный баннер willdstore">
    <div class="container">
      <div class="hero__inner">
        <div class="hero__content">
          <span class="hero__label">
            <i class="fas fa-bolt" aria-hidden="true"></i>
            Новая коллекция 2025
          </span>
          <h1 class="hero__title">
            Брендовый стиль —<br>
            <span class="hero__title-accent">доступные цены</span>
          </h1>
          <p class="hero__subtitle">
            Polo Ralph Lauren, Hellstar, Chrome Hearts, Hermes и другие топ-бренды.
            Проверяем каждую вещь перед отправкой.
          </p>
          <div class="hero__actions">
            <a href="#/catalog" class="btn btn--accent btn--lg">
              <i class="fas fa-shopping-bag" aria-hidden="true"></i>
              Смотреть каталог
            </a>
            <a href="#/catalog?sort=new" class="btn btn--outline-light btn--lg">
              Новинки
            </a>
          </div>
          <div class="hero__stats" aria-label="Статистика магазина">
            <div class="hero__stat">
              <span class="hero__stat-num">500+</span>
              <span class="hero__stat-label">товаров</span>
            </div>
            <div class="hero__stat">
              <span class="hero__stat-num">12 000+</span>
              <span class="hero__stat-label">клиентов</span>
            </div>
            <div class="hero__stat">
              <span class="hero__stat-num">4.9★</span>
              <span class="hero__stat-label">рейтинг</span>
            </div>
          </div>
        </div>
        <div class="hero__visual" aria-hidden="true">
          ${hits.slice(0, 2).map(p => `
          <div class="hero__card">
            <img src="${p.image}" alt="" class="hero__card-img" loading="lazy" decoding="async" width="200" height="267">
            <div class="hero__card-body">
              <p class="hero__card-name">${p.name}</p>
              <p class="hero__card-price">${formatPrice(p.price)}</p>
            </div>
          </div>`).join("")}
        </div>
      </div>
    </div>
  </section>

  <!-- ── КАТЕГОРИИ ── -->
  <section class="section" aria-labelledby="cats-heading">
    <div class="container">
      <div class="section-head">
        <span class="section-head__label">Каталог</span>
        <h2 class="section-head__title" id="cats-heading">Выберите категорию</h2>
      </div>
      <div class="cats-grid">
        ${[
          { id:"clothes",     label:"Одежда",     icon:"fa-tshirt",       count: PRODUCTS.filter(p=>p.category==="clothes").length },
          { id:"bags",        label:"Сумки",       icon:"fa-shopping-bag", count: PRODUCTS.filter(p=>p.category==="bags").length },
          { id:"accessories", label:"Аксессуары",  icon:"fa-hat-cowboy",   count: PRODUCTS.filter(p=>p.category==="accessories").length }
        ].map(c => `
        <a href="#/catalog?category=${c.id}" class="cat-card" aria-label="${c.label} — ${c.count} товара">
          <span class="cat-card__icon"><i class="fas ${c.icon}" aria-hidden="true"></i></span>
          <span class="cat-card__name">${c.label}</span>
          <span class="cat-card__count">${c.count} товара</span>
        </a>`).join("")}
      </div>
    </div>
  </section>

  <!-- ── ХИТЫ ПРОДАЖ ── -->
  <section class="section section--muted" aria-labelledby="hits-heading">
    <div class="container">
      <div class="section-head">
        <span class="section-head__label"><i class="fas fa-fire" aria-hidden="true"></i> Хиты</span>
        <h2 class="section-head__title" id="hits-heading">Хиты продаж</h2>
        <p class="section-head__sub">Самые популярные товары нашего магазина</p>
      </div>
      <div class="products-grid" role="list">
        ${hits.map(p => `<div role="listitem">${productCardHtml(p)}</div>`).join("")}
      </div>
      <div class="section-foot">
        <a href="#/catalog" class="btn btn--outline">Весь каталог <i class="fas fa-arrow-right" aria-hidden="true"></i></a>
      </div>
    </div>
  </section>

  <!-- ── НОВИНКИ (без пересечения с хитами) ── -->
  ${newItems.length ? `
  <section class="section" aria-labelledby="new-heading">
    <div class="container">
      <div class="section-head">
        <span class="section-head__label"><i class="fas fa-star" aria-hidden="true"></i> Новинки</span>
        <h2 class="section-head__title" id="new-heading">Свежие поступления</h2>
        <p class="section-head__sub">Только что добавлены в магазин</p>
      </div>
      <div class="products-grid" role="list">
        ${newItems.map(p => `<div role="listitem">${productCardHtml(p)}</div>`).join("")}
      </div>
    </div>
  </section>` : ""}

  <!-- ── ПРЕИМУЩЕСТВА (обновлённые тексты) ── -->
  <section class="section advantages" aria-labelledby="adv-heading">
    <div class="container">
      <div class="section-head">
        <span class="section-head__label">Почему мы</span>
        <h2 class="section-head__title" id="adv-heading">Наши преимущества</h2>
      </div>
      <div class="adv-grid">
        ${[
          {
            icon: "fa-search",
            title: "Проверка перед отправкой",
            text:  "Проверяем швы, фурнитуру и маркировку каждого изделия — вы получите именно то, что заказали."
          },
          {
            icon: "fa-shipping-fast",
            title: "Отправка в день заказа",
            text:  "Отправляем день-в-день при заказе до 16:00. Трек-номер приходит в Telegram за 2 часа."
          },
          {
            icon: "fa-undo",
            title: "7 дней на возврат",
            text:  "Без вопросов и споров. Оформите возврат онлайн — курьер сам заберёт по вашему адресу."
          },
          {
            icon: "fa-headset",
            title: "Поддержка 24/7",
            text:  "Отвечаем в WhatsApp, Telegram и по email. Решим любой вопрос за 30 минут."
          }
        ].map(a => `
        <article class="adv-card">
          <div class="adv-card__icon" aria-hidden="true">
            <i class="fas ${a.icon}"></i>
          </div>
          <h3 class="adv-card__title">${a.title}</h3>
          <p class="adv-card__text">${a.text}</p>
        </article>`).join("")}
      </div>
    </div>
  </section>

  <!-- ── ОТЗЫВЫ ── -->
  <section class="section section--muted" aria-labelledby="reviews-heading"
    data-component="reviews"
    data-source="local"
    <!-- TODO: Supabase API — data-source="supabase" data-table="reviews" -->
    >
    <div class="container">
      <div class="section-head">
        <span class="section-head__label">Отзывы</span>
        <h2 class="section-head__title" id="reviews-heading">Что говорят покупатели</h2>
      </div>
      <div class="reviews-grid">
        ${REVIEWS.map(r => reviewCardHtml(r)).join("")}
      </div>
    </div>
  </section>

  <!-- ── РАССЫЛКА ── -->
  <section class="section newsletter" aria-labelledby="nl-heading">
    <div class="container newsletter__inner">
      <div class="newsletter__text">
        <h2 class="newsletter__title" id="nl-heading">Будьте в курсе новинок</h2>
        <p class="newsletter__sub">
          Подпишитесь и получите промокод <strong>FIRST15</strong> на первый заказ
        </p>
      </div>
      <form class="newsletter-form" onsubmit="subscribeNewsletter(event)"
        aria-label="Форма подписки на рассылку" novalidate>
        <label for="nl-email" class="sr-only">Ваш email</label>
        <input
          type="email"
          id="nl-email"
          class="newsletter-form__input"
          placeholder="Ваш email"
          required
          autocomplete="email"
          aria-required="true">
        <button type="submit" class="btn btn--primary newsletter-form__btn">
          Подписаться
        </button>
      </form>
    </div>
  </section>`;
}

function subscribeNewsletter(e) {
  e.preventDefault();
  Toast.show("Вы подписаны! Промокод FIRST15 отправлен на email", "success");
  e.target.reset();
}

/** Карточка отзыва */
function reviewCardHtml(r) {
  const product = getProductById(r.productId);
  return `
  <article class="review-card"
    itemscope itemtype="https://schema.org/Review"
    data-review-id="${r.id}"
    <!-- TODO: Supabase — data-db-id="${r.id}" для обновления -->
    >
    <div class="review-card__head">
      <div class="review-card__avatar" aria-hidden="true">
        ${r.avatar
          ? `<img src="${r.avatar}" alt="${r.name}" loading="lazy" decoding="async" width="48" height="48">`
          : `<span class="review-card__initials">${r.name[0]}</span>`}
      </div>
      <div class="review-card__meta">
        <p class="review-card__name" itemprop="author">${r.name}</p>
        <p class="review-card__city">${r.city}</p>
      </div>
      <div class="review-card__rating" aria-label="Оценка ${r.rating} из 5"
        itemprop="reviewRating" itemscope itemtype="https://schema.org/Rating">
        <meta itemprop="ratingValue" content="${r.rating}">
        <span class="stars">${starsHtml(r.rating)}</span>
      </div>
    </div>
    <blockquote class="review-card__text" itemprop="reviewBody">
      "${r.text}"
    </blockquote>
    ${product ? `<p class="review-card__product">
      О товаре: <a href="#/product/${product.id}">${product.name}</a>
    </p>` : ""}
  </article>`;
}

/* ══════════════════════════════════════
   СТРАНИЦА: КАТАЛОГ
   ══════════════════════════════════════ */
let catalogState = {
  category: "all",
  brand:    "all",
  minPrice: 0,
  maxPrice: 99999,
  sort:     "default",
  search:   "",
  page:     1
};
const PER_PAGE = 8;

function renderCatalog(params = {}) {
  // Обновляем состояние из query-params
  if (params.category && params.category !== catalogState.category) {
    catalogState.category = params.category;
    catalogState.page     = 1;
  }
  if (params.sort) catalogState.sort = params.sort;

  setMeta({
    title:       "Каталог брендовой одежды и аксессуаров",
    description: "Широкий выбор брендовой одежды, сумок и аксессуаров в willdstore. Фильтрация по бренду, цене и категории.",
    keywords:    "каталог, брендовая одежда, сумки, аксессуары, купить"
  });
  setActiveNav("#/catalog");

  const brands = getUniqueBrands();

  document.getElementById("app").innerHTML = `
  <div class="container section-sm">
    ${breadcrumbHtml([
      { label: "Главная", href: "#/" },
      { label: "Каталог" }
    ])}

    <h1 class="page-title">Каталог товаров</h1>

    <div class="catalog-layout">
      <!-- ── ФИЛЬТР (sidebar) ── -->
      <aside class="filter-panel" id="filter-panel" aria-label="Фильтры каталога">
        <div class="filter-panel__head">
          <h2 class="filter-panel__title">
            <i class="fas fa-sliders-h" aria-hidden="true"></i> Фильтры
          </h2>
          <button class="btn btn--ghost btn--sm filter-panel__reset"
            onclick="resetFilters()" aria-label="Сбросить все фильтры">
            Сбросить
          </button>
        </div>

        <!-- Категория -->
        <div class="filter-group">
          <p class="filter-group__label" id="filter-cat-label">Категория</p>
          <div class="filter-group__options" role="group" aria-labelledby="filter-cat-label">
            ${CATEGORIES.map(c => `
            <button
              class="filter-chip ${catalogState.category === c.id ? "is-active" : ""}"
              onclick="setFilter('category','${c.id}')"
              aria-pressed="${catalogState.category === c.id}">
              ${c.label}
            </button>`).join("")}
          </div>
        </div>

        <!-- Бренд -->
        <div class="filter-group">
          <p class="filter-group__label" id="filter-brand-label">Бренд</p>
          <div class="filter-group__options filter-group__options--col" role="group" aria-labelledby="filter-brand-label">
            <button
              class="filter-chip ${catalogState.brand === "all" ? "is-active" : ""}"
              onclick="setFilter('brand','all')"
              aria-pressed="${catalogState.brand === "all"}">
              Все бренды
            </button>
            ${brands.map(b => `
            <button
              class="filter-chip ${catalogState.brand === b ? "is-active" : ""}"
              onclick="setFilter('brand','${b}')"
              aria-pressed="${catalogState.brand === b}">
              ${b}
            </button>`).join("")}
          </div>
        </div>

        <!-- Цена -->
        <div class="filter-group">
          <p class="filter-group__label" id="filter-price-label">Цена, ₽</p>
          <div class="price-range" role="group" aria-labelledby="filter-price-label">
            <div class="price-range__inputs">
              <label class="sr-only" for="price-min">Минимальная цена</label>
              <input type="number" id="price-min" class="price-range__input"
                value="${catalogState.minPrice || ""}" placeholder="от" min="0"
                onchange="setFilter('minPrice', +this.value || 0)"
                aria-label="Минимальная цена">
              <span class="price-range__sep" aria-hidden="true">—</span>
              <label class="sr-only" for="price-max">Максимальная цена</label>
              <input type="number" id="price-max" class="price-range__input"
                value="${catalogState.maxPrice === 99999 ? "" : catalogState.maxPrice}" placeholder="до" min="0"
                onchange="setFilter('maxPrice', +this.value || 99999)"
                aria-label="Максимальная цена">
            </div>
          </div>
        </div>
      </aside>

      <!-- ── ОСНОВНАЯ ОБЛАСТЬ ── -->
      <section aria-label="Список товаров">
        <!-- Тулбар -->
        <div class="catalog-toolbar">
          <button class="btn btn--outline btn--sm filter-toggle-btn"
            onclick="toggleFilterPanel()"
            aria-expanded="false"
            aria-controls="filter-panel"
            aria-label="Открыть панель фильтров">
            <i class="fas fa-sliders-h" aria-hidden="true"></i> Фильтры
          </button>
          <span id="catalog-count" class="catalog-toolbar__count" aria-live="polite"></span>
          <label class="sr-only" for="catalog-sort">Сортировка</label>
          <select id="catalog-sort" class="catalog-sort"
            onchange="setFilter('sort', this.value)"
            aria-label="Сортировка товаров">
            <option value="default">По умолчанию</option>
            <option value="price-asc">Цена: по возрастанию</option>
            <option value="price-desc">Цена: по убыванию</option>
            <option value="rating">По рейтингу</option>
            <option value="new">Сначала новинки</option>
          </select>
        </div>

        <!-- Сетка товаров -->
        <div id="products-grid" class="products-grid" role="list">
          <!-- рендерится через drawCatalogProducts() -->
        </div>

        <!-- Пагинация -->
        <nav id="pagination" class="pagination" aria-label="Страницы каталога"></nav>
      </section>
    </div>
  </div>`;

  drawCatalogProducts();
}

function drawCatalogProducts() {
  const all   = filterProducts(catalogState);
  const total = all.length;
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  catalogState.page = Math.min(catalogState.page, pages);
  const slice = all.slice((catalogState.page - 1) * PER_PAGE, catalogState.page * PER_PAGE);

  // Счётчик
  const countEl = document.getElementById("catalog-count");
  if (countEl) countEl.textContent = `Найдено: ${total} товаров`;

  // Сортировка — синхронизируем select
  const sortEl = document.getElementById("catalog-sort");
  if (sortEl) sortEl.value = catalogState.sort;

  // Сетка
  const grid = document.getElementById("products-grid");
  if (!grid) return;

  if (!slice.length) {
    grid.innerHTML = `
    <div class="empty-state" style="grid-column:1/-1">
      <div class="empty-state__icon" aria-hidden="true"><i class="fas fa-search"></i></div>
      <h3 class="empty-state__title">Ничего не найдено</h3>
      <p class="empty-state__text">Попробуйте изменить фильтры или <button class="btn-link" onclick="resetFilters()">сбросить их</button></p>
    </div>`;
    document.getElementById("pagination").innerHTML = "";
    return;
  }
  grid.innerHTML = slice.map(p => `<div role="listitem">${productCardHtml(p)}</div>`).join("");

  // Пагинация
  const pag = document.getElementById("pagination");
  if (pages <= 1) { pag.innerHTML = ""; return; }
  let btns = `
    <button class="page-btn" onclick="goPage(${catalogState.page - 1})"
      ${catalogState.page === 1 ? "disabled" : ""}
      aria-label="Предыдущая страница">
      <i class="fas fa-chevron-left" aria-hidden="true"></i>
    </button>`;
  for (let i = 1; i <= pages; i++) {
    btns += `<button class="page-btn ${i === catalogState.page ? "is-active" : ""}"
      onclick="goPage(${i})" aria-label="Страница ${i}" aria-current="${i === catalogState.page ? "page" : "false"}">${i}</button>`;
  }
  btns += `
    <button class="page-btn" onclick="goPage(${catalogState.page + 1})"
      ${catalogState.page === pages ? "disabled" : ""}
      aria-label="Следующая страница">
      <i class="fas fa-chevron-right" aria-hidden="true"></i>
    </button>`;
  pag.innerHTML = btns;
}

function setFilter(key, val) {
  catalogState[key] = val;
  catalogState.page = 1;
  // Обновляем aria-pressed на чипах
  document.querySelectorAll(`[onclick*="setFilter('${key}'"]`).forEach(btn => {
    const btnVal = btn.getAttribute("onclick").match(/'([^']+)'\)$/)?.[1];
    btn.setAttribute("aria-pressed", String(btnVal === String(val)));
    btn.classList.toggle("is-active", btnVal === String(val));
  });
  drawCatalogProducts();
}

function goPage(n) {
  catalogState.page = n;
  drawCatalogProducts();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetFilters() {
  catalogState = { category:"all", brand:"all", minPrice:0, maxPrice:99999, sort:"default", search:"", page:1 };
  renderCatalog();
}

function toggleFilterPanel() {
  const panel = document.getElementById("filter-panel");
  const btn   = document.querySelector(".filter-toggle-btn");
  if (!panel) return;
  const open = panel.classList.toggle("is-open");
  btn?.setAttribute("aria-expanded", String(open));
}

/* ══════════════════════════════════════
   СТРАНИЦА: КАРТОЧКА ТОВАРА
   ══════════════════════════════════════ */
function renderProduct({ id }) {
  const p = getProductById(id);
  if (!p) { Router.go("catalog"); return; }

  setMeta({
    title:       p.name,
    description: p.description,
    keywords:    p.tags.join(", "),
    ogImage:     p.image
  });
  setActiveNav("#/catalog");
  injectJsonLd(productJsonLd(p));

  const similar   = getSimilar(p, 4);
  const discount  = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;

  document.getElementById("app").innerHTML = `
  <div class="container">
    ${breadcrumbHtml([
      { label: "Главная", href: "#/" },
      { label: "Каталог", href: "#/catalog" },
      { label: p.name }
    ])}
  </div>

  <section class="product-page" aria-label="${p.name}">
    <div class="container">
      <div class="product-layout" itemscope itemtype="https://schema.org/Product">
        <meta itemprop="name" content="${p.name}">
        <meta itemprop="brand" content="${p.brand}">

        <!-- Галерея -->
        <div class="product-gallery">
          <div class="product-gallery__main">
            <img
              id="product-main-img"
              src="${p.image}"
              alt="${p.name} — ${p.brand} в willdstore"
              class="product-gallery__img"
              loading="eager"
              decoding="auto"
              width="500"
              height="667"
              itemprop="image">
          </div>
        </div>

        <!-- Инфо -->
        <div class="product-info">
          <p class="product-info__brand" itemprop="brand">${p.brand}</p>
          <h1 class="product-info__name" itemprop="name">${p.name}</h1>

          <!-- Рейтинг -->
          <div class="product-info__rating"
            itemprop="aggregateRating" itemscope itemtype="https://schema.org/AggregateRating">
            <span class="stars" aria-label="Рейтинг ${p.rating} из 5">${starsHtml(p.rating)}</span>
            <span class="product-info__rating-val">${p.rating}</span>
            <a href="#reviews" class="product-info__reviews-link">${p.reviewCount} отзывов</a>
            <meta itemprop="ratingValue" content="${p.rating}">
            <meta itemprop="reviewCount" content="${p.reviewCount}">
          </div>

          <!-- Цена -->
          <div class="product-info__prices"
            itemprop="offers" itemscope itemtype="https://schema.org/Offer">
            <meta itemprop="priceCurrency" content="RUB">
            <meta itemprop="availability" content="https://schema.org/${p.inStock ? "InStock" : "OutOfStock"}">
            <span class="product-info__price" itemprop="price" content="${p.price}">
              ${formatPrice(p.price)}
            </span>
            ${p.oldPrice ? `
            <span class="product-info__old-price">${formatPrice(p.oldPrice)}</span>
            <span class="badge badge--sale product-info__discount">−${discount}%</span>` : ""}
          </div>
          <p class="product-info__stock ${p.inStock ? "product-info__stock--in" : "product-info__stock--out"}">
            <i class="fas ${p.inStock ? "fa-check-circle" : "fa-times-circle"}" aria-hidden="true"></i>
            ${p.inStock ? "В наличии" : "Нет в наличии"}
          </p>

          <!-- Размеры -->
          ${p.sizes.length > 0 && p.sizes[0] !== "ONE SIZE" ? `
          <div class="size-picker">
            <p class="size-picker__label" id="size-label">
              Размер: <span id="size-selected">${p.sizes[0]}</span>
            </p>
            <div class="size-picker__btns" role="group" aria-labelledby="size-label">
              ${p.sizes.map((s, i) => `
              <button
                class="size-btn ${i === 0 ? "is-active" : ""}"
                data-size="${s}"
                onclick="pickSize(this)"
                aria-pressed="${i === 0}">
                ${s}
              </button>`).join("")}
            </div>
          </div>` : ""}

          <!-- Количество -->
          <div class="qty-picker">
            <p class="qty-picker__label">Количество</p>
            <div class="qty-control" role="group" aria-label="Выбор количества">
              <button class="qty-control__btn" onclick="changeQty(-1)"
                aria-label="Уменьшить количество">−</button>
              <input
                type="number"
                id="qty-input"
                class="qty-control__input"
                value="1" min="1" max="99"
                aria-label="Количество товара"
                readonly>
              <button class="qty-control__btn" onclick="changeQty(1)"
                aria-label="Увеличить количество">+</button>
            </div>
          </div>

          <!-- Кнопки действий -->
          <div class="product-actions">
            <button
              class="btn btn--primary btn--lg product-actions__add"
              onclick="addProductToCart(${p.id})"
              ${!p.inStock ? "disabled" : ""}
              aria-label="Добавить ${p.name} в корзину">
              <i class="fas fa-shopping-cart" aria-hidden="true"></i>
              В корзину
            </button>
            <button
              class="btn btn--outline btn--icon btn--lg ${Favorites.has(p.id) ? "is-active" : ""}"
              id="fav-btn-product"
              onclick="toggleFavProduct(${p.id}, this)"
              aria-label="${Favorites.has(p.id) ? "Убрать из избранного" : "Добавить в избранное"}"
              aria-pressed="${Favorites.has(p.id)}">
              <i class="${Favorites.has(p.id) ? "fas" : "far"} fa-heart" aria-hidden="true"></i>
            </button>
          </div>

          <!-- Табы: описание, характеристики, отзывы -->
          <div class="product-tabs">
            <div class="tabs-nav" role="tablist" aria-label="Информация о товаре">
              <button class="tab-btn is-active" onclick="switchTab('desc', this)"
                role="tab" aria-selected="true" aria-controls="tab-desc">Описание</button>
              <button class="tab-btn" onclick="switchTab('specs', this)"
                role="tab" aria-selected="false" aria-controls="tab-specs">Характеристики</button>
              <button class="tab-btn" onclick="switchTab('reviews', this)"
                role="tab" aria-selected="false" aria-controls="tab-reviews" id="reviews">
                Отзывы (${p.reviewCount})
              </button>
            </div>
            <div class="tab-content is-active" id="tab-desc" role="tabpanel">
              <p class="tab-content__text">${p.description}</p>
            </div>
            <div class="tab-content" id="tab-specs" role="tabpanel">
              <dl class="specs-list">
                ${Object.entries(p.specs).map(([k, v]) => `
                <div class="specs-list__row">
                  <dt class="specs-list__key">${k}</dt>
                  <dd class="specs-list__val">${v}</dd>
                </div>`).join("")}
              </dl>
            </div>
            <div class="tab-content" id="tab-reviews" role="tabpanel">
              <div class="reviews-grid reviews-grid--compact">
                ${REVIEWS.filter(r => r.productId === p.id).length
                  ? REVIEWS.filter(r => r.productId === p.id).map(r => reviewCardHtml(r)).join("")
                  : `<p class="empty-reviews">Пока нет отзывов для этого товара.</p>`}
              </div>
            </div>
          </div>
        </div><!-- /product-info -->
      </div><!-- /product-layout -->

      <!-- Похожие товары -->
      ${similar.length ? `
      <section class="similar-section" aria-labelledby="similar-heading">
        <h2 class="similar-section__title" id="similar-heading">Похожие товары</h2>
        <div class="products-grid" role="list">
          ${similar.map(s => `<div role="listitem">${productCardHtml(s)}</div>`).join("")}
        </div>
      </section>` : ""}
    </div>
  </section>`;

  window._productId    = p.id;
  window._selectedSize = p.sizes[0] !== "ONE SIZE" ? p.sizes[0] : null;
}

function addProductToCart(id) {
  const qty  = parseInt(document.getElementById("qty-input")?.value, 10) || 1;
  const size = window._selectedSize;
  Cart.add(id, qty, size);
  updateCartBadge();
  const p = getProductById(id);
  Toast.show(`«${p?.name}» добавлен в корзину (${qty} шт.)`, "success");
}

function toggleFavProduct(id, btn) {
  const isNow = Favorites.toggle(id);
  btn.classList.toggle("is-active", isNow);
  btn.setAttribute("aria-pressed", String(isNow));
  btn.setAttribute("aria-label", isNow ? "Убрать из избранного" : "Добавить в избранное");
  btn.querySelector("i").className = isNow ? "fas fa-heart" : "far fa-heart";
  Toast.show(isNow ? "Добавлено в избранное" : "Удалено из избранного",
    isNow ? "success" : "info");
  updateFavBadge();
}

function pickSize(btn) {
  document.querySelectorAll(".size-btn").forEach(b => {
    b.classList.remove("is-active");
    b.setAttribute("aria-pressed", "false");
  });
  btn.classList.add("is-active");
  btn.setAttribute("aria-pressed", "true");
  window._selectedSize = btn.dataset.size;
  const lbl = document.getElementById("size-selected");
  if (lbl) lbl.textContent = btn.dataset.size;
}

function changeQty(delta) {
  const inp = document.getElementById("qty-input");
  if (!inp) return;
  inp.value = Math.max(1, Math.min(99, +inp.value + delta));
}

function switchTab(name, btn) {
  document.querySelectorAll(".tab-btn").forEach(b => {
    b.classList.remove("is-active");
    b.setAttribute("aria-selected", "false");
  });
  document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("is-active"));
  btn.classList.add("is-active");
  btn.setAttribute("aria-selected", "true");
  document.getElementById(`tab-${name}`)?.classList.add("is-active");
}

/* ══════════════════════════════════════
   СТРАНИЦА: КОРЗИНА
   ══════════════════════════════════════ */
function renderCart() {
  setMeta({ title: "Корзина", description: "Ваша корзина в willdstore" });
  setActiveNav("#/cart");

  const items = Cart.load();
  const promo = Cart.getPromo();
  const disc  = promo?.discount || 0;

  document.getElementById("app").innerHTML = `
  <div class="cart-page">
    <div class="container">
      ${breadcrumbHtml([
        { label: "Главная", href: "#/" },
        { label: "Корзина" }
      ])}
      <h1 class="page-title">
        Корзина
        ${items.length ? `<span class="page-title__count">${Cart.count()} шт.</span>` : ""}
      </h1>

      ${!items.length ? `
      <div class="empty-state">
        <div class="empty-state__icon" aria-hidden="true"><i class="fas fa-shopping-cart"></i></div>
        <h2 class="empty-state__title">Корзина пуста</h2>
        <p class="empty-state__text">Добавьте товары из каталога</p>
        <a href="#/catalog" class="btn btn--primary btn--lg">Перейти в каталог</a>
      </div>` : `

      <div class="cart-layout">
        <!-- Список товаров -->
        <div class="cart-items" id="cart-items" aria-label="Товары в корзине">
          ${items.map(item => `
          <article class="cart-item" data-key="${item._key}">
            <a href="#/product/${item.productId}" class="cart-item__img-wrap">
              <img src="${item.image}" alt="${item.name}" class="cart-item__img"
                loading="lazy" decoding="async" width="100" height="125">
            </a>
            <div class="cart-item__info">
              <a href="#/product/${item.productId}" class="cart-item__name">${item.name}</a>
              ${item.size ? `<p class="cart-item__meta">Размер: <strong>${item.size}</strong></p>` : ""}
              <p class="cart-item__meta">Цена: ${formatPrice(item.price)}</p>

              <div class="cart-item__controls">
                <div class="qty-control" role="group" aria-label="Количество ${item.name}">
                  <button class="qty-control__btn"
                    onclick="cartQty('${item.productId}','${item.size}',${item.qty - 1})"
                    aria-label="Уменьшить">−</button>
                  <input type="number" class="qty-control__input"
                    value="${item.qty}" min="1" max="99"
                    onchange="cartQty('${item.productId}','${item.size}',+this.value)"
                    aria-label="Количество">
                  <button class="qty-control__btn"
                    onclick="cartQty('${item.productId}','${item.size}',${item.qty + 1})"
                    aria-label="Увеличить">+</button>
                </div>
                <span class="cart-item__line-price">${formatPrice(item.price * item.qty)}</span>
                <button class="cart-item__remove btn btn--ghost btn--icon"
                  onclick="cartRemove('${item.productId}','${item.size}')"
                  aria-label="Удалить ${item.name} из корзины">
                  <i class="fas fa-trash-alt" aria-hidden="true"></i>
                </button>
              </div>
            </div>
          </article>`).join("")}
        </div>

        <!-- Итоговая панель -->
        <aside class="cart-summary" aria-label="Сумма заказа">
          <h2 class="cart-summary__title">Итого</h2>

          <div class="cart-summary__rows">
            <div class="cart-summary__row">
              <span>Товары (${Cart.count()} шт.)</span>
              <span>${formatPrice(Cart.subtotal())}</span>
            </div>
            <div class="cart-summary__row">
              <span>Доставка</span>
              <span class="text-success">Бесплатно</span>
            </div>
            ${promo ? `
            <div class="cart-summary__row cart-summary__row--promo">
              <span>Промокод <code>${promo.code}</code></span>
              <span class="text-danger">−${Math.round(disc * 100)}%</span>
            </div>` : ""}
          </div>

          <div class="cart-summary__total">
            <span>К оплате</span>
            <span class="cart-summary__total-val">${formatPrice(Cart.total(disc))}</span>
          </div>

          <!-- Промокод -->
          <form class="promo-form" onsubmit="applyPromo(event)" aria-label="Применить промокод" novalidate>
            <label class="sr-only" for="promo-input">Промокод</label>
            <input type="text" id="promo-input" class="promo-form__input"
              placeholder="Промокод" value="${promo?.code || ""}"
              autocomplete="off" aria-label="Введите промокод">
            <button type="submit" class="btn btn--outline btn--sm">Применить</button>
          </form>
          <div id="promo-msg" aria-live="polite"></div>

          <a href="#/checkout" class="btn btn--primary btn--full btn--lg cart-summary__cta">
            Оформить заказ <i class="fas fa-arrow-right" aria-hidden="true"></i>
          </a>
          <a href="#/catalog" class="btn btn--ghost btn--full" style="margin-top:8px;text-align:center">
            <i class="fas fa-arrow-left" aria-hidden="true"></i> Продолжить покупки
          </a>
        </aside>
      </div>`}
    </div>
  </div>`;
}

function cartQty(productId, size, qty) {
  Cart.setQty(+productId, size === "null" ? null : size, qty);
  updateCartBadge();
  renderCart();
}

function cartRemove(productId, size) {
  Cart.remove(+productId, size === "null" ? null : size);
  updateCartBadge();
  renderCart();
  Toast.show("Товар удалён из корзины", "info");
}

function applyPromo(e) {
  e.preventDefault();
  const code  = document.getElementById("promo-input")?.value?.trim();
  const msgEl = document.getElementById("promo-msg");
  if (!code) return;
  const promo = Cart.applyPromo(code);
  if (promo) {
    msgEl.innerHTML = `<p class="promo-ok"><i class="fas fa-check" aria-hidden="true"></i> ${promo.label} применена!</p>`;
    renderCart();
  } else {
    msgEl.innerHTML = `<p class="promo-err"><i class="fas fa-times" aria-hidden="true"></i> Промокод не найден</p>`;
  }
}

/* ══════════════════════════════════════
   СТРАНИЦА: ОФОРМЛЕНИЕ ЗАКАЗА
   ══════════════════════════════════════ */
function renderCheckout() {
  if (!Cart.count()) { Router.go("cart"); return; }
  setMeta({ title: "Оформление заказа", description: "Оформите заказ в willdstore" });
  setActiveNav("#/cart");

  const promo = Cart.getPromo();
  const disc  = promo?.discount || 0;

  document.getElementById("app").innerHTML = `
  <div class="checkout-page">
    <div class="container">
      ${breadcrumbHtml([
        { label: "Главная",  href: "#/" },
        { label: "Корзина",  href: "#/cart" },
        { label: "Оформление заказа" }
      ])}
      <h1 class="page-title">Оформление заказа</h1>

      <div class="checkout-layout">
        <!-- Форма -->
        <form class="checkout-form" id="checkout-form"
          onsubmit="submitOrder(event)" novalidate
          aria-label="Форма оформления заказа">

          <!-- Личные данные -->
          <fieldset class="form-section">
            <legend class="form-section__title">
              <i class="fas fa-user" aria-hidden="true"></i> Личные данные
            </legend>
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label" for="co-name">Имя и фамилия *</label>
                <input class="form-input" id="co-name" name="name" type="text"
                  required placeholder="Иван Иванов"
                  autocomplete="name" aria-required="true">
                <span class="form-error" id="err-name" role="alert"></span>
              </div>
              <div class="form-group">
                <label class="form-label" for="co-phone">Телефон *</label>
                <input class="form-input" id="co-phone" name="phone" type="tel"
                  required placeholder="+7 (900) 000-00-00"
                  pattern="^[+]?[78][\s\-]?[(]?\d{3}[)]?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}$"
                  autocomplete="tel" aria-required="true">
                <span class="form-error" id="err-phone" role="alert"></span>
              </div>
              <div class="form-group form-group--full">
                <label class="form-label" for="co-email">Email *</label>
                <input class="form-input" id="co-email" name="email" type="email"
                  required placeholder="email@example.com"
                  autocomplete="email" aria-required="true">
                <span class="form-error" id="err-email" role="alert"></span>
              </div>
            </div>
          </fieldset>

          <!-- Доставка -->
          <fieldset class="form-section">
            <legend class="form-section__title">
              <i class="fas fa-map-marker-alt" aria-hidden="true"></i> Доставка
            </legend>
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label" for="co-city">Город *</label>
                <input class="form-input" id="co-city" name="city" type="text"
                  required placeholder="Москва"
                  autocomplete="address-level2" aria-required="true">
                <span class="form-error" id="err-city" role="alert"></span>
              </div>
              <div class="form-group form-group--full">
                <label class="form-label" for="co-address">Адрес доставки *</label>
                <input class="form-input" id="co-address" name="address" type="text"
                  required placeholder="ул. Ленина, д. 1, кв. 10"
                  autocomplete="street-address" aria-required="true">
                <span class="form-error" id="err-address" role="alert"></span>
              </div>
              <div class="form-group form-group--full">
                <label class="form-label" for="co-comment">Комментарий к заказу</label>
                <textarea class="form-input form-input--textarea"
                  id="co-comment" name="comment" rows="3"
                  placeholder="Дополнительные пожелания, время доставки..."></textarea>
              </div>
            </div>

            <!-- Способ доставки -->
            <div class="delivery-options" role="radiogroup" aria-label="Способ доставки">
              ${[
                { val: "courier", icon: "fa-bicycle",  title: "Курьером",     sub: "2–3 дня · Бесплатно от 3 000 ₽" },
                { val: "pickup",  icon: "fa-store",    title: "Самовывоз",    sub: "Москва, ул. Тверская 10" },
                { val: "cdek",    icon: "fa-truck",    title: "СДЭК",         sub: "3–7 дней · от 290 ₽" }
              ].map((d, i) => `
              <label class="delivery-option" tabindex="0">
                <input type="radio" name="delivery" value="${d.val}" ${i === 0 ? "checked" : ""}
                  aria-label="${d.title}">
                <span class="delivery-option__icon"><i class="fas ${d.icon}" aria-hidden="true"></i></span>
                <span class="delivery-option__body">
                  <strong>${d.title}</strong>
                  <span>${d.sub}</span>
                </span>
              </label>`).join("")}
            </div>
          </fieldset>

          <!-- Оплата -->
          <fieldset class="form-section">
            <legend class="form-section__title">
              <i class="fas fa-credit-card" aria-hidden="true"></i> Оплата
            </legend>
            <div class="payment-options" role="radiogroup" aria-label="Способ оплаты">
              ${[
                { val: "card",   icon: "fa-credit-card", title: "Банковская карта",   sub: "Visa, Mastercard, МИР" },
                { val: "sbp",    icon: "fa-mobile-alt",  title: "СБП",               sub: "Перевод по номеру телефона" },
                { val: "cash",   icon: "fa-money-bill",  title: "Наличными",         sub: "При получении" }
              ].map((m, i) => `
              <label class="payment-option" tabindex="0">
                <input type="radio" name="payment" value="${m.val}" ${i === 0 ? "checked" : ""}
                  aria-label="${m.title}">
                <span class="payment-option__icon"><i class="fas ${m.icon}" aria-hidden="true"></i></span>
                <span class="payment-option__body">
                  <strong>${m.title}</strong>
                  <span>${m.sub}</span>
                </span>
              </label>`).join("")}
            </div>
          </fieldset>

          <!-- Согласие (ОБЯЗАТЕЛЬНО для РФ) -->
          <div class="consent-block">
            <label class="consent-label" id="consent-label">
              <input type="checkbox" id="consent-check" name="consent"
                onchange="toggleSubmitBtn()"
                aria-required="true"
                aria-describedby="consent-label">
              <span>
                Я ознакомлен и согласен с
                <a href="public-offer.html" target="_blank" rel="noopener">Публичной офертой</a>
                и
                <a href="privacy-policy.html" target="_blank" rel="noopener">Политикой конфиденциальности</a>
              </span>
            </label>
            <span class="form-error" id="err-consent" role="alert"></span>
          </div>

          <button type="submit" class="btn btn--primary btn--full btn--lg"
            id="submit-order-btn" disabled
            aria-disabled="true">
            <i class="fas fa-check" aria-hidden="true"></i>
            Подтвердить заказ · ${formatPrice(Cart.total(disc))}
          </button>
        </form>

        <!-- Мини-корзина -->
        <aside class="checkout-summary" aria-label="Состав заказа">
          <div class="cart-summary">
            <h2 class="cart-summary__title">Ваш заказ</h2>
            ${Cart.load().map(i => `
            <div class="cart-summary__row cart-summary__row--item">
              <span class="cart-summary__item-name">${i.name}
                ${i.size ? `<small>(${i.size})</small>` : ""}
                × ${i.qty}
              </span>
              <span>${formatPrice(i.price * i.qty)}</span>
            </div>`).join("")}
            <div class="cart-summary__divider"></div>
            ${promo ? `
            <div class="cart-summary__row cart-summary__row--promo">
              <span>Промокод ${promo.code}</span>
              <span class="text-danger">−${Math.round(disc * 100)}%</span>
            </div>` : ""}
            <div class="cart-summary__total">
              <span>Итого</span>
              <span class="cart-summary__total-val">${formatPrice(Cart.total(disc))}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  </div>`;
}

/** Активировать/деактивировать кнопку при изменении чекбокса */
function toggleSubmitBtn() {
  const cb  = document.getElementById("consent-check");
  const btn = document.getElementById("submit-order-btn");
  if (!cb || !btn) return;
  btn.disabled = !cb.checked;
  btn.setAttribute("aria-disabled", String(!cb.checked));
}

/** Отправить заказ */
function submitOrder(e) {
  e.preventDefault();
  const form = e.target;
  let valid  = true;

  // Простая валидация
  const fields = [
    { id: "co-name",    err: "err-name",    msg: "Введите имя и фамилию" },
    { id: "co-phone",   err: "err-phone",   msg: "Введите корректный телефон" },
    { id: "co-email",   err: "err-email",   msg: "Введите корректный email" },
    { id: "co-city",    err: "err-city",    msg: "Введите город" },
    { id: "co-address", err: "err-address", msg: "Введите адрес доставки" }
  ];

  fields.forEach(({ id, err, msg }) => {
    const inp = document.getElementById(id);
    const errEl = document.getElementById(err);
    const ok = inp?.validity?.valid && inp.value.trim();
    if (errEl) errEl.textContent = ok ? "" : msg;
    if (inp)   inp.classList.toggle("is-error", !ok);
    if (!ok)   valid = false;
  });

  if (!document.getElementById("consent-check")?.checked) {
    document.getElementById("err-consent").textContent =
      "Необходимо согласие с офертой и политикой конфиденциальности";
    valid = false;
  }

  if (!valid) {
    Toast.show("Пожалуйста, заполните все обязательные поля", "error");
    // Скроллим к первой ошибке
    const firstErr = form.querySelector(".is-error");
    firstErr?.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  const formData = {
    name:     form.querySelector("[name=name]").value.trim(),
    phone:    form.querySelector("[name=phone]").value.trim(),
    email:    form.querySelector("[name=email]").value.trim(),
    city:     form.querySelector("[name=city]").value.trim(),
    address:  form.querySelector("[name=address]").value.trim(),
    comment:  form.querySelector("[name=comment]")?.value.trim() || "",
    delivery: form.querySelector("[name=delivery]:checked")?.value || "courier",
    payment:  form.querySelector("[name=payment]:checked")?.value || "card"
  };

  // TODO: Supabase API — вместо Orders.create вызов:
  // const { data: order, error } = await supabase.from('orders').insert([{...}]).select().single();
  const order = Orders.create(formData);
  updateCartBadge();
  renderOrderSuccess(order);
}

/** Экран успеха после оформления заказа */
function renderOrderSuccess(order) {
  document.getElementById("app").innerHTML = `
  <div class="container">
    <div class="order-success">
      <div class="order-success__icon" aria-hidden="true">
        <i class="fas fa-check-circle"></i>
      </div>
      <h1 class="order-success__title">Заказ принят!</h1>
      <p class="order-success__id">Номер заказа: <strong>${order.id}</strong></p>

      <div class="order-success__info">
        <p>Мы свяжемся с вами по телефону <strong>${order.shipping.phone}</strong>
           в течение 30 минут для подтверждения.</p>
        <p>Трек-номер отправки придёт в Telegram и на почту
           <strong>${order.shipping.email}</strong> в течение 2 часов после отправки.</p>
      </div>

      <div class="order-success__payment">
        <h2 class="order-success__pay-title">Инструкция по оплате</h2>
        ${order.shipping.payment === "sbp" ? `
        <p>Переведите <strong>${formatPrice(order.total)}</strong> по СБП на номер
           <strong>+7 (900) 000-00-00</strong> (willdstore).</p>
        <p>В комментарии укажите номер заказа: <code>${order.id}</code></p>` : ""}
        ${order.shipping.payment === "card" ? `
        <p>Оплата картой при получении или по ссылке, которую пришлём в SMS.</p>
        <!-- TODO: ЮKassa/Robokassa — здесь встраивается виджет оплаты -->` : ""}
        ${order.shipping.payment === "cash" ? `
        <p>Оплата наличными при получении. Подготовьте <strong>${formatPrice(order.total)}</strong>.</p>` : ""}
      </div>

      <div class="order-success__actions">
        <a href="#/account" class="btn btn--primary btn--lg">
          <i class="fas fa-box" aria-hidden="true"></i> Мои заказы
        </a>
        <a href="#/" class="btn btn--outline btn--lg">На главную</a>
      </div>
    </div>
  </div>`;
}

/* ══════════════════════════════════════
   СТРАНИЦА: АВТОРИЗАЦИЯ
   ══════════════════════════════════════ */
function renderAuth() {
  if (Auth.isLoggedIn()) { Router.go("account"); return; }
  setMeta({ title: "Вход и регистрация", description: "Войдите или создайте аккаунт в willdstore" });

  document.getElementById("app").innerHTML = `
  <div class="auth-page">
    <div class="container">
      <div class="auth-box">
        <div class="auth-box__logo" aria-label="willdstore">
          <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden="true">
            <rect width="48" height="48" rx="12" fill="#6c3bff"/>
            <text x="24" y="32" text-anchor="middle" font-size="22"
              font-weight="900" fill="white" font-family="Inter,Arial,sans-serif">W</text>
          </svg>
        </div>
        <h1 class="auth-box__title">willdstore</h1>
        <p class="auth-box__sub">Войдите, чтобы отслеживать заказы и управлять избранным</p>

        <!-- Табы -->
        <div class="auth-tabs" role="tablist">
          <button class="auth-tab is-active" onclick="showAuthTab('login', this)"
            role="tab" aria-selected="true" aria-controls="auth-login">Вход</button>
          <button class="auth-tab" onclick="showAuthTab('register', this)"
            role="tab" aria-selected="false" aria-controls="auth-register">Регистрация</button>
        </div>

        <!-- Форма входа -->
        <form id="auth-login" class="auth-form" onsubmit="doLogin(event)" novalidate
          aria-label="Форма входа">
          <div class="form-group">
            <label class="form-label" for="login-email">Email</label>
            <input class="form-input" id="login-email" name="email" type="email"
              required placeholder="email@example.com" autocomplete="email" aria-required="true">
          </div>
          <div class="form-group">
            <label class="form-label" for="login-pass">Пароль</label>
            <input class="form-input" id="login-pass" name="password" type="password"
              required placeholder="Пароль" autocomplete="current-password" aria-required="true">
          </div>
          <p class="auth-form__error" id="login-error" role="alert" aria-live="polite"></p>
          <button type="submit" class="btn btn--primary btn--full">Войти</button>
        </form>

        <!-- Форма регистрации -->
        <form id="auth-register" class="auth-form" style="display:none"
          onsubmit="doRegister(event)" novalidate aria-label="Форма регистрации">
          <div class="form-group">
            <label class="form-label" for="reg-name">Имя</label>
            <input class="form-input" id="reg-name" name="name" type="text"
              required placeholder="Ваше имя" autocomplete="given-name" aria-required="true">
          </div>
          <div class="form-group">
            <label class="form-label" for="reg-email">Email</label>
            <input class="form-input" id="reg-email" name="email" type="email"
              required placeholder="email@example.com" autocomplete="email" aria-required="true">
          </div>
          <div class="form-group">
            <label class="form-label" for="reg-pass">Пароль (мин. 6 символов)</label>
            <input class="form-input" id="reg-pass" name="password" type="password"
              required minlength="6" placeholder="Придумайте пароль"
              autocomplete="new-password" aria-required="true">
          </div>
          <p class="auth-form__error" id="reg-error" role="alert" aria-live="polite"></p>
          <button type="submit" class="btn btn--primary btn--full">Создать аккаунт</button>
        </form>
      </div>
    </div>
  </div>`;
}

function showAuthTab(tab, btn) {
  document.querySelectorAll(".auth-tab").forEach((b, i) => {
    b.classList.toggle("is-active", (tab === "login") === (i === 0));
    b.setAttribute("aria-selected", String((tab === "login") === (i === 0)));
  });
  document.getElementById("auth-login").style.display    = tab === "login"    ? "block" : "none";
  document.getElementById("auth-register").style.display = tab === "register" ? "block" : "none";
}

function doLogin(e) {
  e.preventDefault();
  const { email, password } = Object.fromEntries(new FormData(e.target));
  const res = Auth.login(email, password);
  if (res.ok) {
    updateAuthBtn();
    Router.go("account");
    Toast.show("Добро пожаловать!", "success");
  } else {
    document.getElementById("login-error").textContent = res.error;
  }
}

function doRegister(e) {
  e.preventDefault();
  const { name, email, password } = Object.fromEntries(new FormData(e.target));
  const res = Auth.register(name, email, password);
  if (res.ok) {
    updateAuthBtn();
    Router.go("account");
    Toast.show("Аккаунт создан! Добро пожаловать!", "success");
  } else {
    document.getElementById("reg-error").textContent = res.error;
  }
}

/* ══════════════════════════════════════
   СТРАНИЦА: ЛИЧНЫЙ КАБИНЕТ
   ══════════════════════════════════════ */
function renderAccount() {
  if (!Auth.isLoggedIn()) { Router.go("auth"); return; }
  setMeta({ title: "Личный кабинет", description: "Ваш профиль и заказы в willdstore" });
  setActiveNav("#/account");

  const user   = Auth.current();
  const orders = Orders.getAll();
  const favs   = Favorites.getAll();

  document.getElementById("app").innerHTML = `
  <div class="account-page">
    <div class="container">
      <h1 class="page-title">Личный кабинет</h1>
      <div class="account-layout">

        <!-- Боковая навигация -->
        <aside class="account-sidebar" aria-label="Меню кабинета">
          <div class="account-sidebar__avatar">
            <div class="account-sidebar__ava" aria-hidden="true">${user.name[0].toUpperCase()}</div>
            <p class="account-sidebar__name">${user.name}</p>
            <p class="account-sidebar__email">${user.email}</p>
          </div>
          <nav class="account-nav" aria-label="Разделы кабинета">
            <a href="#" class="account-nav__link is-active" id="acc-tab-orders"
              onclick="showAccTab('orders', event)">
              <i class="fas fa-box" aria-hidden="true"></i> Мои заказы
            </a>
            <a href="#" class="account-nav__link" id="acc-tab-favorites"
              onclick="showAccTab('favorites', event)">
              <i class="fas fa-heart" aria-hidden="true"></i> Избранное
            </a>
            <a href="#" class="account-nav__link" id="acc-tab-profile"
              onclick="showAccTab('profile', event)">
              <i class="fas fa-user" aria-hidden="true"></i> Профиль
            </a>
            <a href="#" class="account-nav__link account-nav__link--danger"
              onclick="doLogout(event)">
              <i class="fas fa-sign-out-alt" aria-hidden="true"></i> Выйти
            </a>
          </nav>
        </aside>

        <!-- Контент -->
        <main class="account-content" id="account-content" aria-live="polite">
          ${ordersTabHtml(orders)}
        </main>
      </div>
    </div>
  </div>`;
}

function ordersTabHtml(orders) {
  return `
  <h2 class="account-content__title">Мои заказы</h2>
  ${orders.length ? `
  <div class="orders-list">
    ${orders.map(o => `
    <article class="order-card">
      <div class="order-card__head">
        <span class="order-card__id">${o.id}</span>
        <span class="order-card__date">${new Date(o.createdAt).toLocaleDateString("ru-RU")}</span>
        <span class="order-card__status badge badge--status">${o.status}</span>
      </div>
      <p class="order-card__items">${o.items.map(i => i.name).join(", ")}</p>
      <div class="order-card__foot">
        <span class="order-card__total">${formatPrice(o.total)}</span>
        <span class="order-card__delivery">
          <i class="fas fa-truck" aria-hidden="true"></i> ${o.shipping.method}
        </span>
      </div>
    </article>`).join("")}
  </div>` :
  `<div class="empty-state">
    <div class="empty-state__icon" aria-hidden="true"><i class="fas fa-box-open"></i></div>
    <h3 class="empty-state__title">Заказов пока нет</h3>
    <a href="#/catalog" class="btn btn--primary" style="margin-top:16px">Перейти в каталог</a>
  </div>`}`;
}

function showAccTab(tab, e) {
  if (e) e.preventDefault();
  const user   = Auth.current();
  const orders = Orders.getAll();
  const favs   = Favorites.getAll();
  const cnt    = document.getElementById("account-content");

  // Подсветка активного пункта
  document.querySelectorAll(".account-nav__link").forEach(a => a.classList.remove("is-active"));
  document.getElementById(`acc-tab-${tab}`)?.classList.add("is-active");

  if (tab === "orders") {
    cnt.innerHTML = ordersTabHtml(orders);
  } else if (tab === "favorites") {
    cnt.innerHTML = `
    <h2 class="account-content__title">Избранное</h2>
    ${favs.length
      ? `<div class="products-grid">${favs.map(p => productCardHtml(p)).join("")}</div>`
      : `<div class="empty-state">
          <div class="empty-state__icon" aria-hidden="true"><i class="far fa-heart"></i></div>
          <h3 class="empty-state__title">Избранное пусто</h3>
          <a href="#/catalog" class="btn btn--primary" style="margin-top:16px">В каталог</a>
        </div>`}`;
  } else if (tab === "profile") {
    cnt.innerHTML = `
    <h2 class="account-content__title">Мой профиль</h2>
    <div class="profile-form">
      <div class="form-group" style="max-width:400px">
        <label class="form-label">Имя</label>
        <input class="form-input" value="${user.name}" disabled aria-label="Ваше имя">
      </div>
      <div class="form-group" style="max-width:400px;margin-top:14px">
        <label class="form-label">Email</label>
        <input class="form-input" value="${user.email}" disabled aria-label="Ваш email">
      </div>
      <p style="margin-top:16px;font-size:.85rem;color:var(--text-muted)">
        Аккаунт создан: ${new Date(user.createdAt).toLocaleDateString("ru-RU")}
      </p>
      <p style="margin-top:8px;font-size:.82rem;color:var(--text-light)">
        <!-- TODO: Supabase Auth — редактирование профиля -->
        Смена пароля и данных — в разработке
      </p>
    </div>`;
  }
}

function doLogout(e) {
  if (e) e.preventDefault();
  Auth.logout();
  updateAuthBtn();
  Router.go("");
  Toast.show("Вы вышли из аккаунта", "info");
}

/* ══════════════════════════════════════
   СТРАНИЦА: ПОИСК
   ══════════════════════════════════════ */
function doSearch(query) {
  if (!query?.trim()) return;
  catalogState = {
    category: "all", brand: "all", minPrice: 0, maxPrice: 99999,
    sort: "default", search: query.trim(), page: 1
  };
  window.location.hash = "#/catalog";
}

/* ══════════════════════════════════════
   СТРАНИЦА: 404
   ══════════════════════════════════════ */
function render404() {
  document.getElementById("app").innerHTML = `
  <div class="container" style="text-align:center;padding:100px 20px">
    <p class="text-muted" style="font-size:6rem;font-weight:900;line-height:1;color:var(--primary)">404</p>
    <h1 style="margin:16px 0 8px">Страница не найдена</h1>
    <p style="color:var(--text-muted);margin-bottom:28px">
      Возможно, она была удалена или вы ввели неверный адрес
    </p>
    <a href="#/" class="btn btn--primary btn--lg">На главную</a>
  </div>`;
}
