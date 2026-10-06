import { db } from "./firebase";

import {
    doc,
    getDoc,
    runTransaction,
    serverTimestamp
} from "firebase/firestore";


/* =====================================================
   問答模式
   送出答案
===================================================== */

export async function submitAnswer(
    roomCode,
    playerId,
    questionIndex,
    answer,
    correct
) {

    const answerId =
        String(
            questionIndex + 1
        ).padStart(3, "0");


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


    return await runTransaction(
        db,
        async (transaction) => {

            /* =========================
               所有讀取放最前面
            ========================= */

            const answerSnap =
                await transaction.get(
                    answerRef
                );


            const playerSnap =
                await transaction.get(
                    playerRef
                );


            /* =========================
               判斷
            ========================= */

            if (answerSnap.exists()) {

                throw new Error(
                    "這一題已經作答過了"
                );

            }


            if (!playerSnap.exists()) {

                throw new Error(
                    "找不到玩家資料"
                );

            }


            const playerData =
                playerSnap.data();


            const currentScore =
                playerData.score ?? 0;


            const currentCorrectCount =
                playerData.correctCount ?? 0;


            /* =========================
               儲存答案
            ========================= */

            transaction.set(
                answerRef,
                {
                    questionNumber:
                        questionIndex + 1,

                    answer,

                    correct,

                    answeredAt:
                        serverTimestamp()
                }
            );


            /* =========================
               更新 Quiz 玩家資料
            ========================= */

            transaction.update(
                playerRef,
                {
                    answeredQuestionIndex:
                        questionIndex,

                    lastAnswer:
                        answer,

                    lastCorrect:
                        correct,

                    answeredAt:
                        serverTimestamp(),

                    score:
                        correct
                            ? currentScore + 100
                            : currentScore,

                    correctCount:
                        correct
                            ? currentCorrectCount + 1
                            : currentCorrectCount
                }
            );


            return {
                answer,
                correct
            };
        }
    );
}


/* =====================================================
   問答模式
   取得已提交答案
===================================================== */

export async function getSubmittedAnswer(
    roomCode,
    playerId,
    questionIndex
) {

    const answerId =
        String(
            questionIndex + 1
        ).padStart(3, "0");


    const answerRef = doc(
        db,
        "rooms",
        roomCode,
        "players",
        playerId,
        "answers",
        answerId
    );


    const answerSnap =
        await getDoc(
            answerRef
        );


    if (!answerSnap.exists()) {
        return null;
    }


    return answerSnap.data();
}


/* =====================================================
   Runner 模式
   送出答案
===================================================== */

export async function submitRunnerAnswer(
    roomCode,
    playerId,
    questionIndex,
    round,
    answer,
    correct
) {

    const roundNumber =
        String(round).padStart(
            3,
            "0"
        );


    const questionNumber =
        String(
            questionIndex + 1
        ).padStart(
            3,
            "0"
        );


    const answerId =
        `runner_${roundNumber}_${questionNumber}`;


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


    return await runTransaction(
        db,
        async (transaction) => {

            /* =========================
               所有讀取放最前面
            ========================= */

            const answerSnap =
                await transaction.get(
                    answerRef
                );


            const playerSnap =
                await transaction.get(
                    playerRef
                );


            /* =========================
               判斷
            ========================= */

            if (answerSnap.exists()) {

                throw new Error(
                    "這一題已經作答過了"
                );

            }


            if (!playerSnap.exists()) {

                throw new Error(
                    "找不到玩家資料"
                );

            }


            const playerData =
                playerSnap.data();


            const runnerCorrectCount =
                playerData.runnerCorrectCount ?? 0;


            const runnerWrongCount =
                playerData.runnerWrongCount ?? 0;


            /* =========================
               儲存 Runner 答案
            ========================= */

            transaction.set(
                answerRef,
                {
                    gameMode:
                        "runner",

                    round,

                    questionNumber:
                        questionIndex + 1,

                    questionIndex,

                    answer,

                    correct,

                    answeredAt:
                        serverTimestamp()
                }
            );


            /* =========================
               更新 Runner 統計

               注意：
               不修改 Quiz 的 score
               不修改 Quiz 的 correctCount
            ========================= */

            transaction.update(
                playerRef,
                {
                    runnerLastQuestionIndex:
                        questionIndex,

                    runnerLastRound:
                        round,

                    runnerLastAnswer:
                        answer,

                    runnerLastCorrect:
                        correct,

                    runnerAnsweredAt:
                        serverTimestamp(),

                    runnerCorrectCount:
                        correct
                            ? runnerCorrectCount + 1
                            : runnerCorrectCount,

                    runnerWrongCount:
                        correct
                            ? runnerWrongCount
                            : runnerWrongCount + 1
                }
            );


            return {
                answer,
                correct,
                round,
                questionIndex
            };
        }
    );
}


/* =====================================================
   Runner 模式
   取得已提交答案
===================================================== */

export async function getSubmittedRunnerAnswer(
    roomCode,
    playerId,
    questionIndex,
    round
) {

    const roundNumber =
        String(round).padStart(
            3,
            "0"
        );


    const questionNumber =
        String(
            questionIndex + 1
        ).padStart(
            3,
            "0"
        );


    const answerId =
        `runner_${roundNumber}_${questionNumber}`;


    const answerRef = doc(
        db,
        "rooms",
        roomCode,
        "players",
        playerId,
        "answers",
        answerId
    );


    const answerSnap =
        await getDoc(
            answerRef
        );


    if (!answerSnap.exists()) {
        return null;
    }


    return answerSnap.data();
}