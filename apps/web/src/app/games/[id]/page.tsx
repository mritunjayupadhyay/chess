import { GameDetailPage } from "../../../chess/pages/GameDetailPage";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <GameDetailPage gameId={id} />;
}
