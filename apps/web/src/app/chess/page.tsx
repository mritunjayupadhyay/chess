import type { Metadata } from "next";
import ChessProviders from "@/chess/providers/ChessProviders";
import { GamePage } from "@/chess/pages/GamePage";

export const metadata: Metadata = {
  title: "Chess Game",
  description: "Play chess online",
};

export default function ChessPage(): React.JSX.Element {
  return (
    <ChessProviders>
      <GamePage />
    </ChessProviders>
  );
}
