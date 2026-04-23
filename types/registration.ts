/**
 * Student registration form schema — matches DB columns in student_registrations.
 */

export interface StudentRegistration {
  id?: string;
  fullName: string;
  email: string;
  phone: string;
  level: string;
  experience?: string | null;
  preferredMode?: string | null;
  preferredTime?: string | null;
  goals?: string | null;
  message?: string | null;
  paymentScreenshotUrl?: string | null;
  status?: "pending" | "approved" | "rejected" | string;
  createdAt?: string;
}
