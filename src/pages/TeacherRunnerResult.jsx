import {
    useEffect,
    useMemo,
    useState
} from "react";

import {
    collection,
    getDocs
} from "firebase/firestore";

import {
    useLocation,
    useNavigate
} from "react-router-dom";

import { db } from "../firebase/firebase";

import "../styles/TeacherRunnerResult.css";


function TeacherRunnerResult() {

    const location = useLocation();
    const navigate = useNavigate();


    const roomCode =
        location.state?.roomCode;

    const roomName =
        location.state?.roomName;


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
       讀取學生結果
    ========================= */

    useEffect(() => {

        const loadResults =
            async () => {

                if (!roomCode) {

                    setErrorMessage(
                        "缺少教室資料"
                    );

                    setLoading(false);

                    return;
                }


                try {

                    const playersRef =
                        collection(
                            db,
                            "rooms",
                            roomCode,
                            "players"
                        );


                    const snapshot =
                        await getDocs(
                            playersRef
                        );


                    const result =
                        snapshot.docs.map(
                            (playerDoc) => {

                                const data =
                                    playerDoc.data();


                                return {

                                    id:
                                        playerDoc.id,

                                    ...data,

                                    runnerScore:
                                        data.runnerScore ??
                                        0,

                                    runnerCorrectCount:
                                        data.runnerCorrectCount ??
                                        0,

                                    runnerWrongCount:
                                        data.runnerWrongCount ??
                                        0,

                                    runnerReviveCount:
                                        data.runnerReviveCount ??
                                        0

                                };

                            }
                        );


                    setPlayers(
                        result
                    );


                } catch (error) {

                    console.error(
                        "讀取 Runner 結果失敗：",
                        error
                    );


                    setErrorMessage(
                        "無法取得遊戲結果"
                    );

                } finally {

                    setLoading(false);

                }

            };


        loadResults();

    }, [
        roomCode
    ]);


    /* =========================
       排名
    ========================= */

    const rankedPlayers =
        useMemo(() => {

            return [...players]
                .sort(
                    (a, b) =>
                        b.runnerScore -
                        a.runnerScore
                );

        }, [
            players
        ]);


    const winner =
        rankedPlayers[0];


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

            <div className="runner-result-page">

                <div className="runner-result-message">

                    正在整理遊戲結果...

                </div>

            </div>

        );

    }


    /* =========================
       錯誤
    ========================= */

    if (errorMessage) {

        return (

            <div className="runner-result-page">

                <div className="runner-result-message">

                    <h1>
                        無法顯示遊戲結果
                    </h1>

                    <p>
                        {errorMessage}
                    </p>


                    <button
                        type="button"
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

        <div className="runner-result-page">

            {/* =====================
                標題
            ===================== */}

            <header className="runner-result-header">

                <div>

                    <h1>
                        遊戲結果
                    </h1>

                    <p>

                        {roomName && (
                            <>
                                {roomName}
                                <span>
                                    ・
                                </span>
                            </>
                        )}

                        教室代碼：
                        <strong>
                            {roomCode}
                        </strong>

                    </p>

                </div>


                <button
                    className="runner-result-home"
                    type="button"
                    onClick={() =>
                        navigate("/")
                    }
                >
                    返回首頁
                </button>

            </header>


            {/* =====================
                第一名
            ===================== */}

            {winner && (

                <section className="runner-winner">

                    <div className="runner-winner-label">
                        第一名
                    </div>


                    <div className="runner-winner-name">

                        {winner.name ??
                            winner.playerName ??
                            "未命名"}

                    </div>


                    <div className="runner-winner-score">

                        {winner.runnerScore}

                        <span>
                            分
                        </span>

                    </div>


                    <div className="runner-winner-detail">

                        答對
                        <strong>
                            {winner.runnerCorrectCount}
                        </strong>

                        題

                        <span>
                            ・
                        </span>

                        正確率

                        <strong>
                            {getAccuracy(winner)}%
                        </strong>

                    </div>

                </section>

            )}


            {/* =====================
                全部排名
            ===================== */}

            <section className="runner-ranking">

                <div className="runner-ranking-title">

                    <h2>
                        排名
                    </h2>

                    <span>
                        共 {rankedPlayers.length} 人
                    </span>

                </div>


                {rankedPlayers.length === 0 ? (

                    <div className="runner-result-empty">

                        沒有學生遊戲結果

                    </div>

                ) : (

                    <div className="runner-ranking-table-wrapper">

                        <table className="runner-ranking-table">

                            <thead>

                                <tr>

                                    <th>
                                        排名
                                    </th>

                                    <th>
                                        學生
                                    </th>

                                    <th>
                                        跑酷分數
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

                                </tr>

                            </thead>


                            <tbody>

                                {rankedPlayers.map(
                                    (
                                        player,
                                        index
                                    ) => (

                                        <tr
                                            key={
                                                player.id
                                            }
                                        >

                                            <td>

                                                <span
                                                    className={
                                                        index === 0
                                                            ? "runner-rank first"
                                                            : "runner-rank"
                                                    }
                                                >
                                                    {index + 1}
                                                </span>

                                            </td>


                                            <td className="runner-ranking-name">

                                                {player.name ??
                                                    player.playerName ??
                                                    "未命名"}

                                            </td>


                                            <td>

                                                <strong className="runner-ranking-score">

                                                    {
                                                        player.runnerScore
                                                    }

                                                </strong>

                                            </td>


                                            <td className="runner-ranking-correct">

                                                {
                                                    player.runnerCorrectCount
                                                }

                                            </td>


                                            <td className="runner-ranking-wrong">

                                                {
                                                    player.runnerWrongCount
                                                }

                                            </td>


                                            <td>

                                                {
                                                    getAccuracy(
                                                        player
                                                    )
                                                }%

                                            </td>


                                            <td>

                                                {
                                                    player.runnerReviveCount
                                                } / 3

                                            </td>

                                        </tr>

                                    )
                                )}

                            </tbody>

                        </table>

                    </div>

                )}

            </section>

        </div>

    );

}

export default TeacherRunnerResult;