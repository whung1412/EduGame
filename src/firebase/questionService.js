import { db } from "./firebase";
import {collection, doc, serverTimestamp, writeBatch, getDocs, orderBy, query} from "firebase/firestore";

export async function saveQuestions(roomCode, questions) {
    if (!roomCode) {
        throw new Error("缺少教室代碼");
    }

    if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error("沒有可儲存的題目");
    }

    const batch = writeBatch(db);
    const questionsRef = collection(
        db,
        "rooms",
        roomCode,
        "questions"
    );

    questions.forEach((question, index) => {
        // 使用固定順序 ID，方便之後依題號讀取
        const questionId = String(index + 1).padStart(3, "0");
        const questionRef = doc(questionsRef, questionId);

        batch.set(questionRef, {
            questionNumber: index + 1,
            question: question.question,
            options: question.options,
            correctAnswer: question.correctAnswer,
            createdAt: serverTimestamp()
        });
    });

    await batch.commit();

    return questions.length;
}

export async function getQuestions(roomCode) {
    if (!roomCode) {
        throw new Error("缺少教室代碼");
    }

    const questionsRef = collection(
        db,
        "rooms",
        roomCode,
        "questions"
    );

    const questionsQuery = query(
        questionsRef,
        orderBy("questionNumber", "asc")
    );

    const snapshot = await getDocs(questionsQuery);

    return snapshot.docs.map((questionDoc) => ({
        id: questionDoc.id,
        ...questionDoc.data()
    }));
}