import { useLocation } from "react-router-dom";

import TeacherGame from "./TeacherGame";
import TeacherRunnerGame from "./TeacherRunnerGame";

import StudentGame from "./StudentGame";
import RunnerGame from "./RunnerGame";


function Game() {

    const location = useLocation();

    const role =
        location.state?.role;

    const gameMode =
        location.state?.gameMode;


    /* =========================
       教師
    ========================= */

    if (role === "teacher") {

        /* -------------------------
           一般問答模式
        ------------------------- */

        if (gameMode === "quiz") {

            return <TeacherGame />;

        }


        /* -------------------------
           跑酷模式
        ------------------------- */

        if (gameMode === "runner") {

            return (
                <TeacherRunnerGame
                    roomCode={
                        location.state?.roomCode
                    }
                />
            );

        }


        /* -------------------------
           尚未開發模式
        ------------------------- */

        return (
            <UnavailableGame />
        );

    }


    /* =========================
       學生
    ========================= */

    if (role === "student") {

        /* -------------------------
           一般問答模式
        ------------------------- */

        if (gameMode === "quiz") {

            return <StudentGame />;

        }


        /* -------------------------
           跑酷模式
        ------------------------- */

        if (gameMode === "runner") {

            return <RunnerGame />;

        }


        /* -------------------------
           尚未開發模式
        ------------------------- */

        return (
            <UnavailableGame />
        );

    }


    /* =========================
       無身分資料
    ========================= */

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#f6f2e9",
                color: "#343463"
            }}
        >

            <div
                style={{
                    padding: "32px 45px",
                    background: "white",
                    border: "3px solid #343463",
                    borderRadius: "18px",
                    boxShadow: "6px 6px 0 #343463",
                    textAlign: "center"
                }}
            >

                <h1>
                    無法進入遊戲
                </h1>

                <p>
                    缺少使用者身分。
                </p>

            </div>

        </div>
    );

}


/* =========================
   尚未開放
========================= */

function UnavailableGame() {

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#f6f2e9",
                color: "#343463"
            }}
        >

            <div
                style={{
                    padding: "32px 45px",
                    background: "white",
                    border: "3px solid #343463",
                    borderRadius: "18px",
                    boxShadow: "6px 6px 0 #343463",
                    textAlign: "center"
                }}
            >

                <h1>
                    遊戲模式尚未開放
                </h1>

                <p>
                    此遊戲模式目前仍在開發中。
                </p>

            </div>

        </div>
    );

}


export default Game;