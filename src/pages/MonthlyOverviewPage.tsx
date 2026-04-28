import { useMemo, useRef, useEffect, useState } from "react";
import type { TooltipContentProps } from "recharts";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import type { Bill } from "../types/Bill";

type Props = {
  bills: Bill[];
};

type BarTooltipData = {
  category: string;
  amount: number;
};
// Helpers
function formatZAR(amount: number): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2,
  }).format(amount);
}

function getMonthKey(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(key: string): string {
  const [year, month] = key.split("-");
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString("en-ZA", {
    month: "long",
    year: "numeric",
  });
}

// Category colors matching your app palette
const CATEGORY_COLORS: Record<string, string> = {
  Housing:       "#4a8c6a",
  Utilities:     "#e07048",
  Communication: "#d97706",
  Insurance:     "#3d7a5b",
  Entertainment: "#e03030",
  Health:        "#4a6cb8",
  Other:         "#8aad94",
};

function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? "#8aad94";
}

// Custom tooltip for bar chart
function BarTooltip({ active, payload }: TooltipContentProps<number, string>) {
  if (!active || !payload?.length) return null;
    const item = payload[0];
    const data = item.payload as BarTooltipData;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-3">
      <p className="text-sm font-semibold text-gray-800">{data.category}</p>
      <p className="text-sm text-gray-500 mt-0.5">Amount: {formatZAR(Number(item.value))}</p>
    </div>
  );
}

// ─── Custom tooltip for donut chart ───────────────────────────────────────────
function DonutTooltip({ active, payload }: TooltipContentProps<number, string>) {
  if (!active || !payload?.length) return null;
    const item = payload[0];
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-3">
      <p className="text-sm font-semibold text-gray-800">{item.name}</p>
      <p className="text-sm text-gray-500 mt-0.5">{formatZAR(Number(item.value))}</p>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function MonthlyOverviewPage({ bills }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // ── Build list of months that have bills, plus current month ─────────────
  const months = useMemo(() => {
    const today = new Date();
    const currentKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

    const keys = new Set<string>();
    keys.add(currentKey);

    // Add 5 months before current
    for (let i = 1; i <= 5; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      keys.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }

    // Add months from bills
    bills.forEach((b) => {
      if (b.dueDate) keys.add(getMonthKey(b.dueDate));
    });

    // Add 2 future months
    for (let i = 1; i <= 2; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
      keys.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }

    return Array.from(keys).sort();
  }, [bills]);

  const currentMonthKey = useMemo(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey);

  // Scroll to current month on mount
  useEffect(() => {
    const el = scrollRef.current?.querySelector(`[data-key="${currentMonthKey}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [currentMonthKey]);

  // ── Filter bills for selected month ───────────────────────────────────────
  const monthBills = useMemo(() => {
    return bills.filter((b) => b.dueDate && getMonthKey(b.dueDate) === selectedMonth);
  }, [bills, selectedMonth]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const total   = useMemo(() => monthBills.reduce((s, b) => s + b.amount, 0), [monthBills]);
  const paid    = useMemo(() => monthBills.filter((b) => b.paid).reduce((s, b) => s + b.amount, 0), [monthBills]);
  const pending = useMemo(() => monthBills.filter((b) => !b.paid).reduce((s, b) => s + b.amount, 0), [monthBills]);

  // ── Spending by category (bar chart data) ─────────────────────────────────
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    monthBills.forEach((b) => {
      const cat = b.category ?? "Other";
      map[cat] = (map[cat] ?? 0) + b.amount;
    });
    return Object.entries(map)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [monthBills]);

  // ── Paid vs Pending (donut chart data) ────────────────────────────────────
  const donutData = useMemo(() => {
    const data = [];
    if (paid > 0)    data.push({ name: "Paid",    value: paid });
    if (pending > 0) data.push({ name: "Pending", value: pending });
    return data;
  }, [paid, pending]);

  const paidPct    = total > 0 ? Math.round((paid / total) * 100)    : 0;
  const pendingPct = total > 0 ? Math.round((pending / total) * 100) : 0;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Monthly Overview</h1>
        <p className="text-gray-400 text-sm mt-1">See your spending breakdown by month</p>
      </div>

      {/* Month selector — horizontal scroll */}
      <div className="bg-white rounded-2xl border border-gray-100 mb-6 overflow-hidden">
        <div ref={scrollRef} className="flex overflow-x-auto scrollbar-hide px-4">
          {months.map((key) => (
            <button
              key={key}
              data-key={key}
              onClick={() => setSelectedMonth(key)}
              className={`shrink-0 px-6 py-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                selectedMonth === key
                  ? "border-[#4a8c6a] text-gray-800 font-semibold"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              {getMonthLabel(key)}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total",   value: formatZAR(total),   color: "text-gray-800"    },
          { label: "Paid",    value: formatZAR(paid),    color: "text-[#4a8c6a]"   },
          { label: "Pending", value: formatZAR(pending), color: "text-[#d97706]"   },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
            <p className="text-sm text-gray-400 mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {monthBills.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-gray-400 text-sm">No bills for {getMonthLabel(selectedMonth)}</p>
        </div>
      ) : (
        <>
          {/* Spending by Category — horizontal bar chart */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-6">Spending by Category</h2>
            <ResponsiveContainer width="100%" height={Math.max(200, categoryData.length * 55)}>
              <BarChart
                data={categoryData}
                layout="vertical"
                margin={{ top: 0, right: 30, left: 80, bottom: 0 }}
              >
                <XAxis
                  type="number"
                  tickFormatter={(v) => `$${v.toLocaleString()}`}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#9ca3af" }}
                />
                <YAxis
                  type="category"
                  dataKey="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 13, fill: "#374151" }}
                  width={75}
                />
                <Tooltip content={<BarTooltip active={false} payload={[]} coordinate={undefined} accessibilityLayer={false} activeIndex={undefined} />} cursor={{ fill: "#f3f4f6" }} />
                <Bar dataKey="amount" radius={[0, 8, 8, 0]} maxBarSize={32}>
                  {categoryData.map((entry) => (
                    <Cell key={entry.category} fill={getCategoryColor(entry.category)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Paid vs Pending — donut chart */}
          {donutData.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-6">Paid vs Pending</h2>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={90}
                      outerRadius={130}
                      paddingAngle={3}
                      dataKey="value"
                      startAngle={90}
                      endAngle={-270}
                    >
                      {donutData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={entry.name === "Paid" ? "#4a8c6a" : "#d97706"}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<DonutTooltip active={false} payload={[]} coordinate={undefined} accessibilityLayer={false} activeIndex={undefined} />} />
                    <Legend
                      formatter={(value) => {
                        const pct = value === "Paid" ? paidPct : pendingPct;
                        return (
                          <span style={{ color: value === "Paid" ? "#4a8c6a" : "#d97706", fontSize: 14 }}>
                            {value} {pct}%
                          </span>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
