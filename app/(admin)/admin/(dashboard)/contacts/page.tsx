import ContactsList from "@/components/admin/ContactsList";

export default function AdminContactsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">Contact Submissions</h1>
      <p className="mt-1 text-slate-600">Messages sent via the contact form.</p>
      <ContactsList />
    </div>
  );
}
