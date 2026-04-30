/**
 * willdstore — app.js
 * Точка входа: регистрация роутов, инициализация событий,
 * управление шапкой (бейджи, поиск, бургер-меню).
 */

document.addEventListener("DOMContentLoaded", () => {

  /* ── Показываем страницу (убираем FOUC) ── */
  document.body.classList.add("is-loaded");

  /* ── Регистрация роутов ─────────────────── */
  Router
    .on("",             ()  => { renderHome();               setActiveNav("#/"); })
    .on("home",         ()  => { renderHome();               setActiveNav("#/"); })
    .on("catalog",      (p) => { renderCatalog(p);           setActiveNav("#/catalog"); })
    .on("product/:id",  (p) => { renderProduct(p);           setActiveNav("#/catalog"); })
    .on("cart",         ()  => { renderCart();               setActiveNav("#/cart"); })
    .on("checkout",     ()  => { renderCheckout();           setActiveNav("#/cart"); })
    .on("auth",         ()  => { renderAuth();               setActiveNav("#/auth"); })
    .on("account",      ()  => { renderAccount();            setActiveNav("#/account"); })
    .on("404",          ()  => { render404(); });

  /* ── Запуск роутера ─────────────────────── */
  Router.start();

  /* ── Первичное обновление UI ─────────────── */
  updateCartBadge();
  updateFavBadge();
  updateAuthBtn();

  /* ── Бургер-меню ─────────────────────────── */
  const burgerBtn = document.getElementById("burger-btn");
  const mobileNav = document.getElementById("mobile-nav");

  burgerBtn?.addEventListener("click", () => {
    const isOpen = mobileNav.classList.toggle("is-open");
    burgerBtn.setAttribute("aria-expanded", String(isOpen));
    mobileNav.setAttribute("aria-hidden",   String(!isOpen));
    document.body.classList.toggle("nav-open", isOpen);

    // Анимируем гамбургер → крестик
    const spans = burgerBtn.querySelectorAll("span");
    if (isOpen) {
      spans[0].style.transform = "rotate(45deg) translate(5px, 5px)";
      spans[1].style.opacity   = "0";
      spans[2].style.transform = "rotate(-45deg) translate(5px, -5px)";
    } else {
      spans.forEach(s => { s.style.transform = ""; s.style.opacity = ""; });
    }
  });

  /* Закрыть мобильное меню при клике вне */
  document.addEventListener("click", e => {
    if (
      mobileNav?.classList.contains("is-open") &&
      !mobileNav.contains(e.target) &&
      !burgerBtn?.contains(e.target)
    ) {
      closeMobileNav();
    }
  });

  /* ── Поиск в шапке ───────────────────────── */
  const searchInput = document.getElementById("header-search");
  searchInput?.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      closeMobileNav();
      doSearch(searchInput.value);
    }
  });

  const searchBtn = document.getElementById("search-btn");
  searchBtn?.addEventListener("click", () => {
    const val = searchInput?.value;
    if (val?.trim()) {
      closeMobileNav();
      doSearch(val);
    }
  });

  /* ── Глобальные горячие клавиши ──────────── */
  document.addEventListener("keydown", e => {
    // ESC — закрыть меню / фильтр
    if (e.key === "Escape") {
      closeMobileNav();
      document.getElementById("filter-panel")?.classList.remove("is-open");
      document.querySelector(".filter-toggle-btn")
        ?.setAttribute("aria-expanded", "false");
    }
    // Ctrl/Cmd + K — фокус на поиск
    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
      e.preventDefault();
      searchInput?.focus();
    }
  });

  /* ── Слушаем события из cart.js/store.js ─── */
  document.addEventListener("wds:cartUpdated",  () => updateCartBadge());
  document.addEventListener("wds:favUpdated",   () => updateFavBadge());
  document.addEventListener("wds:authChanged",  () => updateAuthBtn());

});

/* ══════════════════════════════════════
   Закрыть мобильное меню
   ══════════════════════════════════════ */
function closeMobileNav() {
  const mobileNav = document.getElementById("mobile-nav");
  const burgerBtn = document.getElementById("burger-btn");
  if (!mobileNav?.classList.contains("is-open")) return;

  mobileNav.classList.remove("is-open");
  mobileNav.setAttribute("aria-hidden", "true");
  burgerBtn?.setAttribute("aria-expanded", "false");
  document.body.classList.remove("nav-open");
  burgerBtn?.querySelectorAll("span")
    .forEach(s => { s.style.transform = ""; s.style.opacity = ""; });
}
