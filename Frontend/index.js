/**
 * Essence. Premium E-Commerce Platform
 * Main Application Logic
 */

// --- Configuration ---
const CONFIG = {
    // Determine API URL based on environment (fallback to localhost)
    API_BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:' 
        ? 'http://localhost:8080' 
        : 'https://essence-api-r38y.onrender.com'
    CURRENCY_SYMBOL: '₹'
};

// --- State Management ---
const state = {
    products: [],
    categories: [],
    cart: JSON.parse(localStorage.getItem('essence_cart')) || [],
    wishlist: JSON.parse(localStorage.getItem('essence_wishlist')) || [],
    filters: {
        search: '',
        category: '',
        sort: 'newest'
    },
    theme: localStorage.getItem('essence_theme') || 'light'
};

// --- DOM Elements ---
const DOM = {
    grid: document.getElementById('product-grid'),
    resultsCount: document.getElementById('results-count'),
    errorState: document.getElementById('error-state'),
    
    // Inputs & Controls
    searchInput: document.getElementById('search-input'),
    mobileSearchInput: document.getElementById('mobile-search-input'),
    categoryFilters: document.getElementById('category-filters'),
    sortSelect: document.getElementById('sort-select'),
    
    // Cart
    cartBtn: document.getElementById('cart-btn'),
    cartSidebar: document.getElementById('cart-sidebar'),
    cartOverlay: document.getElementById('cart-overlay'),
    closeCart: document.getElementById('close-cart'),
    cartItems: document.getElementById('cart-items'),
    cartTotal: document.getElementById('cart-total'),
    cartCount: document.getElementById('cart-count'),
    
    // Theme & Nav
    themeToggle: document.getElementById('theme-toggle'),
    themeIcon: document.getElementById('theme-icon'),
    navbar: document.getElementById('navbar'),
    mobileMenuBtn: document.getElementById('mobile-menu-btn'),
    mobileMenu: document.getElementById('mobile-menu'),
    mobileSearchBtn: document.getElementById('mobile-search-btn'),
    mobileSearchContainer: document.getElementById('mobile-search-container'),
    
    // Modal
    modal: document.getElementById('product-modal'),
    modalContent: document.getElementById('modal-content'),
    closeModal: document.getElementById('close-modal'),
    closeModalBg: document.getElementById('close-modal-bg'),
    toastContainer: document.getElementById('toast-container')
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    setupEventListeners();
    fetchCategories();
    fetchProducts();
    updateCartUI();
    lucide.createIcons();
});

// --- API Calls ---
async function fetchProducts() {
    renderSkeletons();
    DOM.errorState.classList.add('hidden');
    DOM.grid.classList.remove('hidden');
    
    const params = new URLSearchParams({ 
        search: state.filters.search, 
        category: state.filters.category, 
        sort: state.filters.sort 
    });
    
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/products?${params}`);
        const result = await response.json();
        
        if (result.status === 'error') throw new Error(result.message);
        
        state.products = result.data || result; // Fallback if backend isn't updated
        renderProducts();
    } catch (error) {
        console.error('[Fetch Error]:', error);
        showToast('Failed to connect to server. Please try again.', 'error');
        DOM.grid.classList.add('hidden');
        DOM.errorState.classList.remove('hidden');
        DOM.resultsCount.textContent = '0 products';
    }
}

async function fetchCategories() {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/categories`);
        const result = await response.json();
        if (result.status === 'error') throw new Error(result.message);
        
        state.categories = result.data || result;
        renderCategoryFilters();
    } catch (error) {
        console.error('[Category Fetch Error]:', error);
    }
}

// --- Rendering Logic ---
function renderProducts() {
    const count = state.products.length;
    DOM.resultsCount.textContent = `${count} product${count !== 1 ? 's' : ''}`;
    DOM.grid.innerHTML = '';

    if (count === 0) {
        DOM.grid.innerHTML = `
            <div class="col-span-full py-24 text-center animate-fade-in">
                <i data-lucide="search-x" class="w-16 h-16 text-[var(--muted)] mx-auto mb-6 opacity-30"></i>
                <h3 class="text-2xl font-bold mb-3">No results found</h3>
                <p class="text-[var(--muted)] max-w-sm mx-auto">We couldn't find anything matching your criteria. Try exploring different categories.</p>
                <button onclick="setCategory('')" class="mt-8 btn-secondary mx-auto">View All Products</button>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    state.products.forEach((product, index) => {
        const isWishlisted = state.wishlist.some(item => item.id === product.id);
        const card = document.createElement('div');
        
        card.className = 'group flex flex-col cursor-pointer animate-fade-in h-full';
        card.style.animationDelay = `${Math.min(index * 40, 400)}ms`;
        card.onclick = () => openModal(product.id);
        
        card.innerHTML = `
            <div class="relative aspect-[4/5] mb-5 overflow-hidden rounded-2xl bg-[var(--bg-color)] group-hover:shadow-lg border border-transparent group-hover:border-[var(--border-color)] transition-all duration-400">
                <img src="${product.image}" alt="${product.name}" loading="lazy" class="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal p-8 transition-transform duration-700 group-hover:scale-105">
                
                <button onclick="event.stopPropagation(); toggleWishlist(${product.id})" class="absolute top-4 right-4 p-3 bg-[var(--card-bg)]/90 backdrop-blur-md rounded-full text-[var(--text-color)] opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 shadow-sm z-10" aria-label="Toggle Wishlist">
                    <i data-lucide="heart" class="w-4 h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}"></i>
                </button>
                
                ${product.is_popular ? '<span class="absolute top-4 left-4 bg-[var(--text-color)] text-[var(--bg-color)] text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full z-10 shadow-md">Best Seller</span>' : ''}
            </div>
            
            <div class="flex flex-col flex-1 px-1">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">${product.category}</span>
                    <div class="flex items-center gap-1">
                        <i data-lucide="star" class="w-3 h-3 fill-[var(--text-color)] text-[var(--text-color)]"></i>
                        <span class="text-xs font-medium">${(4 + (product.id % 10) / 10).toFixed(1)}</span>
                    </div>
                </div>
                <h3 class="font-semibold text-lg text-[var(--text-color)] mb-2 leading-snug group-hover:text-[var(--muted)] transition-colors">${product.name}</h3>
                <p class="text-lg font-bold text-[var(--text-color)] mt-auto">${CONFIG.CURRENCY_SYMBOL}${product.price.toFixed(2)}</p>
            </div>
        `;
        DOM.grid.appendChild(card);
    });

    lucide.createIcons();
}

function renderSkeletons() {
    DOM.grid.innerHTML = Array(8).fill(0).map(() => `
        <div class="flex flex-col">
            <div class="skeleton aspect-[4/5] mb-5"></div>
            <div class="skeleton h-3 w-1/4 mb-3"></div>
            <div class="skeleton h-6 w-3/4 mb-3"></div>
            <div class="skeleton h-5 w-1/3"></div>
        </div>
    `).join('');
}

function renderCategoryFilters() {
    DOM.categoryFilters.innerHTML = `
        <button onclick="setCategory('')" class="category-chip ${state.filters.category === '' ? 'active' : ''}">
            All
        </button>
    ` + state.categories.map(cat => `
        <button onclick="setCategory('${cat}')" class="category-chip ${state.filters.category === cat ? 'active' : ''}">
            ${cat}
        </button>
    `).join('');
}

function updateCartUI() {
    DOM.cartItems.innerHTML = state.cart.length === 0 ? 
        `<div class="h-full flex flex-col items-center justify-center text-[var(--muted)] animate-fade-in">
            <i data-lucide="shopping-bag" class="w-16 h-16 mb-6 opacity-30"></i>
            <p class="font-medium text-lg text-[var(--text-color)] mb-2">Your cart is empty</p>
            <p class="text-sm text-center max-w-[200px]">Looks like you haven't added anything yet.</p>
            <button onclick="closeSidebar()" class="mt-8 btn-secondary w-full">Start Shopping</button>
        </div>` : 
        state.cart.map(item => `
            <div class="flex gap-5 group bg-[var(--bg-color)] p-3 rounded-2xl animate-fade-in border border-transparent hover:border-[var(--border-color)] transition-colors">
                <div class="w-24 h-24 bg-white rounded-xl overflow-hidden shrink-0 shadow-sm">
                    <img src="${item.image}" class="w-full h-full object-contain mix-blend-multiply p-3 transition-transform duration-500 group-hover:scale-110">
                </div>
                <div class="flex-1 flex flex-col justify-center py-1">
                    <div class="flex justify-between items-start mb-1">
                        <h4 class="font-semibold text-sm line-clamp-2 pr-4 leading-tight">${item.name}</h4>
                        <button onclick="removeFromCart(${item.id})" class="text-[var(--muted)] hover:text-red-500 transition-colors p-1 -mt-1"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                    </div>
                    <p class="text-sm font-bold text-[var(--muted)] mb-3">${CONFIG.CURRENCY_SYMBOL}${item.price.toFixed(2)}</p>
                    
                    <div class="flex items-center gap-4 mt-auto">
                        <div class="flex items-center bg-[var(--card-bg)] border border-[var(--border-color)] rounded-full px-1 shadow-sm">
                            <button onclick="updateQty(${item.id}, -1)" class="w-7 h-7 flex items-center justify-center text-[var(--muted)] hover:text-[var(--text-color)] transition-colors rounded-full hover:bg-[var(--bg-color)]">-</button>
                            <span class="text-xs font-bold w-6 text-center">${item.quantity}</span>
                            <button onclick="updateQty(${item.id}, 1)" class="w-7 h-7 flex items-center justify-center text-[var(--muted)] hover:text-[var(--text-color)] transition-colors rounded-full hover:bg-[var(--bg-color)]">+</button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    
    const total = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    DOM.cartTotal.textContent = `${CONFIG.CURRENCY_SYMBOL}${total.toFixed(2)}`;
    
    const count = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    DOM.cartCount.textContent = count;
    DOM.cartCount.classList.toggle('hidden', count === 0);
    
    lucide.createIcons();
}

// --- Actions ---
window.setCategory = function(cat) {
    state.filters.category = cat;
    renderCategoryFilters();
    fetchProducts();
    // Smooth scroll to grid
    document.getElementById('product-grid').scrollIntoView({ behavior: 'smooth', block: 'start' });
};

window.addToCart = function(id) {
    const product = state.products.find(p => p.id === id);
    if (!product) return;
    
    const existing = state.cart.find(item => item.id === id);
    if (existing) {
        existing.quantity++;
    } else {
        state.cart.unshift({ ...product, quantity: 1 }); // Add to top
    }
    
    saveCart();
    updateCartUI();
    showToast('Item added to cart');
    
    // Open sidebar
    openSidebar();
};

window.removeFromCart = function(id) {
    state.cart = state.cart.filter(item => item.id !== id);
    saveCart();
    updateCartUI();
};

window.updateQty = function(id, delta) {
    const item = state.cart.find(item => item.id === id);
    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) {
            removeFromCart(id);
        } else {
            saveCart();
            updateCartUI();
        }
    }
};

window.toggleWishlist = function(id) {
    const index = state.wishlist.findIndex(item => item.id === id);
    if (index > -1) {
        state.wishlist.splice(index, 1);
        showToast('Removed from wishlist', 'info');
    } else {
        const product = state.products.find(p => p.id === id);
        state.wishlist.push(product);
        showToast('Saved to wishlist');
    }
    saveWishlist();
    renderProducts();
    
    // Update modal heart if open
    const modalHeart = document.getElementById('modal-wishlist-icon');
    if (modalHeart && !DOM.modal.classList.contains('hidden')) {
        if (index > -1) {
            modalHeart.classList.remove('fill-red-500', 'text-red-500');
        } else {
            modalHeart.classList.add('fill-red-500', 'text-red-500');
        }
    }
};

// --- Modal Logic ---
window.openModal = function(id) {
    const product = state.products.find(p => p.id === id);
    if (!product) return;
    
    const isWishlisted = state.wishlist.some(item => item.id === id);
    
    document.getElementById('modal-image').src = product.image;
    document.getElementById('modal-category').textContent = product.category;
    document.getElementById('modal-title').textContent = product.name;
    document.getElementById('modal-price').textContent = `${CONFIG.CURRENCY_SYMBOL}${product.price.toFixed(2)}`;
    document.getElementById('modal-description').textContent = product.description;
    
    // Generate pseudo-random rating for premium feel
    const rating = (4 + (product.id % 10) / 10).toFixed(1);
    const reviews = 40 + (product.id * 7 % 300);
    document.getElementById('modal-rating').innerHTML = `
        <i data-lucide="star" class="w-3.5 h-3.5 fill-current"></i>
        <span class="text-xs font-medium text-[var(--text-color)]">${rating} (${reviews} reviews)</span>
    `;
    
    const modalHeart = document.getElementById('modal-wishlist-icon');
    if (isWishlisted) {
        modalHeart.classList.add('fill-red-500', 'text-red-500');
    } else {
        modalHeart.classList.remove('fill-red-500', 'text-red-500');
    }
    
    DOM.modal.classList.remove('hidden');
    DOM.modal.classList.add('flex');
    
    // Trigger reflow
    void DOM.modal.offsetWidth;
    
    // Animate in
    DOM.modal.classList.add('opacity-100');
    DOM.modalContent.classList.remove('scale-95', 'opacity-0');
    DOM.modalContent.classList.add('scale-100', 'opacity-100');
    
    document.getElementById('modal-add-btn').onclick = () => {
        closeModal();
        setTimeout(() => addToCart(id), 300);
    };
    document.getElementById('modal-wishlist-btn').onclick = () => toggleWishlist(id);
    lucide.createIcons();
    
    // Prevent background scrolling
    document.body.style.overflow = 'hidden';
};

window.closeModal = function() {
    DOM.modal.classList.remove('opacity-100');
    DOM.modalContent.classList.remove('scale-100', 'opacity-100');
    DOM.modalContent.classList.add('scale-95', 'opacity-0');
    
    setTimeout(() => {
        DOM.modal.classList.add('hidden');
        DOM.modal.classList.remove('flex');
        document.body.style.overflow = '';
    }, 300);
};

// --- Helpers ---
function saveCart() { localStorage.setItem('essence_cart', JSON.stringify(state.cart)); }
function saveWishlist() { localStorage.setItem('essence_wishlist', JSON.stringify(state.wishlist)); }

function showToast(msg, type = 'success') {
    const toast = document.createElement('div');
    const isError = type === 'error';
    
    toast.className = `bg-[var(--text-color)] text-[var(--bg-color)] px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 text-sm font-semibold transform transition-all duration-400 translate-x-full opacity-0 z-[150]`;
    if (isError) toast.classList.add('border-l-4', 'border-red-500');
    
    toast.innerHTML = `
        <i data-lucide="${isError ? 'alert-octagon' : (type === 'info' ? 'info' : 'check-circle-2')}" class="w-5 h-5 ${isError ? 'text-red-500' : ''}"></i>
        <span>${msg}</span>
    `;
    
    DOM.toastContainer.appendChild(toast);
    lucide.createIcons();
    
    // Reflow and animate in
    void toast.offsetWidth;
    toast.classList.remove('translate-x-full', 'opacity-0');
    
    // Animate out
    setTimeout(() => {
        toast.classList.add('translate-x-full', 'opacity-0');
        setTimeout(() => toast.remove(), 400);
    }, 3500);
}

function initTheme() {
    if (state.theme === 'dark') {
        document.documentElement.classList.add('dark');
        if (DOM.themeIcon) DOM.themeIcon.setAttribute('data-lucide', 'sun');
    } else {
        document.documentElement.classList.remove('dark');
        if (DOM.themeIcon) DOM.themeIcon.setAttribute('data-lucide', 'moon');
    }
    if(window.lucide) lucide.createIcons();
}

function toggleTheme() {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('essence_theme', state.theme);
    initTheme();
}

window.openSidebar = () => {
    DOM.cartSidebar.classList.add('active');
    DOM.cartOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
};

window.closeSidebar = () => {
    DOM.cartSidebar.classList.remove('active');
    DOM.cartOverlay.classList.remove('active');
    document.body.style.overflow = '';
};

// --- Event Listeners Setup ---
function setupEventListeners() {
    // Debounced Search Function
    function handleSearch(e) {
        const val = e.target.value;
        if (DOM.searchInput.value !== val) DOM.searchInput.value = val;
        if (DOM.mobileSearchInput.value !== val) DOM.mobileSearchInput.value = val;
        
        clearTimeout(window.searchTimeout);
        window.searchTimeout = setTimeout(() => {
            state.filters.search = val;
            fetchProducts();
            document.getElementById('product-grid').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 400);
    }

    DOM.searchInput.addEventListener('input', handleSearch);
    DOM.mobileSearchInput.addEventListener('input', handleSearch);

    // Sorting
    DOM.sortSelect.addEventListener('change', (e) => {
        state.filters.sort = e.target.value;
        fetchProducts();
    });

    // Sidebar Toggles
    DOM.cartBtn.addEventListener('click', openSidebar);
    DOM.closeCart.addEventListener('click', closeSidebar);
    DOM.cartOverlay.addEventListener('click', closeSidebar);

    // Mobile Menus
    DOM.mobileMenuBtn.addEventListener('click', () => {
        DOM.mobileMenu.classList.toggle('active');
        const icon = DOM.mobileMenu.classList.contains('active') ? 'x' : 'menu';
        DOM.mobileMenuBtn.innerHTML = `<i data-lucide="${icon}" class="w-6 h-6"></i>`;
        lucide.createIcons();
    });

    DOM.mobileSearchBtn.addEventListener('click', () => {
        DOM.mobileSearchContainer.classList.toggle('hidden');
        if (!DOM.mobileSearchContainer.classList.contains('hidden')) {
            setTimeout(() => DOM.mobileSearchContainer.classList.remove('-translate-y-full'), 10);
            DOM.mobileSearchInput.focus();
        } else {
            DOM.mobileSearchContainer.classList.add('-translate-y-full');
        }
    });

    // Close mobile menu on link click
    document.querySelectorAll('.mobile-link').forEach(link => {
        link.addEventListener('click', () => {
            DOM.mobileMenu.classList.remove('active');
            DOM.mobileMenuBtn.innerHTML = `<i data-lucide="menu" class="w-6 h-6"></i>`;
            lucide.createIcons();
        });
    });

    // Theme toggle
    DOM.themeToggle.addEventListener('click', toggleTheme);

    // Modal
    DOM.closeModal.addEventListener('click', closeModal);
    DOM.closeModalBg.addEventListener('click', closeModal);
    
    // Global Keyboard Esc handling
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (!DOM.modal.classList.contains('hidden')) closeModal();
            if (DOM.cartSidebar.classList.contains('active')) closeSidebar();
        }
    });

    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 20) {
            DOM.navbar.classList.add('shadow-sm');
        } else {
            DOM.navbar.classList.remove('shadow-sm');
        }
    }, { passive: true });
}
