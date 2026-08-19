import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    collection,
    getDocs
} from "firebase/firestore";

import { db } from "../firebase/firebase";

import "../styles/StudentResult.css";


function StudentResult() {
    const location = useLocation();
    const navigate = useNavigate();

    const roomCode = location.state?.roomCode;
    const playerId = location.state?.playerId;
    const playerName = location.state?.playerName;

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");


    /* =========================
       讀取成績
    ========================= */

    useEffect(() => {
        if (!roomCode || !playerId) {
            setLoading(false);
            return;
        }

        async function loadResult() {
            try {
                const playersRef = collection(
                    db,
                    "rooms",
                    roomCode,
                    "players"
                );

                const snapshot =
                    await getDocs(playersRef);


                const players =
                    snapshot.docs.map(
                        (playerDoc) => ({
                            id: playerDoc.id,
                            ...playerDoc.data()
                        })
                    );


                /* 分數由高到低 */

                players.sort((a, b) => {
                    const scoreA =
                        a.score ?? 0;

                    const scoreB =
                        b.score ?? 0;

                    return scoreB - scoreA;
                });


                const playerIndex =
                    players.findIndex(
                        (player) =>
                            player.id === playerId
                    );


                if (playerIndex === -1) {
                    setErrorMessage(
                        "找不到你的成績"
                    );

                    return;
                }


                const player =
                    players[playerIndex];


                setResult({
                    rank: playerIndex + 1,
                    totalPlayers:
                        players.length,

                    name:
                        player.name ??
                        playerName,

                    score:
                        player.score ?? 0,

                    correctCount:
                        player.correctCount ?? 0
                });

            } catch (error) {
                console.error(
                    "讀取成績失敗：",
                    error
                );

                setErrorMessage(
                    "無法讀取成績"
                );

            } finally {
                setLoading(false);
            }
        }


        loadResult();

    }, [
        roomCode,
        playerId,
        playerName
    ]);


    /* =========================
       缺少資料
    ========================= */

    if (!roomCode || !playerId) {
        return (
            <div className="student-result-state-page">

                <div className="student-result-state-card">

                    <h1>
                        無法查看結果
                    </h1>

                    <p>
                        缺少玩家或教室資料。
                    </p>

                    <button
                        type="button"
                        className="primary-button"
                        onClick={() =>
                            navigate("/")
                        }
                    >
                        返回首頁
                    </button>

                </div>

            </div>
        );
    }


    /* =========================
       載入
    ========================= */

    if (loading) {
        return (
            <div className="student-result-state-page">

                <div className="student-result-loading">
                    載入成績中...
                </div>

            </div>
        );
    }


    /* =========================
       錯誤
    ========================= */

    if (errorMessage) {
        return (
            <div className="student-result-state-page">

                <div className="student-result-state-card">

                    <h1>
                        發生錯誤
                    </h1>

                    <p>
                        {errorMessage}
                    </p>

                    <button
                        type="button"
                        className="primary-button"
                        onClick={() =>
                            navigate("/")
                        }
                    >
                        返回首頁
                    </button>

                </div>

            </div>
        );
    }


    return (
        <div className="student-result-page">


            {/* =========================
                Header
            ========================= */}

            <header className="student-result-header">

                <div className="student-result-logo">

                    <div className="student-result-logo-icon">
                        E
                    </div>

                    <span>
                        EduGame
                    </span>

                </div>

            </header>


            {/* =========================
                Main
            ========================= */}

            <main className="student-result-main">

                <div className="student-result-wrapper">


                    {/* 標題 */}

                    <div className="student-result-title">

                        <h1>
                            遊戲結果
                        </h1>

                        <p>
                            {result.name}
                        </p>

                    </div>


                    {/* =========================
                        排名
                    ========================= */}

                    <section
                        className={`student-result-rank ${
                            result.rank === 1
                                ? "first"
                                : ""
                        }`}
                    >

                        <span className="student-result-rank-label">
                            你的排名
                        </span>


                        <div className="student-result-rank-number">

                            <span>
                                第
                            </span>

                            <strong>
                                {result.rank}
                            </strong>

                            <span>
                                名
                            </span>

                        </div>


                        <p>
                            共 {result.totalPlayers} 位玩家
                        </p>

                    </section>


                    {/* =========================
                        成績
                    ========================= */}

                    <section className="student-result-stats">

                        <div className="student-result-stat">

                            <span>
                                分數
                            </span>

                            <strong>
                                {result.score}
                            </strong>

                        </div>


                        <div className="student-result-stat">

                            <span>
                                答對題數
                            </span>

                            <strong>
                                {result.correctCount}
                            </strong>

                            <small>
                                題
                            </small>

                        </div>

                    </section>


                    {/* 第一名 */}

                    {result.rank === 1 && (

                        <div className="student-result-first-message">
                            第一名！
                        </div>

                    )}


                    {/* =========================
                        返回首頁
                    ========================= */}

                    <button
                        type="button"
                        className="primary-button student-result-button"
                        onClick={() =>
                            navigate("/")
                        }
                    >
                        返回首頁
                    </button>

                </div>

            </main>

        </div>
    );
}


export default StudentResult;