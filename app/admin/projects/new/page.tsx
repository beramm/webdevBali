import Link from "next/link";
import { ProjectForm } from "@/components/project-form";

export default function NewProjectPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Link href="/admin" className="text-sm text-zinc-400 hover:text-white">
        ← Back
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-white">New project</h1>
      <div className="mt-8">
        <ProjectForm />
      </div>
    </main>
  );
}
