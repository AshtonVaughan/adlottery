import { AlertTriangle } from "lucide-react";
import { APP_NAME, LEGAL_DOCUMENT_PLACEHOLDER_NOTE } from "@/lib/constants";

interface LegalPageProps {
  title: string;
  version: string;
  lastUpdated?: string;
  children: React.ReactNode;
}

export function LegalPage({
  title,
  version,
  lastUpdated = "2026-05-14",
  children,
}: LegalPageProps) {
  return (
    <div className="container max-w-3xl py-12">
      <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/[0.06] px-4 py-3 text-sm text-amber-100">
        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-300" />
        <p>
          <strong className="font-semibold">Draft placeholder. </strong>
          {LEGAL_DOCUMENT_PLACEHOLDER_NOTE}
        </p>
      </div>
      <header className="mt-8 space-y-2">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
          {APP_NAME} · {title}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          {title}
        </h1>
        <p className="text-xs text-muted-foreground">
          Version {version} · Last updated {lastUpdated}
        </p>
      </header>
      <article
        className="
          mt-8 space-y-4 text-sm leading-relaxed text-foreground/85
          [&_h2]:mt-8 [&_h2]:scroll-mt-20 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-foreground
          [&_h3]:mt-6 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:tracking-tight [&_h3]:text-foreground
          [&_p]:leading-relaxed
          [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 [&_ul]:text-foreground/85
          [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5 [&_ol]:text-foreground/85
          [&_code]:rounded [&_code]:bg-white/[0.05] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-xs [&_code]:text-foreground
        "
      >
        {children}
      </article>
    </div>
  );
}
