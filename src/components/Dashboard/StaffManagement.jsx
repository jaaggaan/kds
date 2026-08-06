import React, { useState } from "react";
import { UserCheck, Plus, Trash2, Shield, Key, Phone, User, Check } from "lucide-react";

export const StaffManagement = () => {
  const [staffList, setStaffList] = useState([
    { id: "s-1", name: "Rahul Sharma", phone: "+91 98765 11111", role: "Manager", isActive: true },
    { id: "s-2", name: "Priya Nair", phone: "+91 98765 22222", role: "Cashier", isActive: true },
    { id: "s-3", name: "Chef Marcus", phone: "+91 98765 33333", role: "Kitchen", isActive: true },
    { id: "s-4", name: "Vikram Singh", phone: "+91 98765 44444", role: "Waiter", isActive: true }
  ]);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("Waiter");
  const [password, setPassword] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddStaff = (e) => {
    e.preventDefault();
    if (!name || !phone) return;

    const newStaff = {
      id: `s-${Date.now()}`,
      name,
      phone,
      role,
      isActive: true
    };

    setStaffList([...staffList, newStaff]);
    setName("");
    setPhone("");
    setPassword("");
    setShowAddForm(false);
  };

  const handleToggleActive = (id) => {
    setStaffList(
      staffList.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s))
    );
  };

  const handleDeleteStaff = (id) => {
    if (window.confirm("Are you sure you want to remove this staff account?")) {
      setStaffList(staffList.filter((s) => s.id !== id));
    }
  };

  return (
    <div className="staff-management-container fade-in">
      <div className="analytics-header">
        <div>
          <h2>Staff Account & Role Permissions</h2>
          <span className="caption-text">Manage restaurant employee access and system roles</span>
        </div>

        <button className="btn-primary" onClick={() => setShowAddForm(true)}>
          <Plus size={16} /> Add Staff Account
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddStaff} className="truffles-card add-staff-card fade-in">
          <h3>Add New Employee Account</h3>
          <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", marginTop: "12px" }}>
            <div className="form-group">
              <label className="caption-text">Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Ananya Roy"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="caption-text">Phone Number *</label>
              <input
                type="text"
                required
                placeholder="+91 98765 00000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="caption-text">Access Role *</label>
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="Waiter">Waiter</option>
                <option value="Cashier">Cashier</option>
                <option value="Kitchen">Kitchen Staff</option>
                <option value="Manager">Store Manager</option>
              </select>
            </div>

            <div className="form-group">
              <label className="caption-text">Password *</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "16px" }}>
            <button type="button" className="btn-secondary" onClick={() => setShowAddForm(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              <Check size={16} /> Create Account
            </button>
          </div>
        </form>
      )}

      {/* Staff Accounts List */}
      <div className="table-card-container">
        <table className="live-orders-table">
          <thead>
            <tr>
              <th>Staff Member</th>
              <th>Phone Number</th>
              <th>System Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {staffList.map((staff) => (
              <tr key={staff.id}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--bg-tertiary)", color: "var(--accent)", display: "grid", placeItems: "center" }}>
                      <UserCheck size={16} />
                    </div>
                    <span style={{ fontWeight: 600, color: "#FFFFFF" }}>{staff.name}</span>
                  </div>
                </td>
                <td className="price-mono" style={{ fontSize: "13px" }}>{staff.phone}</td>
                <td>
                  <span className="badge-tag active">{staff.role}</span>
                </td>
                <td>
                  <button
                    className={`badge-tag ${staff.isActive ? "active" : ""}`}
                    onClick={() => handleToggleActive(staff.id)}
                  >
                    {staff.isActive ? "Active" : "Inactive"}
                  </button>
                </td>
                <td>
                  <button className="btn-action" onClick={() => handleDeleteStaff(staff.id)}>
                    <Trash2 size={14} color="#EF4444" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
