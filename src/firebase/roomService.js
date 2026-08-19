import { db } from "./firebase";
import { generateRoomCode } from "../utils/roomCode";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";

export async function joinRoom(roomCode) {
    const normalizedCode = roomCode.trim().toUpperCase();

    const roomRef = doc(db, "rooms", normalizedCode);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) {
        throw new Error("教室不存在");
    }

    const roomData = roomSnap.data();

    if (!roomData.expireAt) {
        throw new Error("教室資料缺少有效期限");
    }

    if (roomData.expireAt.toDate() <= new Date()) {
        throw new Error("教室已失效");
    }

    return {
        roomCode: normalizedCode,
        ...roomData
    };
}

export async function createRoom( roomName, gameMode, teacherPassword, questionCount) {

    let roomCode;
    let roomExists = true;

    while (roomExists) {
        roomCode = generateRoomCode();

        const roomRef = doc(db, "rooms", roomCode);
        const roomSnap = await getDoc(roomRef);

        if (!roomSnap.exists()) {
            roomExists = false;

            await setDoc(roomRef, {
                roomName,
                gameMode,
                teacherPassword,
                status: "waiting",
                questionCount,
                createdAt: Timestamp.now(),
                expireAt: Timestamp.fromDate(
                    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                )
            });
        }
    }

    return roomCode;
}

export async function enterTeacherRoom(roomCode,teacherPassword) {
    const normalizedCode = roomCode.trim().toUpperCase();

    const roomRef = doc(db, "rooms", normalizedCode);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) {
        throw new Error("教室不存在");
    }

    const roomData = roomSnap.data();

    if (roomData.expireAt.toDate() <= new Date()) {
        throw new Error("教室已失效");
    }

    if (roomData.teacherPassword !== teacherPassword) {
        throw new Error("教師密碼錯誤");
    }

    return {
        roomCode: normalizedCode,
        ...roomData
    };
}