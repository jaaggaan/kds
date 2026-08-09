import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://juohiqxcfzququtuzxme.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_GLqjcXd0gGy58SzO01eO0Q_Yu5_Tc-h";

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

export const executeDirectTableLogout = async (tableIdOrNum) => {
  try {
    console.log(`[Direct Supabase Logout] Initiating direct database logout for table: "${tableIdOrNum}"...`);

    // 1. Resolve table row from Supabase
    let targetTable = null;

    if (isUUID(tableIdOrNum)) {
      const { data } = await supabase.from("restaurant_tables").select("*").eq("id", tableIdOrNum).single();
      targetTable = data;
    } else {
      let num = parseInt(String(tableIdOrNum).replace(/\D/g, ""), 10) || 1;
      const { data } = await supabase.from("restaurant_tables").select("*").eq("table_number", num).single();
      targetTable = data;
    }

    if (!targetTable) {
      console.warn(`[Direct Supabase Logout Warning] Could not find restaurant_table for: "${tableIdOrNum}"`);
      return false;
    }

    console.log(`[Direct Supabase Logout] Resolved Table #${targetTable.table_number} (UUID: ${targetTable.id})`);

    // 2. Complete active orders for this table in Supabase orders table
    const { data: activeOrders } = await supabase
      .from("orders")
      .select("id")
      .eq("table_id", targetTable.id)
      .neq("order_status", "Cancelled")
      .neq("order_status", "Completed");

    if (activeOrders && activeOrders.length > 0) {
      for (const ord of activeOrders) {
        console.log(`[Direct Supabase Logout] Marking order ${ord.id} as Completed and Paid...`);
        await supabase
          .from("orders")
          .update({ order_status: "Completed", payment_status: "Paid" })
          .eq("id", ord.id);
      }
    }

    // 3. Update restaurant_tables.status to 'needs_cleaning' in Supabase
    console.log(`[Direct Supabase Logout] Updating restaurant_tables.status to 'needs_cleaning'...`);
    const { data: updatedTable, error: tableErr } = await supabase
      .from("restaurant_tables")
      .update({ status: "needs_cleaning" })
      .eq("id", targetTable.id)
      .select();

    if (tableErr) {
      console.error(`[Direct Supabase Logout Error] Table status update failed:`, tableErr);
    } else {
      console.log(`[Direct Supabase Logout Success] Table #${targetTable.table_number} set to 'needs_cleaning':`, updatedTable?.[0]);
    }

    // 4. Store cleaning timestamp for the 20-second persistent cleaning lifecycle
    try {
      const tsObj = JSON.parse(localStorage.getItem("truffles_table_cleaning_timestamps") || "{}");
      tsObj[targetTable.id] = Date.now();
      localStorage.setItem("truffles_table_cleaning_timestamps", JSON.stringify(tsObj));
    } catch {}

    // 5. Broadcast Realtime Event
    try {
      localStorage.setItem(
        "truffles_last_event",
        JSON.stringify({ type: "TABLE_STATUS_UPDATE", tableId: targetTable.id, status: "needs_cleaning", timestamp: Date.now() })
      );
    } catch {}

    return true;
  } catch (err) {
    console.error(`[Direct Supabase Logout Exception]`, err);
    return false;
  }
};

export const executeDirectTableSwitch = async (oldTableIdOrNum, newTableIdOrNum) => {
  try {
    console.log(`[Direct Supabase Table Switch] Switching table session from "${oldTableIdOrNum}" to "${newTableIdOrNum}"...`);

    // 1. Resolve old table from Supabase
    let oldTable = null;
    if (isUUID(oldTableIdOrNum)) {
      const { data } = await supabase.from("restaurant_tables").select("*").eq("id", oldTableIdOrNum).single();
      oldTable = data;
    } else {
      const num = parseInt(String(oldTableIdOrNum).replace(/\D/g, ""), 10) || 1;
      const { data } = await supabase.from("restaurant_tables").select("*").eq("table_number", num).single();
      oldTable = data;
    }

    // 2. Resolve new table from Supabase
    let newTable = null;
    if (isUUID(newTableIdOrNum)) {
      const { data } = await supabase.from("restaurant_tables").select("*").eq("id", newTableIdOrNum).single();
      newTable = data;
    } else {
      const num = parseInt(String(newTableIdOrNum).replace(/\D/g, ""), 10) || 1;
      const { data } = await supabase.from("restaurant_tables").select("*").eq("table_number", num).single();
      newTable = data;
    }

    if (!oldTable || !newTable) {
      console.warn(`[Direct Supabase Table Switch Warning] Could not resolve tables: old="${oldTableIdOrNum}", new="${newTableIdOrNum}"`);
      return false;
    }

    console.log(`[Direct Supabase Table Switch] Reassigning orders from Table #${oldTable.table_number} (${oldTable.id}) to Table #${newTable.table_number} (${newTable.id})`);

    // 3. Reassign active orders in Supabase orders table
    const { data: reassignedOrders, error: orderErr } = await supabase
      .from("orders")
      .update({ table_id: newTable.id })
      .eq("table_id", oldTable.id)
      .neq("order_status", "Completed")
      .neq("order_status", "Cancelled")
      .select();

    if (orderErr) {
      console.error("[Direct Supabase Table Switch Error] Order reassignment failed:", orderErr);
    } else {
      console.log(`[Direct Supabase Table Switch Success] Reassigned ${reassignedOrders?.length || 0} active orders to Table #${newTable.table_number}`);
    }

    // 4. Update old table status to 'vacant' in Supabase
    await supabase.from("restaurant_tables").update({ status: "vacant" }).eq("id", oldTable.id);

    // 5. Update new table status to 'occupied' in Supabase
    await supabase.from("restaurant_tables").update({ status: "occupied" }).eq("id", newTable.id);

    console.log(`[Direct Supabase Table Switch Complete] Table #${oldTable.table_number} -> vacant, Table #${newTable.table_number} -> occupied`);
    return true;
  } catch (err) {
    console.error("[Direct Supabase Table Switch Exception]", err);
    return false;
  }
};

export const executeDirectTablePayment = async (tableIdOrNum) => {
  try {
    console.log(`[Direct Supabase Payment] Processing direct database payment update for table: "${tableIdOrNum}"...`);

    // 1. Resolve table row from Supabase
    let targetTable = null;
    if (isUUID(tableIdOrNum)) {
      const { data } = await supabase.from("restaurant_tables").select("*").eq("id", tableIdOrNum).single();
      targetTable = data;
    } else {
      const num = parseInt(String(tableIdOrNum).replace(/\D/g, ""), 10) || 1;
      const { data } = await supabase.from("restaurant_tables").select("*").eq("table_number", num).single();
      targetTable = data;
    }

    if (!targetTable) {
      console.warn(`[Direct Supabase Payment Warning] Could not find table for: "${tableIdOrNum}"`);
      return false;
    }

    console.log(`[Direct Supabase Payment] Resolved Table #${targetTable.table_number} (UUID: ${targetTable.id})`);

    // 2. Mark active orders as Completed & Paid in Supabase orders table
    const { data: updatedOrders, error: orderErr } = await supabase
      .from("orders")
      .update({ order_status: "Completed", payment_status: "Paid" })
      .eq("table_id", targetTable.id)
      .neq("order_status", "Cancelled")
      .neq("order_status", "Completed")
      .select();

    if (orderErr) {
      console.error("[Direct Supabase Payment Error] Orders update failed:", orderErr);
    } else {
      console.log(`[Direct Supabase Payment Success] Marked ${updatedOrders?.length || 0} active orders as Paid and Completed.`);
    }

    // 3. Keep table status as 'occupied' (it will transition to 'needs_cleaning' when customer clicks Logout)
    console.log(`[Direct Supabase Payment Success] Table #${targetTable.table_number} remains occupied with Paid status until customer logs out.`);

    // 4. Broadcast Realtime Event
    try {
      localStorage.setItem(
        "truffles_last_event",
        JSON.stringify({ type: "ORDER_PAID", tableId: targetTable.id, timestamp: Date.now() })
      );
    } catch {}

    return true;
  } catch (err) {
    console.error("[Direct Supabase Payment Exception]", err);
    return false;
  }
};


// ── ORDERS & ORDER ITEMS API ──
export const fetchOrders = async () => {
  try {
    const { data: ordersData, error: ordersErr } = await supabase
      .from("orders")
      .select("*, order_items(*, menu_items(*)), restaurant_tables(*)")
      .order("created_at", { ascending: false });

    if (ordersErr) throw ordersErr;
    logApi("fetchOrders", { count: ordersData?.length });
    return ordersData || [];
  } catch (err) {
    logApi("fetchOrders", null, err);
    return [];
  }
};

export const createOrderInDb = async ({
  tableId,
  items,
  total,
  notes = "",
  customerName = "Guest",
  customerPhone = "",
  customer_name = "Guest",
  customer_phone = ""
}) => {
  try {
    // 1. Resolve table UUID safely without regex digit stripping on UUIDs
    let dbTableUuid = isUUID(tableId) ? tableId : null;
    let tableNumberFound = null;

    if (!dbTableUuid) {
      let num = NaN;
      if (typeof tableId === "number") {
        num = tableId;
      } else if (typeof tableId === "string" && !isUUID(tableId)) {
        const clean = tableId.trim().toUpperCase().replace(/^T/, "");
        num = parseInt(clean, 10);
      }

      if (!isNaN(num)) {
        tableNumberFound = num;
        const { data: tableData } = await supabase
          .from("restaurant_tables")
          .select("id, table_number")
          .eq("table_number", num)
          .maybeSingle();
        if (tableData?.id) dbTableUuid = tableData.id;
      }
    } else {
      const { data: tableData } = await supabase
        .from("restaurant_tables")
        .select("table_number")
        .eq("id", dbTableUuid)
        .maybeSingle();
      if (tableData?.table_number) tableNumberFound = tableData.table_number;
    }

    console.log(`[Supabase Table Audit] Input tableId: "${tableId}" -> Table #${tableNumberFound} -> Resolved DB UUID: "${dbTableUuid}"`);

    const finalCustomerName = customerName && customerName !== "Guest" ? customerName : (customer_name || "Guest");
    const finalCustomerPhone = customerPhone || customer_phone || "";

    const orderPayload = {
      table_id: dbTableUuid,
      customer_name: finalCustomerName,
      customer_phone: finalCustomerPhone,
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

    console.log(`[Supabase Order Audit] Order created UUID: "${newOrder?.id}" | Assigned table_id: "${newOrder?.table_id}"`);

    if (newOrder && items && items.length > 0) {
      // Fetch menu items to map item names to valid menu_item_id UUIDs if needed
      const { data: allMenuItems } = await supabase.from("menu_items").select("id, item_name");

      const lineItemsPayload = items.map((item) => {
        let menuItemUuid = isUUID(item.menuItemId || item.id) ? item.menuItemId || item.id : null;
        if (!menuItemUuid && allMenuItems) {
          const matched = allMenuItems.find(
            (m) => m.item_name.toLowerCase() === (item.name || "").toLowerCase()
          );
          if (matched) menuItemUuid = matched.id;
        }

        return {
          order_id: newOrder.id,
          menu_item_id: menuItemUuid,
          price: parseFloat(item.price) || 0,
          quantity: parseInt(item.qty || item.quantity, 10) || 1,
          notes: item.notes || (item.customizations ? item.customizations.join(", ") : "") || notes || ""
        };
      });

      const { error: itemsErr } = await supabase
        .from("order_items")
        .insert(lineItemsPayload);

      if (itemsErr) {
        logApi("createOrderItems", null, itemsErr);
      }
    }

    // Update table status to occupied for the EXACT resolved table UUID
    if (dbTableUuid) {
      const { data: updatedTableData, error: tableUpdateErr } = await supabase
        .from("restaurant_tables")
        .update({ status: "occupied" })
        .eq("id", dbTableUuid)
        .select();

      console.log(`[Supabase Table Audit] Updated restaurant_tables row Table #${tableNumberFound} UUID "${dbTableUuid}" to status:`, updatedTableData?.[0]?.status);
      if (tableUpdateErr) console.error(`[Supabase Table Error]`, tableUpdateErr);
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
      { event: "*", schema: "public", table: "order_items" },
      (payload) => {
        logApi("Realtime order_items event", payload);
        onDataChange("order_items", payload);
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
