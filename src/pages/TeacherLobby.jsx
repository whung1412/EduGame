import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
    doc,
    Timestamp,
    updateDoc
} from "firebase/firestore";

import { subscribeOnlinePlayers } from "../firebase/presenceService";
import { db } from "../firebase/firebase";

import "../styles/TeacherLobby.css";


function TeacherLobby() {
    const location = useLocation();
    const navigate = useNavigate();

    const roomCode = location.state?.roomCode;
    const roomName = location.state?.roomName;
    const gameMode = location.state?.gameMode;

    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");


    /* =========================
       在線學生
    ========================= */

    useEffect(() => {
        if (!roomCode) {
            return;
        }

        const unsubscribe = subscribeOnlinePlayers(
            roomCode,

            (onlinePlayers) => {
                setPlayers(onlinePlayers);
            },

            (error) => {
                console.error(
                    "讀取在線玩家失敗：",
                    error
                );

                setErrorMessage(
                    "無法讀取在線玩家"
                );
            }
        );

        return () => unsubscribe();

    }, [roomCode]);


    /* =========================
       開始遊戲
    ========================= */

    const handleStartGame = async () => {
        if (!roomCode) {
            return;
        }

        if (players.length === 0) {
            alert("目前尚未有學生加入");
            return;
        }

        try {
            setLoading(true);
            setErrorMessage("");

            const roomRef = doc(
                db,
                "rooms",
                roomCode
            );

            await updateDoc(roomRef, {
                status: "playing",
                currentQuestionIndex: 0,
                questionPhase: "answering",
                startedAt: Timestamp.now()
            });

            navigate("/game", {
                state: {
                    roomCode,
                    roomName,
                    gameMode,
                    role: "teacher"
                }
            });

        } catch (error) {
            console.error(
                "開始遊戲失敗：",
                error
            );

            setErrorMessage(
                "開始遊戲失敗，請稍後再試"
            );

        } finally {
            setLoading(false);
        }
    };


    /* =========================
       遊戲模式名稱
    ========================= */

    const getGameModeName = (mode) => {
        switch (mode) {

            case "quiz":
                return "問答";

            case "runner":
                return "跑酷";

            case "shooter":
                return "射擊";

            case "memory":
                return "配對";

            default:
                return mode || "未設定";
        }
    };


    /* =========================
       缺少教室資料
    ========================= */

    if (!roomCode) {
        return (
            <div className="lobby-page">

                <header className="lobby-header">

                    <Link
                        to="/"
                        className="lobby-logo"
                    >
                        <div className="lobby-logo-icon">
                            E
                        </div>

                        <span>EduGame</span>
                    </Link>

                </header>


                <main className="lobby-error-main">

                    <div className="lobby-error-card">

                        <h1>
                            無法進入教師等待室
                        </h1>

                        <p>
                            缺少教室資料，請重新輸入
                            教室代碼與密碼。
                        </p>

                        <button
                            className="primary-button"
                            type="button"
                            onClick={() =>
                                navigate("/teacher/login")
                            }
                        >
                            返回教師登入
                        </button>

                    </div>

                </main>

            </div>
        );
    }


    return (
        <div className="lobby-page">

            {/* =========================
                Header
            ========================= */}

            <header className="lobby-header">

                <Link
                    to="/"
                    className="lobby-logo"
                >
                    <div className="lobby-logo-icon">
                        E
                    </div>

                    <span>
                        EduGame
                    </span>
                </Link>


                <Link
                    to="/"
                    className="lobby-home"
                >
                    ← 返回首頁
                </Link>

            </header>


            {/* =========================
                Main
            ========================= */}

            <main className="lobby-main">

                <div className="lobby-wrapper">

                    {/* =========================
                        卡片
                    ========================= */}

                    <div className="lobby-card-shadow">

                        <div className="lobby-card">


                            {/* 教室代碼 */}

                            <section className="lobby-code-section">

                                <span className="lobby-code-label">
                                    教室代碼
                                </span>

                                <div className="lobby-code">
                                    {roomCode}
                                </div>

                                <p>
                                    請將代碼提供給學生
                                </p>

                            </section>


                            {/* =========================
                                教室資訊
                            ========================= */}

                            <section className="lobby-info-grid">

                                <div className="lobby-info-item">

                                    <span>
                                        教室名稱
                                    </span>

                                    <strong>
                                        {roomName || "未設定"}
                                    </strong>

                                </div>


                                <div className="lobby-info-item">

                                    <span>
                                        遊戲模式
                                    </span>

                                    <strong>
                                        {getGameModeName(gameMode)}
                                    </strong>

                                </div>


                                <div className="lobby-info-item">

                                    <span>
                                        目前人數
                                    </span>

                                    <strong>
                                        {players.length} 人
                                    </strong>

                                </div>

                            </section>


                            <div className="lobby-divider" />


                            {/* =========================
                                學生
                            ========================= */}

                            <section className="lobby-players">

                                <div className="lobby-players-header">

                                    <h2>
                                        已加入學生
                                    </h2>

                                    <span>
                                        {players.length} 人
                                    </span>

                                </div>


                                {errorMessage && (
                                    <div className="lobby-error-message">
                                        {errorMessage}
                                    </div>
                                )}


                                {players.length === 0 ? (

                                    <div className="lobby-empty">

                                        <div className="lobby-empty-icon">
                                            …
                                        </div>

                                        <strong>
                                            等待學生加入
                                        </strong>

                                        <p>
                                            學生加入後會顯示在這裡
                                        </p>

                                    </div>

                                ) : (

                                    <div className="lobby-player-grid">

                                        {players.map(
                                            (player, index) => (

                                                <div
                                                    className="lobby-player"
                                                    key={player.id}
                                                >

                                                    <div className="lobby-player-number">
                                                        {String(
                                                            index + 1
                                                        ).padStart(
                                                            2,
                                                            "0"
                                                        )}
                                                    </div>

                                                    <span>
                                                        {player.name}
                                                    </span>

                                                </div>

                                            )
                                        )}

                                    </div>

                                )}

                            </section>


                            {/* =========================
                                開始
                            ========================= */}

                            <button
                                className="primary-button lobby-start"
                                type="button"
                                onClick={handleStartGame}
                                disabled={
                                    loading ||
                                    players.length === 0
                                }
                            >
                                {loading
                                    ? "開始中..."
                                    : "開始遊戲 →"}
                            </button>

                        </div>

                    </div>

                </div>

            </main>

        </div>
    );
}

export default TeacherLobby;