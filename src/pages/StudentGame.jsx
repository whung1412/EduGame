import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
    doc,
    onSnapshot
} from "firebase/firestore";

import { db } from "../firebase/firebase";
import { getQuestions } from "../firebase/questionService";
import {
    submitAnswer,
    getSubmittedAnswer
} from "../firebase/answerService";

import {
    setPlayerOnline,
    setPlayerOffline
} from "../firebase/presenceService";

import "../styles/StudentGame.css";


function StudentGame() {
    const location = useLocation();
    const navigate = useNavigate();

    const roomCode =
        location.state?.roomCode;

    const playerId =
        location.state?.playerId;

    const playerName =
        location.state?.playerName;


    const [questions, setQuestions] =
        useState([]);

    const [currentIndex, setCurrentIndex] =
        useState(0);

    const [questionPhase, setQuestionPhase] =
        useState("answering");

    const [selectedAnswer, setSelectedAnswer] =
        useState(null);

    const [isAnswered, setIsAnswered] =
        useState(false);

    const [isCorrect, setIsCorrect] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [errorMessage, setErrorMessage] =
        useState("");
    
    /*  設定學生在線 */

        useEffect(() => {
            if (
                !roomCode ||
                !playerId ||
                !playerName
            ) {
                return;
            }

            setPlayerOnline(
                roomCode,
                playerId,
                playerName
            ).catch((error) => {
                console.error(
                    "設定遊戲中在線狀態失敗：",
                    error
                );
            });

            return () => {
                setPlayerOffline(
                    roomCode,
                    playerId
                ).catch((error) => {
                    console.error(
                        "移除遊戲中在線狀態失敗：",
                        error
                    );
                });
            };

        }, [
            roomCode,
            playerId,
            playerName
        ]);


    /* =========================
       載入題目
    ========================= */

    useEffect(() => {
        if (!roomCode) {
            setLoading(false);
            return;
        }

        async function loadQuestions() {
            try {
                setLoading(true);

                const list =
                    await getQuestions(
                        roomCode
                    );

                if (list.length === 0) {
                    setErrorMessage(
                        "這個教室沒有題目"
                    );

                    return;
                }

                setQuestions(list);

            } catch (error) {
                console.error(
                    "讀取題目失敗：",
                    error
                );

                setErrorMessage(
                    "無法讀取題目"
                );

            } finally {
                setLoading(false);
            }
        }

        loadQuestions();

    }, [roomCode]);


    /* =========================
       監聽老師控制
    ========================= */

    useEffect(() => {
        if (!roomCode) {
            return;
        }

        const roomRef = doc(
            db,
            "rooms",
            roomCode
        );

        const unsubscribe = onSnapshot(
            roomRef,

            (snapshot) => {

                if (!snapshot.exists()) {
                    setErrorMessage(
                        "教室不存在"
                    );

                    return;
                }

                const roomData =
                    snapshot.data();


                if (
                    typeof roomData.currentQuestionIndex ===
                        "number" &&
                    roomData.currentQuestionIndex !==
                        currentIndex
                ) {
                    setCurrentIndex(
                        roomData.currentQuestionIndex
                    );

                    setSelectedAnswer(null);
                    setIsAnswered(false);
                    setIsCorrect(null);
                }


                if (roomData.questionPhase) {
                    setQuestionPhase(
                        roomData.questionPhase
                    );
                }


                if (
                    roomData.status ===
                    "finished"
                ) {
                    navigate(
                        "/student/result",
                        {
                            state: {
                                roomCode,
                                playerId,
                                playerName
                            }
                        }
                    );
                }
            },

            (error) => {
                console.error(
                    "監聽教室失敗：",
                    error
                );

                setErrorMessage(
                    "無法取得教室狀態"
                );
            }
        );


        return () => unsubscribe();

    }, [
        roomCode,
        currentIndex,
        navigate,
        playerId,
        playerName
    ]);


    /* =========================
       回答
    ========================= */

    const handleAnswer = async (answer) => {
        if (
            isAnswered ||
            !playerId ||
            questionPhase !== "answering"
        ) {
            return;
        }


        const currentQuestion =
            questions[currentIndex];

        if (!currentQuestion) {
            return;
        }


        const correct =
            answer ===
            currentQuestion.correctAnswer;


        /* 先鎖定，避免連點 */

        setSelectedAnswer(answer);
        setIsAnswered(true);


        try {
            await submitAnswer(
                roomCode,
                playerId,
                currentIndex,
                answer,
                correct
            );

            setIsCorrect(correct);

        } catch (error) {
            console.error(
                "送出答案失敗：",
                error
            );


            if (
                error.message ===
                "這一題已經作答過了"
            ) {
                const existingAnswer =
                    await getSubmittedAnswer(
                        roomCode,
                        playerId,
                        currentIndex
                    );


                if (existingAnswer) {
                    setSelectedAnswer(
                        existingAnswer.answer
                    );

                    setIsAnswered(true);

                    setIsCorrect(
                        existingAnswer.correct
                    );

                    setErrorMessage("");
                }

                return;
            }


            setIsAnswered(false);
            setSelectedAnswer(null);

            setErrorMessage(
                "答案送出失敗，請再試一次"
            );
        }
    };


    /* =========================
       恢復已作答狀態
    ========================= */

    useEffect(() => {
        if (
            !roomCode ||
            !playerId ||
            questions.length === 0
        ) {
            return;
        }

        async function restoreAnswerState() {
            try {
                const existingAnswer =
                    await getSubmittedAnswer(
                        roomCode,
                        playerId,
                        currentIndex
                    );


                if (existingAnswer) {

                    setSelectedAnswer(
                        existingAnswer.answer
                    );

                    setIsAnswered(true);

                    setIsCorrect(
                        existingAnswer.correct
                    );

                } else {

                    setSelectedAnswer(null);
                    setIsAnswered(false);
                    setIsCorrect(null);
                }

            } catch (error) {
                console.error(
                    "恢復作答狀態失敗：",
                    error
                );
            }
        }


        restoreAnswerState();

    }, [
        roomCode,
        playerId,
        currentIndex,
        questions
    ]);


    /* =========================
       狀態畫面
    ========================= */

    if (!roomCode) {
        return (
            <div className="student-game-state-page">

                <div className="student-game-state-card">

                    <h1>
                        無法進入遊戲
                    </h1>

                    <p>
                        缺少教室資料。
                    </p>

                </div>

            </div>
        );
    }


    if (loading) {
        return (
            <div className="student-game-state-page">

                <div className="student-game-loading">
                    載入題目中...
                </div>

            </div>
        );
    }


    if (errorMessage) {
        return (
            <div className="student-game-state-page">

                <div className="student-game-state-card">

                    <h1>
                        發生錯誤
                    </h1>

                    <p>
                        {errorMessage}
                    </p>

                </div>

            </div>
        );
    }


    const currentQuestion =
        questions[currentIndex];


    if (!currentQuestion) {
        return (
            <div className="student-game-state-page">
                找不到目前題目
            </div>
        );
    }


    return (
        <div className="student-game-page">


            {/* =========================
                Header
            ========================= */}

            <header className="student-game-header">

                <div className="student-game-logo">

                    <div className="student-game-logo-icon">
                        E
                    </div>

                    <span>
                        EduGame
                    </span>

                </div>


                <div className="student-game-player">
                    {playerName}
                </div>

            </header>


            {/* =========================
                Main
            ========================= */}

            <main className="student-game-main">


                {/* =========================
                    上方進度
                ========================= */}

                <div className="student-game-question-top">

                    <div className="student-game-question-number">
                        第 {currentIndex + 1} 題
                    </div>


                    <div className="student-game-question-count">

                        {currentIndex + 1}

                        <span>
                            / {questions.length}
                        </span>

                    </div>

                </div>


                <div className="student-game-progress">

                    <div
                        className="student-game-progress-bar"
                        style={{
                            width:
                                `${
                                    ((currentIndex + 1) /
                                        questions.length) *
                                    100
                                }%`
                        }}
                    />

                </div>


                {/* =========================
                    題目
                ========================= */}

                <section className="student-game-question-card">

                    <h1>
                        {currentQuestion.question}
                    </h1>

                </section>


                {/* =========================
                    選項
                ========================= */}

                <section className="student-game-options">

                    {currentQuestion.options.map(
                        (option, index) => {

                            const optionLetter =
                                String.fromCharCode(
                                    65 + index
                                );


                            const isSelected =
                                option ===
                                selectedAnswer;


                            const isCorrectOption =
                                option ===
                                currentQuestion.correctAnswer;


                            let optionClass = "";


                            /* 公布前 */

                            if (
                                isAnswered &&
                                questionPhase ===
                                    "answering" &&
                                isSelected
                            ) {
                                optionClass =
                                    "selected";
                            }


                            /* 公布後 */

                            if (
                                questionPhase ===
                                "revealed"
                            ) {

                                if (
                                    isCorrectOption
                                ) {
                                    optionClass =
                                        "correct";

                                } else if (
                                    isSelected
                                ) {
                                    optionClass =
                                        "wrong";
                                }
                            }


                            return (
                                <button
                                    key={`${option}-${index}`}
                                    type="button"
                                    className={`student-game-option ${optionClass}`}
                                    onClick={() =>
                                        handleAnswer(
                                            option
                                        )
                                    }
                                    disabled={
                                        isAnswered ||
                                        questionPhase !==
                                            "answering"
                                    }
                                >

                                    <span className="student-game-option-letter">
                                        {optionLetter}
                                    </span>


                                    <span className="student-game-option-text">
                                        {option}
                                    </span>


                                    {questionPhase ===
                                        "revealed" &&
                                        isCorrectOption && (

                                            <span className="student-game-option-mark correct">
                                                ✓
                                            </span>

                                        )}


                                    {questionPhase ===
                                        "revealed" &&
                                        isSelected &&
                                        !isCorrectOption && (

                                            <span className="student-game-option-mark wrong">
                                                ×
                                            </span>

                                        )}

                                </button>
                            );
                        }
                    )}

                </section>


                {/* =========================
                    狀態區
                ========================= */}

                <section className="student-game-status">


                    {/* 已送出 */}

                    {isAnswered &&
                        questionPhase ===
                            "answering" && (

                        <div className="student-game-waiting">

                            <div className="student-game-waiting-icon">
                                ✓
                            </div>


                            <div>
                                <strong>
                                    答案已送出
                                </strong>

                                <p>
                                    等待老師公布答案…
                                </p>
                            </div>

                        </div>
                    )}


                    {/* 公布答案 */}

                    {questionPhase ===
                        "revealed" && (

                        <div
                            className={`student-game-result ${
                                isAnswered
                                    ? isCorrect
                                        ? "correct"
                                        : "wrong"
                                    : "empty"
                            }`}
                        >

                            <div className="student-game-result-main">

                                {isAnswered ? (

                                    isCorrect ? (
                                        <>
                                            <span className="student-game-result-icon">
                                                ✓
                                            </span>

                                            <strong>
                                                回答正確！
                                            </strong>
                                        </>
                                    ) : (
                                        <>
                                            <span className="student-game-result-icon">
                                                ×
                                            </span>

                                            <strong>
                                                回答錯誤
                                            </strong>
                                        </>
                                    )

                                ) : (

                                    <>
                                        <span className="student-game-result-icon">
                                            –
                                        </span>

                                        <strong>
                                            本題未作答
                                        </strong>
                                    </>

                                )}

                            </div>


                            <div className="student-game-correct-answer">

                                <span>
                                    正確答案
                                </span>

                                <strong>
                                    {
                                        currentQuestion.correctAnswer
                                    }
                                </strong>

                            </div>


                            <p className="student-game-next-hint">
                                等待老師進入下一題…
                            </p>

                        </div>

                    )}

                </section>

            </main>

        </div>
    );
}

export default StudentGame;