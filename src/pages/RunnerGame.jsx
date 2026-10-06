import {
    useCallback,
    useEffect,
    useRef,
    useState
} from "react";

import {
    useLocation,
    useNavigate
} from "react-router-dom";

import RunnerPlay from "../components/RunnerPlay";

import {
    MAX_REVIVES,
    REVIVE_SHIELD_TIME,
    MILESTONE_SHIELD_TIME,
    WRONG_ANSWER_SPEED_PENALTY
} from "../config/runnerConfig";

import {
    getQuestions
} from "../firebase/questionService";

import {
    submitRunnerAnswer,
    getSubmittedRunnerAnswer
} from "../firebase/answerService";

import {
    setPlayerOnline,
    setPlayerOffline
} from "../firebase/presenceService";

import "../styles/RunnerGame.css";

import {
    doc,
    getDoc,
    updateDoc
} from "firebase/firestore";

import { db } from "../firebase/firebase";


/* =========================
   工具
========================= */

function shuffleArray(array) {

    const result = [...array];

    for (
        let i = result.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() *
                (i + 1)
            );

        [
            result[i],
            result[j]
        ] = [
            result[j],
            result[i]
        ];

    }

    return result;
}


/* =========================
   RunnerGame
========================= */

function RunnerGame() {

    const location =
        useLocation();

    const navigate =
        useNavigate();


    /* =========================
       玩家 / 教室資料
    ========================= */

    const roomCode =
        location.state?.roomCode;

    const playerId =
        location.state?.playerId;

    const playerName =
        location.state?.playerName;


    /* =========================
       RunnerPlay Ref
    ========================= */

    const runnerRef =
        useRef(null);


    /* =========================
       React State
    ========================= */

    const [
        questions,
        setQuestions
    ] = useState([]);


    const [
        loading,
        setLoading
    ] = useState(true);


    const [
        errorMessage,
        setErrorMessage
    ] = useState("");


    const [
        gameStarted,
        setGameStarted
    ] = useState(false);


    const [
        gameOver,
        setGameOver
    ] = useState(false);


    const [
        score,
        setScore
    ] = useState(0);


    const [
        reviveCount,
        setReviveCount
    ] = useState(0);


    /* =========================
       Quiz
    ========================= */

    const [
        quizOpen,
        setQuizOpen
    ] = useState(false);


    const [
        quizType,
        setQuizType
    ] = useState(null);


    const [
        currentQuestion,
        setCurrentQuestion
    ] = useState(null);


    const [
        currentQuestionIndex,
        setCurrentQuestionIndex
    ] = useState(null);

    const [
        currentQuestionRound,
        setCurrentQuestionRound
    ] = useState(1);


    const [
        selectedAnswer,
        setSelectedAnswer
    ] = useState(null);


    const [
        answerResult,
        setAnswerResult
    ] = useState(null);


    /* =========================
       題目資料 Ref
    ========================= */

    const questionQueueRef =
        useRef([]);

    const questionPointerRef =
        useRef(0);

    /*
    * Runner 題目輪次
    *
    * 第一輪全部答完後變成 2，
    * 第二輪全部答完後變成 3...
    */
    const questionRoundRef =
        useRef(1);

    const answeredQuestionRef =
        useRef(new Set());

    const reviveCountRef =
        useRef(0);


    /* =========================
       載入題目
    ========================= */

    useEffect(() => {

        if (!roomCode) {

            setLoading(false);

            setErrorMessage(
                "缺少教室資料"
            );

            return;
        }


        async function loadQuestions() {

            try {

                setLoading(true);


                const list =
                    await getQuestions(
                        roomCode
                    );


                if (
                    !Array.isArray(list) ||
                    list.length === 0
                ) {

                    setErrorMessage(
                        "這個教室沒有題目"
                    );

                    return;
                }


                setQuestions(list);


                /*
                 * 題目隨機排列
                 */

                questionQueueRef.current =
                    shuffleArray(
                        list.map(
                            (_, index) =>
                                index
                        )
                    );

                questionPointerRef.current =
                    0;

                questionRoundRef.current =
                    1;

                answeredQuestionRef.current =
                    new Set();


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
       Presence
    ========================= */

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
                "設定玩家在線失敗：",
                error
            );

        });


        return () => {

            setPlayerOffline(
                roomCode,
                playerId
            ).catch((error) => {

                console.error(
                    "設定玩家離線失敗：",
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
    取得下一題
    ========================= */

    const getNextQuestion =
        useCallback(async () => {

            if (
                questions.length === 0
            ) {
                return null;
            }


            /*
            * 不斷尋找目前輪次中
            * 尚未回答的題目。
            *
            * 如果整輪都答完，
            * 就自動進入下一輪。
            */
            while (true) {

                /* =====================
                這一輪已經走完
                → 進入下一輪
                ===================== */

                if (
                    questionPointerRef.current >=
                    questionQueueRef.current.length
                ) {

                    questionRoundRef.current +=
                        1;


                    questionQueueRef.current =
                        shuffleArray(
                            questions.map(
                                (_, index) =>
                                    index
                            )
                        );


                    questionPointerRef.current =
                        0;


                    /*
                    * 新的一輪允許所有題目
                    * 再次出現
                    */
                    answeredQuestionRef.current =
                        new Set();

                }


                /* =====================
                取得題號
                ===================== */

                const questionIndex =
                    questionQueueRef.current[
                        questionPointerRef.current
                    ];


                questionPointerRef.current +=
                    1;


                /* =====================
                本輪本機已回答
                ===================== */

                if (
                    answeredQuestionRef.current.has(
                        questionIndex
                    )
                ) {
                    continue;
                }


                /* =====================
                檢查 Firebase
                ===================== */

                try {

                    const existing =
                        await getSubmittedRunnerAnswer(
                            roomCode,
                            playerId,
                            questionIndex,
                            questionRoundRef.current
                        );


                    /*
                    * 例如重新整理頁面後，
                    * Firebase 發現這一輪的
                    * 這題其實已經回答過。
                    */
                    if (existing) {

                        answeredQuestionRef.current.add(
                            questionIndex
                        );

                        continue;
                    }


                } catch (error) {

                    console.error(
                        "檢查 Runner 作答紀錄失敗：",
                        error
                    );

                }


                /* =====================
                找到可以出的題目
                ===================== */

                return {

                    question:
                        questions[
                            questionIndex
                        ],

                    questionIndex,

                    round:
                        questionRoundRef.current

                };

            }

        }, [
            questions,
            roomCode,
            playerId
        ]);

        /* =========================
        同步 Runner 玩家狀態
        ========================= */

        const updateRunnerPlayer =
            useCallback(
                async (data) => {

                    if (
                        !roomCode ||
                        !playerId
                    ) {
                        return;
                    }

                    try {

                        const playerRef = doc(
                            db,
                            "rooms",
                            roomCode,
                            "players",
                            playerId
                        );

                        await updateDoc(
                            playerRef,
                            data
                        );

                    } catch (error) {

                        console.error(
                            "更新 Runner 玩家狀態失敗：",
                            error
                        );

                    }

                },
                [
                    roomCode,
                    playerId
                ]
            );

    /* =========================
       Game Over
    ========================= */

    const endGame =
        useCallback(async () => {

            /* =========================
            取得最終分數
            ========================= */

            const finalScore =
                Math.floor(
                    runnerRef.current
                        ?.getScore?.() ?? 0
                );


            /* =========================
            停止 Runner
            ========================= */

            runnerRef.current?.stop();


            /* =========================
            更新畫面
            ========================= */

            setScore(
                finalScore
            );

            setQuizOpen(false);

            setGameOver(true);


            /* =========================
            同步 Firebase
            ========================= */

            await updateRunnerPlayer({

                runnerStatus:
                    "finished",

                runnerReviveCount:
                    reviveCountRef.current,

                runnerScore:
                    finalScore

            });

        }, [
            updateRunnerPlayer
        ]);


    /* =========================
       開啟題目
    ========================= */

    const triggerQuiz =
        useCallback(
            async (type) => {

                /*
                 * 已經復活三次
                 */

                if (
                    type === "revive" &&
                    reviveCountRef.current >=
                        MAX_REVIVES
                ) {

                    endGame();

                    return;
                }


                runnerRef.current?.pause();


                const result =
                    await getNextQuestion();


                /*
                 * 題目全部回答完
                 */

                if (!result) {

                    endGame();

                    return;
                }


                setQuizType(type);

                setCurrentQuestion(
                    result.question
                );

                setCurrentQuestionIndex(
                    result.questionIndex
                );

                setCurrentQuestionRound(
                    result.round
                );

                setSelectedAnswer(null);

                setAnswerResult(null);

                setQuizOpen(true);

            },
            [
                endGame,
                getNextQuestion
            ]
        );

    /* =========================
       開始遊戲
    ========================= */

    const startGame = async () => {

        /* =========================
        重設題目
        ========================= */

        answeredQuestionRef.current =
            new Set();

        questionRoundRef.current =
            1;

        setCurrentQuestionRound(1);

        questionQueueRef.current =
            shuffleArray(
                questions.map(
                    (_, index) =>
                        index
                )
            );

        questionPointerRef.current =
            0;


        /* =========================
        重設復活
        ========================= */

        reviveCountRef.current =
            0;

        setReviveCount(0);

        setScore(0);


        /* =========================
        重設 Firebase Runner 資料
        ========================= */

        await updateRunnerPlayer({
            runnerStatus:
                "playing",

            runnerCorrectCount:
                0,

            runnerWrongCount:
                0,

            runnerReviveCount:
                0,

            runnerScore:
                0
        });


        /* =========================
        關閉舊畫面
        ========================= */

        setQuizOpen(false);

        setGameOver(false);

        setErrorMessage("");


        /* =========================
        顯示 Canvas
        ========================= */

        setGameStarted(true);


        /*
        * RunnerPlay 開始
        *
        * 因為 setGameStarted 後
        * RunnerPlay 才會掛載，
        * 因此下一個 frame 再開始。
        */

        requestAnimationFrame(() => {

            runnerRef.current?.start();

        });

    };


    /* =========================
       分數更新
    ========================= */

    const handleScoreChange =
        useCallback(
            (newScore) => {

                setScore(newScore);

            },
            []
        );


    /* =========================
       Runner 觸發題目
    ========================= */

    const handleQuizTrigger =
        useCallback(
            (type) => {

                triggerQuiz(type);

            },
            [triggerQuiz]
        );


    /* =========================
       回答題目
    ========================= */

    const handleAnswer =
        async (answer) => {

            if (
                selectedAnswer !== null ||
                !currentQuestion ||
                currentQuestionIndex === null
            ) {
                return;
            }


            /* =====================
            判斷答案
            ===================== */

            const correct =
                answer ===
                currentQuestion.correctAnswer;


            setSelectedAnswer(
                answer
            );


            /* =====================
            儲存答案
            ===================== */

            try {

                await submitRunnerAnswer(
                    roomCode,
                    playerId,
                    currentQuestionIndex,
                    currentQuestionRound,
                    answer,
                    correct
                );


                answeredQuestionRef.current.add(
                    currentQuestionIndex
                );


            } catch (error) {

                console.error(
                    "送出答案失敗：",
                    error
                );


                /*
                * Firebase 已經有答案
                */

                if (
                    error.message ===
                    "這一題已經作答過了"
                ) {

                    try {

                        const existing =
                            await getSubmittedRunnerAnswer(
                                roomCode,
                                playerId,
                                currentQuestionIndex,
                                currentQuestionRound
                            );


                        if (existing) {

                            answeredQuestionRef.current.add(
                                currentQuestionIndex
                            );

                        }


                    } catch (
                        restoreError
                    ) {

                        console.error(
                            "取得原作答紀錄失敗：",
                            restoreError
                        );

                    }


                } else {

                    setSelectedAnswer(
                        null
                    );


                    setErrorMessage(
                        "答案送出失敗，請再試一次"
                    );


                    return;
                }

            }


            /* =====================
            答對
            ===================== */

            if (correct) {

                setAnswerResult(
                    "correct"
                );


                setTimeout(
                    async () => {

                        setQuizOpen(false);

                        setCurrentQuestion(null);

                        setCurrentQuestionIndex(
                            null
                        );

                        setSelectedAnswer(null);

                        setAnswerResult(null);


                        /* =================
                        復活題
                        ================= */

                        if (
                            quizType ===
                            "revive"
                        ) {

                            reviveCountRef.current +=
                                1;


                            const newReviveCount =
                                reviveCountRef.current;


                            setReviveCount(
                                newReviveCount
                            );


                            /* =================
                            同步復活次數
                            到 Firebase
                            ================= */

                            await updateRunnerPlayer({
                                runnerReviveCount:
                                    newReviveCount
                            });


                            runnerRef.current?.resume({

                                shieldSeconds:
                                    REVIVE_SHIELD_TIME,

                                clearNear:
                                    true

                            });

                        }


                        /* =================
                        250 分抽考
                        ================= */

                        else if (
                            quizType ===
                            "milestone"
                        ) {

                            runnerRef.current?.resume({

                                shieldSeconds:
                                    MILESTONE_SHIELD_TIME

                            });

                        }

                    },
                    850
                );

            }


            /* =====================
            答錯
            ===================== */

            else {

                setAnswerResult(
                    "wrong"
                );


                setTimeout(
                    () => {

                        setQuizOpen(false);


                        /*
                        * 復活題答錯
                        * → Game Over
                        */

                        if (
                            quizType ===
                            "revive"
                        ) {

                            endGame();

                        }


                        /*
                        * 250 分抽考答錯
                        * → 加速
                        */

                        else {

                            runnerRef.current?.resume({

                                speedPenalty:
                                    WRONG_ANSWER_SPEED_PENALTY

                            });

                        }

                    },
                    900
                );

            }

        };


    /* =========================
       查看結果
    ========================= */

    const goToResult = async () => {

        try {

            const playerRef = doc(
                db,
                "rooms",
                roomCode,
                "players",
                playerId
            );


            const playerSnap =
                await getDoc(playerRef);


            let runnerCorrectCount = 0;
            let runnerWrongCount = 0;
            let runnerReviveCount =
                reviveCountRef.current;

            let finalRunnerScore =
                score;


            if (playerSnap.exists()) {

                const playerData =
                    playerSnap.data();


                runnerCorrectCount =
                    playerData.runnerCorrectCount ??
                    0;

                runnerWrongCount =
                    playerData.runnerWrongCount ??
                    0;

                runnerReviveCount =
                    playerData.runnerReviveCount ??
                    reviveCountRef.current;

                finalRunnerScore =
                    playerData.runnerScore ??
                    score;

            }


            navigate(
                "/student/result",
                {
                    state: {

                        roomCode,

                        playerId,

                        playerName,

                        gameMode:
                            "runner",

                        runnerScore:
                            finalRunnerScore,

                        runnerCorrectCount,

                        runnerWrongCount,

                        runnerReviveCount

                    }
                }
            );


        } catch (error) {

            console.error(
                "讀取 Runner 結果失敗：",
                error
            );


            /*
            * Firebase 讀取失敗時，
            * 至少仍然讓學生進結果頁。
            */

            navigate(
                "/student/result",
                {
                    state: {

                        roomCode,

                        playerId,

                        playerName,

                        gameMode:
                            "runner",

                        runnerScore:
                            score,

                        runnerCorrectCount:
                            0,

                        runnerWrongCount:
                            0,

                        runnerReviveCount:
                            reviveCountRef.current

                    }
                }
            );

        }

    };


    /* =========================
       狀態頁
    ========================= */

    if (!roomCode) {

        return (

            <div className="runner-state-page">

                <div className="runner-state-card">

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

            <div className="runner-state-page">

                <div className="runner-loading">

                    載入跑酷關卡中...

                </div>

            </div>

        );

    }


    if (
        errorMessage &&
        questions.length === 0
    ) {

        return (

            <div className="runner-state-page">

                <div className="runner-state-card">

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


    /* =========================
       Render
    ========================= */

    return (

        <div className="runner-page">


            {/* =========================
                Header
            ========================= */}

            <header className="runner-header">

                <div className="runner-logo">

                    <div className="runner-logo-icon">
                        E
                    </div>

                    <span>
                        EduGame
                    </span>

                </div>


                <div className="runner-player">
                    {playerName}
                </div>

            </header>


            {/* =========================
                Main
            ========================= */}

            <main className="runner-main">


                {/* =========================
                    遊戲資訊
                ========================= */}

                <section className="runner-top">

                    <div>

                        <span className="runner-mode-label">
                            跑酷模式
                        </span>

                        <h1>
                            方塊衝刺
                        </h1>

                    </div>


                    <div className="runner-stats">

                        <div className="runner-stat">

                            <span>
                                分數
                            </span>

                            <strong>
                                {score}
                            </strong>

                        </div>


                        <div className="runner-stat">

                            <span>
                                復活
                            </span>

                            <strong>

                                {reviveCount}

                                <small>
                                    / {MAX_REVIVES}
                                </small>

                            </strong>

                        </div>

                    </div>

                </section>


                {/* =========================
                    Game
                ========================= */}

                <section className="runner-game-container">


                    {/* =====================
                        RunnerPlay
                    ===================== */}

                    <RunnerPlay
                        ref={runnerRef}
                        onScoreChange={
                            handleScoreChange
                        }
                        onQuizTrigger={
                            handleQuizTrigger
                        }
                    />


                    {/* =====================
                        Start
                    ===================== */}

                    {!gameStarted && (

                        <div className="runner-overlay">

                            <div className="runner-start">

                                <div className="runner-start-character">
                                    ■
                                </div>

                                <h2>
                                    準備開始挑戰！
                                </h2>

                                <p>
                                    跳過地面障礙，
                                    蹲下閃過空中障礙。
                                </p>


                                <div className="runner-rules">

                                    <span>

                                        ↑ / W / Space

                                        <strong>
                                            跳躍
                                        </strong>

                                    </span>


                                    <span>

                                        ↓ / S

                                        <strong>
                                            下蹲
                                        </strong>

                                    </span>

                                </div>


                                <button
                                    type="button"
                                    className="runner-primary-button"
                                    onClick={
                                        startGame
                                    }
                                >
                                    開始遊戲
                                </button>

                            </div>

                        </div>

                    )}


                    {/* =====================
                        Quiz
                    ===================== */}

                    {quizOpen &&
                        currentQuestion && (

                        <div className="runner-overlay">

                            <div className="runner-quiz">


                                <div
                                    className={
                                        `runner-quiz-badge ${quizType}`
                                    }
                                >

                                    {
                                        quizType ===
                                        "revive"

                                            ? "復活挑戰"

                                            : "課堂抽考"
                                    }

                                </div>


                                <h2>

                                    {
                                        quizType ===
                                        "revive"

                                            ? "撞到障礙物了！"

                                            : "抵達 250 分里程碑！"
                                    }

                                </h2>


                                <p className="runner-quiz-hint">

                                    {
                                        quizType ===
                                        "revive"

                                            ? `答對即可原地復活，目前已使用 ${reviveCount} / ${MAX_REVIVES} 次`

                                            : "答對獲得 5 秒防護罩，答錯遊戲速度會增加"
                                    }

                                </p>


                                <div className="runner-question">

                                    {
                                        currentQuestion.question
                                    }

                                </div>


                                <div className="runner-options">

                                    {
                                        currentQuestion.options.map(
                                            (
                                                option,
                                                index
                                            ) => {

                                                const letter =
                                                    String.fromCharCode(
                                                        65 +
                                                        index
                                                    );


                                                const selected =

                                                    option ===

                                                    selectedAnswer;


                                                let className =
                                                    "runner-option";


                                                if (
                                                    selected &&
                                                    answerResult ===
                                                        "correct"
                                                ) {

                                                    className +=
                                                        " correct";

                                                }


                                                if (
                                                    selected &&
                                                    answerResult ===
                                                        "wrong"
                                                ) {

                                                    className +=
                                                        " wrong";

                                                }


                                                return (

                                                    <button
                                                        key={
                                                            `${option}-${index}`
                                                        }
                                                        type="button"
                                                        className={
                                                            className
                                                        }
                                                        disabled={
                                                            selectedAnswer !==
                                                            null
                                                        }
                                                        onClick={() =>
                                                            handleAnswer(
                                                                option
                                                            )
                                                        }
                                                    >

                                                        <span className="runner-option-letter">
                                                            {
                                                                letter
                                                            }
                                                        </span>

                                                        <span className="runner-option-text">
                                                            {
                                                                option
                                                            }
                                                        </span>

                                                    </button>

                                                );

                                            }
                                        )
                                    }

                                </div>


                                {
                                    answerResult ===
                                    "correct" && (

                                        <div className="runner-answer-result correct">

                                            ✓ 回答正確！

                                            {
                                                quizType ===
                                                "revive"

                                                    ? " 準備復活！"

                                                    : " 獲得防護罩！"
                                            }

                                        </div>

                                    )
                                }


                                {
                                    answerResult ===
                                    "wrong" && (

                                        <div className="runner-answer-result wrong">

                                            × 回答錯誤！

                                            {
                                                quizType ===
                                                "revive"

                                                    ? " 挑戰結束"

                                                    : " 遊戲速度增加"
                                            }

                                        </div>

                                    )
                                }

                            </div>

                        </div>

                    )}


                    {/* =====================
                        Game Over
                    ===================== */}

                    {gameOver && (

                        <div className="runner-overlay">

                            <div className="runner-game-over">

                                <div className="runner-game-over-icon">
                                    ■
                                </div>


                                <span className="runner-game-over-label">
                                    GAME OVER
                                </span>


                                <h2>
                                    挑戰結束
                                </h2>


                                <p>
                                    這次一共獲得
                                </p>


                                <strong className="runner-final-score">
                                    {score}
                                </strong>

                                <span className="runner-final-score-label">
                                    分
                                </span>


                                <button
                                    type="button"
                                    className="runner-primary-button"
                                    onClick={
                                        goToResult
                                    }
                                >
                                    查看遊戲結果
                                </button>

                            </div>

                        </div>

                    )}

                </section>


                {/* =========================
                    Controls
                ========================= */}

                <section className="runner-controls">

                    <button
                        type="button"
                        className="runner-control-button jump"

                        onMouseDown={() =>
                            runnerRef.current?.jump()
                        }

                        onTouchStart={(
                            event
                        ) => {

                            event.preventDefault();

                            runnerRef.current?.jump();

                        }}
                    >

                        <span>
                            ↑
                        </span>

                        跳躍

                    </button>


                    <button
                        type="button"
                        className="runner-control-button duck"

                        onMouseDown={() =>
                            runnerRef.current?.startDuck()
                        }

                        onMouseUp={() =>
                            runnerRef.current?.endDuck()
                        }

                        onMouseLeave={() =>
                            runnerRef.current?.endDuck()
                        }

                        onTouchStart={(
                            event
                        ) => {

                            event.preventDefault();

                            runnerRef.current?.startDuck();

                        }}

                        onTouchEnd={(
                            event
                        ) => {

                            event.preventDefault();

                            runnerRef.current?.endDuck();

                        }}

                        onTouchCancel={() =>
                            runnerRef.current?.endDuck()
                        }
                    >

                        <span>
                            ↓
                        </span>

                        下蹲

                    </button>

                </section>


                {/* =========================
                    Error
                ========================= */}

                {
                    errorMessage && (

                        <p className="runner-error">
                            {errorMessage}
                        </p>

                    )
                }

            </main>

        </div>

    );

}


export default RunnerGame;