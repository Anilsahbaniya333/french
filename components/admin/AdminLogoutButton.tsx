"use client";

import { useRouter } from "next/navigation";

export default function AdminLogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={logout}
      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-left text-sm font-medium text-slate-600 hover:bg-slate-50"
    >
      Sign out
    </button>
  );
}
