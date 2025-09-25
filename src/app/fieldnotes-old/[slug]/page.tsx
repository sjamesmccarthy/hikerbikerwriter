import CreativeWritingDetail from "@/components/CreativeWritingDetail";

interface FieldNotePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function FieldNotePage({ params }: FieldNotePageProps) {
  const { slug } = await params;

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto ">
        <CreativeWritingDetail slug={slug} />
      </main>
    </div>
  );
}
