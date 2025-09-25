import CreativeWritingDetail from "@/components/CreativeWritingDetail";

interface CreativeWritingPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function CreativeWritingPage({
  params,
}: CreativeWritingPageProps) {
  const { slug } = await params;

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto ">
        <CreativeWritingDetail slug={slug} />
      </main>
    </div>
  );
}
