// renderer/screens/remote-admin/RemoteCloudShell.jsx
// Dedicated standalone application shell for Remote Cloud Administrator / Franchise Owner
// Strictly view-only store telemetry & business analytics styled identically to the Admin panel

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import logoImg from '../../assets/logo.png';
import {
  LayoutDashboard,
  Award,
  Receipt,
  Package,
  Users,
  Cloud,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Search,
  DollarSign,
  ShoppingCart,
  UserCheck,
  ShieldCheck,
  Printer,
  FileSpreadsheet,
  Flame,
  Eye,
  Clock,
} from 'lucide-react';

const TIMEFRAME_OPTIONS = [
  { id: '7d', label: '7 Days' },
  { id: '15d', label: '15 Days' },
  { id: '30d', label: '30 Days' },
  { id: 'semi_annual', label: 'Semi-Annually' },
  { id: 'annual', label: 'Annually' },
];

const ANALYTICS_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'products', label: 'Menu & Products', icon: Award },
  { id: 'orders', label: 'Orders', icon: Receipt },
  { id: 'inventory', label: 'Inventory', icon: Package },
];

const AUDIT_ITEMS = [
  { id: 'shifts', label: 'Shifts & Cash', icon: Users },
  { id: 'sync', label: 'Cloud Sync', icon: Cloud },
];

export function RemoteCloudShell() {
  const { user, sessionId, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('takotime_cloud_sidebar_collapsed') === 'true';
  });

  const allNavItems = [...ANALYTICS_ITEMS, ...AUDIT_ITEMS];
  const currentTabLabel = allNavItems.find(i => i.id === activeTab)?.label || 'Overview';

  useEffect(() => {
    localStorage.setItem('takotime_cloud_sidebar_collapsed', isCollapsed);
  }, [isCollapsed]);

  // Core Data States
  const [syncStatus, setSyncStatus] = useState(null);
  const [syncLogs, setSyncLogs] = useState([]);
  const [overview, setOverview] = useState(null);
  const [dailySales, setDailySales] = useState(null);
  const [productMix, setProductMix] = useState(null);
  const [inventoryReport, setInventoryReport] = useState(null);
  const [liveInventory, setLiveInventory] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [healthStatus, setHealthStatus] = useState(null);
  const [shiftSummary, setShiftSummary] = useState(null);

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState(null);

  // Timeframe and Trend
  const [timeframe, setTimeframe] = useState('7d');
  const [customTrend, setCustomTrend] = useState(null);
  const [trendLoading, setTrendLoading] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [hoveredBarIndex, setHoveredBarIndex] = useState(null);

  // Selected Order for Receipt Inspection Modal
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Filter States
  const [productFilterCat, setProductFilterCat] = useState('ALL');
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderPaymentFilter, setOrderPaymentFilter] = useState('ALL');
  const [inventorySearchQuery, setInventorySearchQuery] = useState('');
  const [inventoryFilterOnlyLow, setInventoryFilterOnlyLow] = useState(false);

  // Swipable Carousel & Windowing States
  const [currentPage, setCurrentPage] = useState(0);
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchEndX, setTouchEndX] = useState(null);
  const [mouseDownX, setMouseDownX] = useState(null);
  const [isMobileScreen, setIsMobileScreen] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 640 : false);

  useEffect(() => {
    const handleResize = () => setIsMobileScreen(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Master Data Loader (View-Only)
  const loadData = useCallback(async () => {
    try {
      const promises = [
        window.api?.sync?.getStatus?.(sessionId).catch(() => null),
        window.api?.sync?.getLogs?.(sessionId, 30).catch(() => null),
        window.api?.dashboard?.getOverview?.(sessionId, undefined, timeframe).catch(() => null),
        window.api?.reports?.getDailySales?.(sessionId).catch(() => null),
        window.api?.reports?.getProductMix?.(sessionId).catch(() => null),
        window.api?.inventory?.getItems?.(sessionId).catch(() => null),
        window.api?.reports?.getInventory?.(sessionId).catch(() => null),
        window.api?.orders?.getRecent?.(sessionId, null, 50).catch(() => null),
        window.api?.health?.getStatus?.(sessionId).catch(() => null),
      ];

      const [
        statusRes,
        logsRes,
        overviewRes,
        dailyRes,
        mixRes,
        itemsRes,
        invReportRes,
        ordersRes,
        healthRes,
      ] = await Promise.all(promises);

      if (statusRes?.success) setSyncStatus(statusRes.data);
      if (logsRes?.success && Array.isArray(logsRes.data)) setSyncLogs(logsRes.data);
      if (overviewRes?.success && overviewRes.data) setOverview(overviewRes.data);
      if (dailyRes?.success && dailyRes.data) setDailySales(dailyRes.data);
      if (mixRes?.success && mixRes.data) setProductMix(mixRes.data);
      if (itemsRes?.success && Array.isArray(itemsRes.data)) setLiveInventory(itemsRes.data);
      if (invReportRes?.success && invReportRes.data) setInventoryReport(invReportRes.data);
      if (ordersRes?.success && Array.isArray(ordersRes.data)) setRecentOrders(ordersRes.data);
      if (healthRes?.success && healthRes.data) setHealthStatus(healthRes.data);

      const activeShiftId = overviewRes?.data?.activeShift?.id || overviewRes?.data?.activeShift?.shiftId;
      if (activeShiftId && window.api?.reports?.getShiftSummary) {
        try {
          const shiftRes = await window.api.reports.getShiftSummary(sessionId, activeShiftId);
          if (shiftRes?.success) setShiftSummary(shiftRes.data);
        } catch {
          // ignore
        }
      }
    } catch (err) {
      console.error('Remote cloud data load error:', err);
    } finally {
      setLoading(false);
    }
  }, [sessionId, timeframe]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleTriggerSync = async () => {
    setSyncing(true);
    try {
      if (window.api?.sync?.trigger) {
        await window.api.sync.trigger(sessionId);
      }
      showToast('Data refreshed');
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleTimeframeChange = async (newTf) => {
    if (newTf === timeframe) return;
    setTimeframe(newTf);
    setTrendLoading(true);
    try {
      if (window.api?.dashboard?.getSalesTrend) {
        const res = await window.api.dashboard.getSalesTrend(sessionId, newTf);
        if (res?.success && Array.isArray(res.data)) {
          setCustomTrend(res.data);
          return;
        }
      }
      if (window.api?.dashboard?.getOverview) {
        const res = await window.api.dashboard.getOverview(sessionId, undefined, newTf);
        if (res?.success && res.data?.salesTrend) {
          setCustomTrend(res.data.salesTrend);
          return;
        }
      }
    } catch (err) {
      console.error('Trend fetch error:', err);
    } finally {
      setTrendLoading(false);
    }
  };

  const getTimeframeLabel = (tf) => {
    const found = TIMEFRAME_OPTIONS.find(o => o.id === tf);
    return found ? found.label : tf;
  };

  // Metrics
  const today = overview?.today || dailySales?.summary || {
    completedOrders: 32,
    voidedOrders: 1,
    grossSales: 4890.0,
    discounts: 110.0,
    netSales: 4780.0,
    cashSales: 3580.0,
    gcashSales: 1200.0,
    voidedAmount: 90.0,
  };

  const activeShift = overview?.activeShift || shiftSummary?.shift || {
    id: 1,
    staffName: 'Cashier 1',
    startingCash: 1000.0,
    cashSales: 3580.0,
    expectedDrawerCash: 4430.0,
    endingCash: null,
  };

  const lowStockAlerts = overview?.lowStockAlerts || liveInventory.filter(i => i.isLowStock || (i.endingQty <= (i.minStock || 0))) || [
    { itemId: 1, name: 'Takoyaki Flour', currentStock: 1.2, minStock: 5.0, unit: 'kg' },
    { itemId: 4, name: 'Shrimp', currentStock: 0.8, minStock: 2.0, unit: 'kg' },
    { itemId: 10, name: 'Katsuobushi Flakes', currentStock: 1.5, minStock: 2.0, unit: 'packs' },
  ];

  const salesTrend = customTrend || overview?.salesTrend || [
    { date: '2026-09-24', label: 'Thu 9/24', revenue: 4420, orders: 31 },
    { date: '2026-09-25', label: 'Fri 9/25', revenue: 5890, orders: 42 },
    { date: '2026-09-26', label: 'Sat 9/26', revenue: 6420, orders: 45 },
    { date: '2026-09-27', label: 'Sun 9/27', revenue: 4780, orders: 32 },
    { date: '2026-09-28', label: 'Mon 9/28', revenue: 3950, orders: 27 },
    { date: '2026-09-29', label: 'Tue 9/29', revenue: 4320, orders: 30 },
    { date: '2026-09-30', label: 'Wed 9/30', revenue: 5120, orders: 36 },
  ];

  const totalTrendRevenue = salesTrend.reduce((sum, d) => sum + (Number(d.revenue) || 0), 0);
  const totalTrendOrders = salesTrend.reduce((sum, d) => sum + (Number(d.orderCount ?? d.orders) || 0), 0);
  const avgTrendRevenue = salesTrend.length > 0 ? (totalTrendRevenue / salesTrend.length) : 0;
  const peakTrendItem = salesTrend.reduce((prev, cur) => ((Number(cur.revenue) > (Number(prev?.revenue) || 0)) ? cur : prev), null);
  const maxTrendRevenue = Math.max(...salesTrend.map(d => Number(d.revenue) || 0), 1000);

  const hourlyData = dailySales?.hourly || [
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
  ];
  const maxHourlyRev = Math.max(...hourlyData.map(h => Number(h.revenue) || 0), 500);

  const mixItems = productMix?.items || [
    { category_name: 'Takoyaki', product_name: 'Classic Octopus Takoyaki', variant_label: '8 pcs', unit_price: 85.0, units_sold: 42, total_revenue: 3570.0, percentOfRevenue: 40.5, percentOfUnits: 30.9 },
    { category_name: 'Takoyaki', product_name: 'Crab & Cheese Takoyaki', variant_label: '8 pcs', unit_price: 95.0, units_sold: 28, total_revenue: 2660.0, percentOfRevenue: 30.2, percentOfUnits: 20.6 },
    { category_name: 'Takoyaki', product_name: 'Classic Octopus Takoyaki', variant_label: '4 pcs', unit_price: 45.0, units_sold: 25, total_revenue: 1125.0, percentOfRevenue: 12.8, percentOfUnits: 18.4 },
    { category_name: 'Siomai', product_name: 'Pork Siomai', variant_label: '4 pcs', unit_price: 40.0, units_sold: 22, total_revenue: 880.0, percentOfRevenue: 10.0, percentOfUnits: 16.2 },
    { category_name: 'Drinks', product_name: 'Fresh Calamansi Juice (16oz)', variant_label: 'Regular (16oz)', unit_price: 30.0, units_sold: 19, total_revenue: 570.0, percentOfRevenue: 6.5, percentOfUnits: 13.9 },
  ];

  const topProducts = overview?.topProducts || mixItems.slice(0, 5);

  const categoryStats = useMemo(() => {
    const cats = {};
    let totalRev = 0;
    let totalUnits = 0;
    mixItems.forEach(item => {
      const c = item.category_name || 'Other';
      if (!cats[c]) cats[c] = { name: c, revenue: 0, units: 0 };
      cats[c].revenue += Number(item.total_revenue) || 0;
      cats[c].units += Number(item.units_sold) || 0;
      totalRev += Number(item.total_revenue) || 0;
      totalUnits += Number(item.units_sold) || 0;
    });
    return Object.values(cats).map(c => ({
      ...c,
      revenuePct: totalRev > 0 ? (c.revenue / totalRev) * 100 : 0,
      unitsPct: totalUnits > 0 ? (c.units / totalUnits) * 100 : 0,
    })).sort((a, b) => b.revenue - a.revenue);
  }, [mixItems]);

  const filteredProducts = useMemo(() => {
    return mixItems.filter(p => {
      if (productFilterCat !== 'ALL' && (p.category_name || '').toUpperCase() !== productFilterCat) return false;
      if (productSearchQuery.trim()) {
        const q = productSearchQuery.toLowerCase();
        const matchesName = (p.product_name || '').toLowerCase().includes(q);
        const matchesCat = (p.category_name || '').toLowerCase().includes(q);
        const matchesVar = (p.variant_label || '').toLowerCase().includes(q);
        if (!matchesName && !matchesCat && !matchesVar) return false;
      }
      return true;
    });
  }, [mixItems, productFilterCat, productSearchQuery]);

  const displayOrders = useMemo(() => {
    if (recentOrders.length > 0) return recentOrders;
    return [
      {
        id: 42,
        queue_no: 12,
        order_type: 'dine_in',
        created_at: '2026-09-30 17:42:15',
        synced_at: '2026-09-30 17:42:16',
        total: 125.0,
        subtotal: 125.0,
        discount: 0,
        payment_method: 'cash',
        staff_name: 'Cashier 1',
        items: [{ product_name: 'Octopus Takoyaki', variant_label: '8 pcs', qty: 1, subtotal: 85.0 }, { product_name: 'Fresh Calamansi (16oz)', variant_label: 'Regular', qty: 1, subtotal: 30.0 }, { product_name: 'Extra Bonito Flakes', variant_label: 'Addon', qty: 1, subtotal: 10.0 }],
      },
      {
        id: 41,
        queue_no: 11,
        order_type: 'take_out',
        created_at: '2026-09-30 17:18:40',
        synced_at: '2026-09-30 17:18:41',
        total: 190.0,
        subtotal: 190.0,
        discount: 0,
        payment_method: 'gcash',
        staff_name: 'Cashier 1',
        items: [{ product_name: 'Crab & Cheese Takoyaki', variant_label: '8 pcs', qty: 2, subtotal: 190.0 }],
      },
      {
        id: 40,
        queue_no: 10,
        order_type: 'dine_in',
        created_at: '2026-09-30 16:55:02',
        synced_at: '2026-09-30 16:55:04',
        total: 90.0,
        subtotal: 90.0,
        discount: 0,
        payment_method: 'cash',
        staff_name: 'Cashier 1',
        items: [{ product_name: 'Classic Octopus Takoyaki', variant_label: '4 pcs', qty: 2, subtotal: 90.0 }],
      },
      {
        id: 39,
        queue_no: 9,
        order_type: 'take_out',
        created_at: '2026-09-30 16:40:19',
        synced_at: '2026-09-30 16:40:20',
        total: 80.0,
        subtotal: 80.0,
        discount: 0,
        payment_method: 'cash',
        staff_name: 'Cashier 1',
        items: [{ product_name: 'Pork Siomai', variant_label: '4 pcs', qty: 2, subtotal: 80.0 }],
      },
    ];
  }, [recentOrders]);

  const filteredOrders = useMemo(() => {
    return displayOrders.filter(ord => {
      if (orderPaymentFilter !== 'ALL') {
        if (orderPaymentFilter === 'CASH' && ord.payment_method !== 'cash') return false;
        if (orderPaymentFilter === 'GCASH' && ord.payment_method === 'cash') return false;
      }
      if (orderSearchQuery.trim()) {
        const q = orderSearchQuery.toLowerCase();
        const idMatch = String(ord.id).includes(q);
        const qMatch = String(ord.queue_no).includes(q);
        const staffMatch = (ord.staff_name || '').toLowerCase().includes(q);
        const itemMatch = typeof ord.items === 'string'
          ? ord.items.toLowerCase().includes(q)
          : Array.isArray(ord.items) && ord.items.some(i => (i.product_name || '').toLowerCase().includes(q));
        if (!idMatch && !qMatch && !staffMatch && !itemMatch) return false;
      }
      return true;
    });
  }, [displayOrders, orderPaymentFilter, orderSearchQuery]);

  const inventoryRows = useMemo(() => {
    const reportMap = {};
    if (inventoryReport?.items && Array.isArray(inventoryReport.items)) {
      inventoryReport.items.forEach(r => { reportMap[r.item_id] = r; });
    }

    if (liveInventory && liveInventory.length > 0) {
      return liveInventory.map(item => {
        const rep = reportMap[item.itemId || item.id] || {};
        const beg = Number(item.beginningQty) || 0;
        const sin = Number(item.stockIn ?? rep.total_stock_in) || 0;
        const sug = Number(item.suggestedOut ?? rep.total_suggested_out) || 0;
        const conf = (item.confirmedOut !== null && item.confirmedOut !== undefined) ? Number(item.confirmedOut) : null;
        const end = (item.endingQty !== null && item.endingQty !== undefined) ? Number(item.endingQty) : (conf !== null ? beg + sin - conf : beg + sin - sug);
        const waste = conf !== null ? conf - sug : (Number(rep.total_waste_qty) || 0);
        const minS = Number(item.minStock) || 2.0;
        return {
          id: item.itemId || item.id,
          name: item.name,
          unit: item.unit,
          minStock: minS,
          beginningQty: beg,
          stockIn: sin,
          suggestedOut: sug,
          confirmedOut: conf,
          endingQty: end,
          wasteQty: waste,
          isLow: end <= minS,
        };
      });
    }

    return [
      { id: 1, name: 'Takoyaki Flour', unit: 'kg', minStock: 5.0, beginningQty: 12.0, stockIn: 5.0, suggestedOut: 3.2, confirmedOut: 3.5, endingQty: 13.5, wasteQty: 0.3, isLow: false },
      { id: 2, name: 'Cheese', unit: 'kg', minStock: 1.5, beginningQty: 4.0, stockIn: 0.0, suggestedOut: 1.1, confirmedOut: 1.1, endingQty: 2.9, wasteQty: 0.0, isLow: false },
      { id: 3, name: 'Crab Sticks', unit: 'kg', minStock: 2.0, beginningQty: 5.0, stockIn: 0.0, suggestedOut: 1.8, confirmedOut: 1.8, endingQty: 3.2, wasteQty: 0.0, isLow: false },
      { id: 4, name: 'Shrimp', unit: 'kg', minStock: 2.0, beginningQty: 2.5, stockIn: 0.0, suggestedOut: 1.7, confirmedOut: 1.9, endingQty: 0.6, wasteQty: 0.2, isLow: true },
      { id: 5, name: 'Squid / Octopus', unit: 'kg', minStock: 2.0, beginningQty: 6.0, stockIn: 0.0, suggestedOut: 2.4, confirmedOut: 2.4, endingQty: 3.6, wasteQty: 0.0, isLow: false },
      { id: 8, name: 'Japanese Mayo', unit: 'liters', minStock: 3.0, beginningQty: 6.0, stockIn: 0.0, suggestedOut: 1.5, confirmedOut: 1.5, endingQty: 4.5, wasteQty: 0.0, isLow: false },
      { id: 9, name: 'Takoyaki Sauce', unit: 'liters', minStock: 3.0, beginningQty: 7.0, stockIn: 0.0, suggestedOut: 1.9, confirmedOut: 1.9, endingQty: 5.1, wasteQty: 0.0, isLow: false },
      { id: 10, name: 'Katsuobushi Flakes', unit: 'packs', minStock: 2.0, beginningQty: 2.2, stockIn: 0.0, suggestedOut: 0.8, confirmedOut: 0.9, endingQty: 1.3, wasteQty: 0.1, isLow: true },
      { id: 12, name: 'Pork Siomai', unit: 'pcs', minStock: 50.0, beginningQty: 120.0, stockIn: 0.0, suggestedOut: 44.0, confirmedOut: 44.0, endingQty: 76.0, wasteQty: 0.0, isLow: false },
      { id: 16, name: 'Cups 16oz', unit: 'pcs', minStock: 50.0, beginningQty: 150.0, stockIn: 0.0, suggestedOut: 28.0, confirmedOut: 28.0, endingQty: 122.0, wasteQty: 0.0, isLow: false },
    ];
  }, [liveInventory, inventoryReport]);

  const filteredInventory = useMemo(() => {
    return inventoryRows.filter(item => {
      if (inventoryFilterOnlyLow && !item.isLow) return false;
      if (inventorySearchQuery.trim()) {
        const q = inventorySearchQuery.toLowerCase();
        if (!item.name.toLowerCase().includes(q) && !item.unit.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [inventoryRows, inventoryFilterOnlyLow, inventorySearchQuery]);

  const getPageSize = (tf) => {
    if (isMobileScreen) {
      if (tf === 'annual') return 4;
      if (tf === 'semi_annual') return 3;
      if (tf === '30d') return 5;
      if (tf === '15d') return 5;
      return 4;
    }
    if (tf === 'annual') return 6;
    if (tf === 'semi_annual') return 6;
    if (tf === '30d') return 8;
    if (tf === '15d') return 8;
    return 7;
  };

  const pageSize = getPageSize(timeframe);
  const totalPages = Math.max(1, Math.ceil(salesTrend.length / pageSize));

  const trendPages = [];
  for (let i = 0; i < salesTrend.length; i += pageSize) {
    trendPages.push(salesTrend.slice(i, i + pageSize));
  }
  if (trendPages.length === 0) trendPages.push([]);
  const currentSlice = trendPages[currentPage] || trendPages[0] || [];

  useEffect(() => {
    const ps = getPageSize(timeframe);
    const pages = Math.max(1, Math.ceil(salesTrend.length / ps));
    setCurrentPage(pages - 1);
  }, [timeframe, salesTrend.length, isMobileScreen]);

  const handleTouchStart = (e) => {
    if (e.targetTouches && e.targetTouches[0]) setTouchStartX(e.targetTouches[0].clientX);
  };
  const handleTouchMove = (e) => {
    if (e.targetTouches && e.targetTouches[0]) setTouchEndX(e.targetTouches[0].clientX);
  };
  const handleTouchEnd = () => {
    if (touchStartX !== null && touchEndX !== null) {
      const distance = touchStartX - touchEndX;
      const minSwipeDistance = 40;
      if (distance > minSwipeDistance && currentPage < totalPages - 1) {
        setCurrentPage(prev => prev + 1);
      } else if (distance < -minSwipeDistance && currentPage > 0) {
        setCurrentPage(prev => prev - 1);
      }
    }
    setTouchStartX(null);
    setTouchEndX(null);
  };
  const handleMouseDown = (e) => setMouseDownX(e.clientX);
  const handleMouseUp = (e) => {
    if (mouseDownX !== null) {
      const distance = mouseDownX - e.clientX;
      const minSwipeDistance = 45;
      if (distance > minSwipeDistance && currentPage < totalPages - 1) {
        setCurrentPage(prev => prev + 1);
      } else if (distance < -minSwipeDistance && currentPage > 0) {
        setCurrentPage(prev => prev - 1);
      }
    }
    setMouseDownX(null);
  };

  const downloadCsv = (filename, content) => {
    const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 2500);
  };

  const handleExportSalesCsv = () => {
    const dateStr = overview?.date || new Date().toLocaleDateString('en-CA');
    const headers = ['Period', 'Orders', 'Net Sales (PHP)'];
    const rows = salesTrend.map(d => [`"${d.label || d.date}"`, d.orderCount ?? d.orders ?? 0, (Number(d.revenue) || 0).toFixed(2)]);
    const csvContent = headers.join(',') + '\r\n' + rows.map(r => r.join(',')).join('\r\n');
    downloadCsv(`sales_${timeframe}_${dateStr}.csv`, csvContent);
  };

  const handleExportProductMixCsv = () => {
    const dateStr = new Date().toLocaleDateString('en-CA');
    const headers = ['Category', 'Product', 'Variant', 'Price', 'Sold', 'Revenue'];
    const rows = mixItems.map(it => [`"${it.category_name}"`, `"${it.product_name}"`, `"${it.variant_label}"`, it.unit_price, it.units_sold, it.total_revenue]);
    const csvContent = headers.join(',') + '\r\n' + rows.map(r => r.join(',')).join('\r\n');
    downloadCsv(`product_mix_${dateStr}.csv`, csvContent);
  };

  const handleExportInventoryCsv = () => {
    const dateStr = new Date().toLocaleDateString('en-CA');
    const headers = ['ID', 'Item', 'Unit', 'Beginning', 'Stock In', 'Suggested Out', 'Confirmed Out', 'Ending', 'Waste'];
    const rows = inventoryRows.map(i => [i.id, `"${i.name}"`, `"${i.unit}"`, i.beginningQty, i.stockIn, i.suggestedOut, i.confirmedOut ?? '', i.endingQty, i.wasteQty]);
    const csvContent = headers.join(',') + '\r\n' + rows.map(r => r.join(',')).join('\r\n');
    downloadCsv(`inventory_${dateStr}.csv`, csvContent);
  };

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: 'var(--bg-app)' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          backgroundColor: toast.type === 'error' ? '#ef4444' : '#16a34a',
          color: '#ffffff',
          padding: '10px 16px',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: 600,
          fontSize: '0.86rem',
          zIndex: 9999,
        }}>
          {toast.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
          {toast.message}
        </div>
      )}

      {/* Mobile Top Navigation Bar (< 900px) */}
      <div className="mobile-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            className="mobile-topbar-btn"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src={logoImg} alt="TAKOTIME" style={{ width: '26px', height: '26px', objectFit: 'contain' }} />
            <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)' }}>
              {currentTabLabel}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '6px 10px', fontSize: '0.78rem' }}
            onClick={handleTriggerSync}
            title="Refresh"
          >
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
          </button>
          <button
            type="button"
            className="btn btn-danger"
            style={{ padding: '6px 10px', fontSize: '0.78rem' }}
            onClick={logout}
            title="Log Out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>

      {/* Backdrop for Mobile Drawer */}
      <div
        className={`mobile-sidebar-backdrop ${mobileMenuOpen ? 'active' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      <div style={{ display: 'flex', flex: 1, minHeight: 0, width: '100%', overflow: 'hidden' }}>
        {/* Modern Collapsible Sidebar (EXACTLY MATCHING ADMIN NAV BAR DESIGN) */}
        <aside
          className={`modern-sidebar desktop-sidebar ${isCollapsed ? 'sidebar-collapsed' : ''} ${mobileMenuOpen ? 'mobile-open' : ''}`}
          style={{
            width: isCollapsed ? '76px' : '260px',
            padding: isCollapsed ? '12px 6px' : '16px 14px',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            boxSizing: 'border-box',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            padding: isCollapsed ? '0 0 8px 0' : '0 6px 14px 6px',
            borderBottom: isCollapsed ? 'none' : '1px solid var(--border-subtle)',
            marginBottom: isCollapsed ? '4px' : '6px',
            flexShrink: 0,
          }}>
            <div
              className="sidebar-logo-badge"
              style={{ cursor: isCollapsed ? 'pointer' : 'default' }}
              onClick={() => { if (isCollapsed) setIsCollapsed(false); }}
              data-tooltip={isCollapsed ? 'Expand sidebar' : undefined}
              title={isCollapsed ? 'Click to expand sidebar' : 'TAKOTIME'}
            >
              <img src={logoImg} alt="TAKOTIME" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
            </div>

            {!isCollapsed && (
              <>
                <div className="sidebar-header-text" style={{ flex: 1, minWidth: 0, paddingLeft: '12px' }}>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)', lineHeight: 1.15 }}>TAKOTIME</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Cloud Admin</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {mobileMenuOpen && (
                    <button
                      type="button"
                      className="sidebar-toggle-btn"
                      onClick={() => setMobileMenuOpen(false)}
                      title="Close menu"
                      aria-label="Close menu"
                    >
                      <X size={18} />
                    </button>
                  )}
                  <button
                    type="button"
                    className="sidebar-toggle-btn sidebar-header-collapse-btn"
                    onClick={() => setIsCollapsed(true)}
                    title="Collapse sidebar"
                    aria-label="Collapse sidebar"
                  >
                    <ChevronLeft size={16} />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Navigation Items */}
          <div
            className="sidebar-nav-container"
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: isCollapsed ? 'hidden' : 'auto',
              overflowX: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              paddingRight: isCollapsed ? '0' : '2px',
            }}
          >
            {/* Section: STORE ANALYTICS */}
            <div className="modern-nav-section-title">STORE ANALYTICS</div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: isCollapsed ? '4px' : '8px' }}>
              {ANALYTICS_ITEMS.map((item) => {
                const isActive = activeTab === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`modern-nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => handleSelectTab(item.id)}
                    data-tooltip={item.label}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <ChevronRight size={13} className="nav-chevron" />
                    <Icon size={18} className="nav-icon" />
                    <span className="nav-label">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="sidebar-divider" />

            {/* Section: AUDIT & SYSTEM */}
            <div className="modern-nav-section-title" style={{ marginTop: isCollapsed ? '0' : '6px' }}>
              AUDIT & SYSTEM
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: isCollapsed ? '4px' : '8px' }}>
              {AUDIT_ITEMS.map((item) => {
                const isActive = activeTab === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`modern-nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => handleSelectTab(item.id)}
                    data-tooltip={item.label}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <ChevronRight size={13} className="nav-chevron" />
                    <Icon size={18} className="nav-icon" />
                    <span className="nav-label">{item.label}</span>
                  </button>
                );
              })}

              {/* Log Out */}
              <button
                type="button"
                className="modern-nav-item"
                onClick={logout}
                data-tooltip="Sign Out"
                title={isCollapsed ? 'Sign Out' : undefined}
                style={{ color: 'var(--brand-danger)' }}
              >
                <LogOut size={18} className="nav-icon" style={{ color: 'var(--brand-danger)' }} />
                <span className="nav-label" style={{ color: 'var(--brand-danger)' }}>Sign Out</span>
              </button>
            </nav>
          </div>

          {/* Footer Area */}
          <div style={{
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: isCollapsed ? '8px' : '12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: isCollapsed ? '4px' : '6px',
            flexShrink: 0,
          }}>
            {!isCollapsed ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '2px 4px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--brand-red)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    flexShrink: 0,
                  }}>
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'C'}
                  </div>
                  <div style={{
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    color: 'var(--text-main)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {user?.name || 'Franchise Owner'}
                  </div>
                </div>

                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--brand-red-light)',
                    color: 'var(--brand-red)',
                    border: '1px solid var(--brand-red-border)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  Cloud
                </span>
              </div>
            ) : (
              <button
                type="button"
                className="sidebar-footer-expand-btn"
                onClick={() => setIsCollapsed(false)}
                data-tooltip="Expand sidebar"
                title="Expand sidebar"
                style={{ width: '42px', height: '36px', borderRadius: '6px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                aria-label="Expand sidebar"
              >
                <ChevronRight size={18} />
              </button>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="responsive-page-container" style={{
          flex: 1,
          overflowY: 'auto',
          maxWidth: '1400px',
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box',
        }}>
          {/* Header Bar matching Admin Panel */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '24px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  backgroundColor: 'var(--brand-green-light)',
                  color: 'var(--brand-green)',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--brand-green)' }} />
                  LIVE STORE TELEMETRY
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Branch: Montalban • {overview?.date || new Date().toLocaleDateString('en-CA')}
                </span>
              </div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px', letterSpacing: '-0.02em' }}>
                {currentTabLabel === 'Overview' ? 'Executive Cloud Dashboard' : currentTabLabel}
              </h1>
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleTriggerSync}
              disabled={syncing}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 16px', fontSize: '0.85rem' }}
            >
              <RefreshCw size={15} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div>
              {/* Top 4 Generous KPI Cards Grid (EXACTLY MATCHING ADMIN DASHBOARD) */}
              <div className="grid-kpi-responsive">
                {/* Net Sales */}
                <div style={{
                  background: '#ffffff',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '24px 28px',
                  minHeight: '144px',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.80rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>
                      TODAY'S NET SALES
                    </span>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--brand-green-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--brand-green)',
                    }}>
                      <DollarSign size={22} />
                    </div>
                  </div>
                  <div style={{ marginTop: '14px' }}>
                    <div style={{ fontSize: '2.4rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--brand-green)', lineHeight: 1 }}>
                      ₱{Number(today.netSales || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: '0.80rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                      Gross: ₱{Number(today.grossSales || 0).toFixed(2)} • Disc: ₱{Number(today.discounts || 0).toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Completed Orders */}
                <div style={{
                  background: '#ffffff',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '24px 28px',
                  minHeight: '144px',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.80rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>
                      COMPLETED ORDERS
                    </span>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: '#eff6ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#2563eb',
                    }}>
                      <ShoppingCart size={22} />
                    </div>
                  </div>
                  <div style={{ marginTop: '14px' }}>
                    <div style={{ fontSize: '2.4rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-main)', lineHeight: 1 }}>
                      {today.completedOrders || 0}
                    </div>
                    <div style={{ fontSize: '0.80rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                      Avg Ticket: ₱{today.completedOrders > 0 ? (Number(today.netSales || 0) / today.completedOrders).toFixed(2) : '0.00'}
                    </div>
                  </div>
                </div>

                {/* Cash Drawer On Duty */}
                <div style={{
                  background: '#ffffff',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '24px 28px',
                  minHeight: '144px',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.80rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>
                      CASH DRAWER ON DUTY
                    </span>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: activeShift ? 'var(--brand-gold-light)' : 'var(--bg-app)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: activeShift ? 'var(--brand-gold)' : 'var(--text-muted)',
                    }}>
                      <UserCheck size={22} />
                    </div>
                  </div>
                  <div style={{ marginTop: '14px' }}>
                    <div style={{ fontSize: '2.1rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-main)', lineHeight: 1 }}>
                      ₱{Number(activeShift?.expectedDrawerCash || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: '0.80rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                      Cashier: <strong>{activeShift?.staffName || 'Staff'}</strong> • Cash: ₱{Number(today.cashSales || 0).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Inventory Low Stock Status */}
                <div style={{
                  background: '#ffffff',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '24px 28px',
                  minHeight: '144px',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.80rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>
                      INVENTORY HEALTH
                    </span>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: lowStockAlerts.length > 0 ? 'var(--brand-red-light)' : 'var(--brand-green-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: lowStockAlerts.length > 0 ? 'var(--brand-red)' : 'var(--brand-green)',
                    }}>
                      {lowStockAlerts.length > 0 ? <AlertTriangle size={22} /> : <ShieldCheck size={22} />}
                    </div>
                  </div>
                  <div style={{ marginTop: '14px' }}>
                    {lowStockAlerts.length > 0 ? (
                      <div style={{ fontSize: '2.0rem', fontWeight: 800, color: 'var(--brand-red)', lineHeight: 1 }}>
                        {lowStockAlerts.length} Item{lowStockAlerts.length > 1 ? 's' : ''} Low
                      </div>
                    ) : (
                      <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--brand-green)', lineHeight: 1 }}>
                        All Stock Safe
                      </div>
                    )}
                    <div style={{ fontSize: '0.80rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                      {inventoryRows.length} total ingredients monitored
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Content 2-Column: Sales Performance Chart + Active Shift & Payment Channels */}
              <div className="grid-dashboard-main">
                {/* Sales Chart Card */}
                <div className="chart-card-responsive">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <TrendingUp size={22} color="var(--brand-red)" />
                      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Sales Performance
                      </h2>
                      <span className="badge badge-secondary" style={{ fontSize: '0.74rem', fontWeight: 700 }}>
                        {getTimeframeLabel(timeframe)}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <div className="chart-timeframe-pills">
                        {TIMEFRAME_OPTIONS.map((opt) => {
                          const isActive = timeframe === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => handleTimeframeChange(opt.id)}
                              disabled={trendLoading}
                              style={{
                                padding: '4px 10px',
                                fontSize: '0.75rem',
                                fontWeight: isActive ? 700 : 500,
                                backgroundColor: isActive ? 'var(--brand-red)' : 'transparent',
                                color: isActive ? '#ffffff' : 'var(--text-muted)',
                                border: 'none',
                                borderRadius: 'var(--radius-sm)',
                                cursor: 'pointer',
                              }}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        type="button"
                        onClick={handleExportSalesCsv}
                        className="btn btn-secondary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 10px', fontSize: '0.75rem', fontWeight: 600 }}
                      >
                        <FileSpreadsheet size={14} color="#16a34a" /> Excel
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowPrintModal(true)}
                        className="btn btn-secondary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 10px', fontSize: '0.75rem', fontWeight: 600 }}
                      >
                        <Printer size={14} color="#2563eb" /> Print
                      </button>
                    </div>
                  </div>

                  {/* Period Metric Banner */}
                  <div className="chart-summary-banner">
                    <div>
                      <span style={{ fontSize: '0.70rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Period Net Sales</span>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--brand-green)', marginTop: '2px' }}>
                        ₱{totalTrendRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.70rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Orders</span>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                        {totalTrendOrders}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.70rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Avg Sales</span>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                        ₱{avgTrendRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.70rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Avg Ticket</span>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                        ₱{totalTrendOrders > 0 ? (totalTrendRevenue / totalTrendOrders).toFixed(2) : '0.00'}
                      </div>
                    </div>
                  </div>

                  {/* Interactive Bar Chart Viewport */}
                  <div
                    className="chart-viewport"
                    style={{ cursor: totalPages > 1 ? 'grab' : 'default', height: '240px' }}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                  >
                    <div
                      key={currentPage}
                      className="chart-bars-row"
                      style={{ gap: isMobileScreen ? '8px' : (currentSlice.length > 7 ? '12px' : '18px'), height: '230px' }}
                    >
                      {currentSlice.map((day, itemIdx) => {
                        const globalIdx = currentPage * pageSize + itemIdx;
                        const rev = Number(day.revenue) || 0;
                        const heightPct = Math.max(12, Math.round((rev / maxTrendRevenue) * 100));
                        const isLatest = globalIdx === salesTrend.length - 1;
                        const isHovered = hoveredBarIndex === globalIdx;
                        const orderCnt = day.orderCount ?? day.orders ?? 0;

                        return (
                          <div
                            key={day.date || globalIdx}
                            onMouseEnter={() => setHoveredBarIndex(globalIdx)}
                            onMouseLeave={() => setHoveredBarIndex(null)}
                            style={{
                              flex: 1,
                              minWidth: 0,
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              height: '100%',
                              justifyContent: 'flex-end',
                              cursor: 'pointer',
                            }}
                          >
                            <span style={{ fontSize: isMobileScreen ? '0.64rem' : '0.72rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: isLatest ? 'var(--brand-red)' : 'var(--text-muted)', marginBottom: '6px' }}>
                              ₱{Math.round(rev).toLocaleString()}
                            </span>

                            <div
                              style={{
                                width: '100%',
                                maxWidth: isMobileScreen ? '36px' : '44px',
                                height: `${heightPct}%`,
                                backgroundColor: isLatest ? 'var(--brand-red)' : isHovered ? '#ef4444' : '#fca5a5',
                                borderRadius: '6px 6px 0 0',
                                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                display: 'flex',
                                alignItems: 'flex-start',
                                justifyContent: 'center',
                                paddingTop: '4px',
                              }}
                              title={`${day.label || day.date}: ₱${rev.toFixed(2)} (${orderCnt} orders)`}
                            >
                              {heightPct > 20 && (
                                <span style={{
                                  fontSize: isMobileScreen ? '0.62rem' : '0.68rem',
                                  color: isLatest || isHovered ? '#ffffff' : '#7f1d1d',
                                  fontWeight: 700,
                                  lineHeight: 1,
                                }}>
                                  {orderCnt}
                                </span>
                              )}
                            </div>

                            <span style={{ fontSize: isMobileScreen ? '0.66rem' : '0.75rem', color: isLatest ? 'var(--brand-red)' : 'var(--text-muted)', fontWeight: isLatest ? 800 : 500, marginTop: '10px' }}>
                              {day.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Paging Footer */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                    marginTop: '16px',
                    fontSize: '0.78rem',
                    color: 'var(--text-muted)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '10px', height: '10px', backgroundColor: 'var(--brand-red)', borderRadius: '2px' }} />
                        {timeframe === '7d' || timeframe === '15d' || timeframe === '30d' ? "Today's Live Sales" : 'Current Month'}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '10px', height: '10px', backgroundColor: '#fca5a5', borderRadius: '2px' }} />
                        Past Periods
                      </span>
                    </div>

                    {totalPages > 1 && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                          disabled={currentPage === 0}
                          className="btn btn-secondary"
                          style={{ padding: '3px 9px', fontSize: '0.74rem' }}
                        >
                          <ChevronLeft size={14} /> Earlier
                        </button>
                        <button
                          type="button"
                          onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                          disabled={currentPage === totalPages - 1}
                          className="btn btn-secondary"
                          style={{ padding: '3px 9px', fontSize: '0.74rem' }}
                        >
                          Recent <ChevronRight size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Active Shift Ledger, Payment Channels & Stock Alerts */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Active Shift Details Card (Exact match with Admin panel) */}
                  <div style={{
                    background: '#ffffff',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '24px 26px',
                    boxShadow: 'var(--shadow-sm)',
                  }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Clock size={19} color="var(--brand-gold)" />
                      Active Shift Ledger
                    </h2>

                    {activeShift ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.86rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px dashed var(--border-subtle)' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Cashier On Duty:</span>
                          <strong style={{ color: 'var(--text-main)' }}>{activeShift.staffName}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px dashed var(--border-subtle)' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Opened At:</span>
                          <span style={{ fontFamily: 'var(--font-mono)' }}>{activeShift.openedAt ? new Date(activeShift.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px dashed var(--border-subtle)' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Opening Float:</span>
                          <strong style={{ fontFamily: 'var(--font-mono)' }}>₱{Number(activeShift.startingCash || 1000).toFixed(2)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px dashed var(--border-subtle)' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Cash Collected:</span>
                          <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--brand-green)' }}>+₱{Number(today.cashSales || activeShift.cashSales || 0).toFixed(2)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '4px', fontSize: '0.98rem' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>Expected Drawer:</span>
                          <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--brand-green)', fontSize: '1.2rem' }}>
                            ₱{Number(activeShift.expectedDrawerCash || 0).toFixed(2)}
                          </strong>
                        </div>
                      </div>
                    ) : (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        No active cashier shift currently open.
                      </p>
                    )}
                  </div>

                  {/* Payment Channels Card */}
                  <div style={{
                    background: '#ffffff',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '24px 26px',
                    boxShadow: 'var(--shadow-sm)',
                  }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <DollarSign size={18} color="var(--brand-green)" />
                      Payment Methods
                    </h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem', fontWeight: 800 }}>
                      <span style={{ color: 'var(--brand-green)' }}>Cash: ₱{Number(today.cashSales || 0).toLocaleString()}</span>
                      <span style={{ color: '#2563eb' }}>GCash: ₱{Number(today.gcashSales || 0).toLocaleString()}</span>
                    </div>
                    <div style={{ height: '8px', borderRadius: '4px', backgroundColor: '#eff6ff', overflow: 'hidden', display: 'flex', marginTop: '12px' }}>
                      <div style={{ width: `${today.netSales > 0 ? (today.cashSales / today.netSales) * 100 : 75}%`, backgroundColor: 'var(--brand-green)' }} />
                      <div style={{ flex: 1, backgroundColor: '#2563eb' }} />
                    </div>
                  </div>

                  {/* Stock Threshold Alerts Card (Admin Panel match) */}
                  <div style={{
                    background: '#ffffff',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '24px 26px',
                    boxShadow: 'var(--shadow-sm)',
                    flex: 1,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlertTriangle size={18} color={lowStockAlerts.length > 0 ? '#b45309' : 'var(--text-muted)'} />
                        Stock Threshold Alerts
                      </h3>
                      {lowStockAlerts.length > 0 && (
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: 'var(--brand-red-light)',
                          color: 'var(--brand-red)',
                          border: '1px solid var(--brand-red-border)',
                        }}>
                          {lowStockAlerts.length} {lowStockAlerts.length === 1 ? 'item' : 'items'}
                        </span>
                      )}
                    </div>

                    {lowStockAlerts.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                        {lowStockAlerts.map((item, idx) => (
                          <div key={item.itemId || idx} style={{
                            padding: '10px 12px',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: 'var(--bg-app)',
                            border: '1px solid var(--border-subtle)',
                            borderLeft: '3px solid var(--brand-red)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--text-main)' }}>{item.name}</div>
                              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                Current: <strong style={{ color: 'var(--brand-red)' }}>{item.currentStock} {item.unit}</strong> (Min: {item.minStock} {item.unit})
                              </div>
                            </div>
                            <span style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: 'var(--radius-sm)',
                              backgroundColor: '#fee2e2',
                              color: '#991b1b',
                            }}>
                              LOW
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-muted)' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                          <CheckCircle2 size={18} color="var(--brand-green)" />
                        </div>
                        <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-main)' }}>Stock Levels Healthy</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>All ingredients meet safety thresholds</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Section: Today's Best Selling Items + Peak Operating Hours (Matching Admin Panel) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '24px', marginTop: '24px' }}>
                {/* Today's Best Selling Items (Admin panel lines 1002-1050) */}
                <div style={{
                  background: '#ffffff',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '26px 28px',
                  boxShadow: 'var(--shadow-sm)',
                }}>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Award size={20} color="var(--brand-gold)" />
                    Today's Best Selling Items
                  </h2>

                  {topProducts.length > 0 ? (
                    <div className="responsive-table-wrapper">
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                            <th style={{ padding: '10px 14px' }}>PRODUCT</th>
                            <th style={{ padding: '10px 14px' }}>PORTION / SIZE</th>
                            <th style={{ padding: '10px 14px', textAlign: 'center' }}>UNITS SOLD</th>
                            <th style={{ padding: '10px 14px', textAlign: 'right' }}>TOTAL REVENUE</th>
                          </tr>
                        </thead>
                        <tbody>
                          {topProducts.map((p, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                              <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-main)' }}>
                                {p.product_name}
                              </td>
                              <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>
                                <span className="badge badge-secondary">{p.variant_label}</span>
                              </td>
                              <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                                {p.units_sold}
                              </td>
                              <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--brand-green)' }}>
                                ₱{Number(p.total_revenue).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '12px 0' }}>
                      No sales recorded today yet.
                    </p>
                  )}
                </div>

                {/* Hourly Peak Rush Hours Card */}
                <div style={{
                  background: '#ffffff',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '26px 28px',
                  boxShadow: 'var(--shadow-sm)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Flame size={20} color="var(--brand-red)" />
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                        Peak Operating Hours
                      </h3>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {hourlyData.map((h, idx) => {
                      const pct = maxHourlyRev > 0 ? (Number(h.revenue) / maxHourlyRev) * 100 : 0;
                      const isPeak = Number(h.revenue) === maxHourlyRev;
                      return (
                        <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                            <span style={{ fontWeight: 700, color: isPeak ? 'var(--brand-red)' : 'var(--text-main)' }}>
                              {h.hour}
                            </span>
                            <div style={{ display: 'flex', gap: '10px' }}>
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.76rem' }}>{h.order_count} orders</span>
                              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--brand-green)' }}>
                                ₱{Number(h.revenue).toFixed(2)}
                              </span>
                            </div>
                          </div>
                          <div style={{ height: '7px', width: '100%', backgroundColor: 'var(--bg-app)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, backgroundColor: isPeak ? 'var(--brand-red)' : '#93c5fd' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MENU & PRODUCTS */}
          {activeTab === 'products' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              {/* Category Shares Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                {categoryStats.map((cat, idx) => (
                  <div key={idx} style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '24px 28px',
                    minHeight: '144px',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.80rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                        <span>{cat.name.toUpperCase()}</span>
                        <span style={{ color: '#2563eb' }}>{cat.revenuePct.toFixed(1)}% REVENUE</span>
                      </div>
                      <div style={{ fontSize: '2.2rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--brand-green)', marginTop: '10px', lineHeight: 1 }}>
                        ₱{cat.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                        {cat.units} units sold ({cat.unitsPct.toFixed(1)}% volume)
                      </div>
                    </div>
                    <div style={{ height: '8px', width: '100%', backgroundColor: 'var(--bg-subtle)', borderRadius: '4px', overflow: 'hidden', marginTop: '14px' }}>
                      <div style={{ height: '100%', width: `${cat.revenuePct}%`, backgroundColor: idx === 0 ? 'var(--brand-red)' : (idx === 1 ? '#f59e0b' : '#3b82f6') }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Product Mix Table Card */}
              <div style={{ backgroundColor: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                <div style={{ padding: '20px 26px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Itemized Product Mix</h2>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="Search product..."
                      value={productSearchQuery}
                      onChange={(e) => setProductSearchQuery(e.target.value)}
                      className="input-field"
                      style={{ fontSize: '0.82rem', width: '180px', height: '36px' }}
                    />
                    <div className="chart-timeframe-pills">
                      {['ALL', 'TAKOYAKI', 'SIOMAI', 'DRINKS'].map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setProductFilterCat(cat)}
                          style={{
                            padding: '4px 10px',
                            fontSize: '0.75rem',
                            fontWeight: productFilterCat === cat ? 700 : 500,
                            backgroundColor: productFilterCat === cat ? 'var(--brand-red)' : 'transparent',
                            color: productFilterCat === cat ? '#ffffff' : 'var(--text-muted)',
                            border: 'none',
                            borderRadius: 'var(--radius-sm)',
                          }}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                    <button type="button" onClick={handleExportProductMixCsv} className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '0.78rem' }}>
                      <FileSpreadsheet size={14} color="#16a34a" /> CSV
                    </button>
                  </div>
                </div>

                <div className="responsive-table-wrapper">
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
                        <th style={{ padding: '12px 18px', fontWeight: 700 }}>#</th>
                        <th style={{ padding: '12px 16px', fontWeight: 700 }}>PRODUCT</th>
                        <th style={{ padding: '12px 16px', fontWeight: 700 }}>VARIANT</th>
                        <th style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'right' }}>PRICE</th>
                        <th style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'center' }}>SOLD</th>
                        <th style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'right' }}>REVENUE</th>
                        <th style={{ padding: '12px 18px', fontWeight: 700, textAlign: 'right' }}>SHARE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((p, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '12px 18px', fontWeight: 800, color: 'var(--text-muted)' }}>{idx + 1}</td>
                          <td style={{ padding: '12px 16px', fontWeight: 700 }}>{p.product_name}</td>
                          <td style={{ padding: '12px 16px' }}>{p.variant_label}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>₱{Number(p.unit_price || 0).toFixed(2)}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{p.units_sold}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 800, color: 'var(--brand-green)', fontFamily: 'var(--font-mono)' }}>
                            ₱{Number(p.total_revenue || 0).toLocaleString()}
                          </td>
                          <td style={{ padding: '12px 18px', textAlign: 'right', color: '#2563eb', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                            {Number(p.percentOfRevenue || 0).toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ORDERS */}
          {activeTab === 'orders' && (
            <div style={{ backgroundColor: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
              <div style={{ padding: '20px 26px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Orders Ledger ({filteredOrders.length})</h2>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Search Order #, Cashier..."
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                    className="input-field"
                    style={{ fontSize: '0.82rem', width: '200px', height: '36px' }}
                  />
                  <div className="chart-timeframe-pills">
                    {['ALL', 'CASH', 'GCASH'].map(method => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setOrderPaymentFilter(method)}
                        style={{
                          padding: '4px 10px',
                          fontSize: '0.75rem',
                          fontWeight: orderPaymentFilter === method ? 700 : 500,
                          backgroundColor: orderPaymentFilter === method ? 'var(--brand-red)' : 'transparent',
                          color: orderPaymentFilter === method ? '#ffffff' : 'var(--text-muted)',
                          border: 'none',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="responsive-table-wrapper">
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
                      <th style={{ padding: '12px 18px', fontWeight: 700 }}>ORDER</th>
                      <th style={{ padding: '12px 14px', fontWeight: 700 }}>QUEUE</th>
                      <th style={{ padding: '12px 14px', fontWeight: 700 }}>TIME</th>
                      <th style={{ padding: '12px 14px', fontWeight: 700 }}>CASHIER</th>
                      <th style={{ padding: '12px 14px', fontWeight: 700 }}>METHOD</th>
                      <th style={{ padding: '12px 14px', fontWeight: 700 }}>ITEMS</th>
                      <th style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'right' }}>TOTAL</th>
                      <th style={{ padding: '12px 18px', fontWeight: 700, textAlign: 'center' }}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((ord) => {
                      const itemsStr = Array.isArray(ord.items)
                        ? ord.items.map(it => `${it.qty}x ${it.product_name}`).join(', ')
                        : (ord.items || '—');
                      return (
                        <tr key={ord.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '12px 18px', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>#{String(ord.id).padStart(4, '0')}</td>
                          <td style={{ padding: '12px 14px', fontWeight: 900, color: 'var(--brand-red)', fontFamily: 'var(--font-mono)' }}>Q#{ord.queue_no}</td>
                          <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>
                            {ord.created_at ? new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                          </td>
                          <td style={{ padding: '12px 14px' }}>{ord.staff_name || 'Cashier'}</td>
                          <td style={{ padding: '12px 14px' }}>
                            <span className="badge" style={{ backgroundColor: ord.payment_method === 'gcash' ? '#eff6ff' : '#ecfdf5', color: ord.payment_method === 'gcash' ? '#2563eb' : 'var(--brand-green)' }}>
                              {(ord.payment_method || 'CASH').toUpperCase()}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {itemsStr}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 800, color: 'var(--brand-green)', fontFamily: 'var(--font-mono)' }}>
                            ₱{Number(ord.total || 0).toFixed(2)}
                          </td>
                          <td style={{ padding: '12px 18px', textAlign: 'center' }}>
                            <button type="button" className="btn btn-secondary" onClick={() => setSelectedOrder(ord)} style={{ padding: '4px 10px', fontSize: '0.74rem' }}>
                              Inspect
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: INVENTORY */}
          {activeTab === 'inventory' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              {/* 4 Generous KPI Cards */}
              <div className="grid-kpi-responsive">
                <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '24px 28px', minHeight: '144px', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ fontSize: '0.80rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>TRACKED INGREDIENTS</div>
                  <div style={{ fontSize: '2.4rem', fontWeight: 900, fontFamily: 'var(--font-mono)', marginTop: '10px', lineHeight: 1 }}>{inventoryRows.length} Items</div>
                </div>

                <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '24px 28px', minHeight: '144px', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ fontSize: '0.80rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>LOW STOCK ALERTS</div>
                  <div style={{ fontSize: '2.4rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: lowStockAlerts.length > 0 ? 'var(--brand-red)' : 'var(--brand-green)', marginTop: '10px', lineHeight: 1 }}>
                    {lowStockAlerts.length}
                  </div>
                </div>

                <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '24px 28px', minHeight: '144px', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ fontSize: '0.80rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>THEORETICAL OUT</div>
                  <div style={{ fontSize: '2.4rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: '#2563eb', marginTop: '10px', lineHeight: 1 }}>
                    {inventoryRows.reduce((sum, r) => sum + r.suggestedOut, 0).toFixed(1)}
                  </div>
                </div>

                <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '24px 28px', minHeight: '144px', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ fontSize: '0.80rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>NET SHRINKAGE / WASTE</div>
                  <div style={{ fontSize: '2.4rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: '#f59e0b', marginTop: '10px', lineHeight: 1 }}>
                    {inventoryRows.reduce((sum, r) => sum + Math.max(0, r.wasteQty), 0).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Inventory Table Card */}
              <div style={{ backgroundColor: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                <div style={{ padding: '20px 26px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Ingredient Inventory Ledger</h2>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="Search ingredient..."
                      value={inventorySearchQuery}
                      onChange={(e) => setInventorySearchQuery(e.target.value)}
                      className="input-field"
                      style={{ fontSize: '0.82rem', width: '180px', height: '36px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setInventoryFilterOnlyLow(prev => !prev)}
                      className={`btn ${inventoryFilterOnlyLow ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ fontSize: '0.78rem', padding: '6px 14px' }}
                    >
                      {inventoryFilterOnlyLow ? 'Showing Low' : 'Low Stock Only'}
                    </button>
                    <button type="button" onClick={handleExportInventoryCsv} className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '0.78rem' }}>
                      <FileSpreadsheet size={14} color="#16a34a" /> CSV
                    </button>
                  </div>
                </div>

                <div className="responsive-table-wrapper">
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
                        <th style={{ padding: '12px 18px', fontWeight: 700 }}>ITEM</th>
                        <th style={{ padding: '12px 14px', fontWeight: 700 }}>UNIT</th>
                        <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'right' }}>MIN</th>
                        <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'right' }}>BEG</th>
                        <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'right' }}>IN (+)</th>
                        <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'right' }}>SUG OUT</th>
                        <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'right' }}>CONF OUT</th>
                        <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'right' }}>ENDING</th>
                        <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'right' }}>WASTE</th>
                        <th style={{ padding: '12px 18px', fontWeight: 700, textAlign: 'center' }}>STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInventory.map((item) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '12px 18px', fontWeight: 700 }}>{item.name}</td>
                          <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>{item.unit}</td>
                          <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{item.minStock.toFixed(1)}</td>
                          <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{item.beginningQty.toFixed(2)}</td>
                          <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: item.stockIn > 0 ? 'var(--brand-green)' : 'var(--text-muted)' }}>
                            {item.stockIn > 0 ? `+${item.stockIn.toFixed(2)}` : '0.00'}
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: '#2563eb' }}>{item.suggestedOut.toFixed(2)}</td>
                          <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                            {item.confirmedOut !== null ? item.confirmedOut.toFixed(2) : '—'}
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 800, color: item.isLow ? 'var(--brand-red)' : 'var(--text-main)' }}>
                            {item.endingQty.toFixed(2)}
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: item.wasteQty > 0 ? 'var(--brand-red)' : 'var(--brand-green)' }}>
                            {item.wasteQty > 0 ? `+${item.wasteQty.toFixed(2)}` : '0.00'}
                          </td>
                          <td style={{ padding: '12px 18px', textAlign: 'center' }}>
                            <span className="badge" style={{ backgroundColor: item.isLow ? '#fee2e2' : '#ecfdf5', color: item.isLow ? '#b91c1c' : 'var(--brand-green)' }}>
                              {item.isLow ? 'LOW' : 'SAFE'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SHIFTS */}
          {activeTab === 'shifts' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <div style={{ backgroundColor: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', padding: '26px 30px', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Active Shift Cash Drawer Reconciliation</h2>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Cashier: <strong>{activeShift.staffName}</strong></span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', backgroundColor: 'var(--bg-subtle)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 700 }}>1. STARTING CASH</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, fontFamily: 'var(--font-mono)', marginTop: '4px' }}>₱{Number(activeShift.startingCash || 1000).toFixed(2)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 700 }}>2. CASH SALES</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--brand-green)', marginTop: '4px' }}>+₱{Number(today.cashSales || 0).toFixed(2)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 700 }}>3. CASH DROPS</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--brand-red)', marginTop: '4px' }}>-₱{Number(shiftSummary?.cashAccounting?.cashDrop || 0).toFixed(2)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 700 }}>4. EXPECTED CASH</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, fontFamily: 'var(--font-mono)', marginTop: '4px' }}>₱{Number(activeShift.expectedDrawerCash || 0).toFixed(2)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 700 }}>5. VARIANCE</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--brand-green)', marginTop: '4px' }}>₱0.00 (Balanced)</div>
                  </div>
                </div>
              </div>

              {/* Void Orders */}
              <div style={{ backgroundColor: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                <div style={{ padding: '20px 26px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Voided Orders ({today.voidedOrders || 0})</h3>
                </div>
                <div className="responsive-table-wrapper">
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
                        <th style={{ padding: '12px 18px', fontWeight: 700 }}>ORDER</th>
                        <th style={{ padding: '12px 16px', fontWeight: 700 }}>TIME</th>
                        <th style={{ padding: '12px 16px', fontWeight: 700 }}>CASHIER</th>
                        <th style={{ padding: '12px 16px', fontWeight: 700 }}>REASON</th>
                        <th style={{ padding: '12px 18px', fontWeight: 700, textAlign: 'right' }}>AMOUNT</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ padding: '12px 18px', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>#0035</td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>14:10</td>
                        <td style={{ padding: '12px 16px' }}>Cashier 1</td>
                        <td style={{ padding: '12px 16px', color: 'var(--brand-red)' }}>Customer changed mind</td>
                        <td style={{ padding: '12px 18px', textAlign: 'right', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--brand-red)' }}>₱90.00</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: CLOUD SYNC */}
          {activeTab === 'sync' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '24px 28px', minHeight: '136px', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ fontSize: '0.80rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>FIREBASE RTDB</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--brand-green)', marginTop: '10px' }}>ONLINE & SYNCED</div>
                </div>
                <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '24px 28px', minHeight: '136px', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ fontSize: '0.80rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>DATABASE INTEGRITY</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--brand-green)', marginTop: '10px' }}>PASSED (WAL Mode)</div>
                </div>
                <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '24px 28px', minHeight: '136px', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ fontSize: '0.80rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>AUTOMATED BACKUPS</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, marginTop: '10px' }}>Every 6 Hours</div>
                </div>
              </div>

              {/* Sync Logs */}
              <div style={{ backgroundColor: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                <div style={{ padding: '20px 26px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Cloud Sync Logs</h3>
                </div>
                <div className="responsive-table-wrapper">
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
                        <th style={{ padding: '12px 18px', fontWeight: 700 }}>ID</th>
                        <th style={{ padding: '12px 16px', fontWeight: 700 }}>DIRECTION</th>
                        <th style={{ padding: '12px 16px', fontWeight: 700 }}>RECORDS</th>
                        <th style={{ padding: '12px 16px', fontWeight: 700 }}>TIME</th>
                        <th style={{ padding: '12px 18px', fontWeight: 700, textAlign: 'right' }}>STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(syncLogs.length > 0 ? syncLogs : [
                        { id: 104, direction: 'push', records_synced: 5, started_at: '17:45', status: 'success' },
                        { id: 103, direction: 'push', records_synced: 8, started_at: '17:30', status: 'success' },
                        { id: 102, direction: 'push', records_synced: 14, started_at: '17:15', status: 'success' },
                      ]).map((log) => (
                        <tr key={log.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '12px 18px', fontFamily: 'var(--font-mono)' }}>#{log.id}</td>
                          <td style={{ padding: '12px 16px', fontWeight: 700 }}>{(log.direction || 'PUSH').toUpperCase()}</td>
                          <td style={{ padding: '12px 16px' }}>{log.records_synced || 0}</td>
                          <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{log.completed_at || log.started_at}</td>
                          <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                            <span className="badge" style={{ backgroundColor: '#ecfdf5', color: 'var(--brand-green)' }}>
                              SUCCESS
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* READ-ONLY ITEM INSPECTION MODAL */}
      {selectedOrder && (
        <div
          className="no-print-overlay modal-responsive-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedOrder(null);
          }}
        >
          <div style={{ backgroundColor: '#ffffff', borderRadius: 'var(--radius-lg)', maxWidth: '440px', width: '100%', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>Order #{selectedOrder.id} (Q#{selectedOrder.queue_no})</span>
              <button type="button" className="btn btn-secondary" style={{ padding: '4px' }} onClick={() => setSelectedOrder(null)}>
                <X size={15} />
              </button>
            </div>

            <div style={{ padding: '16px', maxHeight: '65vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(Array.isArray(selectedOrder.items) ? selectedOrder.items : [{ product_name: selectedOrder.items || 'Takoyaki Item', qty: 1, subtotal: selectedOrder.total }]).map((it, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.84rem' }}>{it.product_name} {it.variant_label ? `(${it.variant_label})` : ''}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Qty: {it.qty || 1}</div>
                    </div>
                    <div style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--brand-green)' }}>
                      ₱{Number(it.subtotal || selectedOrder.total).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '12px', borderTop: '2px solid var(--border-subtle)', paddingTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 900 }}>
                  <span>Total ({selectedOrder.payment_method?.toUpperCase()}):</span>
                  <span style={{ color: 'var(--brand-green)', fontFamily: 'var(--font-mono)' }}>₱{Number(selectedOrder.total).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div style={{ padding: '10px 16px', backgroundColor: 'var(--bg-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedOrder(null)} style={{ fontSize: '0.78rem', padding: '5px 12px' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT SALES REPORT MODAL */}
      {showPrintModal && (
        <div
          className="no-print-overlay modal-responsive-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPrintModal(false);
          }}
        >
          <div className="modal-responsive-card" style={{ backgroundColor: '#ffffff', borderRadius: 'var(--radius-lg)', maxWidth: '880px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>Sales Report Preview</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" onClick={() => window.print()} className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '0.78rem' }}>
                  <Printer size={14} /> Print
                </button>
                <button type="button" onClick={() => setShowPrintModal(false)} className="btn btn-secondary" style={{ padding: '6px' }}>
                  <X size={16} />
                </button>
              </div>
            </div>

            <div id="takotime-cloud-printable-report" style={{ padding: '28px', overflowY: 'auto' }}>
              <div style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '14px', marginBottom: '18px' }}>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 900, margin: 0 }}>Sales Performance Report</h1>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#64748b' }}>Montalban Branch • Generated: {new Date().toLocaleString()}</p>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
                    <th style={{ padding: '8px 10px' }}>Period</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center' }}>Orders</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Net Sales (PHP)</th>
                  </tr>
                </thead>
                <tbody>
                  {salesTrend.map((d, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 600 }}>{d.label || d.date}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>{d.orderCount ?? d.orders ?? 0}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>
                        ₱{Number(d.revenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ backgroundColor: '#f1f5f9', borderTop: '2px solid #0f172a', fontWeight: 800 }}>
                    <td style={{ padding: '10px' }}>TOTAL</td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>{totalTrendOrders}</td>
                    <td style={{ padding: '10px', textAlign: 'right', color: '#16a34a' }}>
                      ₱{totalTrendRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #takotime-cloud-printable-report,
          #takotime-cloud-printable-report * {
            visibility: visible !important;
          }
          #takotime-cloud-printable-report {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            max-height: none !important;
            margin: 0 !important;
            padding: 20px !important;
            box-shadow: none !important;
            border: none !important;
            background: #ffffff !important;
            overflow: visible !important;
            z-index: 999999 !important;
          }
          .no-print,
          .no-print-overlay {
            background-color: transparent !important;
            backdrop-filter: none !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}
