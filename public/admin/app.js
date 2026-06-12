const API_BASE = window.location.origin;
const tokenKey = 'trynbuy_admin_token';

const loginView = document.getElementById('loginView');
const appView = document.getElementById('appView');
const loginForm = document.getElementById('loginForm');
const loginMsg = document.getElementById('loginMsg');
const logoutBtn = document.getElementById('logoutBtn');
const profileLabel = document.getElementById('profileLabel');
const leftPanel = document.getElementById('leftPanel');
const rightPanel = document.getElementById('rightPanel');
const totalUsers = document.getElementById('totalUsers');
const totalOrders = document.getElementById('totalOrders');
const totalRevenue = document.getElementById('totalRevenue');
const totalProducts = document.getElementById('totalProducts');

const templates = {
  dashboard: document.getElementById('dashboardTemplate'),
  products: document.getElementById('productsTemplate'),
  orders: document.getElementById('ordersTemplate'),
  users: document.getElementById('usersTemplate')
};

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec'
];

const ROLE_COLORS = {
  admin: '#f97316',
  user: '#38bdf8',
  guest: '#a78bfa',
  Unknown: '#94a3b8'
};

const ORDER_COLORS = {
  Placed: '#38bdf8',
  Packed: '#f59e0b',
  Shipped: '#a855f7',
  Delivered: '#22c55e',
  Unknown: '#94a3b8'
};

let currentView = 'dashboard';
let cached = { dashboard: null, products: [], orders: [], users: [], sales: [] };

const authHeaders = () => {
  const token = localStorage.getItem(tokenKey);
  return token ? { Authorization: `Bearer ${token}` } : {};
};

async function api(path, options = {}) {
  const isForm = options.body instanceof FormData;
  const headers = { ...authHeaders(), ...(options.headers || {}) };
  if (!isForm && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || data.error || 'Request failed');
  }
  return data;
}

function setVisible(isAuthed) {
  loginView.classList.toggle('hidden', isAuthed);
  appView.classList.toggle('hidden', !isAuthed);
}

function renderTemplate(name) {
  leftPanel.innerHTML = '';
  rightPanel.innerHTML = '';
  const fragment = templates[name].content.cloneNode(true);
  const nodes = [...fragment.children];
  if (nodes[0]) leftPanel.appendChild(nodes[0]);
  if (nodes[1]) rightPanel.appendChild(nodes[1]);
}

function money(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);
}

function percent(value, total) {
  if (!total) return '0%';
  return `${Math.round((value / total) * 100)}%`;
}

function groupBy(items, keyGetter) {
  return items.reduce((groups, item) => {
    const key = keyGetter(item) || 'Unknown';
    groups.set(key, (groups.get(key) || 0) + 1);
    return groups;
  }, new Map());
}

function displayUserName(user) {
  return user?.name?.trim() || user?.email?.trim() || 'Guest';
}

function topSegmentColor(label, palette) {
  return palette[label] || palette.Unknown || '#94a3b8';
}

function renderDonut(container, legendContainer, segments, centerLabel) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);

  if (!total) {
    container.innerHTML = '<div class="donut-empty">No data yet</div>';
    legendContainer.innerHTML = '';
    return;
  }

  let cursor = 0;
  const gradient = segments
    .filter((segment) => segment.value > 0)
    .map((segment) => {
      const start = (cursor / total) * 100;
      cursor += segment.value;
      const end = (cursor / total) * 100;
      return `${segment.color} ${start}% ${end}%`;
    })
    .join(', ');

  container.innerHTML = `
    <div class="donut-ring" style="background: conic-gradient(${gradient});">
      <div class="donut-core">
        <strong>${total}</strong>
        <span>${centerLabel}</span>
      </div>
    </div>
  `;

  legendContainer.innerHTML = segments
    .filter((segment) => segment.value > 0)
    .map((segment) => `
      <div class="legend-item">
        <span class="legend-swatch" style="--swatch:${segment.color}"></span>
        <div>
          <strong>${segment.label}</strong>
          <span>${segment.value} (${percent(segment.value, total)})</span>
        </div>
      </div>
    `)
    .join('');
}

function renderBars(container, points) {
  const total = points.reduce((sum, point) => sum + point.value, 0);
  const peak = Math.max(...points.map((point) => point.value), 1);

  if (!total) {
    container.innerHTML = '<div class="donut-empty">No sales recorded yet</div>';
    return;
  }

  container.innerHTML = `
    <div class="bar-chart">
      ${points.map((point) => `
        <div class="bar-item">
          <div class="bar-track">
            <div class="bar-fill" style="height:${Math.max((point.value / peak) * 100, 6)}%"></div>
          </div>
          <strong>${point.label}</strong>
          <span>${money(point.value)}</span>
        </div>
      `).join('')}
    </div>
  `;
}

function renderBreakdownList(container, rows) {
  if (!rows.length) {
    container.innerHTML = '<div class="donut-empty">No entries yet</div>';
    return;
  }

  container.innerHTML = rows.map((row) => `
    <div class="row row-tight">
      <div><strong>${row.label}</strong></div>
      <div class="muted">${row.value} · ${row.share}</div>
    </div>
  `).join('');
}

function orderRow(order) {
  const userName = displayUserName(order.user);
  const element = document.createElement('div');
  element.className = 'row';
  element.innerHTML = `
    <div><strong>${userName}</strong> · ${order.status} · ${money(order.totalAmount)}</div>
    <div class="muted">${order.shippingAddress || ''}</div>
    <div class="row-actions">
      <select data-order-status>
        ${['Placed', 'Packed', 'Shipped', 'Delivered'].map((s) => `<option value="${s}" ${order.status === s ? 'selected' : ''}>${s}</option>`).join('')}
      </select>
      <button data-order-save>Save status</button>
    </div>
  `;
  element.querySelector('[data-order-save]').addEventListener('click', async () => {
    const status = element.querySelector('[data-order-status]').value;
    await api(`/api/orders/${order._id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
    await loadAll();
  });
  return element;
}

function productRow(product) {
  const element = document.createElement('div');
  element.className = 'row';
  element.innerHTML = `
    <div><strong>${product.name}</strong> · ${money(product.price)} · ${product.category}</div>
    <div class="muted">Stock: ${product.stock || 0}</div>
    <div class="row-actions">
      <button data-product-delete class="danger">Delete</button>
    </div>
  `;
  element.querySelector('[data-product-delete]').addEventListener('click', async () => {
    if (!confirm(`Delete ${product.name}?`)) return;
    await api(`/api/products/${product._id}`, { method: 'DELETE' });
    await loadAll();
  });
  return element;
}

function userRow(user) {
  const element = document.createElement('div');
  element.className = 'row';
  element.innerHTML = `
    <div><strong>${user.name}</strong> · ${user.email}</div>
    <div class="muted">Role: ${user.role}</div>
  `;
  return element;
}

async function loadAll() {
  const dashboard = await api('/api/admin/dashboard');
  cached.dashboard = dashboard;
  totalUsers.textContent = dashboard.totalUsers ?? 0;
  totalOrders.textContent = dashboard.totalOrders ?? 0;
  totalRevenue.textContent = money(dashboard.totalRevenue ?? 0);

  const [products, orders, users, sales] = await Promise.all([
    api('/api/admin/products'),
    api('/api/admin/orders'),
    api('/api/admin/users'),
    api('/api/admin/sales')
  ]);

  cached.products = products;
  cached.orders = orders;
  cached.users = users;
  cached.sales = sales;
  totalProducts.textContent = products.length;

  if (currentView === 'dashboard') renderDashboard();
  if (currentView === 'products') renderProducts();
  if (currentView === 'orders') renderOrders();
  if (currentView === 'users') renderUsers();
}

function renderDashboard() {
  renderTemplate('dashboard');
  const recentOrders = document.getElementById('recentOrders');
  const userRoleChart = document.getElementById('userRoleChart');
  const userRoleLegend = document.getElementById('userRoleLegend');
  const userRoleTotal = document.getElementById('userRoleTotal');
  const orderStatusChart = document.getElementById('orderStatusChart');
  const orderStatusLegend = document.getElementById('orderStatusLegend');
  const orderStatusTotal = document.getElementById('orderStatusTotal');
  const salesChart = document.getElementById('salesChart');
  const salesList = document.getElementById('salesList');

  recentOrders.innerHTML = '';
  (cached.dashboard?.recentOrders || []).forEach((order) => recentOrders.appendChild(orderRow(order)));

  const userRoleGroups = groupBy(cached.users, (user) => user.role || 'user');
  const userRoleSegments = Array.from(userRoleGroups.entries()).map(([role, value]) => ({
    label: role.charAt(0).toUpperCase() + role.slice(1),
    value,
    color: topSegmentColor(role, ROLE_COLORS)
  }));
  renderDonut(userRoleChart, userRoleLegend, userRoleSegments, 'users');
  userRoleTotal.textContent = `${cached.users.length} total`;

  const orderStatusGroups = groupBy(cached.orders, (order) => order.status || 'Unknown');
  const orderStatusSegments = Array.from(orderStatusGroups.entries()).map(([status, value]) => ({
    label: status,
    value,
    color: topSegmentColor(status, ORDER_COLORS)
  }));
  renderDonut(orderStatusChart, orderStatusLegend, orderStatusSegments, 'orders');
  orderStatusTotal.textContent = `${cached.orders.length} total`;

  salesList.innerHTML = '';
  const salesPoints = (cached.sales || []).map((sale) => ({
    label: MONTH_NAMES[(sale._id || 1) - 1] || `M${sale._id}`,
    value: sale.total || 0
  }));
  renderBars(salesChart, salesPoints);
  salesPoints.forEach((sale) => {
    const row = document.createElement('div');
    row.className = 'row';
    row.textContent = `${sale.label}: ${money(sale.value)}`;
    salesList.appendChild(row);
  });
}

function renderProducts() {
  renderTemplate('products');
  const list = document.getElementById('productsList');
  const form = document.getElementById('productForm');
  const msg = document.getElementById('productMsg');
  list.innerHTML = '';
  cached.products.forEach((product) => list.appendChild(productRow(product)));
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    msg.textContent = '';
    try {
      const formData = new FormData(form);
      const response = await fetch(`${API_BASE}/api/products`, {
        method: 'POST',
        headers: authHeaders(),
        body: formData
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to create product');
      }
      msg.textContent = 'Product created successfully';
      msg.classList.remove('danger');
      form.reset();
      await loadAll();
    } catch (error) {
      msg.textContent = error.message;
      msg.classList.add('danger');
    }
  });
}

function renderOrders() {
  renderTemplate('orders');
  const list = document.getElementById('ordersList');
  list.innerHTML = '';
  cached.orders.forEach((order) => list.appendChild(orderRow(order)));
}

function renderUsers() {
  renderTemplate('users');
  const list = document.getElementById('usersList');
  const breakdown = document.getElementById('userBreakdown');
  list.innerHTML = '';
  cached.users.forEach((user) => list.appendChild(userRow(user)));

  const groups = groupBy(cached.users, (user) => user.role || 'user');
  const total = cached.users.length || 1;
  const rows = Array.from(groups.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([role, value]) => ({
      label: role.charAt(0).toUpperCase() + role.slice(1),
      value,
      share: percent(value, total)
    }));
  renderBreakdownList(breakdown, rows);
}

document.querySelectorAll('.nav-btn').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach((b) => b.classList.remove('active'));
    button.classList.add('active');
    currentView = button.dataset.view;
    if (cached.dashboard) {
      if (currentView === 'dashboard') renderDashboard();
      if (currentView === 'products') renderProducts();
      if (currentView === 'orders') renderOrders();
      if (currentView === 'users') renderUsers();
    }
  });
});

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  loginMsg.textContent = '';
  try {
    const token = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: document.getElementById('email').value,
        password: document.getElementById('password').value
      }),
      headers: { 'Content-Type': 'application/json' }
    });

    if (token.user?.role !== 'admin') {
      throw new Error('This account is not an admin.');
    }

    localStorage.setItem(tokenKey, token.token);
    profileLabel.textContent = token.user.email;
    setVisible(true);
    await loadAll();
  } catch (error) {
    loginMsg.textContent = error.message;
    loginMsg.classList.add('danger');
  }
});

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem(tokenKey);
  setVisible(false);
});

(async function init() {
  const token = localStorage.getItem(tokenKey);
  if (!token) {
    setVisible(false);
    return;
  }

  try {
    const profile = await api('/api/auth/profile');
    if (profile.user?.role !== 'admin') throw new Error('Not an admin');
    profileLabel.textContent = profile.user.email;
    setVisible(true);
    await loadAll();
  } catch {
    localStorage.removeItem(tokenKey);
    setVisible(false);
  }
})();