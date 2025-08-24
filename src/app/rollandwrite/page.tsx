import { Suspense } from "react";
import RollAndWriteEntries from "../../components/RollAndWriteEntries";

export default function RollAndWritePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto">
        <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
          <RollAndWriteEntries />
        </Suspense>
      </main>
    </div>
  );
}
