import { Suspense } from "react";
import CreativeWriting from "@/components/CreativeWriting";

export default function CreativeWritingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto">
        <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
          <CreativeWriting />
        </Suspense>
      </main>
    </div>
  );
}
