"use client";

import { useSelector } from "react-redux";
import { RootState } from "../../store";

interface WaitingRoomProps {
    startGame: () => void;
    leaveRoom: () => void;
}

function WaitingRoom({ startGame, leaveRoom }: WaitingRoomProps): React.JSX.Element {
    const currentRoom = useSelector((state: RootState) => state.multiplayer.currentRoom);
    const playerId = useSelector((state: RootState) => state.multiplayer.playerId);
    const error = useSelector((state: RootState) => state.multiplayer.error);

    if (!currentRoom) return <div />;

    const isCreator = currentRoom.createdBy === playerId;
    const canStart = isCreator && currentRoom.players.length === 2;

    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
                <h1 className="text-2xl font-bold text-center mb-2 text-gray-800">
                    {currentRoom.roomName}
                </h1>
                <p className="text-center text-gray-500 mb-6">
                    Waiting for players...
                </p>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
                        {error}
                    </div>
                )}

                {/* Player List */}
                <div className="mb-6">
                    <h2 className="text-sm font-semibold text-gray-600 uppercase mb-2">
                        Players
                    </h2>
                    <div className="space-y-2">
                        {currentRoom.players.map((player) => (
                            <div
                                key={player.id}
                                className="flex items-center gap-2 p-3 bg-gray-50 rounded-md border border-gray-200"
                            >
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                <span className="font-medium text-gray-800">
                                    {player.displayName}
                                </span>
                                {player.id === currentRoom.createdBy && (
                                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                                        Host
                                    </span>
                                )}
                            </div>
                        ))}
                        {currentRoom.players.length < 2 && (
                            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md border border-dashed border-gray-300">
                                <div className="w-2 h-2 rounded-full bg-gray-300" />
                                <span className="text-gray-400 italic">
                                    Waiting for opponent...
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                    {isCreator && (
                        <button
                            onClick={startGame}
                            disabled={!canStart}
                            className="w-full py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                            {canStart ? "Start Game" : "Waiting for opponent..."}
                        </button>
                    )}
                    <button
                        onClick={leaveRoom}
                        className="w-full py-2 px-4 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                    >
                        Leave Room
                    </button>
                </div>
            </div>
        </div>
    );
}

export { WaitingRoom };
