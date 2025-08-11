import FieldNoteDetail from "@/components/FieldNoteDetail";

interface FieldNotePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function FieldNotePage({ params }: FieldNotePageProps) {
  const { slug } = await params;

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <FieldNoteDetail slug={slug} />
      </main>
    </div>
  );
}
