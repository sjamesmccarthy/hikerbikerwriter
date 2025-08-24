import { Suspense } from "react";
import FieldNotes from "@/components/FieldNotes";

export default function FieldNotesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto">
        <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
          <FieldNotes />
        </Suspense>
      </main>
    </div>
  );
}
