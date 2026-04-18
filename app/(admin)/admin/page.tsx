import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <div className="p-8 md:p-10">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">
        Admin dashboard
      </h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-soft">
        Manage knowledge base imports and related administration tasks. Regular
        users use the proposal workspace separately.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/admin/upload-document"
          className="inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground shadow-sm transition hover:opacity-90"
        >
          Upload knowledge JSON
        </Link>
      </div>
    </div>
  );
}
