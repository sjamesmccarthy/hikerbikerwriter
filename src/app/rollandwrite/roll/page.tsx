"use client";

import { Suspense } from "react";
import RollAndWrite from "../../../components/RollAndWriteSimple";

export default function RollAndWriteBuilderPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="min-h-screen max-w-7xl mx-auto ">
        <Suspense fallback={<div>Loading...</div>}>
          <RollAndWrite />
        </Suspense>
      </main>
    </div>
  );
}
