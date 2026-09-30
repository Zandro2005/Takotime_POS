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
  { id: 4, name: 'Franchise Owner', username: 'cloudadmin', pin: '9999', password: 'cloudpass123', role: 'remote_admin' },
];

const defaultInventory = [
  // Section 1: Fillings & Batter (matches Excel rows 7-13)
  { itemId: 1, name: 'Takoyaki Flour', unit: 'kg', minStock: 5.0, beginningQty: 10.0, stockIn: 5.0, suggestedOut: 1.20, confirmedOut: null, endingQty: 13.80, wasteQty: null },
  { itemId: 2, name: 'Cheese', unit: 'kg', minStock: 1.5, beginningQty: 3.0, stockIn: 0, suggestedOut: 0.20, confirmedOut: null, endingQty: 2.80, wasteQty: null },
  { itemId: 3, name: 'Crab', unit: 'kg', minStock: 2.0, beginningQty: 4.0, stockIn: 0, suggestedOut: 0.30, confirmedOut: null, endingQty: 3.70, wasteQty: null },
  { itemId: 4, name: 'Shrimp', unit: 'kg', minStock: 2.0, beginningQty: 5.0, stockIn: 2.0, suggestedOut: 0.60, confirmedOut: null, endingQty: 6.40, wasteQty: null },
  { itemId: 5, name: 'Squid', unit: 'kg', minStock: 2.0, beginningQty: 3.0, stockIn: 1.0, suggestedOut: 0.40, confirmedOut: null, endingQty: 3.60, wasteQty: null },
  { itemId: 6, name: 'Corn', unit: 'kg', minStock: 2.0, beginningQty: 4.0, stockIn: 0, suggestedOut: 0.50, confirmedOut: null, endingQty: 3.50, wasteQty: null },
  { itemId: 7, name: 'Ham', unit: 'packs', minStock: 5.0, beginningQty: 8.0, stockIn: 0, suggestedOut: 1.0, confirmedOut: null, endingQty: 7.0, wasteQty: null },
  // Section 2: Sauces & Toppings (matches Excel rows 15-18)
  { itemId: 8, name: 'Japanese Mayo', unit: 'liters', minStock: 3.0, beginningQty: 8.0, stockIn: 0, suggestedOut: 0.80, confirmedOut: null, endingQty: 7.20, wasteQty: null },
  { itemId: 9, name: 'Takoyaki Sauce', unit: 'liters', minStock: 3.0, beginningQty: 8.0, stockIn: 0, suggestedOut: 0.80, confirmedOut: null, endingQty: 7.20, wasteQty: null },
  { itemId: 10, name: 'Katsuobushi Flakes', unit: 'packs', minStock: 2.0, beginningQty: 10.0, stockIn: 0, suggestedOut: 1.50, confirmedOut: null, endingQty: 8.50, wasteQty: null },
  { itemId: 11, name: 'Green Seaweeds', unit: 'packs', minStock: 2.0, beginningQty: 6.0, stockIn: 0, suggestedOut: 0.50, confirmedOut: null, endingQty: 5.50, wasteQty: null },
  // Section 3: Dimsum & Dumplings (matches Excel rows 20-23)
  { itemId: 12, name: 'Siomai', unit: 'pcs', minStock: 100.0, beginningQty: 200.0, stockIn: 100.0, suggestedOut: 32.0, confirmedOut: null, endingQty: 268.0, wasteQty: null },
  { itemId: 13, name: 'Japanese Siomai', unit: 'pcs', minStock: 100.0, beginningQty: 120.0, stockIn: 0, suggestedOut: 16.0, confirmedOut: null, endingQty: 104.0, wasteQty: null },
  { itemId: 14, name: 'Big Siomai', unit: 'pcs', minStock: 100.0, beginningQty: 150.0, stockIn: 0, suggestedOut: 24.0, confirmedOut: null, endingQty: 126.0, wasteQty: null },
  { itemId: 15, name: 'Dumplings', unit: 'pcs', minStock: 100.0, beginningQty: 180.0, stockIn: 50.0, suggestedOut: 20.0, confirmedOut: null, endingQty: 210.0, wasteQty: null },
  // Non-food items
  { itemId: 16, name: 'Cups 16oz', unit: 'pcs', minStock: 50.0, beginningQty: 150.0, stockIn: 0, suggestedOut: 18.0, confirmedOut: null, endingQty: 132.0, wasteQty: null },
  { itemId: 17, name: 'Water Bottle 500ml', unit: 'pcs', minStock: 24.0, beginningQty: 48.0, stockIn: 0, suggestedOut: 6.0, confirmedOut: null, endingQty: 42.0, wasteQty: null },
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
        const cashSales = orders.filter(o => o.status === 'completed' && o.payment_method === 'cash').reduce((s, o) => s + o.total, 0);
        const cashlessSales = orders.filter(o => o.status === 'completed' && o.payment_method !== 'cash').reduce((s, o) => s + o.total, 0);
        const expectedCash = (currentShift?.starting_cash || 0) + cashSales;
        const closed = {
          ...currentShift,
          status: 'closed',
          ending_cash: Number(endingCash),
          expected_cash: expectedCash,
          closed_at: new Date().toISOString(),
          discrepancy: Number(endingCash) - expectedCash,
          breakdown: {
            startingCash: currentShift.starting_cash,
            cashSales,
            cashlessSales,
            gcashSales: cashlessSales,
            expectedCash,
          },
        };
        currentShift = null;
        return { success: true, data: closed };
      },
    },

    menu: {
      getCatalog: async () => ({ success: true, data: defaultCatalog }),
      getCategories: async () => ({ success: true, data: defaultCatalog.map(c => ({ id: c.id, name: c.name, sort_order: c.sort_order, active: 1 })) }),
      getProducts: async (s, catId) => ({ success: true, data: defaultCatalog.find(c => c.id === catId)?.products || [] }),
      getVariants: async (s, prodId) => {
        for (const c of defaultCatalog) {
          const p = c.products.find(pr => pr.id === prodId);
          if (p) return { success: true, data: p.variants };
        }
        return { success: true, data: [] };
      },
      getModifiers: async (s, prodId) => {
        for (const c of defaultCatalog) {
          const p = c.products.find(pr => pr.id === prodId);
          if (p) return { success: true, data: p.modifiers };
        }
        return { success: true, data: [] };
      },
    },

    menuAdmin: {
      createCategory: async (s, data) => {
        const newCat = { id: defaultCatalog.length + 1, name: data.name, sort_order: Number(data.sortOrder) || 0, products: [] };
        defaultCatalog.push(newCat);
        return { success: true, data: newCat };
      },
      updateCategory: async (s, data) => {
        const cat = defaultCatalog.find(c => c.id === data.id);
        if (cat && data.name) cat.name = data.name;
        return { success: true, data: cat };
      },
      createProduct: async (s, data) => {
        const cat = defaultCatalog.find(c => c.id === data.categoryId);
        const newProd = {
          id: Date.now(),
          name: data.name,
          category_id: data.categoryId,
          sort_order: Number(data.sortOrder) || 0,
          variants: [],
          modifiers: [],
        };
        if (cat) cat.products.push(newProd);
        return { success: true, data: newProd };
      },
      updateProduct: async (s, data) => {
        for (const c of defaultCatalog) {
          const p = c.products.find(pr => pr.id === data.id);
          if (p) {
            if (data.name) p.name = data.name;
            if (data.categoryId) p.category_id = data.categoryId;
            return { success: true, data: p };
          }
        }
        return { success: true };
      },
      createVariant: async (s, data) => {
        for (const c of defaultCatalog) {
          const p = c.products.find(pr => pr.id === data.productId);
          if (p) {
            const newVar = {
              id: Date.now(),
              product_id: data.productId,
              label: data.label,
              price: Number(data.price),
              cost: Number(data.cost) || 0,
              sort_order: Number(data.sortOrder) || 0,
            };
            p.variants.push(newVar);
            return { success: true, data: newVar };
          }
        }
        return { success: true };
      },
      updateVariant: async (s, data) => {
        for (const c of defaultCatalog) {
          for (const p of c.products) {
            const v = p.variants.find(va => va.id === data.id);
            if (v) {
              if (data.label) v.label = data.label;
              if (data.price !== undefined) v.price = Number(data.price);
              if (data.cost !== undefined) v.cost = Number(data.cost);
              return { success: true, data: v };
            }
          }
        }
        return { success: true };
      },
      deleteVariant: async (s, id) => {
        for (const c of defaultCatalog) {
          for (const p of c.products) {
            p.variants = p.variants.filter(va => va.id !== id);
          }
        }
        return { success: true };
      },
      manageModifiers: async (s, data) => {
        return { success: true };
      },
      toggleActive: async (s, id, active) => {
        return { success: true };
      },
    },

    recipes: {
      get: async (s, variantId) => {
        return {
          success: true,
          data: {
            variantId,
            ingredients: [
              { id: 1, inventoryItemId: 1, name: 'Takoyaki Batter Premix', unit: 'kg', qtyPerUnit: 0.16 },
              { id: 2, inventoryItemId: 2, name: 'Diced Octopus', unit: 'kg', qtyPerUnit: 0.08 },
            ],
          },
        };
      },
      update: async (s, variantId, ingredients) => {
        return {
          success: true,
          data: { variantId, ingredients },
        };
      },
      getCoverage: async () => {
        const list = [];
        for (const c of defaultCatalog) {
          for (const p of c.products) {
            for (const v of p.variants) {
              list.push({
                category_name: c.name,
                product_id: p.id,
                product_name: p.name,
                variant_id: v.id,
                variant_label: v.label,
                price: v.price,
                ingredient_count: 2,
                hasRecipe: true,
              });
            }
          }
        }
        return { success: true, data: list };
      },
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

    inventory: {
      getItems: async (sessionId, date) => {
        return {
          success: true,
          data: defaultInventory.map(item => {
            const beg = Number(item.beginningQty) || 0;
            const sin = Number(item.stockIn) || 0;
            const sug = Number(item.suggestedOut) || 0;
            const conf = item.confirmedOut !== null && item.confirmedOut !== undefined ? Number(item.confirmedOut) : null;
            const end = item.endingQty !== null && item.endingQty !== undefined ? Number(item.endingQty) : (conf !== null ? beg + sin - conf : beg + sin - sug);
            return {
              ...item,
              beginningQty: beg,
              stockIn: sin,
              suggestedOut: sug,
              confirmedOut: conf,
              endingQty: end,
              wasteQty: conf !== null ? conf - sug : null,
              logDate: date || new Date().toLocaleDateString('en-CA'),
              isConfirmed: conf !== null,
              isLowStock: end <= (Number(item.minStock) || 0),
            };
          }),
        };
      },

      updateLog: async (sessionId, payload) => {
        const item = defaultInventory.find(i => i.itemId === payload.itemId);
        if (item) {
          if (payload.stockIn !== undefined) {
            item.stockIn = (Number(item.stockIn) || 0) + Number(payload.stockIn);
          }
          if (payload.beginningQty !== undefined) {
            item.beginningQty = Number(payload.beginningQty);
          }
          const beg = Number(item.beginningQty) || 0;
          const sin = Number(item.stockIn) || 0;
          const conf = item.confirmedOut !== null && item.confirmedOut !== undefined ? Number(item.confirmedOut) : null;
          const sug = Number(item.suggestedOut) || 0;
          item.endingQty = conf !== null ? beg + sin - conf : beg + sin - sug;
        }
        return { success: true };
      },

      confirmOut: async (sessionId, payload) => {
        const item = defaultInventory.find(i => i.itemId === payload.itemId);
        if (item) {
          const qty = Number(payload.confirmedQty) || 0;
          item.confirmedOut = qty;
          const beg = Number(item.beginningQty) || 0;
          const sin = Number(item.stockIn) || 0;
          const sug = Number(item.suggestedOut) || 0;
          item.endingQty = beg + sin - qty;
          item.wasteQty = qty - sug;
        }
        return { success: true, data: item };
      },
    },

    reports: {
      getDailySales: async (sessionId, date) => {
        const completed = orders.filter(o => o.status === 'completed');
        const gross = completed.reduce((sum, o) => sum + o.subtotal, 0);
        const net = completed.reduce((sum, o) => sum + o.total, 0);
        const cash = completed.filter(o => o.payment_method === 'cash').reduce((sum, o) => sum + o.total, 0);
        const gcash = completed.filter(o => o.payment_method !== 'cash').reduce((sum, o) => sum + o.total, 0);
        const voided = orders.filter(o => o.status === 'voided');

        return {
          success: true,
          data: {
            date: date || new Date().toISOString().split('T')[0],
            summary: {
              completedOrders: completed.length,
              voidedOrders: voided.length,
              grossSales: gross,
              discounts: gross - net,
              netSales: net,
              voidedAmount: voided.reduce((sum, o) => sum + o.subtotal, 0),
              cashSales: cash,
              gcashSales: gcash,
            },
            topItems: [
              { product_name: 'Classic Octopus Takoyaki', variant_label: '8 pcs', category_name: 'Takoyaki', units_sold: 42, total_revenue: 3570.0 },
              { product_name: 'Crab & Cheese Takoyaki', variant_label: '8 pcs', category_name: 'Takoyaki', units_sold: 28, total_revenue: 2660.0 },
              { product_name: 'Classic Octopus Takoyaki', variant_label: '4 pcs', category_name: 'Takoyaki', units_sold: 25, total_revenue: 1125.0 },
              { product_name: 'Pork Siomai', variant_label: '4 pcs', category_name: 'Siomai', units_sold: 22, total_revenue: 880.0 },
              { product_name: 'Fresh Calamansi Juice (16oz)', variant_label: 'Regular (16oz)', category_name: 'Drinks', units_sold: 19, total_revenue: 570.0 },
            ],
            shifts: [
              { id: 1, staff_name: 'Cashier 1', status: 'open', opened_at: '2026-09-27 08:00:00', starting_cash: 1000, ending_cash: null, expected_cash: 1000 + cash },
            ],
            hourly: [
              { hour: '09:00', order_count: 3, revenue: 380 },
              { hour: '10:00', order_count: 5, revenue: 640 },
              { hour: '11:00', order_count: 8, revenue: 1120 },
              { hour: '12:00', order_count: 14, revenue: 1980 },
              { hour: '13:00', order_count: 11, revenue: 1540 },
              { hour: '14:00', order_count: 7, revenue: 920 },
              { hour: '15:00', order_count: 9, revenue: 1250 },
              { hour: '16:00', order_count: 12, revenue: 1680 },
              { hour: '17:00', order_count: 16, revenue: 2240 },
              { hour: '18:00', order_count: 10, revenue: 1390 },
            ],
          },
        };
      },

      getShiftSummary: async (sessionId, shiftId) => {
        const completed = orders.filter(o => o.status === 'completed');
        const cash = completed.filter(o => o.payment_method === 'cash').reduce((sum, o) => sum + o.total, 0);
        return {
          success: true,
          data: {
            shift: {
              id: shiftId || 1,
              status: 'open',
              staffName: 'Cashier 1',
              staffRole: 'staff',
              openedAt: '2026-09-27 08:00:00',
              closedAt: null,
              startingCash: 1000,
              endingCash: null,
              expectedCash: 1000 + cash,
              discrepancy: null,
            },
            sales: {
              completedOrders: completed.length,
              voidedOrders: 0,
              grossSales: cash,
              discounts: 0,
              netSales: cash,
              cashSales: cash,
              gcashSales: 0,
            },
            cashAccounting: {
              startingCash: 1000,
              cashSales: cash,
              cashIn: 0,
              cashOut: 0,
              cashDrop: 0,
              expectedDrawerCash: 1000 + cash,
              countedDrawerCash: null,
              discrepancy: null,
            },
            movements: [],
          },
        };
      },

      getProductMix: async (sessionId, startDate, endDate) => {
        return {
          success: true,
          data: {
            startDate,
            endDate,
            totalRevenue: 8805.0,
            totalUnits: 136,
            items: [
              { category_name: 'Takoyaki', product_name: 'Classic Octopus Takoyaki', variant_label: '8 pcs', unit_price: 85.0, units_sold: 42, total_revenue: 3570.0, percentOfRevenue: 40.5, percentOfUnits: 30.9 },
              { category_name: 'Takoyaki', product_name: 'Crab & Cheese Takoyaki', variant_label: '8 pcs', unit_price: 95.0, units_sold: 28, total_revenue: 2660.0, percentOfRevenue: 30.2, percentOfUnits: 20.6 },
              { category_name: 'Takoyaki', product_name: 'Classic Octopus Takoyaki', variant_label: '4 pcs', unit_price: 45.0, units_sold: 25, total_revenue: 1125.0, percentOfRevenue: 12.8, percentOfUnits: 18.4 },
              { category_name: 'Siomai', product_name: 'Pork Siomai', variant_label: '4 pcs', unit_price: 40.0, units_sold: 22, total_revenue: 880.0, percentOfRevenue: 10.0, percentOfUnits: 16.2 },
              { category_name: 'Drinks', product_name: 'Fresh Calamansi Juice (16oz)', variant_label: 'Regular (16oz)', unit_price: 30.0, units_sold: 19, total_revenue: 570.0, percentOfRevenue: 6.5, percentOfUnits: 13.9 },
            ],
          },
        };
      },

      getInventory: async (sessionId, startDate, endDate) => {
        return {
          success: true,
          data: {
            startDate,
            endDate,
            items: defaultInventory.map(i => ({
              item_id: i.itemId,
              item_name: i.name,
              unit: i.unit,
              total_stock_in: Number(i.stockIn) || 0,
              total_suggested_out: Number(i.suggestedOut) || 0,
              total_confirmed_out: (i.confirmedOut !== null && i.confirmedOut !== undefined) ? Number(i.confirmedOut) : (Number(i.suggestedOut) || 0),
              total_waste_qty: (i.wasteQty !== null && i.wasteQty !== undefined) ? Number(i.wasteQty) : 0,
            })),
          },
        };
      },

      exportCsv: async (sessionId, reportType, data) => {
        let csv = 'Report,Export\n';
        if (reportType === 'daily_sales') {
          csv = 'Product,Variant,Category,Units Sold,Revenue (PHP)\n' +
            (data.topItems || []).map(it => `"${it.product_name}","${it.variant_label}","${it.category_name}",${it.units_sold},${it.total_revenue.toFixed(2)}`).join('\n');
        } else if (reportType === 'product_mix') {
          csv = 'Category,Product,Variant,Unit Price,Units Sold,Total Revenue,% Revenue,% Units\n' +
            (data.items || []).map(it => `"${it.category_name}","${it.product_name}","${it.variant_label}",${it.unit_price},${it.units_sold},${it.total_revenue},${it.percentOfRevenue.toFixed(1)}%,${it.percentOfUnits.toFixed(1)}%`).join('\n');
        } else {
          csv = 'Item,Unit,Stock In,Suggested Out,Confirmed Out,Waste\n' +
            (data.items || []).map(it => `"${it.item_name}","${it.unit}",${it.total_stock_in},${it.total_suggested_out},${it.total_confirmed_out},${it.total_waste_qty}`).join('\n');
        }
        return { success: true, data: csv };
      },
    },

    staff: {
      list: async (sessionId) => {
        let staffList = JSON.parse(localStorage.getItem(STORAGE_KEY_PREFIX + 'staff') || 'null');
        if (!staffList) {
          staffList = [
            { id: 1, name: 'Store Admin', username: 'admin', role: 'admin', active: 1, has_pin: 1, total_shifts: 2, last_shift_at: '2026-09-26 18:00:00' },
            { id: 2, name: 'Lead Staff', username: 'supervisor', role: 'admin_staff', active: 1, has_pin: 1, total_shifts: 8, last_shift_at: '2026-09-27 15:30:00' },
            { id: 3, name: 'Cashier 1', username: 'cashier', role: 'staff', active: 1, has_pin: 1, total_shifts: 15, last_shift_at: '2026-09-27 10:00:00' },
          ];
          localStorage.setItem(STORAGE_KEY_PREFIX + 'staff', JSON.stringify(staffList));
        }
        return { success: true, data: staffList };
      },

      create: async (sessionId, staffData) => {
        const staffList = JSON.parse(localStorage.getItem(STORAGE_KEY_PREFIX + 'staff') || '[]');
        const newStaff = {
          id: Date.now(),
          name: staffData.name,
          username: staffData.username.toLowerCase(),
          role: staffData.role,
          active: 1,
          has_pin: staffData.pin ? 1 : 0,
          total_shifts: 0,
          last_shift_at: null,
          created_at: new Date().toISOString(),
        };
        staffList.push(newStaff);
        localStorage.setItem(STORAGE_KEY_PREFIX + 'staff', JSON.stringify(staffList));
        return { success: true, data: newStaff };
      },

      update: async (sessionId, staffData) => {
        const staffList = JSON.parse(localStorage.getItem(STORAGE_KEY_PREFIX + 'staff') || '[]');
        const idx = staffList.findIndex(s => s.id === staffData.id);
        if (idx !== -1) {
          staffList[idx] = {
            ...staffList[idx],
            name: staffData.name !== undefined ? staffData.name : staffList[idx].name,
            role: staffData.role !== undefined ? staffData.role : staffList[idx].role,
            active: staffData.active !== undefined ? (staffData.active ? 1 : 0) : staffList[idx].active,
            updated_at: new Date().toISOString(),
          };
          localStorage.setItem(STORAGE_KEY_PREFIX + 'staff', JSON.stringify(staffList));
          return { success: true, data: staffList[idx] };
        }
        return { success: false, error: 'Staff member not found' };
      },

      deactivate: async (sessionId, id) => {
        const staffList = JSON.parse(localStorage.getItem(STORAGE_KEY_PREFIX + 'staff') || '[]');
        const idx = staffList.findIndex(s => s.id === id);
        if (idx !== -1) {
          staffList[idx].active = 0;
          localStorage.setItem(STORAGE_KEY_PREFIX + 'staff', JSON.stringify(staffList));
          return { success: true, data: staffList[idx] };
        }
        return { success: false, error: 'Staff member not found' };
      },

      reactivate: async (sessionId, id) => {
        const staffList = JSON.parse(localStorage.getItem(STORAGE_KEY_PREFIX + 'staff') || '[]');
        const idx = staffList.findIndex(s => s.id === id);
        if (idx !== -1) {
          staffList[idx].active = 1;
          localStorage.setItem(STORAGE_KEY_PREFIX + 'staff', JSON.stringify(staffList));
          return { success: true, data: staffList[idx] };
        }
        return { success: false, error: 'Staff member not found' };
      },

      resetPassword: async (sessionId, id, password) => {
        return { success: true, message: 'Password reset successfully' };
      },

      resetPin: async (sessionId, id, pin) => {
        const staffList = JSON.parse(localStorage.getItem(STORAGE_KEY_PREFIX + 'staff') || '[]');
        const idx = staffList.findIndex(s => s.id === id);
        if (idx !== -1) {
          staffList[idx].has_pin = pin ? 1 : 0;
          localStorage.setItem(STORAGE_KEY_PREFIX + 'staff', JSON.stringify(staffList));
        }
        return { success: true, message: 'PIN updated successfully' };
      },
    },

    settings: {
      getAll: async (sessionId) => {
        let currentSettings = JSON.parse(localStorage.getItem(STORAGE_KEY_PREFIX + 'settings') || 'null');
        if (!currentSettings) {
          currentSettings = {
            store_name: 'TAKOTIME - Montalban',
            branch_name: 'Montalban Branch',
            branch_address: 'Rodriguez Highway, Montalban, Rizal',
            branch_contact: '0917-123-4567',
            receipt_header: 'TAKOTIME\nMontalban Branch\nTel: (02) 8123-4567',
            receipt_footer: 'Maraming Salamat!\nCome Again!',
            session_timeout_min: '30',
            sync_interval_min: '15',
            backup_interval_hrs: '6',
            tax_rate: '0',
            currency_symbol: '₱',
          };
          localStorage.setItem(STORAGE_KEY_PREFIX + 'settings', JSON.stringify(currentSettings));
        }
        return { success: true, data: currentSettings };
      },

      update: async (sessionId, updatedFields) => {
        let current = JSON.parse(localStorage.getItem(STORAGE_KEY_PREFIX + 'settings') || '{}');
        const next = { ...current, ...(updatedFields || {}) };
        localStorage.setItem(STORAGE_KEY_PREFIX + 'settings', JSON.stringify(next));
        return { success: true, data: next };
      },
    },

    dashboard: {
      getSalesTrend: async (sessionId, timeframe = '7d', date) => {
        const target = date ? new Date(date) : new Date();
        const trend = [];
        if (timeframe === 'semi_annual' || timeframe === 'annual') {
          const monthsCount = timeframe === 'annual' ? 12 : 6;
          for (let i = monthsCount - 1; i >= 0; i--) {
            const d = new Date(target.getFullYear(), target.getMonth() - i, 1);
            const label = d.toLocaleDateString('en-US', { month: 'short', year: monthsCount === 12 ? '2-digit' : undefined });
            const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const revenue = Math.round(98000 + ((i * 4700 + 13000) % 45000));
            const orderCount = Math.round(revenue / 135);
            trend.push({ date: monthStr, label, revenue, orderCount });
          }
        } else {
          const daysCount = timeframe === '30d' ? 30 : timeframe === '15d' ? 15 : 7;
          for (let i = daysCount - 1; i >= 0; i--) {
            const d = new Date(target);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const label = daysCount === 7
              ? d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' })
              : `${d.getMonth() + 1}/${d.getDate()}`;
            const revenue = i === 0 ? 4780 : Math.round(3800 + ((i * 530 + 1100) % 2900));
            const orderCount = Math.round(revenue / 140);
            trend.push({ date: dateStr, label, revenue, orderCount });
          }
        }
        return { success: true, data: trend };
      },

      getOverview: async (sessionId, date, timeframe = '7d') => {
        const target = date ? new Date(date) : new Date();
        const targetDate = date || target.toISOString().split('T')[0];
        const trend = [];

        if (timeframe === 'semi_annual' || timeframe === 'annual') {
          const monthsCount = timeframe === 'annual' ? 12 : 6;
          for (let i = monthsCount - 1; i >= 0; i--) {
            const d = new Date(target.getFullYear(), target.getMonth() - i, 1);
            const label = d.toLocaleDateString('en-US', { month: 'short', year: monthsCount === 12 ? '2-digit' : undefined });
            const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const revenue = Math.round(98000 + ((i * 4700 + 13000) % 45000));
            const orderCount = Math.round(revenue / 135);
            trend.push({ date: monthStr, label, revenue, orderCount });
          }
        } else {
          const daysCount = timeframe === '30d' ? 30 : timeframe === '15d' ? 15 : 7;
          for (let i = daysCount - 1; i >= 0; i--) {
            const d = new Date(target);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const label = daysCount === 7
              ? d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' })
              : `${d.getMonth() + 1}/${d.getDate()}`;
            const revenue = i === 0 ? 4780 : Math.round(3800 + ((i * 530 + 1100) % 2900));
            const orderCount = Math.round(revenue / 140);
            trend.push({ date: dateStr, label, revenue, orderCount });
          }
        }

        return {
          success: true,
          data: {
            date: targetDate,
            timeframe,
            today: {
              completedOrders: 32,
              voidedOrders: 1,
              grossSales: 4890.0,
              discounts: 110.0,
              netSales: 4780.0,
              cashSales: 3580.0,
              gcashSales: 1200.0,
            },
            activeShift: {
              shiftId: 1,
              staffName: 'Cashier 1',
              staffRole: 'staff',
              openedAt: '2026-09-27 10:00:00',
              startingCash: 1000.0,
              cashSales: 3580.0,
              cashIn: 0.0,
              cashOut: 150.0,
              expectedDrawerCash: 4430.0,
              orderCount: 32,
            },
            lowStockAlerts: [
              { itemId: 1, name: 'Takoyaki Batter Premix', unit: 'kg', currentStock: 2.2, minStock: 5.0, severity: 'warning' },
              { itemId: 8, name: 'Fresh Calamansi', unit: 'kg', currentStock: 0.0, minStock: 2.0, severity: 'critical' },
              { itemId: 6, name: 'Bonito Flakes', unit: 'packs', currentStock: 1.5, minStock: 3.0, severity: 'warning' },
            ],
            salesTrend: trend,
            topProducts: [
              { product_name: 'Classic Octopus Takoyaki', variant_label: '8 pcs', units_sold: 22, total_revenue: 1870.0 },
              { product_name: 'Crab & Cheese Takoyaki', variant_label: '8 pcs', units_sold: 15, total_revenue: 1425.0 },
              { product_name: 'Pork Siomai', variant_label: '4 pcs', units_sold: 16, total_revenue: 640.0 },
              { product_name: 'Classic Octopus Takoyaki', variant_label: '4 pcs', units_sold: 12, total_revenue: 540.0 },
              { product_name: 'Fresh Calamansi Juice (16oz)', variant_label: 'Regular (16oz)', units_sold: 10, total_revenue: 300.0 },
            ],
          },
        };
      },
    },

    sync: {
      getStatus: async (sessionId) => {
        return {
          success: true,
          data: {
            isEnabled: true,
            baseUrl: 'https://takotime-pos-default-rtdb.asia-southeast1.firebasedatabase.app',
            branchId: 'montalban',
            pendingOrdersCount: 0,
            totalOrdersCount: 32,
            lastSuccessfulSyncAt: new Date().toISOString(),
            lastSyncStatus: 'success',
            lastSyncError: null,
          },
        };
      },

      trigger: async (sessionId) => {
        return {
          success: true,
          data: {
            success: true,
            recordsSynced: 4,
            ordersPushed: 3,
            actionsApplied: 1,
            timestamp: new Date().toISOString(),
          },
        };
      },

      getLogs: async (sessionId, limit = 20) => {
        return {
          success: true,
          data: [
            { id: 3, direction: 'push', status: 'success', records_synced: 4, error_message: null, started_at: '2026-09-27 15:45:00', completed_at: '2026-09-27 15:45:02' },
            { id: 2, direction: 'push', status: 'success', records_synced: 6, error_message: null, started_at: '2026-09-27 15:30:00', completed_at: '2026-09-27 15:30:03' },
            { id: 1, direction: 'push', status: 'success', records_synced: 12, error_message: null, started_at: '2026-09-27 15:15:00', completed_at: '2026-09-27 15:15:04' },
          ],
        };
      },
    },

    health: {
      getStatus: async (sessionId) => {
        return {
          success: true,
          data: {
            database: {
              path: 'data/pos.db',
              sizeBytes: 262144,
              sizeFormatted: '256.0 KB',
              walSizeBytes: 65536,
              walSizeFormatted: '64.0 KB',
              journalMode: 'WAL',
              integrity: {
                ok: true,
                status: 'PASSED',
                details: 'Database integrity verified. 0 corrupt pages detected.',
                checkedAt: new Date().toISOString(),
              },
              counts: {
                orders: 32,
                products: 8,
                users: 3,
                shifts: 1,
                inventoryItems: 12,
              },
            },
            backups: {
              totalCount: 3,
              latestBackup: {
                filename: 'pos_20260927_120000_scheduled.db',
                filePath: 'backups/pos_20260927_120000_scheduled.db',
                sizeBytes: 245760,
                sizeFormatted: '240.0 KB',
                createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
                reason: 'scheduled_6h',
              },
              backupDir: 'backups/',
            },
            shifts: {
              activeShift: currentShift ? { ...currentShift, staff_name: 'Cashier 1' } : null,
              staleShifts: [],
            },
            sync: {
              pendingSyncCount: 0,
            },
            system: {
              uptimeSeconds: 14420,
              nodeVersion: 'v22.12.0',
              platform: 'win32',
              memory: {
                rssFormatted: '64.2 MB',
                heapUsedFormatted: '38.5 MB',
                heapTotalFormatted: '52.0 MB',
              },
              timestamp: new Date().toISOString(),
            },
          },
        };
      },

      checkIntegrity: async (sessionId) => {
        return {
          success: true,
          data: {
            ok: true,
            status: 'PASSED',
            details: 'Database integrity verified. 0 corrupt pages detected.',
            checkedAt: new Date().toISOString(),
          },
        };
      },

      getStaleShifts: async (sessionId) => {
        return { success: true, data: [] };
      },

      forceCloseShift: async (sessionId, shiftId, notes) => {
        return { success: true, data: { shiftId, status: 'force_closed', expectedCash: 3580 } };
      },
    },

    backup: {
      runNow: async (sessionId, reason = 'manual') => {
        const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
        const newBackup = {
          filename: `pos_${timestamp}_${reason}.db`,
          filePath: `backups/pos_${timestamp}_${reason}.db`,
          sizeBytes: 256000,
          sizeFormatted: '250.0 KB',
          createdAt: new Date().toISOString(),
          reason,
          integrity: 'ok',
        };
        return {
          success: true,
          data: newBackup,
        };
      },

      list: async (sessionId) => {
        return {
          success: true,
          data: [
            {
              filename: 'pos_20260927_120000_scheduled.db',
              filePath: 'backups/pos_20260927_120000_scheduled.db',
              sizeBytes: 245760,
              sizeFormatted: '240.0 KB',
              createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
              reason: 'scheduled_6h',
            },
            {
              filename: 'pos_20260927_060000_scheduled.db',
              filePath: 'backups/pos_20260927_060000_scheduled.db',
              sizeBytes: 237568,
              sizeFormatted: '232.0 KB',
              createdAt: new Date(Date.now() - 3600000 * 10).toISOString(),
              reason: 'scheduled_6h',
            },
            {
              filename: 'pos_20260926_220000_shift_close.db',
              filePath: 'backups/pos_20260926_220000_shift_close.db',
              sizeBytes: 229376,
              sizeFormatted: '224.0 KB',
              createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
              reason: 'shift_close',
            },
          ],
        };
      },

      getStatus: async (sessionId) => {
        return {
          success: true,
          data: {
            totalCount: 3,
            backupDir: 'backups/',
            retentionDays: 30,
            latestBackup: {
              filename: 'pos_20260927_120000_scheduled.db',
              sizeFormatted: '240.0 KB',
              createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
            },
          },
        };
      },

      verify: async (sessionId, filePath) => {
        return {
          success: true,
          data: { valid: true, message: 'ok' },
        };
      },

      prune: async (sessionId, retentionDays) => {
        return {
          success: true,
          data: { prunedCount: 0, remainingCount: 3 },
        };
      },
    },

    print: {
      receipt: async (sessionId, orderId, options) => {
        return {
          success: true,
          data: {
            success: true,
            simulated: true,
            orderId,
            spoolFile: `spooler/receipt_${orderId}.txt`,
            timestamp: new Date().toISOString(),
          },
        };
      },

      test: async (sessionId) => {
        return {
          success: true,
          data: {
            success: true,
            simulated: true,
            message: 'Hardware test ticket sent to thermal spooler.',
          },
        };
      },

      drawer: async (sessionId) => {
        return {
          success: true,
          data: {
            success: true,
            pulseCode: 'ESC_p_0_25_250',
            timestamp: new Date().toISOString(),
          },
        };
      },

      status: async (sessionId) => {
        return {
          success: true,
          data: {
            status: 'ONLINE',
            mode: 'ESC/POS Monospace Thermal Driver',
            paperWidth: '32 columns (58mm)',
            spoolerPath: 'spooler/',
            cashDrawerConnected: true,
          },
        };
      },
    },

    logs: {
      getRecent: async (sessionId, limit = 50) => {
        const now = new Date();
        return {
          success: true,
          data: [
            { timestamp: new Date(now - 1000 * 15).toISOString(), level: 'INFO', message: 'Cashier checkout completed Order #0042 [₱125.00]' },
            { timestamp: new Date(now - 1000 * 30).toISOString(), level: 'INFO', message: 'Thermal receipt spooled to spooler/receipt_42.txt' },
            { timestamp: new Date(now - 1000 * 60).toISOString(), level: 'INFO', message: 'Cloud sync cycle completed: 4 records synced to Firebase' },
            { timestamp: new Date(now - 1000 * 180).toISOString(), level: 'DEBUG', message: 'WAL checkpoint flushed successfully' },
            { timestamp: new Date(now - 1000 * 600).toISOString(), level: 'INFO', message: 'Automated 6-hour SQLite backup created: pos_20260927_120000_scheduled.db' },
            { timestamp: new Date(now - 1000 * 1200).toISOString(), level: 'INFO', message: 'Staff login verified: Cashier 1 (PIN 1111)' },
            { timestamp: new Date(now - 1000 * 1800).toISOString(), level: 'INFO', message: 'Shift #1 opened with starting cash ₱1,000.00' },
            { timestamp: new Date(now - 1000 * 3600).toISOString(), level: 'INFO', message: 'SQLite database opened at data/pos.db with WAL mode' },
          ],
        };
      },
    },
  };
}

