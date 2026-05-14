import { APP_NAME, APP_URL, BRAND } from "@/lib/constants";

/**
 * Placeholder email templates. All copy references the central brand
 * constants so a future Resend integration only needs to call
 * `sendEmail(template, props)` with the rendered template strings.
 *
 * Do not hard-code the brand name in any template body.
 */

export interface EmailTemplate {
  subject: string;
  text: string;
}

export const emailTemplates = {
  welcome: (props: { email: string; referralCode: string }): EmailTemplate => ({
    subject: `Welcome to ${APP_NAME}`,
    text: [
      `Welcome to ${APP_NAME}, ${props.email}.`,
      `${BRAND.tagline}`,
      ``,
      `Your referral code: ${props.referralCode}`,
      `Share: ${APP_URL}/?ref=${props.referralCode}`,
      ``,
      `Free entry, no purchase required.`,
    ].join("\n"),
  }),

  waitlistConfirm: (props: { countryCode: string }): EmailTemplate => ({
    subject: `${APP_NAME} waitlist confirmed`,
    text: [
      `Thanks for joining the ${APP_NAME} waitlist.`,
      `We'll email you when ${props.countryCode} opens for entry.`,
    ].join("\n"),
  }),

  winnerNotice: (props: {
    prize: string;
    drawTitle: string;
    claimUrl: string;
  }): EmailTemplate => ({
    subject: `You won ${props.prize} — ${APP_NAME}`,
    text: [
      `Congratulations — your entry was selected in the ${props.drawTitle} draw.`,
      `Prize: ${props.prize}`,
      ``,
      `Complete identity verification (and any regional skill question) to claim:`,
      props.claimUrl,
      ``,
      `${APP_NAME} · ${APP_URL}`,
    ].join("\n"),
  }),

  payoutUpdate: (props: {
    drawTitle: string;
    status: string;
    reference: string | null;
  }): EmailTemplate => ({
    subject: `${APP_NAME} payout update — ${props.drawTitle}`,
    text: [
      `Your payout status for the ${props.drawTitle} draw is now: ${props.status}.`,
      props.reference ? `Reference: ${props.reference}` : "",
      ``,
      `${APP_NAME}`,
    ]
      .filter(Boolean)
      .join("\n"),
  }),
} as const;

export type EmailTemplateName = keyof typeof emailTemplates;
