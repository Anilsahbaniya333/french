"use client";

import { useState, useEffect } from "react";

interface Contact {
  id: string;
  fullName: string;
  email: string;
  message: string;
  createdAt?: string;
}

export default function ContactsList() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/contacts");
        if (!res.ok) {
          setError("Failed to load contacts.");
          return;
        }
        const json = await res.json();
        setContacts(json.contacts ?? []);
      } catch {
        setError("Could not connect to the database.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <p className="mt-6 text-slate-600">Loading...</p>;
  }

  if (error) {
    return <p className="mt-6 text-red-600">{error}</p>;
  }

  if (contacts.length === 0) {
    return (
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-slate-600">No contact submissions yet.</p>
        <p className="mt-1 text-sm text-slate-500">
          Messages sent via the contact form will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {contacts.map((c) => (
        <div key={c.id} className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-medium text-slate-800">{c.fullName}</p>
              <p className="text-sm text-slate-500">{c.email}</p>
            </div>
            <p className="shrink-0 text-xs text-slate-400">
              {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "—"}
            </p>
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{c.message}</p>
        </div>
      ))}
    </div>
  );
}
