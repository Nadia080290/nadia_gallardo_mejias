/*Datos base  */
const products = [
  { id: 1, nombre: "Audífonos Bluetooth", categoria: "electronica", precio: 29990, stock: 12, enOferta: true },
  { id: 2, nombre: "Smartwatch Pro",      categoria: "electronica", precio: 79990, stock: 5  },
  { id: 3, nombre: "Sartén Antiadherente", categoria: "hogar",       precio: 15990, stock: 20, enOferta: true },
  { id: 4, nombre: "Zapatillas Urban",     categoria: "moda",        precio: 54990, stock: 8  },
  { id: 5, nombre: "Lámpara de Escritorio",categoria: "hogar",       precio: 12990, stock: 15 },
];

/* Actividad 2 Sistema de objetos */
class Producto {
  constructor({ id, nombre, categoria, precio, enOferta = false, stock = 0, imagen = "" }) {
    this.id = id;
    this.nombre = nombre;
    this.categoria = categoria;
    this.precio = Number(precio);
    this.enOferta = Boolean(enOferta);
    this.stock = Number(stock);
    this.imagen = imagen;
    this.favorito = false;
  }

  precioFormateado() { return `$${this.precio.toLocaleString("es-CL")}`; }

  aplicarDescuento(pct) {
    const p = Math.max(0, Math.min(100, Number(pct)));
    this.precio = Math.round(this.precio * (1 - p/100));
    this.enOferta = true;
    return this;
  }

  enStock() { return this.stock > 0; }

  restarStock(q = 1) {
    const n = Math.max(0, Number(q));
    if (this.stock >= n) this.stock -= n;
    return this.stock;
  }

  toggleFavorito() { this.favorito = !this.favorito; return this.favorito; }

  // Método de visualización (DOM)
  renderCard() {
    const card = document.createElement("article");
    card.className = "product-card";
    card.innerHTML = `
      <h4>${this.nombre}</h4>
      <p class="muted">${this.categoria}</p>
      <p class="price">
        <strong>${this.precioFormateado()}</strong>
        ${this.enOferta ? `<span class="muted"> • OFERTA</span>` : ""}
      </p>
      <p>${this.enStock() ? "✅ En stock" : "❌ Sin stock"}</p>
      <div style="display:flex; gap:8px; margin-top:6px;">
        <button class="btn-add" data-id="${this.id}" ${this.enStock() ? "" : "disabled"}>Agregar</button>
        <button class="btn-fav" data-id="${this.id}">${this.favorito ? "★" : "☆"}</button>
      </div>
    `;
    return card;
  }
}

/*Actividad 1 */
const Catalogo = {
  hidratar(lista) { return lista.map(o => new Producto(o)); },
  filtrar(lista, { texto = "", categoria = "", min = 0, max = Number.POSITIVE_INFINITY } = {}) {
    const t = texto.toLowerCase().trim();
    return lista.filter(p =>
      p.nombre.toLowerCase().includes(t) &&
      (categoria ? p.categoria === categoria : true) &&
      p.precio >= min && p.precio <= max
    );
  },
  porId(lista, id) { return lista.find(p => p.id === Number(id)) || null; }
};

/*Actividad 1 */
const $search   = document.getElementById("product-search");
const $category = document.getElementById("category-filter");
const $min      = document.getElementById("min-price");
const $max      = document.getElementById("max-price");
const $results  = document.getElementById("results-container");

// Actividad 3
let $cartIndicator = document.getElementById("cart-indicator");
if (!$cartIndicator) {
  $cartIndicator = document.createElement("div");
  $cartIndicator.id = "cart-indicator";
  $cartIndicator.style.cssText = "position:fixed;right:16px;top:50px;font-weight:600;background:#fff;border:1px solid #e5e7eb;border-radius:999px;padding:6px 10px;";
  $cartIndicator.innerHTML = `🛒 <span id="cart-count">0</span> ítems`;
  document.body.appendChild($cartIndicator);
}
const $cartCount = $cartIndicator.querySelector("#cart-count");

let $promoBanner = document.getElementById("promo-banner");
if (!$promoBanner) {
  $promoBanner = document.createElement("section");
  $promoBanner.id = "promo-banner";
  $promoBanner.setAttribute("role","status");
  $promoBanner.setAttribute("aria-live","polite");
  $promoBanner.style.cssText = "margin:8px auto;text-align:center;font-weight:600;color:#0a7;";
  document.body.insertBefore($promoBanner, $results);
}

let $toasts = document.getElementById("toast-container");
if (!$toasts) {
  $toasts = document.createElement("div");
  $toasts.id = "toast-container";
  $toasts.setAttribute("aria-live","assertive");
  $toasts.setAttribute("aria-atomic","true");
  $toasts.style.cssText = "position:fixed;right:16px;bottom:16px;display:grid;gap:8px;z-index:50;";
  document.body.appendChild($toasts);
}

let catalogo = Catalogo.hidratar(products);
const carrito = [];

/*Actividad 1 y 2*/
function render(list) {
  $results.innerHTML = "";
  if (!list.length) {
    $results.innerHTML = "<p>No se encontraron resultados.</p>";
    return;
  }
  const frag = document.createDocumentFragment();
  list.forEach(p => frag.appendChild(p.renderCard())); // usa método de PASO 2
  $results.appendChild(frag);
}

/*Actividad 1*/
function getFilters() {
  return {
    texto: ($search?.value || "").toLowerCase().trim(),
    categoria: $category ? $category.value : "",
    min: $min && $min.value ? Number($min.value) : 0,
    max: $max && $max.value ? Number($max.value) : Number.POSITIVE_INFINITY
  };
}

function filtrarYMostrar() {
  const filtros = getFilters();
  const lista = Catalogo.filtrar(catalogo, filtros);
  render(lista);
}

function searchProducts() { filtrarYMostrar(); }
window.searchProducts = searchProducts; // asegura disponibilidad global

/*Actividad 1 y 3*/
$search?.addEventListener("input", filtrarYMostrar);
$category?.addEventListener("change", filtrarYMostrar);
$min?.addEventListener("input", filtrarYMostrar);
$max?.addEventListener("input", filtrarYMostrar);


$results.addEventListener("click", (e) => {
  const add = e.target.closest(".btn-add");
  const fav = e.target.closest(".btn-fav");
  if (add) {
    const p = Catalogo.porId(catalogo, add.dataset.id);
    if (p && p.enStock()) {
      carrito.push(p);
      p.restarStock(1);
      document.dispatchEvent(new CustomEvent("cart:updated", { detail: { count: carrito.length, item: p }}));
      filtrarYMostrar(); // refresca stock/botón
    }
  }
  if (fav) {
    const p = Catalogo.porId(catalogo, fav.dataset.id);
    if (p) {
      p.toggleFavorito();
      toast(p.favorito ? `★ Marcado como favorito: ${p.nombre}` : `☆ Quitado de favoritos: ${p.nombre}`);
      filtrarYMostrar();
    }
  }
});

// Escucha actualizaciones del carrito (actualiza contador + notifica)
document.addEventListener("cart:updated", (e) => {
  const { count, item } = e.detail;
  $cartCount.textContent = String(count);
  toast(`✅ "${item.nombre}" agregado al carrito.`);
});

// Banner de promociones simple (muestra si hay productos en oferta)
function setPromoBanner() {
  const hayOfertas = catalogo.some(p => p.enOferta);
  $promoBanner.textContent = hayOfertas
    ? "🔥 ¡Promos activas! Filtra y busca los productos con etiqueta OFERTA."
    : "";
  if (hayOfertas) document.dispatchEvent(new CustomEvent("promo:show"));
}

document.addEventListener("promo:show", () => {
  toast("🎉 Nuevas promociones disponibles.");
});

// Utilidad de notificaciones “toast”
function toast(msg) {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  el.style.cssText = "background:#111827;color:#fff;padding:10px 12px;border-radius:10px;box-shadow:0 6px 18px rgba(0,0,0,.2)";
  $toasts.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}

// Estado inicial
render(catalogo);
setPromoBanner();
