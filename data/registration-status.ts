/**
 * Registration workflow statuses. DB values are stable; labels are what admins/students see.
 * 'pending' is kept as the DB value for "Pending Payment Verification" so existing rows stay valid.
 */
export const REGISTRATION_STATUSES = [
  { value: "pending", label: "Pending Payment Verification", tone: "amber" },
  { value: "payment_verified", label: "Payment Verified", tone: "sky" },
  { value: "approved", label: "Approved / Enrolled", tone: "emerald" },
  { value: "info_required", label: "Additional Information Required", tone: "violet" },
  { value: "rejected", label: "Rejected", tone: "red" },
] as const;

export type RegistrationStatus = (typeof REGISTRATION_STATUSES)[number]["value"];

export function statusLabel(value: string | null | undefined): string {
  return REGISTRATION_STATUSES.find((s) => s.value === value)?.label ?? "Pending Payment Verification";
}

export function isRegistrationStatus(v: unknown): v is RegistrationStatus {
  return REGISTRATION_STATUSES.some((s) => s.value === v);
}

/** Statuses that need migration_registration_v3.sql (the original DB constraint only allows pending/approved/rejected) */
export const STATUSES_NEEDING_V3 = ["payment_verified", "info_required"];
