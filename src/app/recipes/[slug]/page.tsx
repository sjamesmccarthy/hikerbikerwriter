import RecipeDetail from "@/components/RecipeDetail";

interface RecipePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function RecipePage({ params }: RecipePageProps) {
  const { slug } = await params;

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto ">
        <RecipeDetail slug={slug} />
      </main>
    </div>
  );
}
