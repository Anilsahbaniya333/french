import type { Metadata } from "next";
import SetPasswordForm from "./SetPasswordForm";

export const metadata: Metadata = {
  title: "Set your password | Mappell French",
  robots: { index: false, follow: false },
};

export default async function SetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return <SetPasswordForm token={token ?? ""} />;
}
