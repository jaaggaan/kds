import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import {
  INITIAL_BRANCHES,
  INITIAL_CATEGORIES,
  INITIAL_MENU_ITEMS,
  INITIAL_TABLES,
  INITIAL_ACTIVE_ORDERS,
  INITIAL_PAID_TRANSACTIONS
} from "../data/initialData";
import {
  fetchMenuCategories,
  createMenuCategory,
  updateMenuCategory,
  deleteMenuCategory,
  fetchMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  fetchRestaurantTables,
  upsertRestaurantTable,
  updateRestaurantTableStatus,
  fetchOrders,
  createOrderInDb,
  updateOrderStatusInDb,
  payOrderInDb,
  createFeedbackInDb,
  subscribeToRealtimeChanges
} from "../lib/supabase";

const RestoContext = createContext(null);

export const RestoProvider = ({ children }) => {
  const [currentBranch, setCurrentBranch] = useState(INITIAL_BRANCHES[0]);
  const [activeTab, setActiveTab] = useState("table_map");
  const [selectedTableForBilling, setSelectedTableForBilling] = useState(null);

  const [tables, setTables] = useState(INITIAL_TABLES);
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [menuItems, setMenuItems] = useState(INITIAL_MENU_ITEMS);
  const [activeOrders, setActiveOrders] = useState(INITIAL_ACTIVE_ORDERS);
  const [paidTransactions, setPaidTransactions] = useState(INITIAL_PAID_TRANSACTIONS);
  const [isDbLoaded, setIsDbLoaded] = useState(false);

  // Track last processed event timestamp
  const lastProcessedTs = useRef(0);

  // Helper to map DB categories to frontend format
  const mapDbCategory = (dbCat) => ({
    id: dbCat.id,
    name: dbCat.category_name || dbCat.name,
    icon: "Utensils",
    sortOrder: 1
  });

  // Helper to map DB menu items to frontend format
  const mapDbMenuItem = (dbItem) => ({
    id: dbItem.id,
    categoryId: dbItem.category_id,
    name: dbItem.item_name || dbItem.name,
    description: dbItem.description || "",
    price: parseFloat(dbItem.price) || 0,
    isVeg: dbItem.veg !== undefined ? dbItem.veg : true,
    isAvailable: dbItem.available !== undefined ? dbItem.available : true,
    prepTime: 15,
    image: dbItem.image_url || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
    customizations: []
  });

  // Helper to map DB orders to frontend format
  const mapDbOrder = (dbOrder) => {
    const items = (dbOrder.order_items || []).map((i) => {
      const foundMenuItem = menuItems.find((m) => String(m.id) === String(i.menu_item_id));
      return {
        id: i.id,
        menuItemId: i.menu_item_id,
        name: i.menu_items?.item_name || foundMenuItem?.name || "Delicious Item",
        price: parseFloat(i.price) || 0,
        qty: parseInt(i.quantity, 10) || 1,
        customizations: i.notes ? [i.notes] : []
      };
    });

    return {
      id: dbOrder.id,
      tableId: dbOrder.table_id || "T1",
      customerName: "Customer",
      customerPhone: "",
      status: dbOrder.order_status || "New",
      createdAt: dbOrder.created_at || new Date().toISOString(),
      priority: "normal",
      items,
      notes: "",
      totalAmount: parseFloat(dbOrder.total) || 0
    };
  };

  // Helper to map DB tables to frontend format
  const mapDbTable = (dbTable) => ({
    id: dbTable.id || `T${dbTable.table_number}`,
    number: parseInt(dbTable.table_number, 10) || 1,
    status: dbTable.status || "vacant",
    guests: dbTable.status === "occupied" ? 2 : 0,
    seatedTime: null,
    orderId: null,
    activeOrderTotal: 0,
    customerName: null,
    customerPhone: null
  });

  // Load initial data from Supabase
  const loadSupabaseData = useCallback(async () => {
    try {
      // 1. Categories
      const dbCategories = await fetchMenuCategories();
      if (dbCategories && dbCategories.length > 0) {
        setCategories(dbCategories.map(mapDbCategory));
      } else {
        // Seed initial categories if DB is empty
        for (const cat of INITIAL_CATEGORIES) {
          await createMenuCategory(cat.name);
        }
        const fresh = await fetchMenuCategories();
        if (fresh?.length > 0) setCategories(fresh.map(mapDbCategory));
      }

      // 2. Menu Items
      const dbItems = await fetchMenuItems();
      if (dbItems && dbItems.length > 0) {
        setMenuItems(dbItems.map(mapDbMenuItem));
      } else {
        // Seed initial items if DB is empty
        for (const item of INITIAL_MENU_ITEMS) {
          await createMenuItem(item);
        }
        const fresh = await fetchMenuItems();
        if (fresh?.length > 0) setMenuItems(fresh.map(mapDbMenuItem));
      }

      // 3. Restaurant Tables
      const dbTables = await fetchRestaurantTables();
      if (dbTables && dbTables.length > 0) {
        setTables(dbTables.map(mapDbTable));
      } else {
        // Seed 20 tables if empty
        for (const tbl of INITIAL_TABLES) {
          await upsertRestaurantTable(tbl);
        }
        const fresh = await fetchRestaurantTables();
        if (fresh?.length > 0) setTables(fresh.map(mapDbTable));
      }

      // 4. Orders
      const dbOrders = await fetchOrders();
      if (dbOrders && dbOrders.length > 0) {
        const activeList = dbOrders
          .filter((o) => o.order_status !== "Completed" && o.order_status !== "Cancelled" && o.payment_status !== "Paid")
          .map(mapDbOrder);
        if (activeList.length > 0) {
          setActiveOrders(activeList);
        }
      }

      setIsDbLoaded(true);
    } catch (err) {
      console.error("[RestoContext] Error loading Supabase data:", err);
    }
  }, []);

  useEffect(() => {
    loadSupabaseData();
  }, [loadSupabaseData]);

  // Subscribe to Supabase Realtime changes across all tables
  useEffect(() => {
    const unsubscribe = subscribeToRealtimeChanges((table, payload) => {
      console.log(`[Realtime Sync] ${table}:`, payload);
      loadSupabaseData();
    });
    return () => unsubscribe();
  }, [loadSupabaseData]);

  // Process incoming cross-port events from Captive Portal via localStorage
  const processEvent = useCallback((payload) => {
    if (!payload || !payload.type) return;
    const { type } = payload;

    if (type === "TABLE_CHECKIN" || type === "TABLE_ASSIGNED") {
      const tId = String(payload.tableId || "");
      const tNum = parseInt(tId.replace(/\D/g, ""), 10);
      const custPhone = payload.customerPhone || "";
      const custName = payload.customerName || "Guest";
      const cleanCustPhone = custPhone.replace(/\D/g, "");

      setTables((prev) =>
        prev.map((t) => {
          const match = t.id === tId || t.number === tNum || parseInt(String(t.id).replace(/\D/g, ""), 10) === tNum;
          if (match) {
            updateRestaurantTableStatus(t.id, "occupied");
            return {
              ...t,
              status: "occupied",
              guests: t.guests > 0 ? t.guests : 2,
              seatedTime: t.seatedTime || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              customerName: custName,
              customerPhone: custPhone,
            };
          }
          const cleanTablePhone = (t.customerPhone || "").replace(/\D/g, "");
          if (cleanCustPhone && cleanTablePhone === cleanCustPhone) {
            updateRestaurantTableStatus(t.id, "vacant");
            return {
              ...t,
              status: "vacant",
              guests: 0,
              seatedTime: null,
              orderId: null,
              activeOrderTotal: 0,
              customerName: null,
              customerPhone: null,
            };
          }
          return t;
        })
      );
    }

    if (type === "TABLE_VACATE") {
      const tId = String(payload.tableId || "");
      const tNum = parseInt(tId.replace(/\D/g, ""), 10);
      const cleanCustPhone = (payload.customerPhone || "").replace(/\D/g, "");

      setTables((prev) =>
        prev.map((t) => {
          const matchTable = t.id === tId || t.number === tNum || parseInt(String(t.id).replace(/\D/g, ""), 10) === tNum;
          const matchPhone = cleanCustPhone && (t.customerPhone || "").replace(/\D/g, "") === cleanCustPhone;

          if (matchTable || matchPhone) {
            updateRestaurantTableStatus(t.id, "vacant");
            return {
              ...t,
              status: "vacant",
              guests: 0,
              seatedTime: null,
              orderId: null,
              activeOrderTotal: 0,
              customerName: null,
              customerPhone: null,
            };
          }
          return t;
        })
      );
    }
  }, []);

  // Sync localStorage cross-port events
  useEffect(() => {
    const poll = () => {
      try {
        const raw = localStorage.getItem("truffles_last_event");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.timestamp && parsed.timestamp > lastProcessedTs.current) {
            lastProcessedTs.current = parsed.timestamp;
            processEvent(parsed);
          }
        }
      } catch { /* ignore */ }
    };
    poll();
    const interval = setInterval(poll, 1000);
    return () => clearInterval(interval);
  }, [processEvent]);

  // ── Internal dashboard & API actions ──

  const goToBillingForTable = (tableId) => {
    setSelectedTableForBilling(tableId);
    setActiveTab("billing");
  };

  const updateTableStatus = async (tableId, newStatus) => {
    setTables((prev) =>
      prev.map((t) => {
        if (t.id !== tableId) return t;
        const updated = { ...t, status: newStatus };
        if (newStatus === "vacant" || newStatus === "needs_cleaning") {
          updated.guests = 0;
          updated.seatedTime = null;
          updated.orderId = null;
          updated.activeOrderTotal = 0;
          updated.customerName = null;
          updated.customerPhone = null;
        }
        return updated;
      })
    );
    await updateRestaurantTableStatus(tableId, newStatus);
  };

  const broadcast = (payload) => {
    try {
      localStorage.setItem("truffles_last_event", JSON.stringify({ ...payload, timestamp: Date.now() }));
    } catch {}
  };

  const createOrder = async ({ tableId, items, guests = 2, notes = "" }) => {
    const totalAmount = items.reduce((s, i) => s + i.price * i.qty, 0);

    const tNum = parseInt(String(tableId).replace(/\D/g, ""), 10);
    const foundTable = tables.find((t) => t.id === tableId || t.number === tNum);
    const dbTableId = foundTable ? foundTable.id : tableId;
    const displayTableId = foundTable ? `T${foundTable.number}` : tableId;

    // Save to Supabase DB
    const dbOrder = await createOrderInDb({ tableId: dbTableId, items, total: totalAmount, notes });

    const newOrderId = dbOrder?.id || `ORD-${Math.floor(100 + Math.random() * 900)}`;
    const newOrder = {
      id: newOrderId,
      tableId: displayTableId,
      customerName: "Customer",
      customerPhone: "",
      status: "New",
      createdAt: new Date().toISOString(),
      priority: "normal",
      items,
      notes,
      totalAmount
    };

    setActiveOrders((prev) => [newOrder, ...prev]);
    setTables((prev) =>
      prev.map((t) => {
        if (t.id !== tableId) return t;
        return {
          ...t,
          status: "occupied",
          guests: guests || 2,
          seatedTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          orderId: newOrderId,
          activeOrderTotal: totalAmount,
        };
      })
    );

    broadcast({ type: "NEW_ORDER", order: newOrder, tableId });
    return newOrderId;
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    setActiveOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );

    // Sync to Supabase DB
    await updateOrderStatusInDb(orderId, newStatus);

    const targetOrder = activeOrders.find((o) => o.id === orderId);
    if (targetOrder && newStatus === "Payment Pending") {
      updateTableStatus(targetOrder.tableId, "awaiting_payment");
    }

    broadcast({ type: "UPDATE_ORDER_STATUS", orderId, newStatus });
  };

  const cancelOrder = async (orderId) => {
    const targetOrder = activeOrders.find((o) => o.id === orderId);
    if (!targetOrder) return;

    setActiveOrders((prev) => prev.filter((o) => o.id !== orderId));
    await updateOrderStatusInDb(orderId, "Cancelled");
    await updateTableStatus(targetOrder.tableId, "vacant");
  };

  const bumpOrderPriority = (orderId) => {
    setActiveOrders((prev) => {
      const idx = prev.findIndex((o) => o.id === orderId);
      if (idx === -1) return prev;
      const target = { ...prev[idx], priority: "high" };
      const rest = prev.filter((o) => o.id !== orderId);
      return [target, ...rest];
    });
  };

  const payOrder = async (orderId, paymentDetails) => {
    const targetOrder = activeOrders.find((o) => o.id === orderId);
    if (!targetOrder) return;

    const newTx = {
      id: `TX-${Math.floor(1000 + Math.random() * 9000)}`,
      orderId: targetOrder.id,
      tableId: targetOrder.tableId,
      amount: paymentDetails.grandTotal,
      paidAt: new Date().toISOString(),
      paymentMethod: paymentDetails.method,
      itemsCount: targetOrder.items.length,
      discount: paymentDetails.discount,
      tax: paymentDetails.tax,
      serviceCharge: paymentDetails.serviceCharge,
    };

    setPaidTransactions((prev) => [newTx, ...prev]);
    setActiveOrders((prev) => prev.filter((o) => o.id !== orderId));

    // Update in Supabase
    await payOrderInDb(orderId, {
      total: paymentDetails.grandTotal,
      discount: paymentDetails.discount,
      tax: paymentDetails.tax
    });
    await updateTableStatus(targetOrder.tableId, "needs_cleaning");

    setTimeout(async () => {
      await updateTableStatus(targetOrder.tableId, "vacant");
    }, 20000);

    if (selectedTableForBilling === targetOrder.tableId) {
      setSelectedTableForBilling(null);
    }

    broadcast({ type: "PAY_ORDER", orderId, tableId: targetOrder.tableId });
  };

  const submitCustomerFeedback = async ({ orderId, rating, comment }) => {
    await createFeedbackInDb({ orderId, rating, comments: comment });
  };

  // Category CRUD
  const addCategory = async (categoryName) => {
    const created = await createMenuCategory(categoryName);
    if (created) {
      setCategories((prev) => [...prev, mapDbCategory(created)]);
    } else {
      setCategories((prev) => [...prev, { id: `cat-${Date.now()}`, name: categoryName, icon: "Utensils", sortOrder: prev.length + 1 }]);
    }
  };

  const editCategory = async (categoryId, newName) => {
    setCategories((prev) => prev.map((c) => (c.id === categoryId ? { ...c, name: newName } : c)));
    await updateMenuCategory(categoryId, newName);
  };

  const deleteCategory = async (categoryId) => {
    setCategories((prev) => prev.filter((c) => c.id !== categoryId));
    setMenuItems((prev) => prev.filter((m) => m.categoryId !== categoryId));
    await deleteMenuCategory(categoryId);
  };

  const reorderCategory = (index, direction) => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;
    const next = [...categories];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    setCategories(next);
  };

  // Menu Item CRUD
  const addMenuItem = async (itemData) => {
    const created = await createMenuItem(itemData);
    if (created) {
      setMenuItems((prev) => [mapDbMenuItem(created), ...prev]);
    } else {
      setMenuItems((prev) => [{ id: `item-${Date.now()}`, ...itemData }, ...prev]);
    }
  };

  const editMenuItem = async (itemId, itemData) => {
    setMenuItems((prev) => prev.map((m) => (m.id === itemId ? { ...m, ...itemData } : m)));
    await updateMenuItem(itemId, itemData);
  };

  const deleteMenuItemAction = async (itemId) => {
    setMenuItems((prev) => prev.filter((m) => m.id !== itemId));
    await deleteMenuItem(itemId);
  };

  const toggleItemAvailability = async (itemId) => {
    const target = menuItems.find((m) => m.id === itemId);
    if (!target) return;
    const nextAvail = !target.isAvailable;
    setMenuItems((prev) => prev.map((m) => (m.id === itemId ? { ...m, isAvailable: nextAvail } : m)));
    await updateMenuItem(itemId, { isAvailable: nextAvail });
  };

  return (
    <RestoContext.Provider
      value={{
        branches: INITIAL_BRANCHES,
        currentBranch,
        setCurrentBranch,
        activeTab,
        setActiveTab,
        tables,
        categories,
        menuItems,
        activeOrders,
        paidTransactions,
        selectedTableForBilling,
        setSelectedTableForBilling,
        goToBillingForTable,
        updateTableStatus,
        createOrder,
        updateOrderStatus,
        cancelOrder,
        bumpOrderPriority,
        payOrder,
        submitCustomerFeedback,
        addCategory,
        editCategory,
        deleteCategory,
        reorderCategory,
        addMenuItem,
        editMenuItem,
        deleteMenuItem: deleteMenuItemAction,
        toggleItemAvailability,
        isDbLoaded
      }}
    >
      {children}
    </RestoContext.Provider>
  );
};

export const useResto = () => {
  const context = useContext(RestoContext);
  if (!context) throw new Error("useResto must be used within a RestoProvider");
  return context;
};
