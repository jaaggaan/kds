import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://hzheucidugzhdqdjcgvz.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_AxyynYPKA2efszlqyBpJow_YHVnGzWj";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// UUID validator helper
const isUUID = (str) =>
  typeof str === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

// Logging helper
const logApi = (action, details, error = null) => {
  if (error) {
    console.error(`[Supabase API Error] ${action}:`, error, details);
  } else {
    console.log(`[Supabase API Success] ${action}:`, details);
  }
};

// ── MENU CATEGORIES API ──
export const fetchMenuCategories = async () => {
  try {
    const { data, error } = await supabase
      .from("menu_categories")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) throw error;
    logApi("fetchMenuCategories", { count: data?.length });
    return data || [];
  } catch (err) {
    logApi("fetchMenuCategories", null, err);
    return [];
  }
};

export const createMenuCategory = async (categoryName) => {
  try {
    const { data, error } = await supabase
      .from("menu_categories")
      .insert([{ category_name: categoryName }])
      .select();

    if (error) throw error;
    logApi("createMenuCategory", data?.[0]);
    return data?.[0];
  } catch (err) {
    logApi("createMenuCategory", { categoryName }, err);
    return null;
  }
};

export const updateMenuCategory = async (id, categoryName) => {
  try {
    if (!isUUID(id)) return null;
    const { data, error } = await supabase
      .from("menu_categories")
      .update({ category_name: categoryName })
      .eq("id", id)
      .select();

    if (error) throw error;
    logApi("updateMenuCategory", data?.[0]);
    return data?.[0];
  } catch (err) {
    logApi("updateMenuCategory", { id, categoryName }, err);
    return null;
  }
};

export const deleteMenuCategory = async (id) => {
  try {
    if (!isUUID(id)) return false;
    const { error } = await supabase
      .from("menu_categories")
      .delete()
      .eq("id", id);

    if (error) throw error;
    logApi("deleteMenuCategory", { id });
    return true;
  } catch (err) {
    logApi("deleteMenuCategory", { id }, err);
    return false;
  }
};


// ── MENU ITEMS API ──
export const fetchMenuItems = async () => {
  try {
    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) throw error;
    logApi("fetchMenuItems", { count: data?.length });
    return data || [];
  } catch (err) {
    logApi("fetchMenuItems", null, err);
    return [];
  }
};

export const createMenuItem = async (item) => {
  try {
    const catId = item.categoryId || item.category_id;
    const payload = {
      category_id: isUUID(catId) ? catId : null,
      item_name: item.name || item.item_name,
      description: item.description || "",
      price: parseFloat(item.price) || 0,
      veg: item.isVeg !== undefined ? item.isVeg : !!item.veg,
      available: item.isAvailable !== undefined ? item.isAvailable : item.available !== undefined ? item.available : true,
      image_url: item.image || item.image_url || ""
    };

    const { data, error } = await supabase
      .from("menu_items")
      .insert([payload])
      .select();

    if (error) throw error;
    logApi("createMenuItem", data?.[0]);
    return data?.[0];
  } catch (err) {
    logApi("createMenuItem", item, err);
    return null;
  }
};

export const updateMenuItem = async (id, item) => {
  try {
    if (!isUUID(id)) return null;
    const payload = {};
    const catId = item.categoryId || item.category_id;
    if (catId && isUUID(catId)) payload.category_id = catId;
    if (item.name || item.item_name) payload.item_name = item.name || item.item_name;
    if (item.description !== undefined) payload.description = item.description;
    if (item.price !== undefined) payload.price = parseFloat(item.price);
    if (item.isVeg !== undefined) payload.veg = item.isVeg;
    else if (item.veg !== undefined) payload.veg = item.veg;
    if (item.isAvailable !== undefined) payload.available = item.isAvailable;
    else if (item.available !== undefined) payload.available = item.available;
    if (item.image || item.image_url) payload.image_url = item.image || item.image_url;

    const { data, error } = await supabase
      .from("menu_items")
      .update(payload)
      .eq("id", id)
      .select();

    if (error) throw error;
    logApi("updateMenuItem", data?.[0]);
    return data?.[0];
  } catch (err) {
    logApi("updateMenuItem", { id, item }, err);
    return null;
  }
};

export const deleteMenuItem = async (id) => {
  try {
    if (!isUUID(id)) return false;
    const { error } = await supabase
      .from("menu_items")
      .delete()
      .eq("id", id);

    if (error) throw error;
    logApi("deleteMenuItem", { id });
    return true;
  } catch (err) {
    logApi("deleteMenuItem", { id }, err);
    return false;
  }
};


// ── RESTAURANT TABLES API ──
export const fetchRestaurantTables = async () => {
  try {
    const { data, error } = await supabase
      .from("restaurant_tables")
      .select("*")
      .order("table_number", { ascending: true });

    if (error) throw error;
    logApi("fetchRestaurantTables", { count: data?.length });
    return data || [];
  } catch (err) {
    logApi("fetchRestaurantTables", null, err);
    return [];
  }
};

export const upsertRestaurantTable = async (table) => {
  try {
    const num = parseInt(table.number || table.table_number, 10) || 1;
    const payload = {
      table_number: num,
      status: table.status || "vacant"
    };

    if (isUUID(table.id)) {
      payload.id = table.id;
    }

    const { data, error } = await supabase
      .from("restaurant_tables")
      .upsert([payload])
      .select();

    if (error) throw error;
    logApi("upsertRestaurantTable", data?.[0]);
    return data?.[0];
  } catch (err) {
    logApi("upsertRestaurantTable", table, err);
    return null;
  }
};

export const updateRestaurantTableStatus = async (tableId, status) => {
  try {
    if (!isUUID(tableId)) return null;
    const { data, error } = await supabase
      .from("restaurant_tables")
      .update({ status })
      .eq("id", tableId)
      .select();

    if (error) throw error;
    logApi("updateRestaurantTableStatus", { tableId, status });
    return data?.[0];
  } catch (err) {
    logApi("updateRestaurantTableStatus", { tableId, status }, err);
    return null;
  }
};


// ── ORDERS & ORDER ITEMS API ──
export const fetchOrders = async () => {
  try {
    const { data: ordersData, error: ordersErr } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false });

    if (ordersErr) throw ordersErr;
    logApi("fetchOrders", { count: ordersData?.length });
    return ordersData || [];
  } catch (err) {
    logApi("fetchOrders", null, err);
    return [];
  }
};

export const createOrderInDb = async ({ tableId, items, total, notes = "" }) => {
  try {
    const orderPayload = {
      table_id: isUUID(tableId) ? tableId : null,
      order_status: "New",
      total: parseFloat(total) || 0,
      discount: 0,
      tax: 0,
      payment_status: "Pending"
    };

    const { data: orderData, error: orderErr } = await supabase
      .from("orders")
      .insert([orderPayload])
      .select();

    if (orderErr) throw orderErr;
    const newOrder = orderData?.[0];

    if (newOrder && items && items.length > 0) {
      const lineItemsPayload = items.map((item) => ({
        order_id: newOrder.id,
        menu_item_id: isUUID(item.menuItemId || item.id) ? item.menuItemId || item.id : null,
        price: parseFloat(item.price) || 0,
        quantity: parseInt(item.qty || item.quantity, 10) || 1,
        notes: item.notes || (item.customizations ? item.customizations.join(", ") : "") || notes || ""
      }));

      const { error: itemsErr } = await supabase
        .from("order_items")
        .insert(lineItemsPayload);

      if (itemsErr) {
        logApi("createOrderItems", null, itemsErr);
      }
    }

    // Update table status to occupied if tableId is valid UUID
    if (isUUID(tableId)) {
      await updateRestaurantTableStatus(tableId, "occupied");
    }

    logApi("createOrderInDb", newOrder);
    return newOrder;
  } catch (err) {
    logApi("createOrderInDb", { tableId, items, total }, err);
    return null;
  }
};

export const updateOrderStatusInDb = async (orderId, orderStatus) => {
  try {
    if (!isUUID(orderId)) return null;
    const { data, error } = await supabase
      .from("orders")
      .update({ order_status: orderStatus })
      .eq("id", orderId)
      .select();

    if (error) throw error;
    logApi("updateOrderStatusInDb", { orderId, orderStatus });
    return data?.[0];
  } catch (err) {
    logApi("updateOrderStatusInDb", { orderId, orderStatus }, err);
    return null;
  }
};

export const payOrderInDb = async (orderId, { total, discount = 0, tax = 0 }) => {
  try {
    if (!isUUID(orderId)) return null;
    const { data, error } = await supabase
      .from("orders")
      .update({
        order_status: "Completed",
        payment_status: "Paid",
        total: parseFloat(total),
        discount: parseFloat(discount),
        tax: parseFloat(tax)
      })
      .eq("id", orderId)
      .select();

    if (error) throw error;
    logApi("payOrderInDb", { orderId });
    return data?.[0];
  } catch (err) {
    logApi("payOrderInDb", { orderId }, err);
    return null;
  }
};


// ── FEEDBACK API ──
export const createFeedbackInDb = async ({ orderId, rating, comments }) => {
  try {
    const payload = {
      order_id: isUUID(orderId) ? orderId : null,
      rating: parseInt(rating, 10) || 5,
      comments: comments || ""
    };

    const { data, error } = await supabase
      .from("feedback")
      .insert([payload])
      .select();

    if (error) throw error;
    logApi("createFeedbackInDb", data?.[0]);
    return data?.[0];
  } catch (err) {
    logApi("createFeedbackInDb", { orderId, rating, comments }, err);
    return null;
  }
};


// ── REALTIME SUBSCRIPTION HELPER ──
export const subscribeToRealtimeChanges = (onDataChange) => {
  const channel = supabase
    .channel("food_ordering_realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "orders" },
      (payload) => {
        logApi("Realtime orders event", payload);
        onDataChange("orders", payload);
      }
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "restaurant_tables" },
      (payload) => {
        logApi("Realtime restaurant_tables event", payload);
        onDataChange("restaurant_tables", payload);
      }
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "menu_items" },
      (payload) => {
        logApi("Realtime menu_items event", payload);
        onDataChange("menu_items", payload);
      }
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "menu_categories" },
      (payload) => {
        logApi("Realtime menu_categories event", payload);
        onDataChange("menu_categories", payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
