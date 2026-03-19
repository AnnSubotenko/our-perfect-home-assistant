import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  getDaysInMonth,
  getDay,
  startOfMonth,
  format,
  addMonths,
  subMonths,
  isSameDay,
  isToday,
} from "date-fns";

// Types
interface Event {
  id: number;
  title: string;
  paid: boolean;
  isBill: boolean;
}

type EventMap = Record<string, Event[]>;

// date-fns calendar
function dateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

function buildDate(year: number, month: number, day: number): Date {
  return new Date(year, month, day);
}

// Sidebar nav
const navItems = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: "Calendar",
    path: "/calendar",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    label: "Payments",
    path: "/payments",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 7H6a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-3M9 7V5a2 2 0 012-2h6l4 4v6a2 2 0 01-2 2h-2M9 7h6" />
      </svg>
    ),
  },
  {
    label: "Documents",
    path: "/documents",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
];

// Component
export default function CalendarPage() {
  const navigate = useNavigate();
  const today = new Date();

  // Single Date object for the month being viewed
  const [viewDate, setViewDate] = useState<Date>(startOfMonth(today));

  // Single Date object for the selected day
  const [selectedDate, setSelectedDate] = useState<Date>(today);

  // Events keyed by "yyyy-MM-dd"
  const [events, setEvents] = useState<EventMap>({
    [format(new Date(today.getFullYear(), today.getMonth(), 20), "yyyy-MM-dd")]: [
      { id: 1, title: "Electricity Bill Due", paid: false, isBill: true },
    ],
    [format(new Date(today.getFullYear(), today.getMonth(), 22), "yyyy-MM-dd")]: [
      { id: 2, title: "Internet Bill Due", paid: false, isBill: true },
    ],
    [format(new Date(today.getFullYear(), today.getMonth(), 23), "yyyy-MM-dd")]: [
      { id: 3, title: "Date Night", paid: false, isBill: false },
    ],
  });

  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newIsBill, setNewIsBill] = useState(false);
  const [nextId, setNextId] = useState(10);

  // date-fns derived values
  const totalDays  = getDaysInMonth(viewDate);
  const startDay   = getDay(startOfMonth(viewDate));
  const trailingCells = (7 - ((startDay + totalDays) % 7)) % 7;
  const viewYear   = viewDate.getFullYear();
  const viewMonth  = viewDate.getMonth();

  const selectedKey    = dateKey(selectedDate);
  const selectedEvents = events[selectedKey] ?? [];

  // Month navigation (addMonths / subMonths replace manual +/- logic)
  const prevMonth = () => setViewDate(subMonths(viewDate, 1));
  const nextMonth = () => setViewDate(addMonths(viewDate, 1));

  // Event actions
  const togglePaid = (id: number) => {
    setEvents((prev) => ({
      ...prev,
      [selectedKey]: (prev[selectedKey] ?? []).map((ev) =>
        ev.id === id ? { ...ev, paid: !ev.paid } : ev
      ),
    }));
  };

  const deleteEvent = (id: number) => {
    setEvents((prev) => ({
      ...prev,
      [selectedKey]: (prev[selectedKey] ?? []).filter((ev) => ev.id !== id),
    }));
  };

  const addEvent = () => {
    if (!newTitle.trim()) return;
    setEvents((prev) => ({
      ...prev,
      [selectedKey]: [
        ...(prev[selectedKey] ?? []),
        { id: nextId, title: newTitle.trim(), paid: false, isBill: newIsBill },
      ],
    }));
    setNextId((n) => n + 1);
    setNewTitle("");
    setNewIsBill(false);
    setShowModal(false);
  };

  const hasEvents = (day: number): boolean => {
    const key = dateKey(buildDate(viewYear, viewMonth, day));
    return (events[key] ?? []).length > 0;
  };

  return (
    <div className="flex min-h-screen bg-[#f5f4ef]">

      {/* ── Sidebar ── */}
      <aside className="w-72 bg-[#2d4a35] flex flex-col py-8 px-5 fixed h-full">
        <div className="flex items-center gap-3 mb-10 px-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <div>
            <p className="text-white font-bold text-lg leading-tight">Our Home</p>
            <p className="text-[#8aad94] text-xs">Plan together</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? "bg-[#3d6647] text-white"
                    : "text-[#8aad94] hover:bg-[#3d6647] hover:text-white"
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={() => navigate("/login")}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[#8aad94] hover:bg-[#3d6647] hover:text-white transition-colors duration-150 mt-4"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign Out
        </button>
      </aside>

      {/* ── Main ── */}
      <main className="ml-72 flex-1 px-10 py-10">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Our Calendar</h1>
            <p className="text-gray-400 text-sm mt-1 flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Shared between you and your partner
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-[#4a8c6a] hover:bg-[#3d7a5b] text-white text-sm font-medium px-5 py-3 rounded-xl transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Event
          </button>
        </div>

        {/* Calendar card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">

          {/* Month nav — format(viewDate, "MMMM yyyy") */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm font-semibold text-gray-700">
              {format(viewDate, "MMMM yyyy")}
            </span>
            <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 mb-2">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7">

            {/* Leading empty cells — getDay(startOfMonth()) replaces firstDayOfMonth() */}
            {Array.from({ length: startDay }).map((_, i) => (
              <div key={`empty-${i}`} className="h-10" />
            ))}

            {/* Days — isSameDay() and isToday() replace manual comparisons */}
            {Array.from({ length: totalDays }).map((_, i) => {
              const day = i + 1;
              const thisDate   = buildDate(viewYear, viewMonth, day);
              const isSelected = isSameDay(thisDate, selectedDate);
              const todayCell  = isToday(thisDate);
              const hasDot     = hasEvents(day);

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(thisDate)}
                  className={`h-10 w-10 mx-auto flex flex-col items-center justify-center rounded-xl text-sm font-medium transition-colors relative
                    ${isSelected
                      ? "bg-[#4a8c6a] text-white"
                      : todayCell
                      ? "border-2 border-[#4a8c6a] text-[#4a8c6a]"
                      : "text-gray-700 hover:bg-gray-100"
                    }`}
                >
                  {day}
                  {hasDot && (
                    <span className={`absolute bottom-1 w-1 h-1 rounded-full ${isSelected ? "bg-white" : "bg-[#4a8c6a]"}`} />
                  )}
                </button>
              );
            })}

            {/* Trailing cells */}
            {Array.from({ length: trailingCells }).map((_, i) => (
              <div key={`trail-${i}`} className="h-10 flex items-center justify-center text-sm text-gray-300">
                {i + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Selected day events — format(selectedDate, "MMMM d, yyyy") replaces formatDisplayDate() */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            {format(selectedDate, "MMMM d, yyyy")}
          </h2>

          {selectedEvents.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No events for this day</p>
          ) : (
            <div className="flex flex-col gap-2">
              {selectedEvents.map((ev) => (
                <div key={ev.id} className="flex items-center justify-between bg-[#fafaf8] rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => togglePaid(ev.id)}
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors shrink-0 ${
                        ev.paid ? "bg-[#4a8c6a] border-[#4a8c6a]" : "border-gray-300 hover:border-[#4a8c6a]"
                      }`}
                    >
                      {ev.paid && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <div>
                      <p className={`text-sm font-medium transition-all ${ev.paid ? "line-through text-gray-400" : "text-gray-700"}`}>
                        {ev.title}
                      </p>
                      {ev.isBill && (
                        <span className={`text-xs ${ev.paid ? "text-[#4a8c6a]" : "text-[#e07048]"}`}>
                          {ev.paid ? "Paid" : "Bill due"}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteEvent(ev.id)}
                    className="text-gray-300 hover:text-red-400 transition-colors ml-4"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* ── Add Event Modal ── */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
            <h2 className="text-lg font-bold text-gray-800 mb-1">Add Event</h2>
            <p className="text-sm text-gray-400 mb-6">
              {format(selectedDate, "MMMM d, yyyy")}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Event title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") addEvent(); }}
                  placeholder="e.g. Electricity Bill Due"
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-[#fafaf8] text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4a8c6a]/30 focus:border-[#4a8c6a] transition"
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newIsBill}
                  onChange={(e) => setNewIsBill(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#4a8c6a]"
                />
                <span className="text-sm text-gray-600">This is a bill</span>
              </label>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addEvent}
                className="flex-1 py-3 rounded-xl bg-[#4a8c6a] hover:bg-[#3d7a5b] text-white text-sm font-medium transition-colors"
              >
                Add Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
