import { db } from "./firebase";
import {
    addDoc,
    collection,
    Timestamp
} from "firebase/firestore";

export async function addPlayer(roomCode, playerName) {
    const playersRef = collection(
        db,
        "rooms",
        roomCode,
        "players"
    );

    const playerRef = await addDoc(playersRef, {
        name: playerName,
        score: 0,
        correctCount: 0,
        finishTime: null,
        joinedAt: Timestamp.now()
    });

    return {
        playerId: playerRef.id,
        roomCode,
        playerName
    };
}