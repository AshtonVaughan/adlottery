import { EXCLUDED_COUNTRIES, RULES_VERSION } from "@/lib/config";
import type { Draw, Profile } from "@/lib/types";

export type EntryBlock =
  | "no_draw"
  | "draw_closed"
  | "needs_profile"
  | "excluded_country"
  | "banned";

export const ENTRY_BLOCK_MESSAGES: Record<EntryBlock, string> = {
  no_draw: "There's no open draw right now. Check back soon.",
  draw_closed: "This week's draw has closed. The next one opens Monday 00:00 UTC.",
  needs_profile: "Finish your profile to enter.",
  excluded_country: "Sorry, the draw isn't open to residents of your country.",
  banned: "This account can't enter draws. Contact support if you think this is a mistake.",
};

export function profileComplete(
  profile: Pick<Profile, "display_name" | "country_code" | "confirmed_adult_at" | "accepted_rules_version">,
): boolean {
  return Boolean(
    profile.display_name &&
      profile.country_code &&
      profile.confirmed_adult_at &&
      profile.accepted_rules_version === RULES_VERSION,
  );
}

export function entryBlock(
  profile: Pick<
    Profile,
    "display_name" | "country_code" | "confirmed_adult_at" | "accepted_rules_version" | "banned_at"
  >,
  draw: Pick<Draw, "status" | "opens_at" | "closes_at"> | null,
  now: Date = new Date(),
  excluded: string[] = EXCLUDED_COUNTRIES,
): EntryBlock | null {
  if (profile.banned_at) return "banned";
  if (!profileComplete(profile)) return "needs_profile";
  if (profile.country_code && excluded.includes(profile.country_code)) return "excluded_country";
  if (!draw) return "no_draw";
  if (
    draw.status !== "open" ||
    now < new Date(draw.opens_at) ||
    now >= new Date(draw.closes_at)
  ) {
    return "draw_closed";
  }
  return null;
}
