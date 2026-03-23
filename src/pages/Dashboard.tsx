// No sidebar here — Layout.tsx provides it

const stats = [
  {
    label: "Bills Paid",
    value: "8",
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
    value: "3",
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
    label: "Documents",
    value: "24",
    sub: "Stored files",
    iconBg: "bg-[#e8f0eb]",
    iconColor: "text-[#4a8c6a]",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    label: "Total Spent",
    value: "$2,450",
    sub: "December",
    iconBg: "bg-[#fef0ec]",
    iconColor: "text-[#e07048]",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
];

const upcoming = [
  { label: "Electricity Bill Due", date: "Dec 20", color: "bg-[#e07048]" },
  { label: "Internet Bill Due",    date: "Dec 22", color: "bg-[#e07048]" },
  { label: "Date Night",           date: "Dec 23", color: "bg-[#4a8c6a]" },
  { label: "Rent Due",             date: "Jan 1",  color: "bg-[#e07048]" },
];

const recentPayments = [
  { label: "Water Bill",  date: "Dec 15", amount: "$45.00"  },
  { label: "Gas Bill",    date: "Dec 12", amount: "$78.50"  },
  { label: "Phone Bill",  date: "Dec 10", amount: "$120.00" },
];

export default function Dashboard() {
  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Welcome back 👋</h1>
        <p className="text-gray-400 text-sm mt-1">Here's your household overview</p>
      </div>

      {/* Stats grid */}
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

      {/* Upcoming */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[#4a8c6a]">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </span>
          <h2 className="text-lg font-bold text-gray-800">Upcoming</h2>
        </div>
        <div className="flex flex-col gap-2">
          {upcoming.map((item) => (
            <div key={item.label} className="flex items-center justify-between bg-[#fafaf8] rounded-xl px-4 py-3">
              <div className="flex items-center gap-3">
                <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                <span className="text-sm text-gray-700">{item.label}</span>
              </div>
              <span className="text-sm text-gray-400">{item.date}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Payments */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[#4a8c6a]">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          <h2 className="text-lg font-bold text-gray-800">Recent Payments</h2>
        </div>
        <div className="flex flex-col gap-2">
          {recentPayments.map((item) => (
            <div key={item.label} className="flex items-center justify-between bg-[#fafaf8] rounded-xl px-4 py-4">
              <div>
                <p className="text-sm font-medium text-gray-700">{item.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.date}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-800">{item.amount}</p>
                <p className="text-xs text-[#4a8c6a] mt-0.5">Paid</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
