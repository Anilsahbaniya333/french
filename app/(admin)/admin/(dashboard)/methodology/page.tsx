import MethodologyEditor from "@/components/admin/MethodologyEditor";

export default function AdminMethodologyPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">Methodology</h1>
      <p className="mt-1 text-slate-600">
        Edit the methodology page content. This appears on the public methodology page.
      </p>
      <MethodologyEditor />
    </div>
  );
}
