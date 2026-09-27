// renderer/utils/browserMockApi.js
// Browser fallback mock allowing real-time interactive testing in standard web browsers (Chrome/Edge/Safari)

const STORAGE_KEY_PREFIX = 'takotime_mock_';

const defaultCatalog = [
  {
    id: 1,
    name: 'Takoyaki',
    sort_order: 1,
    products: [
      {
        id: 1,
        name: 'Classic Octopus Takoyaki',
        category_id: 1,
        variants: [
          { id: 1, product_id: 1, label: '4 pcs', price: 45.0, cost: 20.0 },
          { id: 2, product_id: 1, label: '8 pcs', price: 85.0, cost: 38.0 },
          { id: 3, product_id: 1, label: '12 pcs', price: 125.0, cost: 55.0 },
        ],
        modifiers: [
          { id: 1, name: 'Extra Takoyaki Sauce', price_delta: 5.0 },
          { id: 2, name: 'Extra Japanese Mayo', price_delta: 5.0 },
          { id: 3, name: 'Extra Bonito Flakes', price_delta: 10.0 },
          { id: 4, name: 'Chili Garlic Sauce', price_delta: 5.0 },
        ],
      },
      {
        id: 2,
        name: 'Crab & Cheese Takoyaki',
        category_id: 1,
        variants: [
          { id: 4, product_id: 2, label: '4 pcs', price: 50.0, cost: 22.0 },
          { id: 5, product_id: 2, label: '8 pcs', price: 95.0, cost: 42.0 },
          { id: 6, product_id: 2, label: '12 pcs', price: 140.0, cost: 60.0 },
        ],
        modifiers: [
          { id: 1, name: 'Extra Takoyaki Sauce', price_delta: 5.0 },
          { id: 2, name: 'Extra Japanese Mayo', price_delta: 5.0 },
          { id: 3, name: 'Extra Bonito Flakes', price_delta: 10.0 },
          { id: 4, name: 'Chili Garlic Sauce', price_delta: 5.0 },
        ],
      },
    ],
  },
  {
    id: 2,
    name: 'Siomai',
    sort_order: 2,
    products: [
      {
        id: 3,
        name: 'Pork Siomai',
        category_id: 2,
        variants: [
          { id: 7, product_id: 3, label: '4 pcs', price: 40.0, cost: 18.0 },
          { id: 8, product_id: 3, label: '8 pcs', price: 75.0, cost: 34.0 },
        ],
        modifiers: [
          { id: 4, name: 'Chili Garlic Sauce', price_delta: 5.0 },
        ],
      },
      {
        id: 4,
        name: 'Japanese Beef Siomai',
        category_id: 2,
        variants: [
          { id: 9, product_id: 4, label: '4 pcs', price: 50.0, cost: 22.0 },
          { id: 10, product_id: 4, label: '8 pcs', price: 95.0, cost: 42.0 },
        ],
        modifiers: [
          { id: 4, name: 'Chili Garlic Sauce', price_delta: 5.0 },
        ],
      },
    ],
  },
  {
    id: 3,
    name: 'Drinks',
    sort_order: 3,
    products: [
      {
        id: 5,
        name: 'Iced Japanese Green Tea (16oz)',
        category_id: 3,
        variants: [
          { id: 11, product_id: 5, label: 'Regular (16oz)', price: 35.0, cost: 12.0 },
        ],
        modifiers: [
          { id: 5, name: 'Less Ice', price_delta: 0.0 },
          { id: 6, name: 'Extra Ice', price_delta: 0.0 },
        ],
      },
      {
        id: 6,
        name: 'Fresh Calamansi Juice (16oz)',
        category_id: 3,
        variants: [
          { id: 12, product_id: 6, label: 'Regular (16oz)', price: 30.0, cost: 10.0 },
        ],
        modifiers: [
          { id: 5, name: 'Less Ice', price_delta: 0.0 },
          { id: 6, name: 'Extra Ice', price_delta: 0.0 },
        ],
      },
      {
        id: 7,
        name: 'Mineral Water (500ml)',
        category_id: 3,
        variants: [
          { id: 13, product_id: 7, label: 'Bottle (500ml)', price: 20.0, cost: 8.0 },
        ],
        modifiers: [],
      },
    ],
  },
];

const mockUsers = [
  { id: 1, name: 'Store Admin', username: 'admin', pin: '1234', password: 'admin123', role: 'admin' },
  { id: 2, name: 'Lead Staff', username: 'supervisor', pin: '5678', password: 'staff123', role: 'admin_staff' },
  { id: 3, name: 'Cashier 1', username: 'cashier', pin: '1111', password: 'cashier123', role: 'staff' },
];

export function setupBrowserMockApi() {
  if (typeof window === 'undefined' || window.api) return;

  console.info('%c[TAKOTIME POS] Running in Browser Mode (Mock SQLite Active)', 'color: #ff5722; font-weight: bold; font-size: 14px;');

  let currentShift = {
    id: 1,
    staff_id: 3,
    status: 'open',
    starting_cash: 1000,
    last_queue_no: 0,
    opened_at: new Date().toISOString(),
  };

  const orders = [];
  const cashMovements = [];

  window.api = {
    auth: {
      login: async (username, password) => {
        const u = mockUsers.find(user => user.username.toLowerCase() === username.toLowerCase() && user.password === password);
        if (!u) return { success: false, error: 'Invalid username or password' };
        return {
          success: true,
          data: {
            sessionId: 'browser-mock-session-' + Date.now(),
            user: { id: u.id, name: u.name, username: u.username, role: u.role },
          },
        };
      },
      loginWithPin: async (pin) => {
        const u = mockUsers.find(user => user.pin === pin);
        if (!u) return { success: false, error: 'Invalid PIN' };
        return {
          success: true,
          data: {
            sessionId: 'browser-mock-session-' + Date.now(),
            user: { id: u.id, name: u.name, username: u.username, role: u.role },
          },
        };
      },
      logout: async () => ({ success: true }),
      getSession: async () => ({ success: true, data: { user: mockUsers[2] } }),
    },

    shifts: {
      getCurrent: async () => ({ success: true, data: currentShift }),
      open: async (sessionId, startingCash, notes) => {
        currentShift = {
          id: (currentShift?.id || 0) + 1,
          staff_id: 3,
          status: 'open',
          starting_cash: Number(startingCash) || 0,
          last_queue_no: 0,
          notes,
          opened_at: new Date().toISOString(),
        };
        return { success: true, data: currentShift };
      },
      close: async (sessionId, shiftId, endingCash, notes) => {
        const expectedCash = (currentShift?.starting_cash || 0) + orders.filter(o => o.status === 'completed' && o.payment_method === 'cash').reduce((s, o) => s + o.total, 0);
        const closed = {
          ...currentShift,
          status: 'closed',
          ending_cash: Number(endingCash),
          expected_cash: expectedCash,
          closed_at: new Date().toISOString(),
          discrepancy: Number(endingCash) - expectedCash,
          breakdown: {
            startingCash: currentShift.starting_cash,
            cashSales: orders.filter(o => o.status === 'completed' && o.payment_method === 'cash').reduce((s, o) => s + o.total, 0),
            expectedCash,
          },
        };
        currentShift = null;
        return { success: true, data: closed };
      },
    },

    menu: {
      getCatalog: async () => ({ success: true, data: defaultCatalog }),
    },

    orders: {
      create: async (sessionId, orderData) => {
        if (!currentShift) return { success: false, error: 'No open shift' };
        currentShift.last_queue_no += 1;
        const newOrder = {
          id: orders.length + 1,
          shift_id: currentShift.id,
          staff_id: orderData.staffId || 3,
          staff_name: 'Cashier 1',
          queue_no: currentShift.last_queue_no,
          order_type: orderData.orderType,
          payment_method: orderData.paymentMethod,
          amount_tendered: orderData.amountTendered,
          change_due: orderData.changeDue,
          subtotal: orderData.items.reduce((s, it) => {
            const prod = defaultCatalog.flatMap(c => c.products).find(p => p.variants.some(v => v.id === it.variantId));
            const v = prod?.variants.find(va => va.id === it.variantId);
            return s + (v ? v.price * it.qty : 0);
          }, 0),
          discount: orderData.discountAmount || 0,
          discount_type: orderData.discountType,
          total: Math.max(0, orderData.items.reduce((s, it) => {
            const prod = defaultCatalog.flatMap(c => c.products).find(p => p.variants.some(v => v.id === it.variantId));
            const v = prod?.variants.find(va => va.id === it.variantId);
            return s + (v ? v.price * it.qty : 0);
          }, 0) - (orderData.discountAmount || 0)),
          status: 'completed',
          created_at: new Date().toISOString(),
          items: orderData.items.map(it => {
            const prod = defaultCatalog.flatMap(c => c.products).find(p => p.variants.some(v => v.id === it.variantId));
            const v = prod?.variants.find(va => va.id === it.variantId);
            return {
              id: Math.random(),
              product_name: prod?.name || 'Item',
              variant_label: v?.label || 'Regular',
              qty: it.qty,
              subtotal: v ? v.price * it.qty : 0,
            };
          }),
        };
        orders.unshift(newOrder);
        return {
          success: true,
          data: {
            id: newOrder.id,
            queueNo: newOrder.queue_no,
            orderType: newOrder.order_type,
            total: newOrder.total,
            paymentMethod: newOrder.payment_method,
            changeDue: newOrder.change_due,
          },
        };
      },

      getRecent: async (sessionId, shiftId, limit) => {
        return { success: true, data: orders.slice(0, limit || 20) };
      },

      void: async (sessionId, orderId, reason) => {
        const ord = orders.find(o => o.id === orderId);
        if (ord) {
          ord.status = 'voided';
          ord.void_reason = reason;
        }
        return { success: true };
      },
    },

    receipt: {
      format: async (sessionId, orderId) => {
        const ord = orders.find(o => o.id === orderId) || orders[0];
        if (!ord) return { success: false, error: 'Order not found' };
        const text = `
       TAKOTIME - MONTALBAN
    TAKOTIME Montalban Branch
================================
QUEUE #: ${String(ord.queue_no).padStart(3, '0')}
Order ID: #${ord.id} [${ord.order_type.toUpperCase()}]
Date: ${new Date(ord.created_at).toLocaleString()}
Cashier: ${ord.staff_name}
--------------------------------
ITEM              QTY    TOTAL
--------------------------------
${ord.items.map(it => `${it.product_name.padEnd(18, ' ')}${String(it.qty).padEnd(5, ' ')}₱${it.subtotal.toFixed(2)}`).join('\n')}
--------------------------------
TOTAL DUE:              ₱${ord.total.toFixed(2)}
Payment: ${ord.payment_method.toUpperCase()}
================================
      Thank you! Come again!
`;
        return { success: true, data: { formattedText: text } };
      },
    },
  };
}
