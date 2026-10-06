import {
    useEffect,
    useMemo,
    useState
} from "react";

import {
    collection,
    onSnapshot
} from "firebase/firestore";

import { db } from "../firebase/firebase";

import "../styles/TeacherRunnerGame.css";

import { useNavigate } from "react-router-dom";


function TeacherRunnerGame({
    roomCode
}) {

    /* =========================
       State
    ========================= */
    const navigate = useNavigate();

    const [
        players,
        setPlayers
    ] = useState([]);


    const [
        loading,
        setLoading
    ] = useState(true);


    const [
        errorMessage,
        setErrorMessage
    ] = useState("");


    /* =========================
       監聽學生資料
    ========================= */

    useEffect(() => {

        if (!roomCode) {

            setLoading(false);

            setErrorMessage(
                "缺少教室代碼"
            );

            return;
        }


        const playersRef =
            collection(
                db,
                "rooms",
                roomCode,
                "players"
            );


        const unsubscribe =
            onSnapshot(
                playersRef,

                (snapshot) => {

                    const playerList =
                        snapshot.docs.map(
                            (playerDoc) => {

                                const data =
                                    playerDoc.data();

                                return {
                                    id:
                                        playerDoc.id,

                                    ...data
                                };
                            }
                        );


                    setPlayers(
                        playerList
                    );

                    setLoading(false);

                    setErrorMessage("");

                },

                (error) => {

                    console.error(
                        "監聽 Runner 學生資料失敗：",
                        error
                    );

                    setLoading(false);

                    setErrorMessage(
                        "無法取得學生遊戲狀態"
                    );

                }
            );


        return () => {

            unsubscribe();

        };

    }, [
        roomCode
    ]);


    /* =========================
       Runner 玩家
    ========================= */

    const runnerPlayers =
        useMemo(() => {

            return players
                .filter((player) => {

                    return (
                        player.runnerStatus ===
                            "playing" ||

                        player.runnerStatus ===
                            "finished"
                    );

                })
                .sort((a, b) => {

                    /*
                     * 遊戲中的學生排前面
                     */

                    if (
                        a.runnerStatus !==
                        b.runnerStatus
                    ) {

                        if (
                            a.runnerStatus ===
                            "playing"
                        ) {
                            return -1;
                        }

                        if (
                            b.runnerStatus ===
                            "playing"
                        ) {
                            return 1;
                        }

                    }


                    /*
                     * 同狀態時
                     * 依答對題數排列
                     */

                    return (
                        (b.runnerCorrectCount ?? 0) -
                        (a.runnerCorrectCount ?? 0)
                    );

                });

        }, [
            players
        ]);


    /* =========================
       全班統計
    ========================= */

    const totalPlayers =
        runnerPlayers.length;


    const playingCount =
        runnerPlayers.filter(
            (player) =>
                player.runnerStatus ===
                "playing"
        ).length;


    const finishedCount =
        runnerPlayers.filter(
            (player) =>
                player.runnerStatus ===
                "finished"
        ).length;

    /* =========================
    是否全部結束
    ========================= */

    const allFinished =
        totalPlayers > 0 &&
        finishedCount === totalPlayers;

    /* =========================
    查看結果
    ========================= */

    const handleViewResult = () => {

        if (!allFinished) {
            return;
        }

        navigate(
            "/teacher/runner-result",
            {
                state: {
                    roomCode
                }
            }
        );

    };

    /* =========================
       正確率
    ========================= */

    const getAccuracy =
        (player) => {

            const correct =
                player.runnerCorrectCount ??
                0;

            const wrong =
                player.runnerWrongCount ??
                0;

            const total =
                correct + wrong;


            if (total === 0) {
                return 0;
            }


            return Math.round(
                correct /
                total *
                100
            );

        };


    /* =========================
       Loading
    ========================= */

    if (loading) {

        return (
            <div className="teacher-runner-page">

                <div className="teacher-runner-loading">

                    正在取得學生狀態...

                </div>

            </div>
        );

    }


    /* =========================
       Render
    ========================= */

    return (

        <div className="teacher-runner-page">

            {/* =====================
                Header
            ===================== */}

            <header className="teacher-runner-header">

                <div>

                    <h1>
                        跑酷模式
                    </h1>

                    <p>
                        教室代碼：
                        <strong>
                            {roomCode}
                        </strong>
                    </p>

                </div>


                <div
                    className={
                        allFinished
                            ? "teacher-runner-status finished"
                            : "teacher-runner-status"
                    }
                >

                    {allFinished
                        ? "遊戲已結束"
                        : "遊戲進行中"}

                </div>

            </header>


            {/* =====================
                錯誤訊息
            ===================== */}

            {errorMessage && (

                <div className="teacher-runner-error">

                    {errorMessage}

                </div>

            )}


            {/* =====================
                全班概況
            ===================== */}

            <section className="teacher-runner-summary">

                <div className="runner-summary-item">

                    <span className="runner-summary-number">
                        {totalPlayers}
                    </span>

                    <span className="runner-summary-label">
                        參與學生
                    </span>

                </div>


                <div className="runner-summary-divider" />


                <div className="runner-summary-item">

                    <span className="runner-summary-number">
                        {playingCount}
                    </span>

                    <span className="runner-summary-label">
                        遊戲中
                    </span>

                </div>


                <div className="runner-summary-divider" />


                <div className="runner-summary-item">

                    <span className="runner-summary-number">
                        {finishedCount}
                    </span>

                    <span className="runner-summary-label">
                        已結束
                    </span>

                </div>

            </section>

            {/* =====================
                查看結果
            ===================== */}

            <div className="teacher-runner-result-action">

                {!allFinished && totalPlayers > 0 && (

                    <p>
                        還有 {playingCount} 位學生正在遊戲中
                    </p>

                )}


                <button
                    type="button"
                    className="teacher-runner-result-button"
                    onClick={handleViewResult}
                    disabled={!allFinished}
                >

                    {allFinished
                        ? "查看遊戲結果 →"
                        : "等待所有學生完成"}

                </button>

            </div>


            {/* =====================
                學生列表
            ===================== */}

            <section className="teacher-runner-players">

                <div className="teacher-runner-list-title">

                    <h2>
                        學生狀態
                    </h2>

                    <span>
                        即時更新
                    </span>

                </div>


                {runnerPlayers.length === 0 ? (

                    <div className="teacher-runner-empty">

                        尚未有學生開始遊戲

                    </div>

                ) : (

                    <div className="teacher-runner-table-wrapper">

                        <table className="teacher-runner-table">

                            <thead>

                                <tr>

                                    <th>
                                        學生
                                    </th>

                                    <th>
                                        答對
                                    </th>

                                    <th>
                                        答錯
                                    </th>

                                    <th>
                                        正確率
                                    </th>

                                    <th>
                                        復活
                                    </th>

                                    <th>
                                        狀態
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {runnerPlayers.map(
                                    (player) => {

                                        const correct =
                                            player.runnerCorrectCount ??
                                            0;

                                        const wrong =
                                            player.runnerWrongCount ??
                                            0;

                                        const revive =
                                            player.runnerReviveCount ??
                                            0;

                                        const accuracy =
                                            getAccuracy(
                                                player
                                            );


                                        const isPlaying =
                                            player.runnerStatus ===
                                            "playing";


                                        return (

                                            <tr
                                                key={
                                                    player.id
                                                }
                                            >

                                                {/* 學生 */}

                                                <td>

                                                    <div className="runner-player-name">

                                                        {player.name ??
                                                            player.playerName ??
                                                            "未命名"}

                                                    </div>

                                                </td>


                                                {/* 答對 */}

                                                <td>

                                                    <span className="runner-correct">

                                                        {correct}

                                                    </span>

                                                </td>


                                                {/* 答錯 */}

                                                <td>

                                                    <span className="runner-wrong">

                                                        {wrong}

                                                    </span>

                                                </td>


                                                {/* 正確率 */}

                                                <td>

                                                    <div className="runner-accuracy">

                                                        <span>

                                                            {accuracy}%

                                                        </span>

                                                        <div className="runner-accuracy-bar">

                                                            <div
                                                                className="runner-accuracy-value"
                                                                style={{
                                                                    width:
                                                                        `${accuracy}%`
                                                                }}
                                                            />

                                                        </div>

                                                    </div>

                                                </td>


                                                {/* 復活 */}

                                                <td>

                                                    <span className="runner-revive">

                                                        {revive} / 3

                                                    </span>

                                                </td>


                                                {/* 狀態 */}

                                                <td>

                                                    <span
                                                        className={
                                                            isPlaying
                                                                ? "runner-player-status playing"
                                                                : "runner-player-status finished"
                                                        }
                                                    >

                                                        {
                                                            isPlaying
                                                                ? "遊戲中"
                                                                : "已結束"
                                                        }

                                                    </span>

                                                </td>

                                            </tr>

                                        );

                                    }
                                )}

                            </tbody>

                        </table>

                    </div>

                )}

            </section>

        </div>

    );

}


export default TeacherRunnerGame;