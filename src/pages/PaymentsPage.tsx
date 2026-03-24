// No sidebar or outer wrapper here — Layout.tsx provides it
import { useMemo, useState, type ReactNode } from "react";

// Types
type Bill = {
  id: string;
  name: string;
  amount: number;
  paid: boolean;
  dueDate?: string;
  category?: string;
};

type FilterType = "all" | "paid" | "pending";

type StatCardProps = {
  title: string;
  amount: string;
  amountClassName: string;
  iconBgClassName: string;
  icon: ReactNode;
};

type FilterButtonProps = {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
  activeClassName: string;
  inactiveClassName?: string;
};

// Helpers
function formatZAR(amount: number): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
  }).format(amount);
}

// Sub-components
function StatCard({
  title,
  amount,
  amountClassName,
  iconBgClassName,
  icon,
}: StatCardProps) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white px-6 py-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${iconBgClassName}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-400">{title}</p>
          <p className={`mt-0.5 text-xl font-bold ${amountClassName}`}>{amount}</p>
        </div>
      </div>
    </div>
  );
}

function FilterButton({
  active,
  children,
  onClick,
  activeClassName,
  inactiveClassName = "border-gray-200 bg-white text-gray-600 hover:bg-gray-50",
}: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border px-5 py-2.5 text-sm font-medium transition-colors ${
        active ? `${activeClassName} border-transparent` : inactiveClassName
      }`}
    >
      {children}
    </button>
  );
}

// Main Component
export default function PaymentsPage() {
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");

  const [bills, setBills] = useState<Bill[]>([
    { id: "1", name: "Rent",        amount: 1500, paid: true,  dueDate: "1st",  category: "Housing"   },
    { id: "2", name: "Electricity", amount: 120,  paid: false, dueDate: "20th", category: "Utilities" },
    { id: "3", name: "Internet",    amount: 65,   paid: false, dueDate: "22nd", category: "Utilities" },
    { id: "4", name: "Water",       amount: 45,   paid: true,  dueDate: "15th", category: "Utilities" },
    { id: "5", name: "Gas",         amount: 78,   paid: true,  dueDate: "12th", category: "Utilities" },
  ]);

  const [newBillName,     setNewBillName]     = useState("");
  const [newBillAmount,   setNewBillAmount]   = useState("");
  const [newBillDueDate,  setNewBillDueDate]  = useState("");
  const [newBillCategory, setNewBillCategory] = useState("");

  // Derived totals via useMemo
  const totalPaid = useMemo(
    () => bills.filter((b) => b.paid).reduce((sum, b) => sum + b.amount, 0),
    [bills]
  );

  const totalPending = useMemo(
    () => bills.filter((b) => !b.paid).reduce((sum, b) => sum + b.amount, 0),
    [bills]
  );

  const totalMonthly = useMemo(
    () => bills.reduce((sum, b) => sum + b.amount, 0),
    [bills]
  );

  const filteredBills = useMemo(() => {
    if (filter === "paid")    return bills.filter((b) => b.paid);
    if (filter === "pending") return bills.filter((b) => !b.paid);
    return bills;
  }, [bills, filter]);

  // Actions
  function togglePaid(id: string) {
    setBills((prev) =>
      prev.map((b) => (b.id === id ? { ...b, paid: !b.paid } : b))
    );
  }

  function deleteBill(id: string) {
    setBills((prev) => prev.filter((b) => b.id !== id));
  }

  function addBill() {
    const name   = newBillName.trim();
    const amount = Number(newBillAmount);
    if (!name || isNaN(amount) || amount <= 0) return;

    setBills((prev) => [
      ...prev,
      {
        id:       crypto.randomUUID(),
        name,
        amount,
        paid:     false,
        dueDate:  newBillDueDate.trim()  || undefined,
        category: newBillCategory.trim() || undefined,
      },
    ]);

    setNewBillName("");
    setNewBillAmount("");
    setNewBillDueDate("");
    setNewBillCategory("");
    setShowModal(false);
  }

  // ────────────────
  return (
    <div>

      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Payment Tracker</h1>
          <p className="mt-1 text-sm text-gray-400">Track your monthly bills and payments</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 self-start rounded-xl bg-[#4a8c6a] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#3d7a5b]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4v16m8-8H4"
          />
          </svg>
          Add Bill
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <StatCard
          title="Total Paid"
          amount={formatZAR(totalPaid)}
          amountClassName="text-[#4a8c6a]"
          iconBgClassName="bg-[#e8f0eb]"
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7 text-[#4a8c6a]"
              fill="none" viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
            </svg>
          }
        />
        <StatCard
          title="Pending"
          amount={formatZAR(totalPending)}
          amountClassName="text-[#d97706]"
          iconBgClassName="bg-[#fef3e2]"
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7 text-[#d97706]"
              fill="none" viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8v4l3 2"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
            </svg>
          }
        />
        <StatCard
          title="Total Monthly"
          amount={formatZAR(totalMonthly)}
          amountClassName="text-gray-800"
          iconBgClassName="bg-[#e8f0eb]"
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7 text-[#4a8c6a]"
              fill="none" viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 14h6m-6-4h6m2 10H7a2 2 0 01-2-2V6a2 2 0 012-2h7l5 5v9a2 2 0 01-2 2z"
            />
            </svg>
          }
        />
      </div>

      {/* Filter buttons */}
      <div className="flex gap-3 mb-6">
        <FilterButton active={filter === "all"}     onClick={() => setFilter("all")}     activeClassName="bg-[#4a8c6a] text-white">All</FilterButton>
        <FilterButton active={filter === "paid"}    onClick={() => setFilter("paid")}    activeClassName="bg-[#4a8c6a] text-white">Paid</FilterButton>
        <FilterButton active={filter === "pending"} onClick={() => setFilter("pending")} activeClassName="bg-[#fef3e2] text-[#d97706]">Pending</FilterButton>
      </div>

      {/* Bills list */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">Monthly Bills</h2>
          <span className="text-sm text-gray-400">
            {filteredBills.length} {filteredBills.length === 1 ? "bill" : "bills"}
          </span>
        </div>

        {filteredBills.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">No bills in this filter.</p>
        ) : (
          <div className="space-y-3">
            {filteredBills.map((bill) => (
              <div
                key={bill.id}
                className={`flex flex-col gap-4 rounded-xl px-5 py-4 md:flex-row md:items-center md:justify-between ${
                  bill.paid ? "border border-[#cfe4d6] bg-[#f6fbf7]" : "bg-[#fafaf8]"
                }`}
              >
                {/* Left: checkbox + name */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => togglePaid(bill.id)}
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                      bill.paid
                        ? "border-[#4a8c6a] bg-[#4a8c6a]"
                        : "border-gray-300 hover:border-[#4a8c6a]"
                    }`}
                  >
                    {bill.paid && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3.5 w-3.5 text-white"
                        fill="none" viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                      </svg>
                    )}
                  </button>
                  <div>
                    <p className={`text-base font-medium ${bill.paid ? "text-gray-400 line-through" : "text-gray-800"}`}>
                      {bill.name}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {bill.dueDate && <span>Due: {bill.dueDate}</span>}
                      {bill.dueDate && bill.category && <span> · </span>}
                      {bill.category && <span>{bill.category}</span>}
                    </p>
                  </div>
                </div>

                {/* Right: amount + badge + delete */}
                <div className="flex items-center gap-4">
                  <p className="text-base font-bold text-gray-800">{formatZAR(bill.amount)}</p>
                  <span className={`rounded-full px-4 py-1 text-xs font-medium ${
                    bill.paid ? "bg-[#d8eadf] text-[#4a8c6a]" : "bg-[#fef3e2] text-[#d97706]"
                  }`}>
                    {bill.paid ? "Paid" : "Pending"}
                  </span>
                  <button
                    onClick={() => deleteBill(bill.id)}
                    className="text-gray-300 transition-colors hover:text-red-400"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Bill Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
            <h2 className="mb-1 text-lg font-bold text-gray-800">Add Bill</h2>
            <p className="mb-6 text-sm text-gray-400">Add a new monthly payment</p>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Bill name</label>
                <input
                  type="text"
                  value={newBillName}
                  onChange={(e) => setNewBillName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") addBill(); }}
                  placeholder="e.g. Electricity"
                  autoFocus
                  className="w-full rounded-xl border border-gray-200 bg-[#fafaf8] px-4 py-3 text-sm text-gray-700 placeholder-gray-400 transition focus:border-[#4a8c6a] focus:outline-none focus:ring-2 focus:ring-[#4a8c6a]/30"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Amount (ZAR)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newBillAmount}
                  onChange={(e) => setNewBillAmount(e.target.value)}
                  placeholder="e.g. 120.00"
                  className="w-full rounded-xl border border-gray-200 bg-[#fafaf8] px-4 py-3 text-sm text-gray-700 placeholder-gray-400 transition focus:border-[#4a8c6a] focus:outline-none focus:ring-2 focus:ring-[#4a8c6a]/30"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Due date</label>
                <input
                  type="text"
                  value={newBillDueDate}
                  onChange={(e) => setNewBillDueDate(e.target.value)}
                  placeholder="e.g. 20th"
                  className="w-full rounded-xl border border-gray-200 bg-[#fafaf8] px-4 py-3 text-sm text-gray-700 placeholder-gray-400 transition focus:border-[#4a8c6a] focus:outline-none focus:ring-2 focus:ring-[#4a8c6a]/30"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Category</label>
                <input
                  type="text"
                  value={newBillCategory}
                  onChange={(e) => setNewBillCategory(e.target.value)}
                  placeholder="e.g. Utilities"
                  className="w-full rounded-xl border border-gray-200 bg-[#fafaf8] px-4 py-3 text-sm text-gray-700 placeholder-gray-400 transition focus:border-[#4a8c6a] focus:outline-none focus:ring-2 focus:ring-[#4a8c6a]/30"
                />
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={addBill}
                className="flex-1 rounded-xl bg-[#4a8c6a] py-3 text-sm font-medium text-white transition-colors hover:bg-[#3d7a5b]"
              >
                Add Bill
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
