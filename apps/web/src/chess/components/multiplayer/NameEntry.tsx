"use client";

import { useState } from "react";
import { useDispatch } from "react-redux";
import { multiplayerActions } from "../../store/multiplayer.slice";

function NameEntry(): React.JSX.Element {
    const dispatch = useDispatch();
    const [name, setName] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = name.trim();
        if (trimmed.length > 0) {
            dispatch(multiplayerActions.setPlayerName(trimmed));
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
                <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
                    Multiplayer Chess
                </h1>
                <form onSubmit={handleSubmit}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Enter your display name
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={20}
                        placeholder="Your name"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                        autoFocus
                    />
                    <button
                        type="submit"
                        disabled={name.trim().length === 0}
                        className="mt-4 w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                        Continue
                    </button>
                </form>
            </div>
        </div>
    );
}

export { NameEntry };
