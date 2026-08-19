import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { enterTeacherRoom } from "../firebase/roomService";
import "../styles/TeacherLogin.css";


function TeacherLogin() {
    const [roomCode, setRoomCode] = useState("");
    const [teacherPassword, setTeacherPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const navigate = useNavigate();


    /* =========================
       進入教室
    ========================= */

    const handleEnterRoom = async () => {
        const normalizedCode =
            roomCode.trim().toUpperCase();

        const normalizedPassword =
            teacherPassword.trim();


        if (normalizedCode.length !== 6) {
            setErrorMessage(
                "請輸入六碼教室代碼"
            );

            return;
        }


        if (!normalizedPassword) {
            setErrorMessage(
                "請輸入教師密碼"
            );

            return;
        }


        try {
            setLoading(true);
            setErrorMessage("");


            const room =
                await enterTeacherRoom(
                    normalizedCode,
                    normalizedPassword
                );


            navigate("/teacher/lobby", {
                state: {
                    roomCode: normalizedCode,
                    roomName: room.roomName,
                    gameMode: room.gameMode
                }
            });

        } catch (error) {
            console.error(
                "進入教室失敗：",
                error
            );

            setErrorMessage(
                error.message ||
                "進入教室失敗"
            );

        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="teacher-login-page">

            {/* =========================
                Header
            ========================= */}

            <header className="teacher-login-header">

                <Link
                    to="/"
                    className="teacher-login-logo"
                >
                    <div className="teacher-login-logo-icon">
                        E
                    </div>

                    <span>
                        EduGame
                    </span>
                </Link>


                <Link
                    to="/teacher"
                    className="teacher-login-back"
                >
                    ← 教師入口
                </Link>

            </header>


            {/* =========================
                Main
            ========================= */}

            <main className="teacher-login-main">

                <div className="teacher-login-wrapper">


                    {/* =========================
                        卡片
                    ========================= */}

                    <div className="teacher-login-shadow">

                        <div className="teacher-login-card">


                            <div className="teacher-login-title">

                                <h1>
                                    進入既有教室
                                </h1>

                                <p>
                                    輸入教室代碼與教師密碼
                                </p>

                            </div>


                            {/* 教室代碼 */}

                            <div className="teacher-login-field">

                                <label htmlFor="teacherRoomCode">
                                    教室代碼
                                </label>


                                <input
                                    id="teacherRoomCode"
                                    className="app-input teacher-login-code"
                                    type="text"
                                    value={roomCode}
                                    maxLength={6}
                                    placeholder="A7X9KQ"
                                    autoComplete="off"
                                    onChange={(event) => {

                                        const value =
                                            event.target.value
                                                .toUpperCase()
                                                .replace(
                                                    /[^A-Z0-9]/g,
                                                    ""
                                                );

                                        setRoomCode(value);
                                    }}
                                />


                                <span className="teacher-login-hint">
                                    六碼英文字母或數字
                                </span>

                            </div>


                            {/* 教師密碼 */}

                            <div className="teacher-login-field">

                                <label htmlFor="teacherPassword">
                                    教師密碼
                                </label>


                                <input
                                    id="teacherPassword"
                                    className="app-input"
                                    type="password"
                                    value={teacherPassword}
                                    placeholder="請輸入建立教室時設定的密碼"
                                    onChange={(event) =>
                                        setTeacherPassword(
                                            event.target.value
                                        )
                                    }
                                />

                            </div>


                            {/* 錯誤 */}

                            {errorMessage && (
                                <div className="teacher-login-error">
                                    {errorMessage}
                                </div>
                            )}


                            {/* 進入 */}

                            <button
                                className="primary-button teacher-login-submit"
                                type="button"
                                onClick={handleEnterRoom}
                                disabled={loading}
                            >
                                {loading
                                    ? "驗證中..."
                                    : "進入教室 →"}
                            </button>

                        </div>

                    </div>

                </div>

            </main>

        </div>
    );
}

export default TeacherLogin;