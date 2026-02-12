import type { Metadata } from "next";
import ChessProviders from "@/chess/providers/ChessProviders";
import { MultiplayerPage } from "@/chess/pages/MultiplayerPage";

export const metadata: Metadata = {
    title: "Multiplayer Chess",
    description: "Play chess online with a friend",
};

export default function MultiplayerChessPage(): React.JSX.Element {
    return (
        <ChessProviders>
            <MultiplayerPage />
        </ChessProviders>
    );
}
