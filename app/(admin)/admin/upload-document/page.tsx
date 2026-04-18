import { UploadDocumentForm } from "@/components/admin/upload-document-form";

export default function AdminUploadDocumentPage() {
  return (
    <div className="p-8 md:p-10">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">
        Upload Document
      </h1>
      <UploadDocumentForm />
    </div>
  );
}
