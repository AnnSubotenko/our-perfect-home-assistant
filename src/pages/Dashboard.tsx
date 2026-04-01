// No sidebar here — Layout.tsx provides it
import { useMemo } from "react";
import type { Bill } from "../types/Bill";

type Props = {
  bills: Bill[];
  loading: boolean;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatZAR(amount: number): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
  });
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function Dashboard({ bills, loading }: Props) {

  // ── Dynamic stats from shared bills ──────────────────────────────────────
  const totalPaid = useMemo(
    () => bills.filter((b) => b.paid).reduce((sum, b) => sum + b.amount, 0),
    [bills]
  );

  const totalPending = useMemo(
    () => bills.filter((b) => !b.paid).reduce((sum, b) => sum + b.amount, 0),
    [bills]
  );

  const billsPaidCount = useMemo(
    () => bills.filter((b) => b.paid).length,
    [bills]
  );

  const pendingCount = useMemo(
    () => bills.filter((b) => !b.paid).length,
    [bills]
  );

  // Last 3 paid bills (most recent first)
  const recentPayments = useMemo(
    () =>
      bills
        .filter((b) => b.paid && b.dueDate)
        .sort((a, b) => new Date(b.dueDate!).getTime() - new Date(a.dueDate!).getTime())
        .slice(0, 3),
    [bills]
  );

  // Next 4 unpaid bills sorted by due date (soonest first)
  const upcoming = useMemo(
    () =>
      bills
        .filter((b) => !b.paid && b.dueDate)
        .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
        .slice(0, 4),
    [bills]
  );

  // ── Stats config ─────────────────────────────────────────────────────────
  const stats = [
    {
      label: "Bills Paid",
      value: loading ? "—" : String(billsPaidCount),
      sub: "This month",
      iconBg: "bg-[#e8f0eb]",
      iconColor: "text-[#4a8c6a]",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: "Pending",
      value: loading ? "—" : String(pendingCount),
      sub: "Due soon",
      iconBg: "bg-[#fef3e2]",
      iconColor: "text-[#d97706]",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: "Total Paid",
      value: loading ? "—" : formatZAR(totalPaid),
      sub: "This month",
      iconBg: "bg-[#e8f0eb]",
      iconColor: "text-[#4a8c6a]",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: "Pending Amount",
      value: loading ? "—" : formatZAR(totalPending),
      sub: "Outstanding",
      iconBg: "bg-[#fef0ec]",
      iconColor: "text-[#e07048]",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
    },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Welcome back 👋</h1>
        <p className="text-gray-400 text-sm mt-1">Here's your household overview</p>
      </div>

      {/* Stats grid — all dynamic from bills prop */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl p-6 border border-gray-100 flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-800 mb-1">{stat.value}</p>
              <p className="text-xs text-gray-400">{stat.sub}</p>
            </div>
            <div className={`w-12 h-12 rounded-xl ${stat.iconBg} ${stat.iconColor} flex items-center justify-center`}>
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Upcoming unpaid bills — dynamic */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[#4a8c6a]">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </span>
          <h2 className="text-lg font-bold text-gray-800">Upcoming</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-6">
            <div className="w-5 h-5 border-2 border-[#4a8c6a] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : upcoming.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No upcoming bills 🎉</p>
        ) : (
          <div className="flex flex-col gap-2">
            {upcoming.map((bill) => (
              <div key={bill.id} className="flex items-center justify-between bg-[#fafaf8] rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#e07048]" />
                  <span className="text-sm text-gray-700">{bill.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-800">{formatZAR(bill.amount)}</span>
                  <span className="text-sm text-gray-400">{bill.dueDate ? formatDate(bill.dueDate) : ""}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent payments — dynamic */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[#4a8c6a]">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          <h2 className="text-lg font-bold text-gray-800">Recent Payments</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-6">
            <div className="w-5 h-5 border-2 border-[#4a8c6a] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : recentPayments.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No payments yet</p>
        ) : (
          <div className="flex flex-col gap-2">
            {recentPayments.map((bill) => (
              <div key={bill.id} className="flex items-center justify-between bg-[#fafaf8] rounded-xl px-4 py-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">{bill.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {bill.dueDate ? formatDate(bill.dueDate) : ""}
                    {bill.category ? ` · ${bill.category}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-800">{formatZAR(bill.amount)}</p>
                  <p className="text-xs text-[#4a8c6a] mt-0.5">Paid</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
