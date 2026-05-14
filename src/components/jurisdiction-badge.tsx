import { Badge } from "@/components/ui/badge";
import type { JurisdictionStatus, EligibilityStatus } from "@/lib/types";

const labels: Record<JurisdictionStatus | EligibilityStatus, string> = {
  open: "Open",
  restricted: "Restricted",
  waitlist: "Waitlist",
  blocked: "Blocked",
  eligible: "Eligible",
  waitlisted: "Waitlisted",
};

const variants: Record<
  JurisdictionStatus | EligibilityStatus,
  "success" | "warning" | "danger" | "info" | "default"
> = {
  open: "success",
  eligible: "success",
  restricted: "warning",
  waitlist: "info",
  waitlisted: "info",
  blocked: "danger",
};

export function JurisdictionBadge({
  status,
}: {
  status: JurisdictionStatus | EligibilityStatus;
}) {
  return <Badge variant={variants[status]}>{labels[status]}</Badge>;
}
