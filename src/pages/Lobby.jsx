import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";

import { db } from "../firebase/firebase";

import {
    setPlayerOnline,
    setPlayerOffline,
    subscribeOnlinePlayers
} from "../firebase/presenceService";

import "../styles/Lobby.css";


function Lobby() {
    const location = useLocation();
    const navigate = useNavigate();

    const roomCode = location.state?.roomCode;
    const roomName = location.state?.roomName;
    const playerName = location.state?.playerName;
    const playerId = location.state?.playerId;

    const [players, setPlayers] = useState([]);
    const [errorMessage, setErrorMessage] = useState("");


    /* =========================
       設定學生在線
    ========================= */

    useEffect(() => {
        if (!roomCode || !playerId || !playerName) {
            return;
        }

        setPlayerOnline(
            roomCode,
            playerId,
            playerName
        ).catch((error) => {
            console.error(
                "設定玩家在線狀態失敗：",
                error
            );

            setErrorMessage(
                "無法設定在線狀態"
            );
        });


        return () => {
            setPlayerOffline(
                roomCode,
                playerId
            ).catch((error) => {
                console.error(
                    "移除玩家在線狀態失敗：",
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
                    setPlayers(onlinePlayers);
                },

                (error) => {
                    console.error(
                        "讀取在線玩家失敗：",
                        error
                    );

                    setErrorMessage(
                        "無法取得在線玩家名單"
                    );
                }
            );

        return () => unsubscribe();

    }, [roomCode]);


    /* =========================
       監聽老師開始遊戲
    ========================= */

    useEffect(() => {
        if (!roomCode) {
            return;
        }

        const roomRef =
            doc(
                db,
                "rooms",
                roomCode
            );


        const unsubscribe =
            onSnapshot(

                roomRef,

                (roomSnapshot) => {

                    if (!roomSnapshot.exists()) {
                        setErrorMessage(
                            "教室不存在或已被刪除"
                        );

                        return;
                    }


                    const roomData =
                        roomSnapshot.data();


                    if (
                        roomData.status ===
                        "playing"
                    ) {
                        navigate("/game", {
                            state: {
                                roomCode,
                                roomName:
                                    roomData.roomName,
                                gameMode:
                                    roomData.gameMode,
                                playerId,
                                playerName,
                                role: "student"
                            }
                        });
                    }
                },

                (error) => {
                    console.error(
                        "監聽教室狀態失敗：",
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
        playerId,
        playerName,
        navigate
    ]);


    /* =========================
       缺少資料
    ========================= */

    if (!roomCode) {
        return (
            <div className="student-lobby-page">

                <header className="student-lobby-header">

                    <Link
                        to="/"
                        className="student-lobby-logo"
                    >
                        <div className="student-lobby-logo-icon">
                            E
                        </div>

                        <span>
                            EduGame
                        </span>
                    </Link>

                </header>


                <main className="student-lobby-error-main">

                    <div className="student-lobby-error-card">

                        <h1>
                            無法進入等待室
                        </h1>

                        <p>
                            缺少教室資料，
                            請重新加入教室。
                        </p>

                        <button
                            className="primary-button"
                            type="button"
                            onClick={() =>
                                navigate("/student")
                            }
                        >
                            返回加入教室
                        </button>

                    </div>

                </main>

            </div>
        );
    }


    return (
        <div className="student-lobby-page">

            {/* =========================
                Header
            ========================= */}

            <header className="student-lobby-header">

                <Link
                    to="/"
                    className="student-lobby-logo"
                >
                    <div className="student-lobby-logo-icon">
                        E
                    </div>

                    <span>
                        EduGame
                    </span>
                </Link>


                <Link
                    to="/"
                    className="student-lobby-home"
                >
                    ← 返回首頁
                </Link>

            </header>


            {/* =========================
                Main
            ========================= */}

            <main className="student-lobby-main">

                <div className="student-lobby-wrapper">


                    {/* 卡片底層 */}

                    <div className="student-lobby-shadow">

                        <div className="student-lobby-card">


                            {/* =========================
                                等待狀態
                            ========================= */}

                            <section className="student-lobby-status">

                                <div className="student-lobby-status-icon">
                                    …
                                </div>

                                <h1>
                                    等待老師開始遊戲
                                </h1>

                                <p>
                                    遊戲開始後會自動進入
                                </p>

                            </section>


                            {/* =========================
                                教室資訊
                            ========================= */}

                            <section className="student-lobby-info">

                                <div className="student-lobby-info-item">

                                    <span>
                                        教室名稱
                                    </span>

                                    <strong>
                                        {roomName || "未設定"}
                                    </strong>

                                </div>


                                <div className="student-lobby-info-item code">

                                    <span>
                                        教室代碼
                                    </span>

                                    <strong>
                                        {roomCode}
                                    </strong>

                                </div>


                                <div className="student-lobby-info-item">

                                    <span>
                                        你的名稱
                                    </span>

                                    <strong>
                                        {playerName}
                                    </strong>

                                </div>

                            </section>


                            <div className="student-lobby-divider" />


                            {/* =========================
                                在線玩家
                            ========================= */}

                            <section className="student-lobby-players">

                                <div className="student-lobby-players-header">

                                    <h2>
                                        在線玩家
                                    </h2>

                                    <span>
                                        {players.length} 人
                                    </span>

                                </div>


                                {errorMessage && (
                                    <div className="student-lobby-error">
                                        {errorMessage}
                                    </div>
                                )}


                                {players.length === 0 ? (

                                    <div className="student-lobby-empty">

                                        <strong>
                                            目前沒有在線玩家
                                        </strong>

                                    </div>

                                ) : (

                                    <div className="student-lobby-player-grid">

                                        {players.map(
                                            (player, index) => (

                                                <div
                                                    className={`student-lobby-player ${
                                                        player.id === playerId
                                                            ? "me"
                                                            : ""
                                                    }`}
                                                    key={player.id}
                                                >

                                                    <div className="student-lobby-player-number">
                                                        {String(
                                                            index + 1
                                                        ).padStart(
                                                            2,
                                                            "0"
                                                        )}
                                                    </div>


                                                    <span className="student-lobby-player-name">
                                                        {player.name}
                                                    </span>


                                                    {player.id ===
                                                        playerId && (
                                                        <span className="student-lobby-me">
                                                            你
                                                        </span>
                                                    )}

                                                </div>

                                            )
                                        )}

                                    </div>

                                )}

                            </section>

                        </div>

                    </div>

                </div>

            </main>

        </div>
    );
}

export default Lobby;