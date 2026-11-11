import RegistrationsList from "@/components/admin/RegistrationsList";

export default function AdminRegistrationsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">Student Registrations</h1>
      <p className="mt-1 text-slate-600">
        Review new registrations, verify Interac e-Transfer payments, and activate student accounts.
      </p>
      <RegistrationsList />
    </div>
  );
}
