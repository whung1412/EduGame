import {
    forwardRef,
    useCallback,
    useEffect,
    useImperativeHandle,
    useRef
} from "react";

import {
    GAME_WIDTH,
    GAME_HEIGHT,
    GROUND_HEIGHT,
    PLAYER_X,
    PLAYER_WIDTH,
    PLAYER_HEIGHT,
    PLAYER_DUCK_HEIGHT,
    GRAVITY,
    JUMP_FORCE,
    BASE_SPEED,
    MAX_SPEED,
    MILESTONE_SCORE,
    RUNNER_DIFFICULTY
} from "../config/runnerConfig";


const RunnerPlay = forwardRef(function RunnerPlay(
    {
        onScoreChange,
        onQuizTrigger
    },
    ref
) {

    /* =========================
       Canvas
    ========================= */

    const canvasRef = useRef(null);

    const animationRef = useRef(null);

    const lastTimeRef = useRef(null);


    /* =========================
       遊戲資料
    ========================= */

    const statusRef =
        useRef("menu");

    const scoreRef =
        useRef(0);

    const speedRef =
        useRef(BASE_SPEED);

    const penaltySpeedRef =
        useRef(0);

    const spawnTimerRef =
        useRef(0);

    const lastMilestoneRef =
        useRef(0);

    const difficultyLevelRef =
        useRef(1);


    /* =========================
       玩家
    ========================= */

    const playerRef =
        useRef({
            x: PLAYER_X,

            y:
                GAME_HEIGHT -
                GROUND_HEIGHT -
                PLAYER_HEIGHT,

            vy: 0,

            jumping: false,

            ducking: false,

            fastFalling: false,
            wantDuck: false
        });

    /* =========================
       障礙物
    ========================= */

    const obstaclesRef =
        useRef([]);


    /* =========================
       護盾
    ========================= */

    const shieldRef =
        useRef({
            active: false,
            remaining: 0,
            maxTime: 0
        });


    /* =========================
       重設玩家
    ========================= */

    const resetPlayer =
        useCallback(() => {

            playerRef.current = {
                x: PLAYER_X,

                y:
                    GAME_HEIGHT -
                    GROUND_HEIGHT -
                    PLAYER_HEIGHT,

                vy: 0,

                jumping: false,

                ducking: false,

                fastFalling: false,
                
                wantDuck: false
            };

        }, []);


    /* =========================
       跳躍
    ========================= */

    const jump =
        useCallback(() => {

            if (
                statusRef.current !==
                "playing"
            ) {
                return;
            }

            const player =
                playerRef.current;

            if (
                player.jumping ||
                player.ducking
            ) {
                return;
            }

            player.jumping = true;

            player.vy =
                -JUMP_FORCE;

        }, []);


    /* =========================
       下蹲
    ========================= */

    const startDuck =
        useCallback(() => {

            if (
                statusRef.current !==
                "playing"
            ) {
                return;
            }

            const player =
                playerRef.current;


            /* =====================
            空中按下蹲
            → 快速下降
            → 落地後自動蹲下
            ===================== */

            if (player.jumping) {

                player.fastFalling = true;
                player.wantDuck = true;

                /*
                * 如果還在往上跳，
                * 立刻改成向下
                */

                if (player.vy < 0) {
                    player.vy = 350;
                }

                return;
            }


            /* =====================
            已經在地面
            ===================== */

            player.ducking = true;

        }, []);


    const endDuck =
        useCallback(() => {

            const player =
                playerRef.current;

            player.ducking = false;
            player.wantDuck = false;

        }, []);


    /* =========================
       開啟護盾
    ========================= */

    const activateShield =
        useCallback((seconds) => {

            shieldRef.current = {
                active: true,
                remaining: seconds,
                maxTime: seconds
            };

        }, []);


    /* =========================
       清除玩家附近障礙
    ========================= */

    const clearNearObstacles =
        useCallback(() => {

            obstaclesRef.current =
                obstaclesRef.current.filter(
                    (obstacle) =>
                        obstacle.x >
                        PLAYER_X +
                        PLAYER_WIDTH +
                        100
                );

        }, []);


    /* =========================
       提供 RunnerGame 控制
    ========================= */

    useImperativeHandle(
        ref,
        () => ({

            /* 開始遊戲 */

            start() {

                resetPlayer();

                obstaclesRef.current = [];

                scoreRef.current = 0;

                speedRef.current = BASE_SPEED;

                penaltySpeedRef.current = 0;

                spawnTimerRef.current = 0;

                lastMilestoneRef.current = 0;

                difficultyLevelRef.current = 1;

                shieldRef.current = {
                    active: false,
                    remaining: 0,
                    maxTime: 0
                };

                lastTimeRef.current =
                    null;

                statusRef.current =
                    "playing";

                onScoreChange(0);
            },


            /* 暫停遊戲 */

            pause() {

                statusRef.current =
                    "quiz";
            },


            /* 繼續遊戲 */

            resume({
                shieldSeconds = 0,
                speedPenalty = 0,
                clearNear = false
            } = {}) {

                if (clearNear) {
                    clearNearObstacles();
                }

                if (
                    shieldSeconds > 0
                ) {
                    activateShield(
                        shieldSeconds
                    );
                }

                if (
                    speedPenalty > 0
                ) {
                    penaltySpeedRef.current +=
                        speedPenalty;
                }

                statusRef.current =
                    "playing";

                lastTimeRef.current =
                    performance.now();
            },


            /* 結束遊戲 */

            stop() {

                statusRef.current =
                    "gameover";
            },


            /* 操作 */

            jump,

            startDuck,

            endDuck,


            /* 取得目前分數 */

            getScore() {

                return Math.floor(
                    scoreRef.current
                );
            }

        }),

        [
            activateShield,
            clearNearObstacles,
            endDuck,
            jump,
            onScoreChange,
            resetPlayer,
            startDuck
        ]
    );


    /* =========================
       Keyboard
    ========================= */

    useEffect(() => {

        const handleKeyDown =
            (event) => {

                if (
                    event.code === "Space" ||
                    event.code === "ArrowUp" ||
                    event.code === "KeyW"
                ) {

                    event.preventDefault();

                    jump();
                }


                if (
                    event.code ===
                        "ArrowDown" ||
                    event.code ===
                        "KeyS"
                ) {

                    event.preventDefault();

                    startDuck();
                }

            };


        const handleKeyUp =
            (event) => {

                if (
                    event.code ===
                        "ArrowDown" ||
                    event.code ===
                        "KeyS"
                ) {

                    event.preventDefault();

                    endDuck();
                }

            };


        window.addEventListener(
            "keydown",
            handleKeyDown
        );

        window.addEventListener(
            "keyup",
            handleKeyUp
        );


        return () => {

            window.removeEventListener(
                "keydown",
                handleKeyDown
            );

            window.removeEventListener(
                "keyup",
                handleKeyUp
            );

        };

    }, [
        jump,
        startDuck,
        endDuck
    ]);

    /* =========================
   建立單一障礙
========================= */

const createObstacle =
    useCallback(
        (
            type,
            extraX = 0
        ) => {

            if (type === "low") {

                return {

                    id:
                        Date.now() +
                        Math.random(),

                    type: "low",

                    x:
                        GAME_WIDTH +
                        40 +
                        extraX,

                    y:
                        GAME_HEIGHT -
                        GROUND_HEIGHT -
                        42,

                    width: 42,

                    height: 42

                };

            }


            return {

                id:
                    Date.now() +
                    Math.random(),

                type: "high",

                x:
                    GAME_WIDTH +
                    40 +
                    extraX,

                y:
                    GAME_HEIGHT -
                    GROUND_HEIGHT -
                    125,

                width: 42,

                height: 70

            };

        },
        []
    );


    /* =========================
    產生障礙排列
    ========================= */

    const spawnObstacle =
        useCallback(() => {

            const level =
                difficultyLevelRef.current;


            const config =
                RUNNER_DIFFICULTY[level] ??
                RUNNER_DIFFICULTY[5];


            /* =====================
            第一個障礙
            ===================== */

            const firstType =
                Math.random() > 0.5
                    ? "low"
                    : "high";


            const newObstacles = [

                createObstacle(
                    firstType
                )

            ];


            /* =====================
            是否產生雙障礙
            ===================== */

            const makeCombo =

                Math.random() <
                config.comboChance;


            if (makeCombo) {

                /*
                * 第二個故意使用相反類型，
                * 形成跳 → 蹲
                * 或蹲 → 跳。
                */

                const secondType =

                    firstType === "low"
                        ? "high"
                        : "low";


                newObstacles.push(

                    createObstacle(
                        secondType,
                        230
                    )

                );


                /* =================
                Level 5
                有機率出現三連
                ================= */

                const makeTriple =

                    level >= 5 &&

                    Math.random() <
                        config.tripleChance;


                if (makeTriple) {

                    /*
                    * 第三個回到第一種，
                    * 例如：
                    *
                    * low → high → low
                    * 跳 → 蹲 → 跳
                    */

                    newObstacles.push(

                        createObstacle(
                            firstType,
                            460
                        )

                    );

                }

            }


            obstaclesRef.current.push(
                ...newObstacles
            );

        }, [createObstacle]);


    /* =========================
       碰撞判定
    ========================= */

    const checkCollision =
        useCallback(
            (
                player,
                obstacle
            ) => {

                const playerHeight =
                    player.ducking
                        ? PLAYER_DUCK_HEIGHT
                        : PLAYER_HEIGHT;


                const playerY =
                    player.ducking

                        ? (
                            GAME_HEIGHT -
                            GROUND_HEIGHT -
                            PLAYER_DUCK_HEIGHT
                        )

                        : player.y;


                const padding = 6;


                return (

                    player.x +
                        padding <

                    obstacle.x +
                        obstacle.width -
                        padding &&


                    player.x +
                        PLAYER_WIDTH -
                        padding >

                    obstacle.x +
                        padding &&


                    playerY +
                        padding <

                    obstacle.y +
                        obstacle.height -
                        padding &&


                    playerY +
                        playerHeight -
                        padding >

                    obstacle.y +
                        padding

                );

            },
            []
        );


    /* =========================
       Game Loop
    ========================= */

    useEffect(() => {


        /* =========================
           Update
        ========================= */

        const update =
            (deltaTime) => {

                if (
                    statusRef.current !==
                    "playing"
                ) {
                    return;
                }


                const player =
                    playerRef.current;


                /* =====================
                   分數
                ===================== */

                scoreRef.current +=
                    deltaTime *
                    60 *
                    0.1;


                const currentScore =
                    Math.floor(
                        scoreRef.current
                    );


                onScoreChange(
                    currentScore
                );


                /* =====================
                   速度
                ===================== */

                speedRef.current =
                    Math.min(

                        MAX_SPEED,

                        BASE_SPEED +

                        scoreRef.current *
                            0.55 +

                        penaltySpeedRef.current
                    );


                /* =====================
                   250 分抽考
                ===================== */
                difficultyLevelRef.current = Math.min( 5, Math. floor( currentScore / MILESTONE_SCORE) + 1);

                const milestone =

                    Math.floor(
                        currentScore /
                        MILESTONE_SCORE
                    ) *

                    MILESTONE_SCORE;


                if (
                    milestone > 0 &&
                    milestone >
                        lastMilestoneRef.current
                ) {

                    lastMilestoneRef.current =
                        milestone;

                    statusRef.current =
                        "quiz";

                    onQuizTrigger(
                        "milestone"
                    );

                    return;
                }


                /* =====================
                   Shield
                ===================== */

                if (
                    shieldRef.current.active
                ) {

                    shieldRef.current.remaining -=
                        deltaTime;


                    if (
                        shieldRef.current.remaining <=
                        0
                    ) {

                        shieldRef.current = {
                            active: false,
                            remaining: 0,
                            maxTime: 0
                        };

                    }

                }


                /* =====================
                   Player Physics
                ===================== */

                if (
                    player.jumping
                ) {

                    /* =====================
                    正常重力 / 快速下降
                    ===================== */

                    const currentGravity =

                        player.fastFalling

                            ? GRAVITY * 3

                            : GRAVITY;


                    player.vy +=
                        currentGravity *
                        deltaTime;


                    player.y +=
                        player.vy *
                        deltaTime;


                    const groundY =

                        GAME_HEIGHT -

                        GROUND_HEIGHT -

                        PLAYER_HEIGHT;


                    if (
                        player.y >=
                        groundY
                    ) {

                        player.y =
                            groundY;

                        player.vy =
                            0;

                        player.jumping =
                            false;

                        player.fastFalling =
                            false;


                        /* =====================
                        空中有按住下蹲
                        → 落地立即蹲下
                        ===================== */

                        if (player.wantDuck) {

                            player.ducking =
                                true;

                        }

                    }

                }


                /* =====================
                   Spawn
                ===================== */

                spawnTimerRef.current -=
                    deltaTime;


                if (
                    spawnTimerRef.current <=
                    0
                ) {
                    spawnObstacle();

                    const speedRatio = ( speedRef.current - BASE_SPEED) / ( MAX_SPEED - BASE_SPEED );


                    const difficultyConfig =

                        RUNNER_DIFFICULTY[
                            difficultyLevelRef.current
                        ] ??

                        RUNNER_DIFFICULTY[5];


                    spawnTimerRef.current =

                        difficultyConfig.minGap -

                        speedRatio *
                            0.2 +

                        Math.random() *
                            difficultyConfig.randomGap;

                }


                /* =====================
                   障礙物
                ===================== */

                for (
                    let i =
                        obstaclesRef.current.length -
                        1;

                    i >= 0;

                    i--
                ) {

                    const obstacle =
                        obstaclesRef.current[i];


                    obstacle.x -=

                        speedRef.current *

                        deltaTime;


                    /* 移出畫面 */

                    if (
                        obstacle.x +
                            obstacle.width <
                        -50
                    ) {

                        obstaclesRef.current.splice(
                            i,
                            1
                        );

                        continue;
                    }


                    /* =====================
                       碰撞
                    ===================== */

                    if (
                        checkCollision(
                            player,
                            obstacle
                        )
                    ) {


                        /* 有護盾 */

                        if (
                            shieldRef.current.active
                        ) {

                            obstaclesRef.current.splice(
                                i,
                                1
                            );

                            continue;
                        }


                        /* 沒護盾 */

                        obstaclesRef.current.splice(
                            i,
                            1
                        );


                        statusRef.current =
                            "quiz";


                        onQuizTrigger(
                            "revive"
                        );


                        return;

                    }

                }

            };


        /* =========================
           Draw
        ========================= */

        const draw = () => {

            const canvas =
                canvasRef.current;


            if (!canvas) {
                return;
            }


            const ctx =
                canvas.getContext(
                    "2d"
                );


            if (!ctx) {
                return;
            }


            const player =
                playerRef.current;


            ctx.clearRect(
                0,
                0,
                GAME_WIDTH,
                GAME_HEIGHT
            );


            /* =====================
               天空
            ===================== */

            ctx.fillStyle =
                "#dceff3";


            ctx.fillRect(
                0,
                0,
                GAME_WIDTH,
                GAME_HEIGHT
            );


            /* =====================
               雲朵
            ===================== */

            ctx.fillStyle =
                "rgba(255,255,255,0.75)";


            ctx.beginPath();

            ctx.arc(
                150,
                85,
                25,
                0,
                Math.PI * 2
            );

            ctx.arc(
                180,
                75,
                34,
                0,
                Math.PI * 2
            );

            ctx.arc(
                215,
                87,
                24,
                0,
                Math.PI * 2
            );

            ctx.fill();


            ctx.beginPath();

            ctx.arc(
                630,
                105,
                22,
                0,
                Math.PI * 2
            );

            ctx.arc(
                660,
                92,
                32,
                0,
                Math.PI * 2
            );

            ctx.arc(
                695,
                105,
                24,
                0,
                Math.PI * 2
            );

            ctx.fill();


            /* =====================
               地面
            ===================== */

            ctx.fillStyle =
                "#f4c95d";


            ctx.fillRect(
                0,
                GAME_HEIGHT -
                    GROUND_HEIGHT,
                GAME_WIDTH,
                GROUND_HEIGHT
            );


            ctx.fillStyle =
                "#343463";


            ctx.fillRect(
                0,
                GAME_HEIGHT -
                    GROUND_HEIGHT,
                GAME_WIDTH,
                7
            );


            /* =====================
               地面速度線
            ===================== */

            ctx.fillStyle =
                "rgba(52,52,99,0.16)";


            const offset =
                (
                    scoreRef.current *
                    20
                ) %
                80;


            for (
                let x = -80;
                x <
                    GAME_WIDTH +
                    80;
                x += 80
            ) {

                ctx.fillRect(
                    x - offset,
                    GAME_HEIGHT - 32,
                    42,
                    4
                );

            }


            /* =====================
               玩家
            ===================== */

            const drawPlayerHeight =

                player.ducking

                    ? PLAYER_DUCK_HEIGHT

                    : PLAYER_HEIGHT;


            const drawPlayerY =

                player.ducking

                    ? (
                        GAME_HEIGHT -
                        GROUND_HEIGHT -
                        PLAYER_DUCK_HEIGHT
                    )

                    : player.y;


            /* =====================
               護盾
            ===================== */

            if (
                shieldRef.current.active
            ) {

                ctx.beginPath();


                ctx.strokeStyle =
                    "#00a8c6";


                ctx.lineWidth =
                    5;


                ctx.arc(

                    player.x +
                        PLAYER_WIDTH / 2,

                    drawPlayerY +
                        drawPlayerHeight / 2,

                    42,

                    0,

                    Math.PI * 2
                );


                ctx.stroke();


                /* 護盾整數倒數 */

                const shieldSeconds =

                    Math.max(

                        0,

                        Math.ceil(
                            shieldRef.current.remaining
                        )

                    );


                ctx.font =
                    "bold 20px sans-serif";


                ctx.textAlign =
                    "center";


                ctx.textBaseline =
                    "middle";


                ctx.fillStyle =
                    "#343463";


                ctx.fillText(

                    `⏱ ${shieldSeconds}`,

                    player.x +
                        PLAYER_WIDTH / 2,

                    drawPlayerY -
                        20

                );

            }


            /* =====================
               玩家本體
            ===================== */

            ctx.fillStyle =

                shieldRef.current.active

                    ? "#55cfe0"

                    : "#ef6f6c";


            ctx.fillRect(

                player.x,

                drawPlayerY,

                PLAYER_WIDTH,

                drawPlayerHeight

            );


            /* =====================
               眼睛
            ===================== */

            ctx.fillStyle =
                "#343463";


            ctx.fillRect(
                player.x + 25,
                drawPlayerY + 15,
                5,
                5
            );


            ctx.fillRect(
                player.x + 35,
                drawPlayerY + 15,
                5,
                5
            );


            /* =====================
               障礙物
            ===================== */

            obstaclesRef.current.forEach(
                (obstacle) => {

                    ctx.fillStyle =

                        obstacle.type ===
                        "low"

                            ? "#343463"

                            : "#004358";


                    ctx.fillRect(

                        obstacle.x,

                        obstacle.y,

                        obstacle.width,

                        obstacle.height

                    );


                    /* 警示條 */

                    ctx.fillStyle =
                        "#f4c95d";


                    ctx.fillRect(

                        obstacle.x + 6,

                        obstacle.y + 10,

                        obstacle.width - 12,

                        7

                    );

                }
            );

        };


        /* =========================
           Animation
        ========================= */

        const loop =
            (timestamp) => {

                if (
                    lastTimeRef.current ===
                    null
                ) {

                    lastTimeRef.current =
                        timestamp;

                }


                const deltaTime =

                    Math.min(

                        (
                            timestamp -
                            lastTimeRef.current
                        ) /
                            1000,

                        0.033

                    );


                lastTimeRef.current =
                    timestamp;


                update(
                    deltaTime
                );


                draw();


                animationRef.current =

                    requestAnimationFrame(
                        loop
                    );

            };


        animationRef.current =

            requestAnimationFrame(
                loop
            );


        return () => {

            if (
                animationRef.current
            ) {

                cancelAnimationFrame(
                    animationRef.current
                );

            }

        };

    }, [
        checkCollision,
        onQuizTrigger,
        onScoreChange,
        spawnObstacle
    ]);


    /* =========================
       Canvas
    ========================= */

    return (

        <canvas
            ref={canvasRef}
            width={GAME_WIDTH}
            height={GAME_HEIGHT}
            className="runner-canvas"
        />

    );

});


export default RunnerPlay;