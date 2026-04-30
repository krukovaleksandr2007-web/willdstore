/**
 * willdstore — cart.js
 * Вся логика: корзина (localStorage), заказы, промокоды.
 *
 * Формат заказа совместим со схемой PostgreSQL:
 * orders(id, user_id, status, total, items jsonb, shipping jsonb, created_at)
 *
 * TODO: Supabase API — при оформлении заказа вызов:
 *   supabase.from('orders').insert({...})
 */

/* ══════════════════════════════════════
   КОРЗИНА
   ══════════════════════════════════════ */
const Cart = (() => {
  const STORAGE_KEY = "wds_cart"; // wds = willdstore

  /** Загрузить корзину из localStorage */
  function load() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }

  /** Сохранить корзину + вызвать событие обновления */
  function _save(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    _emit();
  }

  /** Диспатч кастомного события — подписчики обновляют UI */
  function _emit() {
    document.dispatchEvent(
      new CustomEvent("wds:cartUpdated", { detail: { count: count() } })
    );
  }

  /**
   * Добавить товар в корзину.
   * @param {number} productId
   * @param {number} qty
   * @param {string|null} size
   */
  function add(productId, qty = 1, size = null) {
    const items = load();
    const key   = `${productId}_${size}`;
    const idx   = items.findIndex(i => i._key === key);

    if (idx > -1) {
      items[idx].qty = Math.min(items[idx].qty + qty, 99);
    } else {
      const product = getProductById(productId);
      if (!product) return;
      items.push({
        _key:      key,          // составной ключ для быстрого поиска
        productId: product.id,
        name:      product.name,
        brand:     product.brand,
        price:     product.price,
        image:     product.image,
        size:      size,
        qty:       qty
      });
    }
    _save(items);
  }

  /**
   * Установить конкретное количество.
   * qty <= 0 → удалить позицию.
   */
  function setQty(productId, size, qty) {
    const key   = `${productId}_${size}`;
    const items = load();
    const idx   = items.findIndex(i => i._key === key);
    if (idx === -1) return;
    if (qty <= 0) {
      items.splice(idx, 1);
    } else {
      items[idx].qty = Math.min(qty, 99);
    }
    _save(items);
  }

  /** Удалить позицию из корзины */
  function remove(productId, size) {
    const key = `${productId}_${size}`;
    _save(load().filter(i => i._key !== key));
  }

  /** Полностью очистить корзину */
  function clear() {
    _save([]);
  }

  /** Суммарное число единиц товара (для бейджа) */
  function count() {
    return load().reduce((sum, i) => sum + i.qty, 0);
  }

  /** Сумма без скидки */
  function subtotal() {
    return load().reduce((sum, i) => sum + i.price * i.qty, 0);
  }

  /** Итого с применением промокода */
  function total(discountFraction = 0) {
    return Math.round(subtotal() * (1 - discountFraction));
  }

  /**
   * Применить промокод.
   * @param {string} code
   * @returns {object|null} promo или null если неверный
   */
  function applyPromo(code) {
    const promo = PROMO_CODES[(code || "").toUpperCase().trim()];
    if (promo) {
      sessionStorage.setItem(
        "wds_promo",
        JSON.stringify({ code: code.toUpperCase().trim(), ...promo })
      );
      return promo;
    }
    return null;
  }

  /** Получить текущий активный промокод */
  function getPromo() {
    try { return JSON.parse(sessionStorage.getItem("wds_promo")); }
    catch { return null; }
  }

  /** Сбросить промокод */
  function removePromo() {
    sessionStorage.removeItem("wds_promo");
  }

  return { load, add, setQty, remove, clear, count, subtotal, total, applyPromo, getPromo, removePromo };
})();

/* ══════════════════════════════════════
   ЗАКАЗЫ
   ══════════════════════════════════════ */
const Orders = (() => {
  const STORAGE_KEY = "wds_orders";

  function getAll() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
  }

  function _save(orders) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  }

  /**
   * Создать новый заказ.
   * Формат совместим с PostgreSQL-схемой:
   *
   * CREATE TABLE orders (
   *   id         TEXT PRIMARY KEY,
   *   user_id    UUID REFERENCES auth.users,   -- NULL для гостя
   *   status     TEXT DEFAULT 'pending',
   *   total      INTEGER,                       -- в копейках можно или рублях
   *   items      JSONB,
   *   shipping   JSONB,
   *   created_at TIMESTAMPTZ DEFAULT NOW()
   * );
   *
   * TODO: Supabase API
   *   const { data, error } = await supabase
   *     .from('orders')
   *     .insert([orderPayload])
   *     .select()
   *     .single();
   *
   * @param {object} shippingForm - данные из формы оформления
   * @returns {object} созданный заказ
   */
  function create(shippingForm) {
    const promo    = Cart.getPromo();
    const discount = promo ? promo.discount : 0;
    const items    = Cart.load();

    const order = {
      // Локальный ID (при миграции в Supabase заменить на UUID)
      id:        "WDS-" + Date.now(),
      // TODO: Supabase — userId: supabase.auth.getUser()?.id || null
      userId:    null,
      status:    "pending",       // pending | paid | shipped | delivered | cancelled
      subtotal:  Cart.subtotal(),
      discount:  discount,
      promoCode: promo?.code || null,
      total:     Cart.total(discount),
      // Позиции заказа — готовы к jsonb
      items: items.map(i => ({
        productId: i.productId,
        name:      i.name,
        price:     i.price,
        qty:       i.qty,
        size:      i.size
      })),
      // Данные доставки
      shipping: {
        name:     shippingForm.name,
        phone:    shippingForm.phone,
        email:    shippingForm.email,
        city:     shippingForm.city,
        address:  shippingForm.address,
        comment:  shippingForm.comment || "",
        method:   shippingForm.delivery,
        payment:  shippingForm.payment
      },
      createdAt: new Date().toISOString()
    };

    // Сохраняем локально
    const all = getAll();
    all.unshift(order);
    _save(all);

    // Чистим корзину и промокод
    Cart.clear();
    Cart.removePromo();

    return order;
  }

  /** Получить заказ по ID */
  function getById(id) {
    return getAll().find(o => o.id === id) || null;
  }

  return { getAll, create, getById };
})();

/* ══════════════════════════════════════
   ИЗБРАННОЕ
   ══════════════════════════════════════ */
const Favorites = (() => {
  const KEY = "wds_favorites";

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; }
    catch { return []; }
  }

  function _save(ids) {
    localStorage.setItem(KEY, JSON.stringify(ids));
    document.dispatchEvent(new CustomEvent("wds:favUpdated"));
  }

  function toggle(id) {
    const ids = load();
    const idx = ids.indexOf(+id);
    if (idx > -1) { ids.splice(idx, 1); } else { ids.push(+id); }
    _save(ids);
    return ids.includes(+id);
  }

  function has(id)  { return load().includes(+id); }
  function count()  { return load().length; }
  function getAll() { return load().map(id => getProductById(id)).filter(Boolean); }

  return { toggle, has, count, getAll };
})();

/* ══════════════════════════════════════
   АВТОРИЗАЦИЯ (имитация — готова к Supabase)
   TODO: Supabase API
     supabase.auth.signUp({ email, password })
     supabase.auth.signInWithPassword({ email, password })
     supabase.auth.signOut()
   ══════════════════════════════════════ */
const Auth = (() => {
  const USERS_KEY   = "wds_users";
  const SESSION_KEY = "wds_session";

  function _getUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; }
    catch { return []; }
  }

  function _setSession(user) {
    // Никогда не храним пароль в сессии!
    const { password, ...safe } = user;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(safe));
    document.dispatchEvent(new CustomEvent("wds:authChanged"));
  }

  function register(name, email, password) {
    const users = _getUsers();
    if (users.find(u => u.email === email)) {
      return { ok: false, error: "Email уже зарегистрирован" };
    }
    if (password.length < 6) {
      return { ok: false, error: "Пароль должен быть не менее 6 символов" };
    }
    const user = {
      id:        "u_" + Date.now(),
      name,
      email,
      password,  // В реальном проекте — хеш на сервере!
      createdAt: new Date().toISOString()
    };
    users.push(user);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    _setSession(user);
    return { ok: true, user };
  }

  function login(email, password) {
    const user = _getUsers().find(u => u.email === email && u.password === password);
    if (!user) return { ok: false, error: "Неверный email или пароль" };
    _setSession(user);
    return { ok: true, user };
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    document.dispatchEvent(new CustomEvent("wds:authChanged"));
  }

  function current() {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); }
    catch { return null; }
  }

  function isLoggedIn() { return !!current(); }

  return { register, login, logout, current, isLoggedIn };
})();

/* ══════════════════════════════════════
   TOAST-УВЕДОМЛЕНИЯ
   ══════════════════════════════════════ */
const Toast = (() => {
  let _container = null;

  function _getContainer() {
    if (!_container) {
      _container = document.getElementById("toast-container");
      if (!_container) {
        _container = document.createElement("div");
        _container.id = "toast-container";
        _container.className = "toast-container";
        _container.setAttribute("role", "status");
        _container.setAttribute("aria-live", "polite");
        document.body.appendChild(_container);
      }
    }
    return _container;
  }

  /**
   * Показать уведомление.
   * @param {string} msg
   * @param {"success"|"error"|"info"|"warning"} type
   * @param {number} duration - мс, 0 = не скрывать
   */
  function show(msg, type = "info", duration = 3500) {
    const iconMap = {
      success: "fa-check-circle",
      error:   "fa-times-circle",
      warning: "fa-exclamation-triangle",
      info:    "fa-info-circle"
    };
    const c = _getContainer();
    const t = document.createElement("div");
    t.className = `toast toast--${type}`;
    t.setAttribute("role", "alert");
    t.innerHTML = `
      <i class="fas ${iconMap[type] || iconMap.info}" aria-hidden="true"></i>
      <span>${msg}</span>
      <button class="toast__close" aria-label="Закрыть уведомление">
        <i class="fas fa-times" aria-hidden="true"></i>
      </button>`;
    t.querySelector(".toast__close").addEventListener("click", () => _dismiss(t));
    c.appendChild(t);

    if (duration > 0) {
      setTimeout(() => _dismiss(t), duration);
    }
  }

  function _dismiss(el) {
    if (!el || !el.parentNode) return;
    el.style.animation = "toastOut 0.3s ease forwards";
    setTimeout(() => el.remove(), 300);
  }

  return { show };
})();
