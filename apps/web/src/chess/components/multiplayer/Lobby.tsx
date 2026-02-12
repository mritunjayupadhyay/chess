"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store";

interface LobbyProps {
    createRoom: (roomName: string, playerName: string) => void;
    joinRoom: (roomId: string, playerName: string) => void;
    listRooms: () => void;
}

function Lobby({ createRoom, joinRoom, listRooms }: LobbyProps): React.JSX.Element {
    const [roomName, setRoomName] = useState("");
    const playerName = useSelector((state: RootState) => state.multiplayer.playerName);
    const roomList = useSelector((state: RootState) => state.multiplayer.roomList);
    const error = useSelector((state: RootState) => state.multiplayer.error);

    useEffect(() => {
        listRooms();
    }, [listRooms]);

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = roomName.trim();
        if (trimmed.length > 0) {
            createRoom(trimmed, playerName);
            setRoomName("");
        }
    };

    const waitingRooms = roomList.filter(r => r.status === "waiting");

    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full mx-4">
                <h1 className="text-2xl font-bold text-center mb-2 text-gray-800">
                    Lobby
                </h1>
                <p className="text-center text-gray-500 mb-6">
                    Playing as <span className="font-semibold">{playerName}</span>
                </p>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
                        {error}
                    </div>
                )}

                {/* Create Room */}
                <form onSubmit={handleCreate} className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Create a new room
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={roomName}
                            onChange={(e) => setRoomName(e.target.value)}
                            maxLength={30}
                            placeholder="Room name"
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                        />
                        <button
                            type="submit"
                            disabled={roomName.trim().length === 0}
                            className="py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                            Create
                        </button>
                    </div>
                </form>

                {/* Room List */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-700 mb-3">
                        Available Rooms
                    </h2>
                    {waitingRooms.length === 0 ? (
                        <p className="text-gray-400 text-center py-4">
                            No rooms available. Create one!
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {waitingRooms.map((room) => (
                                <div
                                    key={room.roomId}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200"
                                >
                                    <div>
                                        <span className="font-medium text-gray-800">
                                            {room.roomName}
                                        </span>
                                        <span className="text-gray-500 text-sm ml-2">
                                            ({room.playerCount}/2 players)
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => joinRoom(room.roomId, playerName)}
                                        className="py-1 px-3 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                                    >
                                        Join
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <button
                    onClick={listRooms}
                    className="mt-4 w-full py-2 px-4 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                    Refresh
                </button>
            </div>
        </div>
    );
}

export { Lobby };
