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

  // Helper to safely resolve a table from tables array without running digit stripping on UUIDs
  const resolveTable = useCallback((tableId, tablesList = tables) => {
    if (!tableId || !Array.isArray(tablesList) || tablesList.length === 0) return null;
    const strId = String(tableId).trim();

    // 1. Direct match on table.id (e.g. Postgres UUID or exact "T5")
    const directMatch = tablesList.find((t) => String(t.id) === strId);
    if (directMatch) return directMatch;

    // 2. Parse table number safely ONLY if strId is NOT a UUID
    const isUUIDFormat = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(strId);
    if (!isUUIDFormat) {
      let num = NaN;
      if (typeof tableId === "number") {
        num = tableId;
      } else {
        const clean = strId.toUpperCase().replace(/^T/, "");
        num = parseInt(clean, 10);
      }

      if (!isNaN(num)) {
        const numMatch = tablesList.find((t) => t.number === num);
        if (numMatch) return numMatch;
      }
    }

    return null;
  }, [tables]);

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
      const dishName = i.menu_items?.item_name || i.menu_items?.name || foundMenuItem?.name || "Delicious Item";

      return {
        id: i.id,
        menuItemId: i.menu_item_id,
        name: dishName,
        price: parseFloat(i.price) || 0,
        qty: parseInt(i.quantity, 10) || 1,
        customizations: i.notes ? [i.notes] : []
      };
    });

    const foundTable = resolveTable(dbOrder.table_id, tables);
    const displayTableId = foundTable ? `T${foundTable.number}` : dbOrder.table_id || "T1";

    return {
      id: dbOrder.id,
      tableId: displayTableId,
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
        for (const item of INITIAL_MENU_ITEMS) {
          await createMenuItem(item);
        }
        const fresh = await fetchMenuItems();
        if (fresh?.length > 0) setMenuItems(fresh.map(mapDbMenuItem));
      }

      // 3. Restaurant Tables
      const dbTables = await fetchRestaurantTables();
      let loadedTables = INITIAL_TABLES;
      if (dbTables && dbTables.length > 0) {
        loadedTables = dbTables.map(mapDbTable);
        setTables(loadedTables);
      } else {
        for (const tbl of INITIAL_TABLES) {
          await upsertRestaurantTable(tbl);
        }
        const fresh = await fetchRestaurantTables();
        if (fresh?.length > 0) {
          loadedTables = fresh.map(mapDbTable);
          setTables(loadedTables);
        }
      }

      // 4. Orders & Table Status Sync
      const dbOrders = await fetchOrders();
      if (dbOrders && dbOrders.length > 0) {
        const activeList = dbOrders
          .filter((o) => o.order_status !== "Completed" && o.order_status !== "Cancelled" && o.payment_status !== "Paid")
          .map(mapDbOrder);

        setActiveOrders(activeList);

        // Reflect active orders onto Table Map grid
        setTables((prevTables) =>
          prevTables.map((t) => {
            const matchingOrder = activeList.find(
              (o) =>
                o.tableId === `T${t.number}` ||
                o.tableId === t.id ||
                (typeof o.tableId === "string" && o.tableId.startsWith("T") && parseInt(o.tableId.replace("T", ""), 10) === t.number)
            );
            if (matchingOrder) {
              return {
                ...t,
                status: "occupied",
                guests: t.guests > 0 ? t.guests : 2,
                seatedTime: t.seatedTime || new Date(matchingOrder.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                orderId: matchingOrder.id,
                activeOrderTotal: matchingOrder.totalAmount,
                customerName: matchingOrder.customerName || "Customer",
              };
            }
            // Auto-clean tables with no active order
            if (t.status === "occupied" || t.status === "awaiting_payment") {
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

    if (type === "NEW_ORDER") {
      const incomingOrder = payload.order;
      if (incomingOrder && incomingOrder.items && incomingOrder.items.length > 0) {
        console.log(`[Captive Portal Order Event] Received NEW_ORDER for table: ${payload.tableId || incomingOrder.tableId}`, incomingOrder);

        const targetTable = resolveTable(payload.tableId || incomingOrder.tableId, tables);
        const dbTableId = targetTable ? targetTable.id : payload.tableId || incomingOrder.tableId;

        // Persist order directly into Supabase PostgreSQL DB
        createOrderInDb({
          tableId: dbTableId,
          items: incomingOrder.items,
          total: incomingOrder.totalAmount || incomingOrder.total || 0,
          notes: incomingOrder.notes || ""
        }).then((savedDbOrder) => {
          console.log(`[Captive Portal Order Event] Successfully saved order to Supabase DB:`, savedDbOrder);
          loadSupabaseData();
        }).catch((err) => {
          console.error(`[Captive Portal Order Event Error] Failed to save order to Supabase:`, err);
        });
      }
    }

    if (type === "TABLE_CHECKIN" || type === "TABLE_ASSIGNED") {
      const targetTable = resolveTable(payload.tableId, tables);
      const custPhone = payload.customerPhone || "";
      const custName = payload.customerName || "Guest";

      setTables((prev) =>
        prev.map((t) => {
          const match = targetTable ? t.id === targetTable.id : t.id === payload.tableId;
          if (match) {
            return {
              ...t,
              guests: t.guests > 0 ? t.guests : 2,
              seatedTime: t.seatedTime || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              customerName: custName,
              customerPhone: custPhone,
            };
          }
          return t;
        })
      );
    }

    if (type === "TABLE_VACATE") {
      const targetTable = resolveTable(payload.tableId, tables);

      setTables((prev) =>
        prev.map((t) => {
          const matchTable = targetTable ? t.id === targetTable.id : t.id === payload.tableId;

          if (matchTable) {
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
  }, [resolveTable, tables]);

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
    const foundTable = resolveTable(tableId, tables);
    const targetId = foundTable ? foundTable.id : tableId;

    setTables((prev) =>
      prev.map((t) => {
        if (t.id !== targetId) return t;
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

    if (isUUID(targetId)) {
      await updateRestaurantTableStatus(targetId, newStatus);
    }
  };

  const broadcast = (payload) => {
    try {
      localStorage.setItem("truffles_last_event", JSON.stringify({ ...payload, timestamp: Date.now() }));
    } catch {}
  };

  const createOrder = async ({ tableId, items, guests = 2, notes = "" }) => {
    const totalAmount = items.reduce((s, i) => s + i.price * i.qty, 0);

    const foundTable = resolveTable(tableId, tables);
    const dbTableId = foundTable ? foundTable.id : tableId;
    const displayTableId = foundTable ? `T${foundTable.number}` : (String(tableId).startsWith("T") ? tableId : `T${tableId}`);

    console.log(`[Table Trace Log] Selected UI tableId: "${tableId}" -> Found Table #${foundTable?.number} -> DB UUID: "${dbTableId}" -> Display: "${displayTableId}"`);

    // Save to Supabase DB as the ONLY source of truth
    const dbOrder = await createOrderInDb({ tableId: dbTableId, items, total: totalAmount, notes });

    // Synchronize data model directly from Supabase DB
    await loadSupabaseData();

    const newOrderId = dbOrder?.id || `ORD-${Math.floor(100 + Math.random() * 900)}`;
    const newOrderPayload = {
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

    broadcast({ type: "NEW_ORDER", order: newOrderPayload, tableId: displayTableId });
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
