"use client";

import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useUser } from "@clerk/nextjs";
import { RootState } from "../store";
import { multiplayerActions } from "../store/multiplayer.slice";
import { useMultiplayerSocket } from "../hooks/useMultiplayerSocket";
import { NameEntry } from "../components/multiplayer/NameEntry";
import { Lobby } from "../components/multiplayer/Lobby";
import { WaitingRoom } from "../components/multiplayer/WaitingRoom";
import { MultiplayerChessBoard } from "../containers/chessboard/MultiplayerChessBoard";
import {
    getMemberByClerkId,
    getChessProfileByMemberId,
    createChessProfile,
} from "../../lib/api";

function MultiplayerPage(): React.JSX.Element {
    const dispatch = useDispatch();
    const { user } = useUser();
    const playerName = useSelector((state: RootState) => state.multiplayer.playerName);
    const currentRoom = useSelector((state: RootState) => state.multiplayer.currentRoom);
    const gameActive = useSelector((state: RootState) => state.multiplayer.gameActive);

    const socketActions = useMultiplayerSocket();

    useEffect(() => {
        if (!user?.id) return;

        async function setup() {
            try {
                const member = await getMemberByClerkId(user!.id);
                if (!member?.id) return;
                dispatch(multiplayerActions.setMemberId(member.id));

                const profile = await getChessProfileByMemberId(member.id);
                if (!profile?.id) {
                    const username = [user!.firstName, user!.lastName].filter(Boolean).join('_') || user!.id;
                    await createChessProfile(member.id, username);
                }
            } catch (err) {
                console.error('Failed to set up chess profile:', err);
            }
        }

        setup();
    }, [user, dispatch]);

    if (!playerName) {
        return <NameEntry />;
    }

    if (!currentRoom) {
        return <Lobby {...socketActions} />;
    }

    if (!gameActive) {
        return <WaitingRoom {...socketActions} />;
    }

    return <MultiplayerChessBoard {...socketActions} />;
}

export { MultiplayerPage };
