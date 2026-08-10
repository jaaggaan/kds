import React, { useState, useEffect, useCallback } from "react";
import {
  supabase,
  fetchQueuedPreOrders,
  assignPreOrderToTable,
} from "../../lib/supabase";
import { useResto } from "../../context/RestoContext";
import {
  ShoppingBag,
  Clock,
  Users,
  CheckCircle,
  X,
  ArrowRight,
  RefreshCw,
  ChefHat,
  Ticket,
} from "lucide-react";

export const PreOrderQueue = () => {
  const { tables } = useResto();
  const [preOrders, setPreOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedTableId, setSelectedTableId] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const vacantTables = tables.filter((t) => t.status === "vacant");

  const loadPreOrders = useCallback(async () => {
    setLoading(true);
    const data = await fetchQueuedPreOrders();
    setPreOrders(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPreOrders();
    const channel = supabase
      .channel("preorder_queue_admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => loadPreOrders())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [loadPreOrders]);

  const handleAssign = async () => {
    if (!selectedOrder || !selectedTableId) return;
    setAssigning(true);
    const result = await assignPreOrderToTable(selectedOrder.id, selectedTableId);
    setAssigning(false);
    if (result.data) {
      setSuccessMsg(`✓ ${selectedOrder.preorder_ticket} assigned to table successfully!`);
      setSelectedOrder(null);
      setSelectedTableId("");
      loadPreOrders();
      setTimeout(() => setSuccessMsg(""), 4000);
    }
  };

  const getElapsed = (createdAt) => {
    const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
    if (diff < 1) return "Just now";
    if (diff < 60) return `${diff}m ago`;
    return `${Math.floor(diff / 60)}h ${diff % 60}m ago`;
  };

  return (
    <div style={{ padding: "24px", maxWidth: "900px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 700, display: "flex", alignItems: "center", gap: "10px" }}>
            <Ticket size={22} color="#F59E0B" />
            Pre-Order Queue
          </h2>
          <p style={{ margin: "4px 0 0", color: "#6B7280", fontSize: "13px" }}>
            Customers waiting for a table · Assign when a table becomes available
          </p>
        </div>
        <button
          onClick={loadPreOrders}
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "8px 14px", borderRadius: "8px", border: "1px solid #E5E7EB",
            background: "#F9FAFB", cursor: "pointer", fontSize: "13px", fontWeight: 600, color: "#374151"
          }}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Success Banner */}
      {successMsg && (
        <div style={{
          display: "flex", alignItems: "center", gap: "10px",
          padding: "12px 16px", borderRadius: "10px",
          background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)",
          color: "#16A34A", fontWeight: 600, fontSize: "14px", marginBottom: "16px"
        }}>
          <CheckCircle size={18} /> {successMsg}
        </div>
      )}

      {/* Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
        {[
          { label: "Waiting Pre-Orders", value: preOrders.length, color: "#F59E0B", icon: <ShoppingBag size={18} /> },
          { label: "Vacant Tables", value: vacantTables.length, color: "#10B981", icon: <Users size={18} /> },
          { label: "Can Assign Now", value: Math.min(preOrders.length, vacantTables.length), color: "#6366F1", icon: <ArrowRight size={18} /> },
        ].map((stat) => (
          <div key={stat.label} style={{
            padding: "16px", borderRadius: "12px", background: "#fff",
            border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.06)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: stat.color, marginBottom: "6px" }}>
              {stat.icon}
              <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>{stat.label}</span>
            </div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#111827", fontFamily: "monospace" }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Queue List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "48px", color: "#9CA3AF" }}>
          <p>Loading pre-orders...</p>
        </div>
      ) : preOrders.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "64px 24px",
          background: "#F9FAFB", borderRadius: "16px", border: "2px dashed #E5E7EB"
        }}>
          <ChefHat size={48} color="#D1D5DB" style={{ marginBottom: "16px" }} />
          <h3 style={{ color: "#6B7280", margin: "0 0 8px" }}>No Pre-Orders in Queue</h3>
          <p style={{ color: "#9CA3AF", fontSize: "13px", margin: 0 }}>
            When customers pre-order food before being seated, they appear here.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {preOrders.map((order) => {
            const itemSummary = (order.items || []).slice(0, 2).map((i) => `${i.qty || 1}x ${i.name}`).join(", ");
            const totalAmount = order.total_amount || (order.items || []).reduce((s, i) => s + i.price * (i.qty || 1), 0);
            return (
              <div key={order.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "16px 20px", borderRadius: "12px",
                background: "#fff", border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
              }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{
                      padding: "3px 10px", borderRadius: "20px",
                      background: "rgba(245,158,11,0.12)", color: "#D97706",
                      fontSize: "12px", fontWeight: 800
                    }}>{order.preorder_ticket || "PRE-???"}</span>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: "#111827" }}>{order.customer_name || "Guest"}</span>
                    {order.customer_phone && <span style={{ fontSize: "12px", color: "#6B7280" }}>{order.customer_phone}</span>}
                  </div>
                  <div style={{ fontSize: "13px", color: "#374151" }}>
                    {itemSummary}{(order.items || []).length > 2 ? ` +${(order.items || []).length - 2} more` : ""} · ₹{totalAmount}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#9CA3AF", fontSize: "12px" }}>
                    <Clock size={11} /> {getElapsed(order.created_at)}
                  </div>
                </div>
                <button
                  onClick={() => { setSelectedOrder(order); setSelectedTableId(""); }}
                  disabled={vacantTables.length === 0}
                  style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    padding: "10px 18px", borderRadius: "10px",
                    background: vacantTables.length === 0 ? "#F3F4F6" : "#6366F1",
                    color: vacantTables.length === 0 ? "#9CA3AF" : "#fff",
                    border: "none", cursor: vacantTables.length === 0 ? "not-allowed" : "pointer",
                    fontSize: "13px", fontWeight: 700, whiteSpace: "nowrap"
                  }}
                >
                  <ArrowRight size={14} /> Assign Table
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Assignment Modal */}
      {selectedOrder && (
        <div
          onClick={() => setSelectedOrder(null)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px"
          }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{
            background: "#fff", borderRadius: "20px", padding: "28px",
            width: "100%", maxWidth: "440px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
              <div>
                <h3 style={{ margin: "0 0 4px", fontSize: "18px", fontWeight: 700 }}>Assign to Table</h3>
                <p style={{ margin: 0, color: "#6B7280", fontSize: "13px" }}>
                  Ticket <strong style={{ color: "#D97706" }}>{selectedOrder.preorder_ticket}</strong> · {selectedOrder.customer_name}
                </p>
              </div>
              <button onClick={() => setSelectedOrder(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF" }}>
                <X size={20} />
              </button>
            </div>

            {/* Order Items */}
            <div style={{
              padding: "12px 14px", borderRadius: "10px",
              background: "#FEF3C7", border: "1px solid #FDE68A", marginBottom: "20px"
            }}>
              <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: "12px", color: "#92400E", textTransform: "uppercase" }}>Order Items</p>
              {(selectedOrder.items || []).map((item, idx) => (
                <p key={idx} style={{ margin: "2px 0", fontSize: "13px", color: "#78350F" }}>
                  {item.qty || 1}× {item.name} — ₹{item.price * (item.qty || 1)}
                </p>
              ))}
            </div>

            {/* Table Grid */}
            <label style={{ fontSize: "13px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "8px" }}>Select a Vacant Table</label>
            {vacantTables.length === 0 ? (
              <p style={{ color: "#EF4444", fontSize: "13px", margin: "0 0 20px" }}>No vacant tables available right now.</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", marginBottom: "20px" }}>
                {vacantTables.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTableId(t.id)}
                    style={{
                      padding: "12px 8px", borderRadius: "10px", border: "2px solid",
                      borderColor: selectedTableId === t.id ? "#6366F1" : "#E5E7EB",
                      background: selectedTableId === t.id ? "rgba(99,102,241,0.08)" : "#F9FAFB",
                      color: selectedTableId === t.id ? "#4F46E5" : "#374151",
                      fontWeight: 700, fontSize: "13px", cursor: "pointer"
                    }}
                  >
                    T{t.number || t.table_number}
                  </button>
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => setSelectedOrder(null)}
                style={{
                  flex: 1, padding: "12px", borderRadius: "10px",
                  border: "1px solid #E5E7EB", background: "#F9FAFB",
                  color: "#374151", fontWeight: 600, cursor: "pointer", fontSize: "14px"
                }}
              >Cancel</button>
              <button
                onClick={handleAssign}
                disabled={!selectedTableId || assigning}
                style={{
                  flex: 2, padding: "12px", borderRadius: "10px", border: "none",
                  background: !selectedTableId || assigning ? "#E5E7EB" : "#6366F1",
                  color: !selectedTableId || assigning ? "#9CA3AF" : "#fff",
                  fontWeight: 700, cursor: !selectedTableId || assigning ? "not-allowed" : "pointer",
                  fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px"
                }}
              >
                {assigning ? "Assigning..." : <><CheckCircle size={16} /> Confirm Assignment</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
