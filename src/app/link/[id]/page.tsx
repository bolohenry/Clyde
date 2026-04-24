import { Metadata } from "next";
import Link from "next/link";

interface LinkPayload {
  text?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
}

interface Props {
  params: Promise<{ id: string }>;
}

async function getPayload(id: string): Promise<LinkPayload | null> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  try {
    const res = await fetch(`${baseUrl}/api/link?id=${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const payload = await getPayload(id);
  const description = payload?.text
    ? payload.text.slice(0, 120) + (payload.text.length > 120 ? "…" : "")
    : "Open to chat about this with Clyde.";
  return {
    title: "Let me ask Clyde",
    description,
  };
}

export default async function LinkPreviewPage({ params }: Props) {
  const { id } = await params;
  const payload = await getPayload(id);

  if (!payload) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf9] px-4">
        <div className="text-center">
          <p className="text-3xl mb-3">😕</p>
          <h1 className="text-lg font-semibold text-[#1c1917] mb-1">Link not found</h1>
          <p className="text-sm text-[#78716c] mb-5">
            This link may have expired (links last 30 days) or never existed.
          </p>
          <Link href="/" className="text-sm text-[#0c87f0] hover:underline underline-offset-2">
            Try Clyde yourself →
          </Link>
        </div>
      </div>
    );
  }

  const hasFile = !!payload.fileUrl;
  const isImage = payload.fileType?.startsWith("image/");
  const isDocx = payload.fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    || payload.fileName?.toLowerCase().endsWith(".docx");

  return (
    <div className="min-h-screen bg-[#fafaf9] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mb-10 w-fit group">
          <div className="w-8 h-8 rounded-full bg-[#0c87f0] flex items-center justify-center
            group-hover:bg-[#0a75d1] transition-colors">
            <span className="text-white text-sm font-bold">C</span>
          </div>
          <span className="text-sm font-semibold text-[#1c1917]">Clyde</span>
        </Link>

        <h1 className="text-2xl font-semibold text-[#1c1917] mb-1">
          Someone wants Clyde&apos;s help with this
        </h1>
        <p className="text-[#78716c] text-sm mb-6 leading-relaxed">
          Here&apos;s what they shared. Open to start the conversation.
        </p>

        {/* Context preview card */}
        <div className="rounded-xl border border-[#e7e5e4] bg-white p-4 mb-4 shadow-sm">
          {payload.text && (
            <p className="text-[15px] text-[#1c1917] leading-relaxed">
              {payload.text.length > 400
                ? payload.text.slice(0, 400) + "…"
                : payload.text}
            </p>
          )}

          {hasFile && (
            <div className={`flex items-center gap-2.5 ${payload.text ? "mt-3 pt-3 border-t border-[#f5f5f4]" : ""}`}>
              {isImage ? (
                <div className="w-8 h-8 rounded-lg bg-[#e0efff] flex items-center justify-center flex-shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0c87f0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                </div>
              ) : isDocx ? (
                <div className="w-8 h-8 rounded-lg bg-[#e8f0fe] flex items-center justify-center flex-shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1a73e8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <line x1="12" y1="9" x2="8" y2="9"/>
                  </svg>
                </div>
              ) : (
                <div className="w-8 h-8 rounded-lg bg-[#f5f5f4] flex items-center justify-center flex-shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#78716c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                </div>
              )}
              <span className="text-[13px] text-[#78716c] truncate">{payload.fileName}</span>
            </div>
          )}
        </div>

        {/* CTA */}
        <Link
          href={`/?link=${id}`}
          className="block w-full py-3 rounded-xl bg-[#0c87f0] text-white
            font-semibold text-[15px] text-center
            hover:bg-[#0a75d1] active:scale-[0.98]
            transition-all duration-150"
        >
          Open with Clyde
        </Link>

        <p className="mt-4 text-center text-[12px] text-[#a8a29e]">
          Free to use · No account needed
        </p>
      </div>
    </div>
  );
}
