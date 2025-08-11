import RecipeBuilder from "@/components/RecipeBuilder";
import { Suspense } from "react";

export default function RecipeBuilderPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading recipe builder...</p>
              </div>
            </div>
          }
        >
          <RecipeBuilder />
        </Suspense>
      </main>
    </div>
  );
}
