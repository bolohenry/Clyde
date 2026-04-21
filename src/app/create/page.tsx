"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";

const MAX_CHARS = 1500;
const MAX_FILE_MB = 8;
const ACCEPTED = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf", "text/plain"];

type AttachedFile = {
  file: File;
  previewUrl: string | null; // object URL for images, null for docs
};

type PageState = "compose" | "uploading" | "done" | "error";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
  );
}

export default function CreatePage() {
  const [text, setText] = useState("");
  const [attached, setAttached] = useState<AttachedFile | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [pageState, setPageState] = useState<PageState>("compose");
  const [link, setLink] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const remaining = MAX_CHARS - text.length;
  const overLimit = remaining < 0;
  const canSubmit = (text.trim() || attached) && !overLimit;

  // ── File attachment helpers ─────────────────────────────────────────────────

  const attachFile = useCallback((file: File) => {
    if (!ACCEPTED.includes(file.type)) {
      setErrorMsg("Unsupported file type. Use images (JPG, PNG, GIF, WebP), PDFs, or plain text.");
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setErrorMsg(`File too large. Max ${MAX_FILE_MB} MB.`);
      return;
    }
    setErrorMsg(null);
    const isImage = file.type.startsWith("image/");
    const previewUrl = isImage ? URL.createObjectURL(file) : null;
    // Revoke any existing preview
    setAttached((prev) => {
      if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl);
      return { file, previewUrl };
    });
  }, []);

  const removeAttachment = useCallback(() => {
    setAttached((prev) => {
      if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl);
      return null;
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) attachFile(file);
  }, [attachFile]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) attachFile(file);
  }, [attachFile]);

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!canSubmit) return;

    // Fast path: text-only, no server round-trip needed
    if (!attached) {
      const encoded = encodeURIComponent(text.trim());
      setLink(`${window.location.origin}/?ask=${encoded}`);
      setCopied(false);
      setPageState("done");
      return;
    }

    // Slow path: upload file → store link payload
    setPageState("uploading");
    setErrorMsg(null);

    try {
      // 1. Upload file
      const form = new FormData();
      form.append("file", attached.file);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: form });
      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({}));
        throw new Error(err.error || "Upload failed");
      }
      const { url: fileUrl, fileName } = await uploadRes.json();

      // 2. Store link payload
      const linkRes = await fetch("/api/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim(),
          fileUrl,
          fileName,
          fileType: attached.file.type,
        }),
      });
      if (!linkRes.ok) throw new Error("Could not create link");
      const { id } = await linkRes.json();

      setLink(`${window.location.origin}/?link=${id}`);
      setCopied(false);
      setPageState("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
      setPageState("error");
    }
  };

  const handleCopy = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleReset = () => {
    removeAttachment();
    setText("");
    setLink(null);
    setCopied(false);
    setErrorMsg(null);
    setPageState("compose");
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#fafaf9] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">

        {/* Header */}
        <Link href="/" className="flex items-center gap-2 mb-10 group w-fit">
          <div className="w-8 h-8 rounded-full bg-[#0c87f0] flex items-center justify-center
            group-hover:bg-[#0a75d1] transition-colors">
            <span className="text-white text-sm font-bold">C</span>
          </div>
          <span className="text-sm font-semibold text-[#1c1917]">Clyde</span>
        </Link>

        {pageState !== "done" ? (
          <>
            <h1 className="text-2xl font-semibold text-[#1c1917] mb-1">
              Send someone to Clyde
            </h1>
            <p className="text-[#78716c] text-sm mb-6 leading-relaxed">
              Paste what they said — or attach a screenshot or file. You&apos;ll get a link.
              When they click it, Clyde opens ready to help.
            </p>

            {/* Textarea */}
            <div className="relative">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste what they said..."
                rows={5}
                className="w-full resize-none rounded-xl border border-[#e7e5e4]
                  bg-white px-4 py-3.5 text-[15px] text-[#1c1917]
                  placeholder-[#a8a29e] outline-none leading-relaxed
                  focus:border-[#0c87f0] focus:ring-2 focus:ring-[#0c87f0]/10
                  transition-all duration-150"
              />
              <span className={`absolute bottom-3 right-3 text-[11px] tabular-nums
                ${overLimit ? "text-red-500" : "text-[#a8a29e]"}`}>
                {remaining}
              </span>
            </div>

            {/* File attachment area */}
            {attached ? (
              /* Attachment preview */
              <div className="mt-2 flex items-center gap-3 p-3 rounded-xl border border-[#e7e5e4] bg-white">
                {attached.previewUrl ? (
                  /* Image preview */
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={attached.previewUrl}
                    alt="Attachment preview"
                    className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border border-[#e7e5e4]"
                  />
                ) : (
                  /* Doc icon */
                  <div className="w-14 h-14 rounded-lg bg-[#f5f5f4] flex items-center justify-center flex-shrink-0 text-[#78716c]">
                    <FileIcon />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-[#1c1917] truncate">{attached.file.name}</p>
                  <p className="text-[11px] text-[#a8a29e] mt-0.5">{formatBytes(attached.file.size)}</p>
                </div>
                <button
                  onClick={removeAttachment}
                  aria-label="Remove attachment"
                  className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center
                    text-[#a8a29e] hover:text-[#1c1917] hover:bg-[#f5f5f4] transition-colors"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            ) : (
              /* Drop zone */
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
                aria-label="Attach an image or file"
                className={`mt-2 flex items-center justify-center gap-2 p-3.5 rounded-xl
                  border-2 border-dashed cursor-pointer select-none transition-all duration-150
                  text-[13px] text-[#a8a29e] hover:text-[#78716c]
                  ${isDragging
                    ? "border-[#0c87f0] bg-[#0c87f0]/5 text-[#0c87f0]"
                    : "border-[#e7e5e4] bg-white hover:border-[#c7c4c0]"
                  }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                Add an image or file
                <span className="text-[11px] text-[#c7c4c0]">· up to {MAX_FILE_MB} MB</span>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED.join(",")}
              onChange={onFileChange}
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
            />

            {/* Error */}
            {errorMsg && (
              <p className="mt-2.5 text-[13px] text-red-600 leading-snug">{errorMsg}</p>
            )}

            <button
              onClick={handleCreate}
              disabled={!canSubmit || pageState === "uploading"}
              className="mt-3 w-full py-3 rounded-xl bg-[#0c87f0] text-white
                font-semibold text-[15px] hover:bg-[#0a75d1] active:scale-[0.98]
                disabled:opacity-30 disabled:cursor-not-allowed
                transition-all duration-150 flex items-center justify-center gap-2"
            >
              {pageState === "uploading" ? (
                <>
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                  </svg>
                  Uploading…
                </>
              ) : "Create link"}
            </button>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold text-[#1c1917] mb-1">Link ready</h1>
            <p className="text-[#78716c] text-sm mb-6 leading-relaxed">
              Send this to them. When they click it, Clyde opens{attached ? " with their message and file" : " with their message"} already loaded.
            </p>

            {/* Link box */}
            <div className="rounded-xl border border-[#e7e5e4] bg-white p-4 mb-3">
              <p className="text-[13px] text-[#78716c] break-all leading-relaxed select-all">
                {link}
              </p>
            </div>

            <button
              onClick={handleCopy}
              className={`w-full py-3 rounded-xl font-semibold text-[15px]
                active:scale-[0.98] transition-all duration-150
                ${copied
                  ? "bg-green-500 text-white"
                  : "bg-[#0c87f0] text-white hover:bg-[#0a75d1]"
                }`}
            >
              {copied ? "✓ Copied" : "Copy link"}
            </button>

            <button
              onClick={handleReset}
              className="mt-3 w-full py-2.5 rounded-xl text-[14px] font-medium
                text-[#78716c] hover:text-[#1c1917] transition-colors duration-150"
            >
              Make another
            </button>
          </>
        )}

        {/* Footer */}
        <p className="mt-10 text-center text-[12px] text-[#a8a29e]">
          Links are instant — no account needed.{" "}
          <Link href="/" className="text-[#0c87f0] hover:underline underline-offset-2">
            Try Clyde yourself →
          </Link>
        </p>
      </div>
    </div>
  );
}
