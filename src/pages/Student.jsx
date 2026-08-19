import { useState } from "react";
import { joinRoom } from "../firebase/roomService";
import { addPlayer } from "../firebase/playerService";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Student.css";

function Student() {
    const [roomCode, setRoomCode] = useState("");
    const [playerName, setPlayerName] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const navigate = useNavigate();

    const handleJoinRoom = async () => {
        const normalizedCode = roomCode.trim().toUpperCase();
        const normalizedName = playerName.trim();

        if (!normalizedCode) {
            setErrorMessage("請輸入教室代碼");
            return;
        }

        if (normalizedCode.length !== 6) {
            setErrorMessage("教室代碼必須是六碼");
            return;
        }

        if (!normalizedName) {
            setErrorMessage("請輸入學生名稱");
            return;
        }

        try {
            setLoading(true);
            setErrorMessage("");

            const room = await joinRoom(normalizedCode);

            const player = await addPlayer(
                normalizedCode,
                normalizedName
            );

            navigate("/lobby", {
                state: {
                    roomCode: normalizedCode,
                    roomName: room.roomName,
                    gameMode: room.gameMode,
                    playerId: player.playerId,
                    playerName: normalizedName
                }
            });
        } catch (error) {
            console.error("加入教室失敗：", error);

            setErrorMessage(
                error.message || "加入教室失敗"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="student-page">

            <header className="student-header">

                <Link to="/" className="student-logo">
                    <div className="student-logo-icon">
                        E
                    </div>

                    <span>EduGame</span>
                </Link>

                <Link to="/" className="student-back">
                    ← 返回首頁
                </Link>

            </header>

            <main className="student-main">

                <div className="student-form-wrapper">

                    <div className="student-form-shadow">

                        <div className="student-form-card">

                            <h1>加入教室</h1>

                            <p className="student-form-description">
                                輸入老師提供的教室資訊
                            </p>

                            <div className="student-field">

                                <label htmlFor="roomCode">
                                    教室代碼
                                </label>

                                <input
                                    id="roomCode"
                                    className="app-input student-code-input"
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

                                <span className="student-field-hint">
                                    六碼英文字母或數字
                                </span>

                            </div>

                            <div className="student-field">

                                <label htmlFor="playerName">
                                    學生名稱
                                </label>

                                <input
                                    id="playerName"
                                    className="app-input"
                                    type="text"
                                    value={playerName}
                                    placeholder="請輸入你的名稱"
                                    onChange={(event) =>
                                        setPlayerName(
                                            event.target.value
                                        )
                                    }
                                />

                            </div>

                            {errorMessage && (
                                <div className="student-error">
                                    {errorMessage}
                                </div>
                            )}

                            <button
                                className="primary-button student-submit"
                                type="button"
                                onClick={handleJoinRoom}
                                disabled={loading}
                            >
                                {loading
                                    ? "加入中..."
                                    : "加入教室 →"}
                            </button>

                        </div>

                    </div>

                </div>

            </main>

        </div>
    );
}

export default Student;