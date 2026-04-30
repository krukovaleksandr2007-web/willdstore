/**
 * willdstore — router.js
 * SPA Hash-роутер.
 * Поддерживает: #/catalog  #/product/5  #/catalog?category=bags
 */

const Router = (() => {
  /** Таблица роутов: { "pattern": handlerFn } */
  const _routes = {};

  /**
   * Сопоставить hash с зарегистрированным паттерном.
   * Паттерн "product/:id" → params.id = "5"
   * Query string "?cat=bags" → params.cat = "bags"
   */
  function _match(rawHash) {
    // Разделяем path и query
    const withoutHash = rawHash.replace(/^#\/?/, "") || "home";
    const sepIdx      = withoutHash.indexOf("?");
    const rawPath     = sepIdx > -1 ? withoutHash.slice(0, sepIdx) : withoutHash;
    const rawQuery    = sepIdx > -1 ? withoutHash.slice(sepIdx + 1) : "";

    // Парсим query string → объект
    const queryParams = {};
    if (rawQuery) {
      rawQuery.split("&").forEach(pair => {
        const [k, v = ""] = pair.split("=");
        if (k) queryParams[decodeURIComponent(k)] = decodeURIComponent(v);
      });
    }

    for (const [pattern, handler] of Object.entries(_routes)) {
      const paramNames = [];
      const regexStr   = "^" + pattern.replace(/:([^/]+)/g, (_, name) => {
        paramNames.push(name);
        return "([^/]+)";
      }) + "$";
      const match = rawPath.match(new RegExp(regexStr));
      if (match) {
        const pathParams = {};
        paramNames.forEach((name, i) => {
          pathParams[name] = decodeURIComponent(match[i + 1]);
        });
        return {
          handler,
          params: { ...queryParams, ...pathParams } // path params перекрывают query
        };
      }
    }
    return null;
  }

  /** Выполнить навигацию по текущему hash */
  function _navigate() {
    const hash  = window.location.hash || "#/";
    const found = _match(hash);
    if (found) {
      found.handler(found.params);
    } else {
      _routes["404"]?.({});
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return {
    /**
     * Зарегистрировать роут.
     * @param {string} pattern  - e.g. "", "catalog", "product/:id", "404"
     * @param {function} handler - fn(params)
     */
    on(pattern, handler) {
      _routes[pattern] = handler;
      return this; // для цепочки
    },

    /** Запустить роутер */
    start() {
      window.addEventListener("hashchange", _navigate);
      _navigate();
    },

    /** Перейти на страницу */
    go(path) {
      window.location.hash = "#/" + path.replace(/^[#/]+/, "");
    }
  };
})();

/* ══════════════════════════════════════
   SEO: динамические мета-теги
   ══════════════════════════════════════ */
function setMeta({ title, description, keywords = "", ogImage = "" }) {
  // Title
  document.title = title
    ? `${title} | willdstore`
    : "Купить брендовую одежду и аксессуары с доставкой по России | willdstore";

  // Meta description
  _setMetaAttr("name", "description",
    description || "Оригинальный стиль, проверка качества перед отправкой, быстрая доставка по РФ."
  );

  // Keywords
  if (keywords) _setMetaAttr("name", "keywords", keywords);

  // Open Graph
  _setMetaAttr("property", "og:title",       document.title);
  _setMetaAttr("property", "og:description", description || "");
  if (ogImage) _setMetaAttr("property", "og:image", ogImage);

  // Twitter
  _setMetaAttr("name", "twitter:title",       document.title);
  _setMetaAttr("name", "twitter:description", description || "");
}

function _setMetaAttr(attrName, attrValue, content) {
  let el = document.querySelector(`meta[${attrName}="${attrValue}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

/* ══════════════════════════════════════
   Активная ссылка в навигации
   ══════════════════════════════════════ */
function setActiveNav(href) {
  document.querySelectorAll(".nav__link, .mobile-nav__link").forEach(a => {
    a.classList.toggle("is-active", a.getAttribute("href") === href);
    // ARIA
    a.setAttribute("aria-current", a.getAttribute("href") === href ? "page" : "false");
  });
}

/* ══════════════════════════════════════
   JSON-LD helpers
   ══════════════════════════════════════ */
function injectJsonLd(data) {
  // Удаляем предыдущий динамический LD-скрипт
  document.getElementById("jsonld-dynamic")?.remove();
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.id   = "jsonld-dynamic";
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

function productJsonLd(p) {
  return {
    "@context":     "https://schema.org",
    "@type":        "Product",
    "name":         p.name,
    "description":  p.description,
    "image":        p.image,
    "brand":        { "@type": "Brand", "name": p.brand },
    "offers": {
      "@type":         "Offer",
      "url":           `https://willdstore.ru/#/product/${p.id}`,
      "priceCurrency": "RUB",
      "price":         p.price,
      "availability":  p.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      "seller":        { "@type": "Organization", "name": "willdstore" }
    },
    "aggregateRating": {
      "@type":       "AggregateRating",
      "ratingValue": p.rating,
      "reviewCount": p.reviewCount,
      "bestRating":  "5",
      "worstRating": "1"
    }
  };
}
