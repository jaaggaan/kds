import React, { useState } from "react";
import { useResto } from "../../context/RestoContext";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import {
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Users,
  Calendar,
  ArrowUpRight,
  Filter
} from "lucide-react";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const RevenueAnalytics = () => {
  const { paidTransactions } = useResto();
  const [dateRange, setDateRange] = useState("this_week"); // today | this_week | this_month | custom

  // Calculate dynamic metrics based on paidTransactions & historical data
  const totalRevenue = paidTransactions.reduce((sum, tx) => sum + tx.amount, 0) + 48250;
  const totalOrders = paidTransactions.length + 38;
  const avgOrderValue = Math.round(totalRevenue / totalOrders);
  const repeatCustomerPct = 34.5; // percentage

  // 1. Hourly Sales Bar Chart Data (Today)
  const hourlyLabels = [
    "11 AM", "12 PM", "1 PM", "2 PM", "3 PM", "4 PM", "5 PM",
    "6 PM", "7 PM", "8 PM", "9 PM", "10 PM", "11 PM"
  ];
  const hourlyDataValues = [
    2400, 5800, 8900, 6400, 3100, 2800, 4200,
    7500, 11400, 14200, 10800, 6200, 2100
  ];

  const hourlyBarData = {
    labels: hourlyLabels,
    datasets: [
      {
        label: "Hourly Revenue (₹)",
        data: hourlyDataValues,
        backgroundColor: "rgba(255, 107, 53, 0.85)",
        borderColor: "#ff6b35",
        borderWidth: 1,
        borderRadius: 6,
        hoverBackgroundColor: "#ff8c5e"
      }
    ]
  };

  const hourlyBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#0f172a",
        titleColor: "#f8fafc",
        bodyColor: "#ff6b35",
        borderColor: "rgba(255,107,53,0.3)",
        borderWidth: 1,
        padding: 12
      }
    },
    scales: {
      x: {
        grid: { color: "rgba(255,255,255,0.05)" },
        ticks: { color: "#94a3b8" }
      },
      y: {
        grid: { color: "rgba(255,255,255,0.05)" },
        ticks: {
          color: "#94a3b8",
          callback: (value) => `₹${value}`
        }
      }
    }
  };

  // 2. Top 5 Selling Items Donut Chart Data
  const topItemsData = {
    labels: [
      "Quattro Formaggi Pizza",
      "Butter Chicken Supreme",
      "Paneer Tikka Grill",
      "Crispy Peri Peri Wings",
      "Belgian Lava Cake"
    ],
    datasets: [
      {
        data: [142, 118, 95, 84, 62],
        backgroundColor: [
          "#ff6b35",
          "#f59e0b",
          "#10b981",
          "#3b82f6",
          "#8b5cf6"
        ],
        borderColor: "#1e293b",
        borderWidth: 3
      }
    ]
  };

  const topItemsOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right",
        labels: { color: "#cbd5e1", font: { size: 13 }, padding: 16 }
      },
      tooltip: {
        backgroundColor: "#0f172a",
        padding: 12
      }
    }
  };

  // 3. Revenue Line Graph (This Week vs Last Week)
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const thisWeekData = [12400, 14800, 16200, 15900, 22400, 28900, 26500];
  const lastWeekData = [10200, 12100, 14500, 13800, 19500, 24100, 22800];

  const comparisonLineData = {
    labels: weekDays,
    datasets: [
      {
        label: "This Week Revenue (₹)",
        data: thisWeekData,
        borderColor: "#ff6b35",
        backgroundColor: "rgba(255, 107, 53, 0.15)",
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "#ff6b35",
        pointRadius: 5
      },
      {
        label: "Last Week Revenue (₹)",
        data: lastWeekData,
        borderColor: "#64748b",
        backgroundColor: "transparent",
        borderDash: [5, 5],
        tension: 0.4,
        pointBackgroundColor: "#64748b",
        pointRadius: 4
      }
    ]
  };

  const comparisonLineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: { color: "#cbd5e1", font: { size: 12 } }
      },
      tooltip: {
        backgroundColor: "#0f172a",
        titleColor: "#f8fafc",
        borderColor: "rgba(255,255,255,0.1)",
        borderWidth: 1,
        padding: 12
      }
    },
    scales: {
      x: {
        grid: { color: "rgba(255,255,255,0.05)" },
        ticks: { color: "#94a3b8" }
      },
      y: {
        grid: { color: "rgba(255,255,255,0.05)" },
        ticks: {
          color: "#94a3b8",
          callback: (val) => `₹${val / 1000}k`
        }
      }
    }
  };

  return (
    <div className="analytics-container">
      {/* Header & Date Range Picker */}
      <div className="analytics-header">
        <div>
          <h2>Executive Revenue Analytics</h2>
          <span className="subtitle">Real-time performance indicators & sales trends</span>
        </div>

        <div className="date-picker-bar">
          <Calendar size={16} className="date-icon" />
          {["today", "this_week", "this_month", "custom"].map((range) => (
            <button
              key={range}
              className={`date-chip ${dateRange === range ? "active" : ""}`}
              onClick={() => setDateRange(range)}
            >
              {range.replace("_", " ").toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="metrics-grid">
        {/* Card 1: Total Revenue */}
        <div className="metric-card accent-card">
          <div className="card-top">
            <span className="metric-label">Total Revenue</span>
            <div className="icon-badge accent-bg">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="metric-value">₹{totalRevenue.toLocaleString("en-IN")}</div>
          <div className="metric-trend positive">
            <ArrowUpRight size={16} /> +14.2% vs last period
          </div>
        </div>

        {/* Card 2: Avg Order Value */}
        <div className="metric-card">
          <div className="card-top">
            <span className="metric-label">Avg Order Value (AOV)</span>
            <div className="icon-badge">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="metric-value">₹{avgOrderValue}</div>
          <div className="metric-trend positive">
            <ArrowUpRight size={16} /> +5.8% vs last period
          </div>
        </div>

        {/* Card 3: Total Orders */}
        <div className="metric-card">
          <div className="card-top">
            <span className="metric-label">Total Orders</span>
            <div className="icon-badge">
              <ShoppingBag size={20} />
            </div>
          </div>
          <div className="metric-value">{totalOrders}</div>
          <div className="metric-trend positive">
            <ArrowUpRight size={16} /> +8.4% completed
          </div>
        </div>

        {/* Card 4: Repeat Customer % */}
        <div className="metric-card">
          <div className="card-top">
            <span className="metric-label">Repeat Customer %</span>
            <div className="icon-badge">
              <Users size={20} />
            </div>
          </div>
          <div className="metric-value">{repeatCustomerPct}%</div>
          <div className="metric-trend positive">
            <ArrowUpRight size={16} /> +3.1% loyalty rate
          </div>
        </div>
      </div>

      {/* 4 Chart Sections */}
      <div className="charts-grid">
        {/* Section 1: Hourly Sales Bar Chart (Today) */}
        <div className="chart-card span-2">
          <div className="chart-title-bar">
            <h3>Hourly Sales Breakdown (Today)</h3>
            <span className="badge-tag">Peak: 8 PM (₹14.2k)</span>
          </div>
          <div className="chart-canvas-wrapper">
            <Bar data={hourlyBarData} options={hourlyBarOptions} />
          </div>
        </div>

        {/* Section 2: Top 5 Selling Items Donut Chart */}
        <div className="chart-card">
          <div className="chart-title-bar">
            <h3>Top 5 Selling Items (This Week)</h3>
          </div>
          <div className="chart-canvas-wrapper donut-wrapper">
            <Doughnut data={topItemsData} options={topItemsOptions} />
          </div>
        </div>

        {/* Section 3: Revenue Comparison Line Graph */}
        <div className="chart-card span-2">
          <div className="chart-title-bar">
            <h3>Revenue Comparison: This Week vs Last Week</h3>
            <span className="badge-tag accent-tag">Overall Growth: +12.4%</span>
          </div>
          <div className="chart-canvas-wrapper">
            <Line data={comparisonLineData} options={comparisonLineOptions} />
          </div>
        </div>
      </div>
    </div>
  );
};
