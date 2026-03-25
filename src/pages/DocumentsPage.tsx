// No sidebar or outer wrapper here — Layout.tsx provides it
import { useEffect, useMemo, useRef, useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────
type Category = "Housing" | "Utilities" | "Insurance" | "Health" | "Other";

type Doc = {
  id: string;
  name: string;
  size: number;
  category: Category;
  uploadedAt: Date;
  fileType: string;
  url: string; // empty string after refresh — object URLs don't survive
};

// What actually gets saved to localStorage (dates as strings, no urls)
type StoredDoc = Omit<Doc, "uploadedAt"> & { uploadedAt: string };

const CATEGORIES: Category[] = ["Housing", "Utilities", "Insurance", "Health", "Other"];

const ACCEPTED_EXTENSIONS = ".pdf,.png,.jpg,.jpeg,.heic,.heif";
const ACCEPTED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/heic",
  "image/heif",
];

const SAMPLE_DOCS: Doc[] = [
  { id: "1", name: "Electricity_Bill_Dec2024.pdf", size: 245 * 1024, category: "Utilities", uploadedAt: new Date("2024-12-20"), fileType: "pdf", url: "" },
  { id: "2", name: "Rent_Receipt_Dec2024.pdf",     size: 128 * 1024, category: "Housing",   uploadedAt: new Date("2024-12-20"), fileType: "pdf", url: "" },
  { id: "3", name: "Water_Bill_Dec2024.pdf",        size: 156 * 1024, category: "Utilities", uploadedAt: new Date("2024-12-15"), fileType: "pdf", url: "" },
  { id: "4", name: "Internet_Invoice_Nov2024.pdf",  size: 189 * 1024, category: "Utilities", uploadedAt: new Date("2024-11-22"), fileType: "pdf", url: "" },
  { id: "5", name: "Car_Insurance_Nov2024.pdf",     size: 512 * 1024, category: "Insurance", uploadedAt: new Date("2024-11-10"), fileType: "pdf", url: "" },
  { id: "6", name: "Electricity_Bill_Nov2024.pdf",  size: 234 * 1024, category: "Utilities", uploadedAt: new Date("2024-11-20"), fileType: "pdf", url: "" },
];

// ─── localStorage helpers ─────────────────────────────────────────────────────
const STORAGE_KEY = "our-home-docs";

// Read from localStorage and convert date strings back to Date objects
function loadFromStorage(): Doc[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return SAMPLE_DOCS; // first visit — use sample data
    const stored: StoredDoc[] = JSON.parse(raw);
    return stored.map((d) => ({
      ...d,
      uploadedAt: new Date(d.uploadedAt), // string → Date
      url: "",  // object URLs don't survive refresh, always reset to ""
    }));
  } catch {
    return SAMPLE_DOCS; // if localStorage is corrupted, fall back to samples
  }
}

// Save to localStorage — strip urls since they don't survive refresh
function saveToStorage(docs: Doc[]) {
  const toStore: StoredDoc[] = docs.map((d) => ({
    ...d,
    url: "",                              // never save object URLs
    uploadedAt: d.uploadedAt.toISOString(), // Date → string for JSON
  }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
}

// ─── Other helpers ────────────────────────────────────────────────────────────
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString("en-ZA", { month: "long", year: "numeric" });
}

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getFileType(file: File): string {
  if (file.type === "application/pdf") return "pdf";
  if (file.type.includes("png")) return "png";
  if (file.type.includes("jpeg") || file.type.includes("jpg")) return "jpg";
  if (file.type.includes("heic") || file.type.includes("heif")) return "heic";
  return file.name.split(".").pop()?.toLowerCase() ?? "file";
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function FileIcon({ type }: { type: string }) {
  const isPdf = type === "pdf";
  return (
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isPdf ? "bg-red-50 text-red-400" : "bg-blue-50 text-blue-400"}`}>
      {isPdf ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )}
    </div>
  );
}

function DownloadButton({ doc }: { doc: Doc }) {
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );

  if (doc.url) {
    return (
      <a
        href={doc.url}
        download={doc.name}
        title="Download file"
        className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-50 transition-colors"
      >
        {icon}
      </a>
    );
  }

  return (
    <span
      title="Re-upload this file to enable download"
      className="p-1.5 rounded-lg text-gray-200 cursor-not-allowed"
    >
      {icon}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function DocumentsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Load from localStorage on first render ────────────────────────────────
  const [docs, setDocs] = useState<Doc[]>(() => loadFromStorage());

  // ── Save to localStorage whenever docs change ─────────────────────────────
  useEffect(() => {
    saveToStorage(docs);
  }, [docs]);

  const [search,          setSearch]          = useState("");
  const [categoryFilter,  setCategoryFilter]  = useState<Category | "All">("All");
  const [showModal,       setShowModal]       = useState(false);
  const [dragOver,        setDragOver]        = useState(false);
  const [pendingFile,     setPendingFile]     = useState<File | null>(null);
  const [pendingCategory, setPendingCategory] = useState<Category | "">("");
  const [uploadError,     setUploadError]     = useState("");

  // ── Derived stats ─────────────────────────────────────────────────────────
  const totalSize      = useMemo(() => docs.reduce((sum, d) => sum + d.size, 0), [docs]);
  const monthsCovered  = useMemo(() => new Set(docs.map((d) => getMonthKey(d.uploadedAt))).size, [docs]);
  const categoriesUsed = useMemo(() => new Set(docs.map((d) => d.category)).size, [docs]);

  // ── Filtered + grouped ────────────────────────────────────────────────────
  const filteredDocs = useMemo(() => {
    return docs.filter((d) => {
      const matchesSearch   = d.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === "All" || d.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [docs, search, categoryFilter]);

  const groupedDocs = useMemo(() => {
    const groups: Record<string, Doc[]> = {};
    filteredDocs.forEach((doc) => {
      const key = getMonthKey(doc.uploadedAt);
      if (!groups[key]) groups[key] = [];
      groups[key].push(doc);
    });
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [filteredDocs]);

  // ── File validation ───────────────────────────────────────────────────────
  function validateFile(file: File): string {
    const isAccepted =
      ACCEPTED_TYPES.includes(file.type) ||
      /\.(pdf|png|jpe?g|heic|heif)$/i.test(file.name);
    if (!isAccepted) return "Only PDF, PNG, JPG, and HEIC files are supported.";
    if (file.size > 10 * 1024 * 1024) return "File must be under 10 MB.";
    return "";
  }

  // ── Drag & drop ───────────────────────────────────────────────────────────
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const error = validateFile(file);
    if (error) { setUploadError(error); return; }
    setPendingFile(file);
    setUploadError("");
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const error = validateFile(file);
    if (error) { setUploadError(error); return; }
    setPendingFile(file);
    setUploadError("");
  }

  // ── Upload ────────────────────────────────────────────────────────────────
  function handleUpload() {
    if (!pendingFile)     { setUploadError("Please select a file."); return; }
    if (!pendingCategory) { setUploadError("Please select a category."); return; }

    const url = URL.createObjectURL(pendingFile);

    const newDoc: Doc = {
      id:         crypto.randomUUID(),
      name:       pendingFile.name,
      size:       pendingFile.size,
      category:   pendingCategory as Category,
      uploadedAt: new Date(),
      fileType:   getFileType(pendingFile),
      url, // available this session — cleared on refresh via loadFromStorage
    };

    setDocs((prev) => [newDoc, ...prev]);
    setPendingFile(null);
    setPendingCategory("");
    setUploadError("");
    setShowModal(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleDelete(id: string) {
    const doc = docs.find((d) => d.id === id);
    if (doc?.url) URL.revokeObjectURL(doc.url); // free memory
    setDocs((prev) => prev.filter((d) => d.id !== id));
    // useEffect above will automatically save the updated list to localStorage
  }

  function openModal() {
    setPendingFile(null);
    setPendingCategory("");
    setUploadError("");
    setShowModal(true);
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div>

      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Documents</h1>
          <p className="mt-1 text-sm text-gray-400">Store and organize your payment receipts</p>
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-2 rounded-xl bg-[#4a8c6a] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#3d7a5b]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Upload
        </button>
      </div>

      {/* Search + filter */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents..."
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4a8c6a]/30 focus:border-[#4a8c6a] transition"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as Category | "All")}
          className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#4a8c6a]/30 focus:border-[#4a8c6a] transition min-w-35"
        >
          <option value="All">All</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Documents", value: String(docs.length)    },
          { label: "Months Covered",  value: String(monthsCovered)  },
          { label: "Categories",      value: String(categoriesUsed) },
          { label: "Total Size",      value: formatBytes(totalSize) },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
            <p className="text-2xl font-bold text-[#4a8c6a]">{stat.value}</p>
            <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>


      {/* Document list */}
      {groupedDocs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-gray-400 text-sm">No documents found.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {groupedDocs.map(([monthKey, monthDocs]) => (
            <div key={monthKey} className="bg-white rounded-2xl border border-gray-100 p-6">

              {/* Month header */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[#4a8c6a]">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </span>
                <h2 className="text-lg font-bold text-gray-800">
                  {formatMonthYear(monthDocs[0].uploadedAt)}
                </h2>
                <span className="text-sm text-gray-400">
                  ({monthDocs.length} {monthDocs.length === 1 ? "file" : "files"})
                </span>
              </div>

              {/* Files grid */}
              <div className="grid grid-cols-2 gap-3">
                {monthDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 bg-[#fafaf8] rounded-xl px-4 py-3"
                  >
                    <FileIcon type={doc.fileType} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">{doc.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatBytes(doc.size)} · {doc.category}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <DownloadButton doc={doc} />
                      <button
                        onClick={() => handleDelete(doc.id)}
                        title="Delete document"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-50 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Upload Document</h2>
                <p className="text-sm text-gray-400 mt-0.5">PDF, PNG, JPG or HEIC — max 10 MB</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Drop zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors mb-4 ${
                dragOver
                  ? "border-[#4a8c6a] bg-[#e8f0eb]"
                  : pendingFile
                  ? "border-[#4a8c6a] bg-[#f0f8f4]"
                  : "border-gray-200 hover:border-[#4a8c6a] hover:bg-[#fafaf8]"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_EXTENSIONS}
                onChange={handleFileInput}
                className="hidden"
              />
              {pendingFile ? (
                <div className="flex flex-col items-center gap-2">
                  <FileIcon type={getFileType(pendingFile)} />
                  <p className="text-sm font-medium text-gray-700">{pendingFile.name}</p>
                  <p className="text-xs text-gray-400">{formatBytes(pendingFile.size)}</p>
                  <p className="text-xs text-[#4a8c6a]">Click to change file</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <p className="text-sm">Drag and drop your file here, or click to browse</p>
                  <p className="text-xs">Supports PDF, PNG, JPG, HEIC up to 10 MB</p>
                </div>
              )}
            </div>

            {uploadError && <p className="text-xs text-red-500 mb-4">{uploadError}</p>}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={pendingCategory}
                onChange={(e) => setPendingCategory(e.target.value as Category)}
                className="w-full rounded-xl border border-gray-200 bg-[#fafaf8] px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#4a8c6a]/30 focus:border-[#4a8c6a] transition"
              >
                <option value="">Select category</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                className="flex-1 rounded-xl bg-[#4a8c6a] py-3 text-sm font-medium text-white transition-colors hover:bg-[#3d7a5b]"
              >
                Upload Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
