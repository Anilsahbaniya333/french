import ContactForm from "@/components/forms/ContactForm";

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-slate-800">Contact Us</h1>
      <p className="mt-4 text-slate-600">
        Have a question or want to learn more? Send us a message and we'll be in touch.
      </p>
      <div className="mt-10 max-w-xl">
        <ContactForm />
      </div>
    </div>
  );
}
