import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import {
    collection,
    doc,
    onSnapshot,
    orderBy,
    query,
    updateDoc
} from "firebase/firestore";

import { db } from "../firebase/firebase";
import { getQuestions } from "../firebase/questionService";
import { subscribeOnlinePlayers } from "../firebase/presenceService";

import "../styles/TeacherGame.css";


function TeacherGame() {
    const location = useLocation();
    const navigate = useNavigate();

    const roomCode = location.state?.roomCode;
    const roomName = location.state?.roomName;

    const [questions, setQuestions] = useState([]);
    const [players, setPlayers] = useState([]);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [questionPhase, setQuestionPhase] =
        useState("answering");

    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    const [onlinePlayerIds, setOnlinePlayerIds] = useState([]);


    /* =========================
       玩家顯示名稱
    ========================= */

    const getDisplayName = (player) => {
        const sameNamePlayers = players.filter(
            (p) => p.name === player.name
        );

        if (sameNamePlayers.length <= 1) {
            return player.name;
        }

        const sameNameIndex = sameNamePlayers.findIndex(
            (p) => p.id === player.id
        );

        return `${player.name}（${sameNameIndex + 1}）`;
    };


    /* =========================
       讀取題目
    ========================= */

    useEffect(() => {
        if (!roomCode) {
            setLoading(false);
            return;
        }

        async function loadQuestions() {
            try {
                setLoading(true);

                const list = await getQuestions(roomCode);

                if (list.length === 0) {
                    setErrorMessage("這個教室沒有題目");
                    return;
                }

                setQuestions(list);

            } catch (error) {
                console.error("讀取題目失敗：", error);
                setErrorMessage("無法讀取題目");

            } finally {
                setLoading(false);
            }
        }

        loadQuestions();

    }, [roomCode]);


    /* =========================
       監聽教室狀態
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
                    setErrorMessage("教室不存在");
                    return;
                }

                const data = snapshot.data();

                if (
                    typeof data.currentQuestionIndex ===
                    "number"
                ) {
                    setCurrentIndex(
                        data.currentQuestionIndex
                    );
                }

                if (data.questionPhase) {
                    setQuestionPhase(
                        data.questionPhase
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

    }, [roomCode]);


    /* =========================
       學生資料
    ========================= */

    useEffect(() => {
        if (!roomCode) {
            return;
        }

        const playersRef = collection(
            db,
            "rooms",
            roomCode,
            "players"
        );

        const playersQuery = query(
            playersRef,
            orderBy("joinedAt", "asc")
        );

        const unsubscribe = onSnapshot(
            playersQuery,

            (snapshot) => {
                const list = snapshot.docs.map(
                    (playerDoc) => ({
                        id: playerDoc.id,
                        ...playerDoc.data()
                    })
                );

                setPlayers(list);
            },

            (error) => {
                console.error(
                    "讀取學生資料失敗：",
                    error
                );
            }
        );

        return () => unsubscribe();

    }, [roomCode]);


    /* =========================
       在線學生
    ========================= */

    useEffect(() => {
        if (!roomCode) {
            return;
        }

        const unsubscribe =
            subscribeOnlinePlayers(

                roomCode,

                (onlinePlayers) => {
                    const ids =
                        onlinePlayers.map(
                            (player) => player.id
                        );

                    setOnlinePlayerIds(ids);
                },

                (error) => {
                    console.error(
                        "讀取在線學生失敗：",
                        error
                    );
                }
            );

        return () => unsubscribe();

    }, [roomCode]);


    /* =========================
       答題進度
    ========================= */

    const onlinePlayers = players.filter(
        (player) =>
            onlinePlayerIds.includes(player.id)
    );

    const answeredPlayers = onlinePlayers.filter(
        (player) =>
            player.answeredQuestionIndex ===
            currentIndex
    );

    const allAnswered =
        onlinePlayers.length > 0 &&
        answeredPlayers.length ===
            onlinePlayers.length;


    /* =========================
       全部答完自動公布
    ========================= */

    useEffect(() => {
        if (
            !roomCode ||
            questionPhase !== "answering" ||
            !allAnswered
        ) {
            return;
        }

        const revealAutomatically = async () => {
            try {
                const roomRef = doc(
                    db,
                    "rooms",
                    roomCode
                );

                await updateDoc(roomRef, {
                    questionPhase: "revealed"
                });

            } catch (error) {
                console.error(
                    "自動公布答案失敗：",
                    error
                );
            }
        };

        revealAutomatically();

    }, [
        roomCode,
        questionPhase,
        allAnswered
    ]);


    /* =========================
       提前公布答案
    ========================= */

    const handleRevealAnswer = async () => {
        try {
            const roomRef = doc(
                db,
                "rooms",
                roomCode
            );

            await updateDoc(roomRef, {
                questionPhase: "revealed"
            });

        } catch (error) {
            console.error(
                "公布答案失敗：",
                error
            );
        }
    };


    /* =========================
       下一題
    ========================= */

    const handleNextQuestion = async () => {
        try {
            const roomRef = doc(
                db,
                "rooms",
                roomCode
            );

            if (
                currentIndex <
                questions.length - 1
            ) {
                await updateDoc(roomRef, {
                    currentQuestionIndex:
                        currentIndex + 1,

                    questionPhase: "answering"
                });

                return;
            }


            await updateDoc(roomRef, {
                status: "finished",
                questionPhase: "finished"
            });


            navigate("/teacher/result", {
                state: {
                    roomCode,
                    roomName
                }
            });

        } catch (error) {
            console.error(
                "切換下一題失敗：",
                error
            );
        }
    };


    /* =========================
       狀態畫面
    ========================= */

    if (!roomCode) {
        return (
            <div className="teacher-game-state-page">

                <div className="teacher-game-state-card">

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
            <div className="teacher-game-state-page">

                <div className="teacher-game-loading">
                    載入題目中...
                </div>

            </div>
        );
    }


    if (errorMessage) {
        return (
            <div className="teacher-game-state-page">

                <div className="teacher-game-state-card">

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
            <div className="teacher-game-state-page">
                找不到目前題目
            </div>
        );
    }


    return (
        <div className="teacher-game-page">

            {/* =========================
                Header
            ========================= */}

            <header className="teacher-game-header">

                <Link
                    to="/"
                    className="teacher-game-logo"
                >
                    <div className="teacher-game-logo-icon">
                        E
                    </div>

                    <span>
                        EduGame
                    </span>
                </Link>


                <div className="teacher-game-room">
                    {roomName}
                </div>

            </header>


            {/* =========================
                Main
            ========================= */}

            <main className="teacher-game-main">


                {/* =========================
                    題目區
                ========================= */}

                <section className="teacher-game-question-area">


                    {/* 題目資訊 */}

                    <div className="teacher-game-question-top">

                        <div className="teacher-game-progress-label">
                            第 {currentIndex + 1} 題
                        </div>

                        <div className="teacher-game-progress-count">
                            {currentIndex + 1}
                            <span>
                                / {questions.length}
                            </span>
                        </div>

                    </div>


                    {/* 進度條 */}

                    <div className="teacher-game-progress">

                        <div
                            className="teacher-game-progress-bar"
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


                    {/* 題目 */}

                    <div className="teacher-game-question-card">

                        <h1>
                            {currentQuestion.question}
                        </h1>

                    </div>


                    {/* =========================
                        選項
                    ========================= */}

                    <div className="teacher-game-options">

                        {currentQuestion.options.map(
                            (option, index) => {

                                const isCorrect =
                                    option ===
                                    currentQuestion.correctAnswer;

                                const optionLetter =
                                    String.fromCharCode(
                                        65 + index
                                    );

                                return (
                                    <div
                                        key={`${option}-${index}`}
                                        className={`teacher-game-option ${
                                            questionPhase ===
                                                "revealed" &&
                                            isCorrect
                                                ? "correct"
                                                : ""
                                        }`}
                                    >

                                        <span className="teacher-game-option-letter">
                                            {optionLetter}
                                        </span>

                                        <span className="teacher-game-option-text">
                                            {option}
                                        </span>


                                        {questionPhase ===
                                            "revealed" &&
                                            isCorrect && (
                                                <span className="teacher-game-correct-mark">
                                                    ✓
                                                </span>
                                            )}

                                    </div>
                                );
                            }
                        )}

                    </div>


                    {/* 正確答案 */}

                    {questionPhase === "revealed" && (
                        <div className="teacher-game-answer">

                            <span>
                                正確答案
                            </span>

                            <strong>
                                {
                                    currentQuestion.correctAnswer
                                }
                            </strong>

                        </div>
                    )}

                </section>


                {/* =========================
                    右側控制區
                ========================= */}

                <aside className="teacher-game-sidebar">


                    {/* 答題進度 */}

                    <section className="teacher-game-panel">

                        <div className="teacher-game-panel-header">

                            <h2>
                                答題進度
                            </h2>

                            <span>
                                {answeredPlayers.length}
                                /
                                {onlinePlayers.length}
                            </span>

                        </div>


                        <div className="teacher-game-answer-progress">

                            <div
                                className="teacher-game-answer-progress-bar"
                                style={{
                                    width:
                                        `${
                                            onlinePlayers.length > 0
                                                ? (
                                                    answeredPlayers.length /
                                                    onlinePlayers.length
                                                ) * 100
                                                : 0
                                        }%`
                                }}
                            />

                        </div>

                    </section>


                    {/* 學生 */}

                    <section className="teacher-game-panel teacher-game-player-panel">

                        <div className="teacher-game-panel-header">

                            <h2>
                                學生狀態
                            </h2>

                            <span>
                                {onlinePlayers.length} 人在線
                            </span>

                        </div>


                        <div className="teacher-game-player-list">

                            {players.length === 0 ? (

                                <div className="teacher-game-empty">
                                    目前沒有學生
                                </div>

                            ) : (

                                players.map((player) => {

                                    const isOnline =
                                        onlinePlayerIds.includes(
                                            player.id
                                        );

                                    const answered =
                                        player.answeredQuestionIndex ===
                                        currentIndex;

                                    let statusText =
                                        "尚未回答";

                                    let statusClass =
                                        "waiting";


                                    if (!isOnline) {
                                        statusText =
                                            "已離線";

                                        statusClass =
                                            "offline";

                                    } else if (
                                        questionPhase ===
                                        "revealed"
                                    ) {

                                        if (!answered) {
                                            statusText =
                                                "未作答";

                                            statusClass =
                                                "offline";

                                        } else if (
                                            player.lastCorrect
                                        ) {
                                            statusText =
                                                "正確";

                                            statusClass =
                                                "correct";

                                        } else {
                                            statusText =
                                                "錯誤";

                                            statusClass =
                                                "wrong";
                                        }

                                    } else if (answered) {
                                        statusText =
                                            "已回答";

                                        statusClass =
                                            "answered";
                                    }


                                    return (
                                        <div
                                            key={player.id}
                                            className={`teacher-game-player ${
                                                !isOnline
                                                    ? "offline"
                                                    : ""
                                            }`}
                                        >

                                            <span className="teacher-game-player-name">
                                                {getDisplayName(
                                                    player
                                                )}
                                            </span>

                                            <span
                                                className={`teacher-game-player-status ${statusClass}`}
                                            >
                                                {statusText}
                                            </span>

                                        </div>
                                    );
                                })

                            )}

                        </div>

                    </section>


                    {/* =========================
                        老師控制
                    ========================= */}

                    <section className="teacher-game-control">

                        {questionPhase ===
                        "answering" ? (

                            <>
                                <p>
                                    等待學生作答中…
                                </p>

                                <button
                                    type="button"
                                    className="secondary-button teacher-game-action"
                                    onClick={
                                        handleRevealAnswer
                                    }
                                >
                                    提前公布答案
                                </button>
                            </>

                        ) : questionPhase ===
                          "revealed" ? (

                            <button
                                type="button"
                                className="primary-button teacher-game-action"
                                onClick={
                                    handleNextQuestion
                                }
                            >
                                {currentIndex ===
                                questions.length - 1
                                    ? "結束遊戲 →"
                                    : "下一題 →"}
                            </button>

                        ) : (

                            <p>
                                遊戲已結束
                            </p>

                        )}

                    </section>

                </aside>

            </main>

        </div>
    );
}

export default TeacherGame;