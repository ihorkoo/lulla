import type { Citation } from "@/lib/api/types";

export function CitationPill({ c }: { c: Citation }) {
  const Wrapper = c.source_url ? "a" : "span";
  return (
    <Wrapper
      {...(c.source_url
        ? { href: c.source_url, target: "_blank", rel: "noopener noreferrer" }
        : {})}
      className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-0.5 text-[11px] font-medium text-brand-800 transition hover:border-brand-300 hover:bg-brand-100"
      title={c.document_title}
    >
      <span className="max-w-[20ch] truncate">{c.document_title}</span>
    </Wrapper>
  );
}
