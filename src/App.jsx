import React from "react";
import { RestoProvider, useResto } from "./context/RestoContext";
import { Navbar } from "./components/Navbar";
import { TableMap } from "./components/TableMap/TableMap";
import { LiveOrders } from "./components/LiveOrders/LiveOrders";
import { KitchenDisplaySystem } from "./components/KDS/KitchenDisplaySystem";
import { CustomerAppContainer } from "./components/CustomerApp/CustomerAppContainer";
import { BillingStation } from "./components/Billing/BillingStation";
import { MenuManager } from "./components/MenuManager/MenuManager";
import { RevenueAnalytics } from "./components/Analytics/RevenueAnalytics";
import { StaffManagement } from "./components/Dashboard/StaffManagement";
import { QRCodeGenerator } from "./components/Tools/QRCodeGenerator";
import { ESP32FirmwareView } from "./components/Tools/ESP32FirmwareView";
import "./App.css";

const MainContent = () => {
  const { activeTab } = useResto();

  return (
    <main className="main-viewport">
      {activeTab === "table_map" && <TableMap />}
      {activeTab === "live_orders" && <LiveOrders />}
      {activeTab === "kds" && <KitchenDisplaySystem />}
      {activeTab === "customer_app" && <CustomerAppContainer />}
      {activeTab === "billing" && <BillingStation />}
      {activeTab === "menu_manager" && <MenuManager />}
      {activeTab === "analytics" && <RevenueAnalytics />}
      {activeTab === "staff" && <StaffManagement />}
      {activeTab === "qr_generator" && <QRCodeGenerator />}
      {activeTab === "esp32" && <ESP32FirmwareView />}
    </main>
  );
};

export default function App() {
  return (
    <RestoProvider>
      <div className="app-shell">
        <Navbar />
        <MainContent />
      </div>
    </RestoProvider>
  );
}
