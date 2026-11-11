import { Suspense } from "react";
import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Student Login | Mappell French",
  description: "Sign in to the Mappell French Student Portal for enrolled students.",
};

export default function StudentLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
