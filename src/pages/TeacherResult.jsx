import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
    collection,
    getDocs
} from "firebase/firestore";

import { db } from "../firebase/firebase";

import "../styles/TeacherResult.css";


function TeacherResult() {
    const location = useLocation();

    const roomCode = location.state?.roomCode;
    const roomName = location.state?.roomName;

    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");


    /* =========================
       讀取結果
    ========================= */

    useEffect(() => {
        if (!roomCode) {
            setLoading(false);
            return;
        }

        async function loadResults() {
            try {
                const playersRef = collection(
                    db,
                    "rooms",
                    roomCode,
                    "players"
                );

                const snapshot =
                    await getDocs(playersRef);


                const list =
                    snapshot.docs.map(
                        (playerDoc) => ({
                            id: playerDoc.id,
                            ...playerDoc.data()
                        })
                    );


                /* 分數高的排前面 */

                list.sort((a, b) => {
                    const scoreA =
                        a.score ?? 0;

                    const scoreB =
                        b.score ?? 0;

                    return scoreB - scoreA;
                });


                setPlayers(list);

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


        loadResults();

    }, [roomCode]);


    /* =========================
       狀態頁
    ========================= */

    if (!roomCode) {
        return (
            <div className="result-state-page">

                <div className="result-state-card">

                    <h1>
                        無法查看結果
                    </h1>

                    <p>
                        缺少教室資料。
                    </p>

                    <Link
                        to="/"
                        className="primary-button result-state-button"
                    >
                        返回首頁
                    </Link>

                </div>

            </div>
        );
    }


    if (loading) {
        return (
            <div className="result-state-page">

                <div className="result-loading">
                    載入成績中...
                </div>

            </div>
        );
    }


    if (errorMessage) {
        return (
            <div className="result-state-page">

                <div className="result-state-card">

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


    const topThree =
        players.slice(0, 3);

    const otherPlayers =
        players.slice(3);


    return (
        <div className="teacher-result-page">

            <header className="teacher-result-header">

                <Link
                    to="/"
                    className="teacher-result-logo"
                >
                    <div className="teacher-result-logo-icon">
                        E
                    </div>

                    <span>
                        EduGame
                    </span>
                </Link>


                <Link
                    to="/"
                    className="teacher-result-home"
                >
                    ← 返回首頁
                </Link>

            </header>


            <main className="teacher-result-main">

                <div className="teacher-result-wrapper">


                    {/* 標題 */}

                    <section className="teacher-result-title">

                        <h1>
                            遊戲結果
                        </h1>


                        <div className="teacher-result-room">

                            <span>
                                {roomName || "未設定教室"}
                            </span>

                            <strong>
                                {roomCode}
                            </strong>

                        </div>

                    </section>


                    {players.length === 0 ? (

                        <div className="teacher-result-empty">

                            <strong>
                                目前沒有成績
                            </strong>

                            <p>
                                尚未有學生完成遊戲
                            </p>

                        </div>

                    ) : (

                        <div className="teacher-result-content">


                            {/* =========================
                                第一名
                            ========================= */}

                            <section className="teacher-result-winner">

                                <div className="winner-rank">
                                    1
                                </div>

                                <span className="winner-label">
                                    第 1 名
                                </span>

                                <h2>
                                    {players[0].name}
                                </h2>


                                <div className="winner-score">

                                    <strong>
                                        {players[0].score ?? 0}
                                    </strong>

                                    <span>
                                        分
                                    </span>

                                </div>


                                <div className="winner-correct">
                                    答對 {players[0].correctCount ?? 0} 題
                                </div>

                            </section>


                            {/* =========================
                                排行榜
                            ========================= */}

                            <section className="teacher-result-ranking">

                                <div className="teacher-result-ranking-header">

                                    <h2>
                                        排行榜
                                    </h2>

                                    <span>
                                        共 {players.length} 人
                                    </span>

                                </div>


                                <div className="teacher-result-ranking-list">

                                    {players
                                        .slice(1)
                                        .map(
                                            (player, index) => {

                                                const rank =
                                                    index + 2;

                                                return (
                                                    <div
                                                        className="teacher-result-ranking-item"
                                                        key={player.id}
                                                    >

                                                        <div className="ranking-number">
                                                            {rank}
                                                        </div>


                                                        <div className="ranking-name">
                                                            {player.name}
                                                        </div>


                                                        <div className="ranking-data">

                                                            <div>
                                                                <span>
                                                                    分數
                                                                </span>

                                                                <strong>
                                                                    {player.score ?? 0}
                                                                </strong>
                                                            </div>


                                                            <div>
                                                                <span>
                                                                    答對
                                                                </span>

                                                                <strong>
                                                                    {player.correctCount ?? 0}
                                                                </strong>
                                                            </div>

                                                        </div>

                                                    </div>
                                                );
                                            }
                                        )}

                                </div>

                            </section>

                        </div>

                    )}


                    <div className="teacher-result-actions">

                        <Link
                            to="/"
                            className="primary-button teacher-result-button"
                        >
                            返回首頁
                        </Link>

                    </div>

                </div>

            </main>

        </div>
    );
}

export default TeacherResult;