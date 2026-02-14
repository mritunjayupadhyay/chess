import { GamePage } from "../../../chess/pages/GamePage";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <GamePage gameId={id} />;
}
