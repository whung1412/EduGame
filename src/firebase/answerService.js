import { db } from "./firebase";
import {
    doc,
    getDoc,
    runTransaction,
    serverTimestamp
} from "firebase/firestore";

export async function submitAnswer(roomCode, playerId, questionIndex, answer, correct) {
    const answerId = String(questionIndex + 1).padStart(3, "0");

    const playerRef = doc(
        db,
        "rooms",
        roomCode,
        "players",
        playerId
    );

    const answerRef = doc(
        db,
        "rooms",
        roomCode,
        "players",
        playerId,
        "answers",
        answerId
    );

    return await runTransaction(db, async (transaction) => {

        // ① 所有讀取都放最前面
        const answerSnap = await transaction.get(answerRef);
        const playerSnap = await transaction.get(playerRef);

        // ② 讀完之後才開始判斷
        if (answerSnap.exists()) {
            throw new Error("這一題已經作答過了");
        }

        if (!playerSnap.exists()) {
            throw new Error("找不到玩家資料");
        }

        const playerData = playerSnap.data();

        const currentScore = playerData.score ?? 0;
        const currentCorrectCount =
            playerData.correctCount ?? 0;

        // ③ 接下來才開始所有寫入

        transaction.set(answerRef, {
            questionNumber: questionIndex + 1,
            answer,
            correct,
            answeredAt: serverTimestamp()
        });

        transaction.update(playerRef, {
            answeredQuestionIndex: questionIndex,
            lastAnswer: answer,
            lastCorrect: correct,
            answeredAt: serverTimestamp(),

            score: correct
                ? currentScore + 100
                : currentScore,

            correctCount: correct
                ? currentCorrectCount + 1
                : currentCorrectCount
        });

        return {
            answer,
            correct
        };
    });
}

export async function getSubmittedAnswer(
    roomCode,
    playerId,
    questionIndex
) {
    const answerId = String(questionIndex + 1).padStart(3, "0");

    const answerRef = doc(
        db,
        "rooms",
        roomCode,
        "players",
        playerId,
        "answers",
        answerId
    );

    const answerSnap = await getDoc(answerRef);

    if (!answerSnap.exists()) {
        return null;
    }

    return answerSnap.data();
}