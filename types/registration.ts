/**
 * Student registration form schema — matches DB columns in student_registrations.
 */

export interface StudentRegistration {
  id?: string;
  fullName: string;
  email: string;
  phone: string;
  /** Course package code (e.g. "A1", "A1–A2", "A1–B2"); legacy rows hold a CEFR level */
  level: string;
  experience?: string | null;
  preferredMode?: string | null;
  preferredTime?: string | null;
  goals?: string | null;
  message?: string | null;
  paymentScreenshotUrl?: string | null;
  status?: "pending" | "approved" | "rejected" | string;
  createdAt?: string;

  /* Added by migration_registration_v2.sql */
  coursePackage?: string | null;
  countryTimezone?: string | null;
  currentLevel?: string | null;
  preferredSchedule?: string | null;
  learningGoal?: string | null;
  consentAt?: string | null;

  /* Added by migration_registration_v3.sql */
  adminNotes?: string | null;
  reviewedAt?: string | null;
  studentId?: string | null;
}
