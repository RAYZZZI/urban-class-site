// =====================================================
// Urban Class — interactions (menu, panier, paiement)
// =====================================================

(function () {
    'use strict';

    const WHATSAPP_NUMBER = '23568758570'; // même numéro que l'Airtel Money
    const AIRTEL_NUMBER_DISPLAY = '+235 68 75 85 70';
    const AIRTEL_NUMBER_RAW = '+23568758570';

    let cart = []; // { id, name, price, qty }

    // ---------- Utils ----------

    function formatFCFA(amount) {
        return amount.toLocaleString('fr-FR').replace(/\u202F|\u00A0/g, ' ') + ' FCFA';
    }

    function qs(id) { return document.getElementById(id); }

    // ---------- Navbar scroll + mobile menu ----------

    function initNavbar() {
        const navbar = qs('navbar');
        const toggle = qs('menuToggle');
        const mobileMenu = qs('mobileMenu');

        window.addEventListener('scroll', function () {
            if (window.scrollY > 30) {
                navbar.classList.add('is-scrolled');
            } else {
                navbar.classList.remove('is-scrolled');
            }
        });

        function closeMobileMenu() {
            toggle.classList.remove('is-active');
            mobileMenu.classList.remove('is-open');
            toggle.setAttribute('aria-expanded', 'false');
        }

        toggle.addEventListener('click', function () {
            const isOpen = mobileMenu.classList.toggle('is-open');
            toggle.classList.toggle('is-active', isOpen);
            toggle.setAttribute('aria-expanded', String(isOpen));
        });

        mobileMenu.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', closeMobileMenu);
        });
    }

    // ---------- Back to top ----------

    function initBackToTop() {
        const btn = qs('backToTop');

        window.addEventListener('scroll', function () {
            if (window.scrollY > 500) {
                btn.classList.add('is-visible');
            } else {
                btn.classList.remove('is-visible');
            }
        });

        btn.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ---------- Toast ----------

    let toastTimer = null;

    function showToast(message) {
        const toast = qs('toast');
        qs('toastMessage').textContent = message;
        toast.classList.add('is-visible');

        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () {
            toast.classList.remove('is-visible');
        }, 2200);
    }

    // ---------- Cart ----------

    function addToCart(id, name, price) {
        const existing = cart.find(function (item) { return item.id === id; });

        if (existing) {
            existing.qty += 1;
        } else {
            cart.push({ id: id, name: name, price: price, qty: 1 });
        }

        renderCart();
        showToast(name + ' ajouté au panier');
    }

    function changeQty(id, delta) {
        const item = cart.find(function (i) { return i.id === id; });
        if (!item) return;

        item.qty += delta;

        if (item.qty <= 0) {
            cart = cart.filter(function (i) { return i.id !== id; });
        }

        renderCart();
    }

    function removeItem(id) {
        cart = cart.filter(function (i) { return i.id !== id; });
        renderCart();
    }

    function cartSubtotal() {
        return cart.reduce(function (sum, item) { return sum + item.price * item.qty; }, 0);
    }

    function iconFor(id) {
        // petite icône générique pour l'aperçu dans le panier
        return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="5" width="14" height="14"/></svg>';
    }

    function renderCart() {
        const itemsWrap = qs('cartItems');
        const count = cart.reduce(function (sum, i) { return sum + i.qty; }, 0);
        const countBadge = qs('cartCount');
        const checkoutBtn = qs('cartCheckoutBtn');

        countBadge.textContent = String(count);
        countBadge.classList.toggle('is-visible', count > 0);

        if (cart.length === 0) {
            itemsWrap.innerHTML = '<p class="cart-empty">Votre panier est vide pour le moment.</p>';
            checkoutBtn.disabled = true;
        } else {
            itemsWrap.innerHTML = cart.map(function (item) {
                return (
                    '<div class="cart-item" data-id="' + item.id + '">' +
                        '<div class="cart-item-icon">' + iconFor(item.id) + '</div>' +
                        '<div class="cart-item-info">' +
                            '<h4>' + item.name + '</h4>' +
                            '<div class="cart-item-price">' + formatFCFA(item.price) + '</div>' +
                            '<div class="cart-item-controls">' +
                                '<button class="qty-btn" data-action="dec" aria-label="Diminuer la quantité">−</button>' +
                                '<span class="qty-value">' + item.qty + '</span>' +
                                '<button class="qty-btn" data-action="inc" aria-label="Augmenter la quantité">+</button>' +
                                '<button class="cart-item-remove" data-action="remove">Retirer</button>' +
                            '</div>' +
                        '</div>' +
                    '</div>'
                );
            }).join('');

            checkoutBtn.disabled = false;
        }

        qs('cartSubtotal').textContent = formatFCFA(cartSubtotal());
    }

    function initCartInteractions() {
        qs('cartItems').addEventListener('click', function (e) {
            const btn = e.target.closest('button');
            if (!btn) return;

            const row = e.target.closest('.cart-item');
            if (!row) return;

            const id = row.dataset.id;
            const action = btn.dataset.action;

            if (action === 'inc') changeQty(id, 1);
            if (action === 'dec') changeQty(id, -1);
            if (action === 'remove') removeItem(id);
        });

        document.querySelectorAll('.add-to-cart').forEach(function (btn) {
            btn.addEventListener('click', function () {
                addToCart(btn.dataset.id, btn.dataset.name, parseInt(btn.dataset.price, 10));
            });
        });
    }

    // ---------- Cart drawer open/close ----------

    function openCart() {
        qs('cartDrawer').classList.add('is-open');
        qs('cartOverlay').classList.add('is-open');
        document.body.style.overflow = 'hidden';
    }

    function closeCart() {
        qs('cartDrawer').classList.remove('is-open');
        qs('cartOverlay').classList.remove('is-open');
        if (!qs('checkoutModal').classList.contains('is-open')) {
            document.body.style.overflow = '';
        }
    }

    function initCartDrawer() {
        qs('cartTrigger').addEventListener('click', openCart);
        qs('cartClose').addEventListener('click', closeCart);
        qs('cartOverlay').addEventListener('click', closeCart);
    }

    // ---------- Checkout modal ----------

    function renderCheckoutSummary() {
        qs('checkoutSummary').innerHTML = cart.map(function (item) {
            return (
                '<div class="order-line">' +
                    '<span>' + item.qty + '× ' + item.name + '</span>' +
                    '<span>' + formatFCFA(item.price * item.qty) + '</span>' +
                '</div>'
            );
        }).join('');

        qs('checkoutTotal').textContent = formatFCFA(cartSubtotal());
    }

    function openCheckout() {
        if (cart.length === 0) return;
        renderCheckoutSummary();
        closeCart();
        qs('checkoutModal').classList.add('is-open');
        qs('checkoutOverlay').classList.add('is-open');
        document.body.style.overflow = 'hidden';
    }

    function closeCheckout() {
        qs('checkoutModal').classList.remove('is-open');
        qs('checkoutOverlay').classList.remove('is-open');
        document.body.style.overflow = '';
    }

    function initCheckout() {
        qs('cartCheckoutBtn').addEventListener('click', openCheckout);
        qs('checkoutClose').addEventListener('click', closeCheckout);
        qs('checkoutOverlay').addEventListener('click', closeCheckout);

        qs('copyNumberBtn').addEventListener('click', function () {
            const numberToCopy = AIRTEL_NUMBER_RAW.replace(/\s/g, '');

            function fallbackCopy() {
                const temp = document.createElement('textarea');
                temp.value = numberToCopy;
                temp.style.position = 'fixed';
                temp.style.opacity = '0';
                document.body.appendChild(temp);
                temp.select();
                try { document.execCommand('copy'); } catch (err) { /* silencieux */ }
                document.body.removeChild(temp);
            }

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(numberToCopy).catch(fallbackCopy);
            } else {
                fallbackCopy();
            }

            showToast('Numéro Airtel Money copié');
        });

        qs('checkoutConfirmBtn').addEventListener('click', function () {
            const name = qs('custName').value.trim();
            const phone = qs('custPhone').value.trim();
            const address = qs('custAddress').value.trim();

            if (!name || !phone) {
                showToast('Merci de renseigner votre nom et téléphone');
                return;
            }

            const lines = cart.map(function (item) {
                return '- ' + item.qty + 'x ' + item.name + ' (' + formatFCFA(item.price * item.qty) + ')';
            }).join('\n');

            const total = formatFCFA(cartSubtotal());

            let message = 'Bonjour Urban Class, je souhaite confirmer ma commande :\n\n';
            message += lines + '\n\n';
            message += 'Total : ' + total + '\n\n';
            message += 'Nom : ' + name + '\n';
            message += 'Téléphone : ' + phone + '\n';
            if (address) message += 'Quartier / adresse : ' + address + '\n';
            message += '\nJ\'ai envoyé le paiement via Airtel Money au ' + AIRTEL_NUMBER_DISPLAY + '.';

            const url = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(message);
            window.open(url, '_blank', 'noopener');

            cart = [];
            renderCart();
            closeCheckout();
            showToast('Commande prête — envoyez le message sur WhatsApp');
        });
    }

    // ---------- Init ----------

    document.addEventListener('DOMContentLoaded', function () {
        initNavbar();
        initBackToTop();
        initCartInteractions();
        initCartDrawer();
        initCheckout();
        renderCart();
    });
})();
