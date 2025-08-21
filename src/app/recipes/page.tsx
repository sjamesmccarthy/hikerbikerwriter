import { Suspense } from "react";
import RecipeViewer from "@/components/RecipeViewer";

function RecipeViewerWithSuspense() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-screen">
          Loading recipes...
        </div>
      }
    >
      <RecipeViewer />
    </Suspense>
  );
}

export default function RecipesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto ">
        <RecipeViewerWithSuspense />
      </main>
    </div>
  );
}
