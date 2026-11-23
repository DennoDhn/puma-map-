import { Platform } from '@/components/platform';
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <Platform initialContentId={id} />;
}
