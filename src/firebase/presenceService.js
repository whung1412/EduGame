import {
    onDisconnect,
    onValue,
    ref,
    remove,
    set
} from "firebase/database";

import { realtimeDb } from "./firebase";

export async function setPlayerOnline(
    roomCode,
    playerId,
    playerName
) {
    const playerPresenceRef = ref(
        realtimeDb,
        `presence/${roomCode}/${playerId}`
    );

    // 先向伺服器登記：斷線時自動刪除
    await onDisconnect(playerPresenceRef).remove();

    // 再寫入目前在線
    await set(playerPresenceRef, {
        name: playerName,
        online: true,
        connectedAt: Date.now()
    });
}

export async function setPlayerOffline(roomCode, playerId) {
    const playerPresenceRef = ref(
        realtimeDb,
        `presence/${roomCode}/${playerId}`
    );

    await remove(playerPresenceRef);
}

export function subscribeOnlinePlayers(
    roomCode,
    onPlayersChanged,
    onError
) {
    const roomPresenceRef = ref(
        realtimeDb,
        `presence/${roomCode}`
    );

    const unsubscribe = onValue(
        roomPresenceRef,
        (snapshot) => {
            const data = snapshot.val() ?? {};

            const players = Object.entries(data).map(
                ([id, player]) => ({
                    id,
                    ...player
                })
            );

            onPlayersChanged(players);
        },
        onError
    );

    return unsubscribe;
}