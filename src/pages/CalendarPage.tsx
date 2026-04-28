import { useState, useEffect, useMemo } from "react";
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
import { supabase } from "../lib/supabase";

// Types
type EventType = "Event" | "Bill" | "Appointment" | "Reminder";
type Visibility = "both" | "just_me";

type CalendarEvent = {
  id: string;
  title: string;
  type: EventType;
  visibility: Visibility;
  date: string;
  time?: string;
  notes?: string;
};

const EVENT_TYPES: EventType[] = ["Event", "Bill", "Appointment", "Reminder"];

// Helpers
function dateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

function buildDate(year: number, month: number, day: number): Date {
  return new Date(year, month, day);
}

function formatTime(time: string): string {
  const [h, m] = time.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const display = hour % 12 || 12;
  return `${display}:${m} ${ampm}`;
}

// Event type pill colors
function typePillClass(type: EventType): string {
  switch (type) {
    case "Bill":        return "bg-[#fef3e2] text-[#d97706]";
    case "Appointment": return "bg-[#e8f0ff] text-[#4a6cb8]";
    case "Reminder":    return "bg-[#f0e8f8] text-[#7c4ab8]";
    default:            return "bg-[#e8f0eb] text-[#4a8c6a]";
  }
}

function typeDotClass(type: EventType): string {
  switch (type) {
    case "Bill":        return "bg-[#d97706]";
    case "Appointment": return "bg-[#4a6cb8]";
    case "Reminder":    return "bg-[#7c4ab8]";
    default:            return "bg-[#4a8c6a]";
  }
}

// Component
export default function CalendarPage() {
  const today = new Date();

  const [viewDate,      setViewDate]      = useState<Date>(startOfMonth(today));
  const [selectedDate,  setSelectedDate]  = useState<Date>(today);
  const [events,        setEvents]        = useState<CalendarEvent[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [showModal,     setShowModal]     = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [saveError,     setSaveError]     = useState("");

  // Modal form state
  const [newTitle,      setNewTitle]      = useState("");
  const [newType,       setNewType]       = useState<EventType>("Event");
  const [newVisibility, setNewVisibility] = useState<Visibility>("both");
  const [newDate,       setNewDate]       = useState(dateKey(today));
  const [newTime,       setNewTime]       = useState("");
  const [newNotes,      setNewNotes]      = useState("");

  // Load events from Supabase
  useEffect(() => {
    async function fetchEvents() {
      setLoading(true);
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("date", { ascending: true });

      if (error) {
        console.error("Failed to load events:", error.message);
        setLoading(false);
        return;
      }

      const mapped: CalendarEvent[] = (data ?? []).map((row) => ({
        id:         row.id,
        title:      row.title,
        type:       row.type as EventType,
        visibility: row.visibility as Visibility,
        date:       row.date,
        time:       row.time ?? undefined,
        notes:      row.notes ?? undefined,
      }));

      setEvents(mapped);
      setLoading(false);
    }

    fetchEvents();
  }, []);

  // Derived calendar values
  const totalDays     = getDaysInMonth(viewDate);
  const startDay      = getDay(startOfMonth(viewDate));
  const trailingCells = (7 - ((startDay + totalDays) % 7)) % 7;
  const viewYear      = viewDate.getFullYear();
  const viewMonth     = viewDate.getMonth();

  const selectedKey    = dateKey(selectedDate);
  const selectedEvents = useMemo(
    () => events.filter((e) => e.date === selectedKey)
               .sort((a, b) => (a.time ?? "").localeCompare(b.time ?? "")),
    [events, selectedKey]
  );

  const hasEvents = (day: number): boolean => {
    const key = dateKey(buildDate(viewYear, viewMonth, day));
    return events.some((e) => e.date === key);
  };

  // Add event
  async function handleSave() {
    if (!newTitle.trim()) { setSaveError("Please enter a title."); return; }
    if (!newDate)         { setSaveError("Please select a date."); return; }

    setSaving(true);
    setSaveError("");

    const { data, error } = await supabase
      .from("events")
      .insert({
        title:      newTitle.trim(),
        type:       newType,
        visibility: newVisibility,
        date:       newDate,
        time:       newTime || null,
        notes:      newNotes.trim() || null,
      })
      .select()
      .single();

    if (error) {
      setSaveError("Failed to save event. Please try again.");
      setSaving(false);
      return;
    }

    const newEvent: CalendarEvent = {
      id:         data.id,
      title:      data.title,
      type:       data.type,
      visibility: data.visibility,
      date:       data.date,
      time:       data.time ?? undefined,
      notes:      data.notes ?? undefined,
    };

    setEvents((prev) => [...prev, newEvent]);
    resetModal();
    setShowModal(false);

    // Jump to the newly added event's date
    setSelectedDate(new Date(data.date + "T12:00:00"));
  }

  // Delete event
  async function handleDelete(id: string) {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    await supabase.from("events").delete().eq("id", id);
  }

  function resetModal() {
    setNewTitle("");
    setNewType("Event");
    setNewVisibility("both");
    setNewDate(dateKey(selectedDate));
    setNewTime("");
    setNewNotes("");
    setSaveError("");
  }

  function openModal() {
    resetModal();
    setNewDate(dateKey(selectedDate));
    setShowModal(true);
  }

  return (
    <div>

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
          onClick={openModal}
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

        {/* Month navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setViewDate(subMonths(viewDate, 1))}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-gray-700">
            {format(viewDate, "MMMM yyyy")}
          </span>
          <button
            onClick={() => setViewDate(addMonths(viewDate, 1))}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
            <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7">
          {Array.from({ length: startDay }).map((_, i) => (
            <div key={`empty-${i}`} className="h-10" />
          ))}

          {Array.from({ length: totalDays }).map((_, i) => {
            const day        = i + 1;
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
                  <span className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white" : "bg-[#4a8c6a]"}`} />
                )}
              </button>
            );
          })}

          {Array.from({ length: trailingCells }).map((_, i) => (
            <div key={`trail-${i}`} className="h-10 flex items-center justify-center text-sm text-gray-300">
              {i + 1}
            </div>
          ))}
        </div>
      </div>

      {/* Selected day events */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          {format(selectedDate, "EEEE, MMMM d, yyyy")}
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-[#4a8c6a] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : selectedEvents.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-400">No events for this day</p>
            <button
              onClick={openModal}
              className="mt-3 text-sm text-[#4a8c6a] hover:underline font-medium"
            >
              + Add an event
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {selectedEvents.map((ev) => (
              <div key={ev.id} className="flex items-start justify-between bg-[#fafaf8] rounded-xl px-4 py-3">
                <div className="flex items-start gap-3">
                  <span className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${typeDotClass(ev.type)}`} />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{ev.title}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typePillClass(ev.type)}`}>
                        {ev.type}
                      </span>
                      {ev.time && (
                        <span className="text-xs text-gray-400">{formatTime(ev.time)}</span>
                      )}
                      <span className={`text-xs text-gray-400`}>
                        {ev.visibility === "both" ? "👥 Both of us" : "🔒 Just me"}
                      </span>
                    </div>
                    {ev.notes && (
                      <p className="text-xs text-gray-400 mt-1">{ev.notes}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(ev.id)}
                  className="text-gray-300 hover:text-red-400 transition-colors ml-4 shrink-0"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Schedule New Event Modal ── */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl">

            {/* Modal header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-800">Schedule New Event</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => { setNewTitle(e.target.value); setSaveError(""); }}
                  placeholder="e.g. Date Night, Doctor's Appointment..."
                  autoFocus
                  className="w-full rounded-xl border border-gray-200 bg-[#fafaf8] px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4a8c6a]/30 focus:border-[#4a8c6a] transition"
                />
              </div>

              {/* Type + Visibility */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as EventType)}
                    className="w-full rounded-xl border border-gray-200 bg-[#fafaf8] px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#4a8c6a]/30 focus:border-[#4a8c6a] transition"
                  >
                    {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Visibility</label>
                  <select
                    value={newVisibility}
                    onChange={(e) => setNewVisibility(e.target.value as Visibility)}
                    className="w-full rounded-xl border border-gray-200 bg-[#fafaf8] px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#4a8c6a]/30 focus:border-[#4a8c6a] transition"
                  >
                    <option value="both">Both of us</option>
                    <option value="just_me">Just me</option>
                  </select>
                </div>
              </div>

              {/* Date + Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-[#fafaf8] px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#4a8c6a]/30 focus:border-[#4a8c6a] transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time (optional)</label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-[#fafaf8] px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#4a8c6a]/30 focus:border-[#4a8c6a] transition"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes (optional)</label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Add any details..."
                  rows={3}
                  className="w-full rounded-xl border border-gray-200 bg-[#fafaf8] px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4a8c6a]/30 focus:border-[#4a8c6a] transition resize-none"
                />
              </div>
            </div>

            {saveError && (
              <p className="text-xs text-red-500 mt-3">{saveError}</p>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                disabled={saving}
                className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 rounded-xl bg-[#4a8c6a] py-3 text-sm font-medium text-white transition-colors hover:bg-[#3d7a5b] disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : "Schedule Event"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
