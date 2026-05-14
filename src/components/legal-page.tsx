import { APP_NAME, LEGAL_DOCUMENT_PLACEHOLDER_NOTE } from "@/lib/constants";

interface LegalPageProps {
  title: string;
  version: string;
  children: React.ReactNode;
}

export function LegalPage({ title, version, children }: LegalPageProps) {
  return (
    <div className="container max-w-3xl py-12">
      <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 px-4 py-3 text-sm text-yellow-200">
        <strong className="font-semibold">Placeholder document.</strong>{" "}
        {LEGAL_DOCUMENT_PLACEHOLDER_NOTE}
      </div>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-1 text-xs text-muted-foreground">
        {APP_NAME} · Version {version} · This page is informational only.
      </p>
      <div className="prose prose-invert mt-6 max-w-none text-sm text-foreground/90">
        {children}
      </div>
    </div>
  );
}
