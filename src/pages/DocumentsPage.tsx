// No sidebar or outer wrapper here — Layout.tsx provides it
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Bill } from "../types/Bill";

// Types
type Category = "Housing" | "Utilities" | "Insurance" | "Health" | "Other";

type Doc = {
  id: string;
  name: string;
  size: number;
  category: Category;
  uploadedAt: Date;
  fileType: string;
  url: string;
  storagePath: string;
};

// What Claude extracts from the document
type ExtractedBill = {
  name: string;
  amount: number;
  dueDate: string;   // "YYYY-MM-DD"
  category: Category;
};

type Props = {
  setBills: React.Dispatch<React.SetStateAction<Bill[]>>;
};

const CATEGORIES: Category[] = ["Housing", "Utilities", "Insurance", "Health", "Other"];
const ACCEPTED_EXTENSIONS = ".pdf,.png,.jpg,.jpeg,.heic,.heif,.doc,.docx";
const ACCEPTED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/heic",
  "image/heif",
  "application/doc",
  "application/docx",
];
const BUCKET = "documents";

// Helpers
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
  if (file.type.includes("doc")) return "doc";
  return file.name.split(".").pop()?.toLowerCase() ?? "file";
}

// Convert file to base64 string for Claude API
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

// Claude API extraction
async function extractBillInfo(file: File): Promise<ExtractedBill> {
  const base64 = await fileToBase64(file);

  // Determine the correct media type for Claude
  let mediaType = file.type;
  if (!mediaType || mediaType === "application/octet-stream") {
    mediaType = "application/pdf";
  }

  const isPdf  = mediaType === "application/pdf";
  const isImage = mediaType.startsWith("image/");

  // Build the content block — Claude handles PDFs as "document", images as "image"
  const fileContent = isPdf
    ? {
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data: base64 },
      }
    : isImage
    ? {
        type: "image",
        source: { type: "base64", media_type: mediaType, data: base64 },
      }
    : null;

  if (!fileContent) throw new Error("Unsupported file type for extraction.");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY as string,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: [
            fileContent,
            {
              type: "text",
              text: `You are a bill extraction assistant. Analyze this document and extract the billing information.

Return ONLY a valid JSON object with exactly these fields, nothing else — no explanation, no markdown, no backticks:

{
  "name": "short bill name e.g. Electricity Bill",
  "amount": 123.45,
  "dueDate": "YYYY-MM-DD",
  "category": "one of: Housing, Utilities, Insurance, Health, Other"
}

Rules:
- amount must be a number (no currency symbols)
- dueDate must be in YYYY-MM-DD format — if only a day is shown (e.g. "due 20th"), use the current month and year
- if a field cannot be found, use: name="Unknown Bill", amount=0, dueDate="${new Date().toISOString().split("T")[0]}", category="Other"`,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err?.error?.message ?? "Claude API request failed.");
  }

  const data = await response.json();
  const text = data.content
    .filter((b: { type: string }) => b.type === "text")
    .map((b: { text: string }) => b.text)
    .join("");

  // Strip any accidental markdown backticks Claude might add
  const clean = text.replace(/```json|```/g, "").trim();
  const parsed: ExtractedBill = JSON.parse(clean);
  return parsed;
}

// Sub-components
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

//  Component
export default function DocumentsPage({ setBills }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [docs,            setDocs]            = useState<Doc[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [uploading,       setUploading]       = useState(false);
  const [extracting,      setExtracting]      = useState(false);
  const [error,           setError]           = useState("");
  const [search,          setSearch]          = useState("");
  const [categoryFilter,  setCategoryFilter]  = useState<Category | "All">("All");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showConfirmModal,setShowConfirmModal]= useState(false);
  const [dragOver,        setDragOver]        = useState(false);
  const [pendingFile,     setPendingFile]     = useState<File | null>(null);
  const [uploadError,     setUploadError]     = useState("");

  // Extracted + editable bill fields shown in confirmation modal
  const [extractedName,     setExtractedName]     = useState("");
  const [extractedAmount,   setExtractedAmount]   = useState("");
  const [extractedDueDate,  setExtractedDueDate]  = useState("");
  const [extractedCategory, setExtractedCategory] = useState<Category>("Other");

  // Load documents from Supabase
  useEffect(() => {
    async function fetchDocs() {
      setLoading(true);
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .order("uploaded_at", { ascending: false });

      if (error) {
        setError(`Failed to load documents: ${error.message}`);
        setLoading(false);
        return;
      }

      const mapped: Doc[] = (data ?? []).map((row) => ({
        id:          row.id,
        name:        row.name,
        size:        row.size,
        category:    row.category as Category,
        uploadedAt:  new Date(row.uploaded_at),
        fileType:    row.file_type,
        url:         row.url,
        storagePath: row.storage_path,
      }));

      setDocs(mapped);
      setLoading(false);
    }
    fetchDocs();
  }, []);

  //  Derived stats
  const totalSize      = useMemo(() => docs.reduce((sum, d) => sum + d.size, 0), [docs]);
  const monthsCovered  = useMemo(() => new Set(docs.map((d) => getMonthKey(d.uploadedAt))).size, [docs]);
  const categoriesUsed = useMemo(() => new Set(docs.map((d) => d.category)).size, [docs]);

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

  // File validation
  function validateFile(file: File): string {
    const isAccepted =
      ACCEPTED_TYPES.includes(file.type) ||
      /\.(pdf|png|jpe?g|heic|heif|docx?)$/i.test(file.name);
    if (!isAccepted) return "Only PDF, PNG, JPG, HEIC and DOC files are supported.";
    if (file.size > 10 * 1024 * 1024) return "File must be under 10 MB.";
    return "";
  }

  // Drag & drop
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const err = validateFile(file);
    if (err) { setUploadError(err); return; }
    setPendingFile(file);
    setUploadError("");
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateFile(file);
    if (err) { setUploadError(err); return; }
    setPendingFile(file);
    setUploadError("");
  }

  // Step 1: Extract info with Claude, then show confirmation modal
  async function handleExtract() {
    if (!pendingFile) { setUploadError("Please select a file."); return; }

    setExtracting(true);
    setUploadError("");

    try {
      const extracted = await extractBillInfo(pendingFile);

      // Pre-fill the confirmation form with extracted values
      setExtractedName(extracted.name);
      setExtractedAmount(String(extracted.amount));
      setExtractedDueDate(extracted.dueDate);
      setExtractedCategory(extracted.category);

      // Close upload modal, open confirmation modal
      setShowUploadModal(false);
      setShowConfirmModal(true);
    } catch (err: unknown) {
      setUploadError(
        err instanceof Error
          ? `Extraction failed: ${err.message}`
          : "Could not extract bill info. You can fill it in manually."
      );
    } finally {
      setExtracting(false);
    }
  }

  // Step 2: Save to Supabase + add to bills
  async function handleConfirmAndSave() {
    if (!pendingFile) return;

    setUploading(true);

    try {
      // 1. Upload file to Supabase Storage
      const storagePath = `${Date.now()}-${pendingFile.name.replace(/\s+/g, "_")}`;

      const { error: storageError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, pendingFile, { upsert: false });

      if (storageError) throw new Error(storageError.message);

      // 2. Get permanent public URL
      const { data: urlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(storagePath);

      const publicUrl = urlData.publicUrl;

      // 3. Save document metadata to Supabase table
      const { data: inserted, error: dbError } = await supabase
        .from("documents")
        .insert({
          name:         pendingFile.name,
          size:         pendingFile.size,
          category:     extractedCategory,
          file_type:    getFileType(pendingFile),
          storage_path: storagePath,
          url:          publicUrl,
        })
        .select()
        .single();

      if (dbError) throw new Error(dbError.message);

      // 4. Add document to local state
      const newDoc: Doc = {
        id:          inserted.id,
        name:        inserted.name,
        size:        inserted.size,
        category:    inserted.category as Category,
        uploadedAt:  new Date(inserted.uploaded_at),
        fileType:    inserted.file_type,
        url:         inserted.url,
        storagePath: inserted.storage_path,
      };
      setDocs((prev) => [newDoc, ...prev]);

      // 5. Add bill to shared bills state → shows on Payments + Dashboard
      const newBill: Bill = {
        id:       crypto.randomUUID(),
        name:     extractedName,
        amount:   parseFloat(extractedAmount) || 0,
        paid:     false,
        dueDate:  extractedDueDate,
        category: extractedCategory,
      };
      setBills((prev) => [newBill, ...prev]);

      // 6. Reset everything
      setPendingFile(null);
      setExtractedName("");
      setExtractedAmount("");
      setExtractedDueDate("");
      setExtractedCategory("Other");
      setShowConfirmModal(false);
      if (fileInputRef.current) fileInputRef.current.value = "";

    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Save failed. Please try again.");
      setShowConfirmModal(false);
      setShowUploadModal(true);
    } finally {
      setUploading(false);
    }
  }

  // Delete
  async function handleDelete(doc: Doc) {
    await supabase.storage.from(BUCKET).remove([doc.storagePath]);
    await supabase.from("documents").delete().eq("id", doc.id);
    setDocs((prev) => prev.filter((d) => d.id !== doc.id));
  }

  function openModal() {
    setPendingFile(null);
    setUploadError("");
    setShowUploadModal(true);
  }

//

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

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

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
          { label: "Total Documents", value: loading ? "—" : String(docs.length)    },
          { label: "Months Covered",  value: loading ? "—" : String(monthsCovered)  },
          { label: "Categories",      value: loading ? "—" : String(categoriesUsed) },
          { label: "Total Size",      value: loading ? "—" : formatBytes(totalSize) },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
            <p className="text-2xl font-bold text-[#4a8c6a]">{stat.value}</p>
            <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Document list */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="w-6 h-6 border-2 border-[#4a8c6a] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">Loading documents...</p>
        </div>
      ) : groupedDocs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-gray-400 text-sm">No documents found.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {groupedDocs.map(([monthKey, monthDocs]) => (
            <div key={monthKey} className="bg-white rounded-2xl border border-gray-100 p-6">
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

              <div className="grid grid-cols-2 gap-3">
                {monthDocs.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-3 bg-[#fafaf8] rounded-xl px-4 py-3">
                    <FileIcon type={doc.fileType} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">{doc.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatBytes(doc.size)} · {doc.category}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <a
                        href={`${doc.url}?download`}
                        download={doc.name}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Download file"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-50 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </a>
                      <button
                        onClick={() => handleDelete(doc)}
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

      {/* ── Upload Modal ── */}
      {showUploadModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowUploadModal(false); }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Upload Document</h2>
                <p className="text-sm text-gray-400 mt-0.5">
                  Claude will automatically extract bill information
                </p>
              </div>
              <button onClick={() => setShowUploadModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
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
                  <p className="text-xs">PDF, PNG, JPG, HEIC up to 10 MB</p>
                </div>
              )}
            </div>

            {uploadError && <p className="text-xs text-red-500 mb-4">{uploadError}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => setShowUploadModal(false)}
                disabled={extracting}
                className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleExtract}
                disabled={!pendingFile || extracting}
                className="flex-1 rounded-xl bg-[#4a8c6a] py-3 text-sm font-medium text-white transition-colors hover:bg-[#3d7a5b] disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {extracting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Analysing...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Extract & Continue
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirmation Modal — review/edit extracted data ── */}
      {showConfirmModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowConfirmModal(false); }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-gray-800">Review Extracted Info</h2>
              <button onClick={() => { setShowConfirmModal(false); setShowUploadModal(true); }} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-400 mb-6">
              Claude extracted this from your document. Edit anything that looks wrong before saving.
            </p>

            <div className="space-y-4">
              {/* Bill name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bill name</label>
                <input
                  type="text"
                  value={extractedName}
                  onChange={(e) => setExtractedName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-[#fafaf8] px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#4a8c6a]/30 focus:border-[#4a8c6a] transition"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount (ZAR)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={extractedAmount}
                  onChange={(e) => setExtractedAmount(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-[#fafaf8] px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#4a8c6a]/30 focus:border-[#4a8c6a] transition"
                />
              </div>

              {/* Due date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Due date</label>
                <input
                  type="date"
                  value={extractedDueDate}
                  onChange={(e) => setExtractedDueDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-[#fafaf8] px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#4a8c6a]/30 focus:border-[#4a8c6a] transition"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={extractedCategory}
                  onChange={(e) => setExtractedCategory(e.target.value as Category)}
                  className="w-full rounded-xl border border-gray-200 bg-[#fafaf8] px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#4a8c6a]/30 focus:border-[#4a8c6a] transition"
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Info note */}
            <div className="flex items-start gap-2 bg-[#e8f0eb] rounded-xl px-4 py-3 mt-5">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-[#4a8c6a] mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-[#4a8c6a]">
                Confirming will save this file to Documents and add the bill to your Payments page automatically.
              </p>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowConfirmModal(false); setShowUploadModal(true); }}
                disabled={uploading}
                className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={handleConfirmAndSave}
                disabled={uploading}
                className="flex-1 rounded-xl bg-[#4a8c6a] py-3 text-sm font-medium text-white transition-colors hover:bg-[#3d7a5b] disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Confirm & Save"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
