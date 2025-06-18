// Configuración de Firebase (Tienda Oberon)
const firebaseConfig = {
    apiKey: "AIzaSyDCA2KrFlJ4XzBK6Hmh0yyIIOOL66Q2njQ",
    authDomain: "tienda-oberon.firebaseapp.com",
    projectId: "tienda-oberon",
    storageBucket: "tienda-oberon.firebasestorage.app",
    messagingSenderId: "504035474209",
    appId: "1:504035474209:web:2d664ade426cd9f1ea5c60"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
let cart = [];

// Carga de productos en #epp-list
document.addEventListener("DOMContentLoaded", async () => {
    const eppList = document.getElementById("epp-list");
    if (!eppList) return console.error('No existe #epp-list');
    try {
        const snapshot = await db.collection('productos').get();
        snapshot.forEach(doc => {
            const p = doc.data();
            const id = doc.id;
            const card = document.createElement("div");
            card.className = "epp-card";
            card.innerHTML = `
                <div style="text-align:center;">
                    <img src="${p.imagenURL}" alt="${p.nombre}"
                         style="max-width:180px;height:auto;display:block;margin:auto;
                                border-radius:8px;box-shadow:0px 4px 6px rgba(0,0,0,0.1);">
                    <h3>${p.nombre}</h3>
                    <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
                        <div class="quantity-wrapper" style="display:flex;align-items:center;gap:10px;">
                            <button class="quantity-btn"
                                    style="padding:5px 12px;border-radius:5px;font-size:16px;
                                           background-color:#007bff;color:white;border:none;"
                                    onclick="adjustQuantity('${id}',-1)">-</button>
                            <input type="text" id="quantity-${id}" value="1" class="quantity-input"
                                   style="width:50px;text-align:center;font-size:18px;
                                          border-radius:5px;border:1px solid #ccc;padding:5px;">
                            <button class="quantity-btn"
                                    style="padding:5px 12px;border-radius:5px;font-size:16px;
                                           background-color:#007bff;color:white;border:none;"
                                    onclick="adjustQuantity('${id}',1)">+</button>
                        </div>
                        <button class="add-to-cart" data-id="${id}" data-name="${p.nombre}"
                                style="margin-top:0px;background-color:rgb(24,172,56);color:white;
                                       padding:0px 18px;border:none;border-radius:5px;
                                       height:30px;width:150px;cursor:pointer;font-weight:bold;">
                            Agregar al Carrito
                        </button>
                    </div>
                </div>
            `;
            eppList.appendChild(card);
        });
        document.querySelectorAll(".add-to-cart").forEach(btn => {
            btn.addEventListener("click", () => {
                const id   = btn.dataset.id;
                const name = btn.dataset.name;
                const qtyInput = document.getElementById(`quantity-${id}`);
                const qty      = Math.max(1, parseInt(qtyInput.value, 10) || 1);
                addToCart(id, name, qty);
            });
        });
    } catch (err) {
        console.error("Error al cargar productos:", err);
    }
    renderCart();

    // Botón de cotización: siempre visible
    const checkoutBtn = document.getElementById("checkout-button");
    if (checkoutBtn) {
        checkoutBtn.textContent = "Solicitar Cotización";
        checkoutBtn.onclick = processQuotation;
        checkoutBtn.style.display = 'inline-block';
    }
});

function adjustQuantity(id, delta) {
    const inp = document.getElementById(`quantity-${id}`);
    if (!inp) return;
    inp.value = Math.max(1, (parseInt(inp.value,10) || 1) + delta);
}

function addToCart(id, name, quantity) {
    const existing = cart.find(x => x.id === id);
    if (existing) existing.quantity += quantity;
    else cart.push({ id, name, quantity });
    renderCart();
}

function updateCartQuantity(id, delta) {
    const item = cart.find(x => x.id === id);
    if (!item) return;
    item.quantity = Math.max(1, item.quantity + delta);
    renderCart();
}

function removeFromCart(id) {
    cart = cart.filter(x => x.id !== id);
    renderCart();
}

function renderCart() {
    const container = document.getElementById("cart-items");
    if (!container) return;
    container.innerHTML = "";
    cart.forEach(item => {
        const div = document.createElement("div");
        div.className = "cart-item-container";
        div.style.cssText = `
            display:flex;align-items:center;justify-content:space-between;
            padding:10px;border:1px solid #ccc;border-radius:8px;
            background:#fff;margin-bottom:10px;
        `;
        div.innerHTML = `
            <span>${item.name}</span>
            <div style="display:flex;align-items:center;gap:10px;">
                <button style="padding:5px 12px;border-radius:5px;font-size:16px;
                               background-color:#007bff;color:white;border:none;"
                        onclick="updateCartQuantity('${item.id}',-1)">-</button>
                <input type="text" value="${item.quantity}" readonly
                       style="width:50px;text-align:center;font-size:18px;
                              border-radius:5px;border:1px solid #ccc;padding:5px;">
                <button style="padding:5px 12px;border-radius:5px;font-size:16px;
                               background-color:#007bff;color:white;border:none;"
                        onclick="updateCartQuantity('${item.id}',1)">+</button>
            </div>
            <button onclick="removeFromCart('${item.id}')"
                    style="padding:5px 12px;border-radius:5px;font-size:16px;
                           background-color:rgb(211,0,0);color:white;border:none;
                           cursor:pointer;">
                Eliminar
            </button>
        `;
        container.appendChild(div);
    });
}

// -- Aquí solo cambié el URL: --
async function processQuotation() {
    // Campos obligatorios
    const razon    = document.getElementById('input-name').value.trim();
    const contacto = document.getElementById('input-contact').value.trim();
    const email    = document.getElementById('input-email').value.trim();
    if (!cart.length)    return alert('El carrito está vacío.');
    if (!razon)          return alert('Ingrese Nombre o Razón Social.');
    if (!contacto)       return alert('Ingrese Nombre de Contacto.');
    if (!email)          return alert('Ingrese Email de Contacto.');

    // Prepara datos de cliente
    const cliente = {
      razonSocial: razon,
      contacto,
      email,
      rut:       document.getElementById('input-rut').value.trim() || undefined,
      giro:      document.getElementById('input-giro').value.trim() || undefined,
      direccion: document.getElementById('input-direccion').value.trim() || undefined
    };

    // Productos
    const items = cart.map(i => ({ nombre: i.name, cantidad: i.quantity }));

    try {
      // Guarda en Firestore (opcional)
      await db.collection('cotizaciones').add({
        cliente,
        items,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // *** LLAMADA CORREGIDA ***
      const endpoint = 'https://us-central1-tienda-oberon.cloudfunctions.net/sendQuotationEmail';
      const resp = await fetch(endpoint, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ cliente, items })
      });

      if (resp.ok) {
        alert('Cotización enviada correctamente.');
        cart = [];
        renderCart();
      } else {
        console.error(await resp.text());
        alert('Error al enviar cotización.');
      }
    } catch (e) {
      console.error('Error de red:', e);
      alert('Error de red al solicitar cotización');
    }
}
