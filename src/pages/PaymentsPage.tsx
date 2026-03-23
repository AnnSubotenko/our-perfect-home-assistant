import { useMemo, useState } from "react";

type Bill = {
  id: string;
  name: string;
  amount: number;
  paid: boolean;
  dueDate?: string;
};

type StatCardProps = {
  title: string;
  amount: string;
  amountClassName?: string;
  icon: React.ReactNode;
  iconBgClassName?: string;
};

function StatCard({
  title,
  amount,
  amountClassName = "text-gray-800",
  icon,
  iconBgClassName = "bg-gray-100",
}: StatCardProps) {
  return (
    <div className="rounded-[28px] border border-[#ddd6cc] bg-white px-8 py-8 shadow-sm">
      <div className="flex items-center gap-5">
        <div
          className={`flex h-20 w-20 items-center justify-center rounded-[22px] ${iconBgClassName}`}
        >
          {icon}
        </div>

        <div>
          <p className="text-[18px] text-gray-500">{title}</p>
          <p className={`mt-1 text-[22px] font-bold ${amountClassName}`}>
            {amount}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PaymentsPage() {

  const [showModal, setShowModal] = useState(false);

   const [bills, setBills] = useState<Bill[]>([
    { id: crypto.randomUUID(), name: "Rent", amount: 1200, paid: true, dueDate: "2026-03-01" },
    { id: crypto.randomUUID(), name: "Electricity", amount: 200, paid: false, dueDate: "2026-03-20" },
    { id: crypto.randomUUID(), name: "Internet", amount: 100, paid: true, dueDate: "2026-03-15" },
    { id: crypto.randomUUID(), name: "Phone", amount: 643, paid: false, dueDate: "2026-03-25" },
  ]);

  const [newBillName, setNewBillName] = useState("");
  const [newBillAmount, setNewBillAmount] = useState("");
  const [newBillDueDate, setNewBillDueDate] = useState("");

  const totalPaid = useMemo(() => {
    return bills
      .filter((bill) => bill.paid)
      .reduce((sum, bill) => sum + bill.amount, 0);
  }, [bills]);

    const pending = useMemo(() => {
    return bills
      .filter((bill) => !bill.paid)
      .reduce((sum, bill) => sum + bill.amount, 0);
  }, [bills]);

    const totalMonthly = useMemo(() => {
    return bills.reduce((sum, bill) => sum + bill.amount, 0);
  }, [bills]);

    function togglePaid(id: string) {
    setBills((prev) =>
      prev.map((bill) =>
        bill.id === id ? { ...bill, paid: !bill.paid } : bill
      )
    );
  }

  function deleteBill(id: string) {
    setBills((prev) => prev.filter((bill) => bill.id !== id));
  }

  function addBill() {
    const trimmedName = newBillName.trim();
    const parsedAmount = Number(newBillAmount);

    if (!trimmedName) return;
    if (!newBillAmount || Number.isNaN(parsedAmount) || parsedAmount <= 0) return;

    const newBill: Bill = {
      id: crypto.randomUUID(),
      name: trimmedName,
      amount: parsedAmount,
      paid: false,
      dueDate: newBillDueDate || undefined,
    };

    setBills((prev) => [...prev, newBill]);
    setNewBillName("");
    setNewBillAmount("");
    setNewBillDueDate("");
    setShowModal(false);
  }

  return (
    <div className="min-h-screen bg-[#f6f5f2] px-6 py-8 md:px-12">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800"> Payment Tracker </h1>
            <p className="text-gray-400 text-sm mt-1 flex items-center gap-1">
            <svg
             xmlns="http://www.w3.org/2000/svg"
             className="w-4 h-4"
             fill="none"
             viewBox="0 0 24 24"
             stroke="currentColor"
             strokeWidth={1.8}>
              <path
               strokeLinecap="round"
               strokeLinejoin="round"
               d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Track your monthly bills and payments
          </p>
          </div>
          <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-[#4a8c6a] hover:bg-[#3d7a5b] text-white text-sm font-medium px-5 py-3 rounded-xl transition-colors"
        >
          <svg
           xmlns="http://www.w3.org/2000/svg"
           className="w-4 h-4" fill="none"
           viewBox="0 0 24 24"
           stroke="currentColor"
           strokeWidth={2}>
            <path
             strokeLinecap="round"
             strokeLinejoin="round"
             d="M12 4v16m8-8H4"
             />
          </svg>
          Add Bill
        </button>
        </div>

        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-3">
          <StatCard
            title="Total Paid"
            amount={`ZAR ${totalPaid.toFixed(2)}`}
            amountClassName="text-[#42a36b]"
            iconBgClassName="bg-[#edf4ef]"
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-9 w-9 text-[#42a36b]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.2}
              >
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
            amount={`ZAR ${pending.toFixed(2)}`}
            amountClassName="text-[#e6a12d]"
            iconBgClassName="bg-[#faf3e7]"
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-9 w-9 text-[#e6a12d]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.2}
              >
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
            amount={`ZAR ${totalMonthly.toFixed(2)}`}
            amountClassName="text-gray-800"
            iconBgClassName="bg-[#eef2ef]"
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-9 w-9 text-[#4a8c6a]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 14h6m-6-4h6m2 10H7a2 2 0 01-2-2V6a2 2 0 012-2h7l5 5v9a2 2 0 01-2 2z"
                />
              </svg>
            }
          />
        </div>

        {/* Bills list */}
        <div className="mt-8 rounded-[28px] border border-[#ddd6cc] bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">Your Bills</h2>
            <span className="text-sm text-gray-400">
              {bills.length} {bills.length === 1 ? "bill" : "bills"}
            </span>
          </div>

          {bills.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">
              No bills yet. Add your first bill.
            </p>
          ) : (
            <div className="space-y-3">
              {bills.map((bill) => (
                <div
                  key={bill.id}
                  className="flex flex-col gap-4 rounded-2xl bg-[#fafaf8] px-4 py-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => togglePaid(bill.id)}
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                        bill.paid
                          ? "border-[#4a8c6a] bg-[#4a8c6a]"
                          : "border-gray-300 hover:border-[#4a8c6a]"
                      }`}
                    >
                      {bill.paid && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3 w-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </button>

                    <div>
                      <p
                        className={`font-medium ${
                          bill.paid ? "text-gray-400 line-through" : "text-gray-800"
                        }`}
                      >
                        {bill.name}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                        <span>ZAR{bill.amount.toFixed(2)}</span>
                        {bill.dueDate && <span>Due: {bill.dueDate}</span>}
                        <span
                          className={
                            bill.paid ? "text-[#42a36b]" : "text-[#e07048]"
                          }
                        >
                          {bill.paid ? "Paid" : "Pending"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteBill(bill.id)}
                    className="self-end text-gray-300 transition-colors hover:text-red-400 md:self-auto"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowModal(false);
            }}
          >
            <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
              <h2 className="mb-1 text-lg font-bold text-gray-800">Add Bill</h2>
              <p className="mb-6 text-sm text-gray-400">
                Add a new monthly payment
              </p>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Bill name
                  </label>
                  <input
                    type="text"
                    value={newBillName}
                    onChange={(e) => setNewBillName(e.target.value)}
                    placeholder="e.g. Electricity"
                    className="w-full rounded-xl border border-gray-200 bg-[#fafaf8] px-4 py-3 text-sm text-gray-700 placeholder-gray-400 transition focus:border-[#4a8c6a] focus:outline-none focus:ring-2 focus:ring-[#4a8c6a]/30"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Amount
                  </label>
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
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Due date
                  </label>
                  <input
                    type="date"
                    value={newBillDueDate}
                    onChange={(e) => setNewBillDueDate(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-[#fafaf8] px-4 py-3 text-sm text-gray-700 transition focus:border-[#4a8c6a] focus:outline-none focus:ring-2 focus:ring-[#4a8c6a]/30"
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
    </div>
  );
}
