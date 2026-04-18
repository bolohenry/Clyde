import { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

async function getSharedContent(id: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  try {
    const res = await fetch(`${baseUrl}/api/share?id=${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const data = await getSharedContent(id);
  return {
    title: data?.content?.title ? `${data.content.title} | Clyde` : "Shared from Clyde",
    description: "View this AI-generated output from Clyde",
  };
}

export default async function SharePage({ params }: Props) {
  const { id } = await params;
  const data = await getSharedContent(id);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 px-4">
        <div className="text-center">
          <p className="text-2xl mb-2">😕</p>
          <h1 className="text-lg font-semibold text-surface-800 mb-1">Link not found</h1>
          <p className="text-sm text-surface-500">This link may have expired (links last 7 days) or never existed.</p>
          <a href="/" className="mt-4 inline-block text-sm text-clyde-500 hover:text-clyde-700 underline underline-offset-2">
            Try Clyde →
          </a>
        </div>
      </div>
    );
  }

  const { content } = data;

  return (
    <div className="min-h-screen bg-surface-50 px-4 py-12">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-7 h-7 rounded-full bg-clyde-500 flex items-center justify-center">
            <span className="text-white text-xs font-bold">C</span>
          </div>
          <span className="text-sm font-semibold text-surface-700">Made with Clyde</span>
        </div>

        {/* Content card */}
        <div className="rounded-2xl border border-surface-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-surface-50 border-b border-surface-100">
            <h1 className="text-base font-semibold text-surface-800">{content.title}</h1>
          </div>
          <div className="px-5 py-4 space-y-2.5">
            {content.items.map((item: { id: string; text: string; subItems?: string[]; checked?: boolean }, i: number) => (
              <div key={item.id} className="space-y-1">
                {content.type === "checklist" && (
                  <div className="flex items-start gap-2.5">
                    <span className="mt-0.5 w-4 h-4 rounded border border-surface-300 flex-shrink-0"/>
                    <span className="text-sm text-surface-700">{item.text}</span>
                  </div>
                )}
                {(content.type === "plan" || content.type === "breakdown") && (
                  <div className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-clyde-100 text-clyde-600 text-[10px] font-semibold flex items-center justify-center mt-0.5">{i + 1}</span>
                    <div>
                      <p className="text-sm font-medium text-surface-800">{item.text}</p>
                      {item.subItems?.map((sub: string, j: number) => (
                        <p key={j} className="text-xs text-surface-500 mt-0.5 ml-0.5">• {sub}</p>
                      ))}
                    </div>
                  </div>
                )}
                {content.type === "comparison" && (
                  <div className="p-3 rounded-lg bg-surface-50 border border-surface-100">
                    <p className="text-sm font-semibold text-surface-800 mb-1">{item.text}</p>
                    {item.subItems?.map((sub: string, j: number) => (
                      <p key={j} className={`text-xs ${sub.toLowerCase().startsWith("pro:") ? "text-green-700" : sub.toLowerCase().startsWith("con:") ? "text-red-600" : "text-surface-600"}`}>
                        {sub.toLowerCase().startsWith("pro:") ? "✓ " : sub.toLowerCase().startsWith("con:") ? "✗ " : "· "}{sub}
                      </p>
                    ))}
                  </div>
                )}
                {content.type === "draft" && (
                  <p className="text-sm text-surface-700 whitespace-pre-line leading-relaxed">{item.text}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-surface-400 mt-6">
          Generated with{" "}
          <a href="/" className="text-clyde-500 hover:text-clyde-700">Clyde</a>
          {" "}· Links expire after 7 days
        </p>
      </div>
    </div>
  );
}
