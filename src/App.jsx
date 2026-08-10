import React from "react";
import { RestoProvider, useResto } from "./context/RestoContext";
import { Navbar } from "./components/Navbar";
import { TableMap } from "./components/TableMap/TableMap";
import { LiveOrders } from "./components/LiveOrders/LiveOrders";
import { KitchenDisplaySystem } from "./components/KDS/KitchenDisplaySystem";
import { BillingStation } from "./components/Billing/BillingStation";
import { MenuManager } from "./components/MenuManager/MenuManager";
import { RevenueAnalytics } from "./components/Analytics/RevenueAnalytics";
import { StaffManagement } from "./components/Dashboard/StaffManagement";
import { PreOrderQueue } from "./components/Dashboard/PreOrderQueue";
import { ReservationsDashboard } from "./components/Dashboard/ReservationsDashboard";
import { QRCodeGenerator } from "./components/Tools/QRCodeGenerator";
import { ESP32FirmwareView } from "./components/Tools/ESP32FirmwareView";
import { CaptivePortalView } from "./components/CaptivePortal/CaptivePortalView";
import { CustomerAppContainer } from "./components/CustomerApp/CustomerAppContainer";
import "./App.css";

const AppShell = () => {
  const { activeTab } = useResto();

  // 1. Standalone Customer App / Captive Portal (No POS Navbar)
  if (activeTab === "captive_portal" || activeTab === "customer_app") {
    return (
      <div className="standalone-viewport">
        <CustomerAppContainer />
      </div>
    );
  }

  // 2. Standalone Kitchen KDS Display (No POS Navbar)
  if (activeTab === "kds") {
    return (
      <div className="standalone-viewport" style={{ height: "100vh", overflow: "hidden" }}>
        <KitchenDisplaySystem />
      </div>
    );
  }

  // 3. Kitchen POS & Admin Dashboard Shell (With Navbar)
  return (
    <div className="app-shell">
      <Navbar />
      <main className="main-viewport">
        {activeTab === "table_map" && <TableMap />}
        {activeTab === "live_orders" && <LiveOrders />}
        {activeTab === "billing" && <BillingStation />}
        {activeTab === "menu_manager" && <MenuManager />}
        {(activeTab === "analytics" || activeTab === "history") && (
          <RevenueAnalytics viewMode={activeTab === "history" ? "history" : "analytics"} />
        )}
        {activeTab === "staff" && <StaffManagement />}
        {activeTab === "qr_generator" && <QRCodeGenerator />}
        {activeTab === "esp32" && <ESP32FirmwareView />}
        {activeTab === "pre_order_queue" && <PreOrderQueue />}
        {activeTab === "reservations" && <ReservationsDashboard />}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <RestoProvider>
      <AppShell />
    </RestoProvider>
  );
}
