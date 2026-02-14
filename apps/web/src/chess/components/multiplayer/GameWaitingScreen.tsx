"use client";

import { useState } from "react";

interface GameWaitingScreenProps {
    gameId: string;
}

function GameWaitingScreen({ gameId }: GameWaitingScreenProps): React.JSX.Element {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(gameId);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // fallback
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4 text-center">
                <h1 className="text-2xl font-bold mb-2 text-gray-800">
                    Waiting for opponent...
                </h1>
                <p className="text-gray-500 mb-6">
                    Share this game ID with your opponent
                </p>

                <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-4">
                    <p className="text-xs text-gray-500 mb-1">Game ID</p>
                    <p className="font-mono text-lg text-gray-800 break-all select-all">
                        {gameId}
                    </p>
                </div>

                <button
                    onClick={handleCopy}
                    className="py-2 px-6 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                    {copied ? "Copied!" : "Copy Game ID"}
                </button>

                <div className="mt-6">
                    <div className="animate-spin inline-block w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full" />
                </div>
            </div>
        </div>
    );
}

export { GameWaitingScreen };
