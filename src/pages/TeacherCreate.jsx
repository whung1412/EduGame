import { useState } from "react";
import { createRoom } from "../firebase/roomService";
import { parseExcelQuestions } from "../utils/excelParser";
import { saveQuestions } from "../firebase/questionService";
import { Link, useNavigate } from "react-router-dom";
import "../styles/TeacherCreate.css";

function TeacherCreate() {
    const [roomName, setRoomName] = useState("");
    const [gameMode, setGameMode] = useState("quiz");
    const [loading, setLoading] = useState(false);
    const [teacherPassword, setTeacherPassword] = useState("");
    const [excelFile, setExcelFile] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [showExcelHelp, setShowExcelHelp] = useState(false);

    const navigate = useNavigate();


    /* =========================
       建立教室
    ========================= */

    const handleCreateRoom = async () => {
        if (!roomName.trim()) {
            alert("請輸入教室名稱！");
            return;
        }

        if (teacherPassword.trim().length < 4) {
            alert("教師密碼至少需要 4 碼！");
            return;
        }

        if (!excelFile) {
            alert("請選擇 Excel 題庫");
            return;
        }

        if (questions.length === 0) {
            alert("Excel 中沒有可使用的題目");
            return;
        }

        try {
            setLoading(true);

            const createdRoomName = roomName.trim();

            const roomCode = await createRoom(
                createdRoomName,
                gameMode,
                teacherPassword.trim(),
                questions.length
            );

            await saveQuestions(
                roomCode,
                questions
            );

            navigate("/teacher/lobby", {
                state: {
                    roomCode,
                    roomName: createdRoomName,
                    gameMode
                }
            });

        } catch (error) {
            console.error(
                "建立教室失敗：",
                error
            );

            alert(
                error.message ||
                "建立失敗，請稍後再試。"
            );

        } finally {
            setLoading(false);
        }
    };


    /* =========================
       Excel
    ========================= */

    const handleExcelChange = async (event) => {
        const file =
            event.target.files?.[0] ?? null;

        setExcelFile(file);
        setQuestions([]);

        if (!file) {
            return;
        }

        try {
            const parsedQuestions =
                await parseExcelQuestions(file);

            setQuestions(parsedQuestions);

        } catch (error) {
            console.error(
                "解析 Excel 失敗：",
                error
            );

            alert(error.message);

            setExcelFile(null);
        }
    };


    return (
        <div className="create-page">

            {/* =========================
                Header
            ========================= */}

            <header className="create-header">

                <Link
                    to="/"
                    className="create-logo"
                >
                    <div className="create-logo-icon">
                        E
                    </div>

                    <span>
                        EduGame
                    </span>
                </Link>


                <Link
                    to="/teacher"
                    className="create-back"
                >
                    ← 教師入口
                </Link>

            </header>


            {/* =========================
                Main
            ========================= */}

            <main className="create-main">

                <div className="create-wrapper">

                    {/* 標題 */}

                    <div className="create-title">

                        <h1>
                            建立教室
                        </h1>

                        <p>
                            設定教室資訊並匯入題庫
                        </p>

                    </div>


                    {/* 卡片底色 */}

                    <div className="create-card-shadow">

                        <div className="create-card">


                            {/* =========================
                                左右兩欄
                            ========================= */}

                            <div className="create-columns">


                                {/* =========================
                                    左側：教室資訊
                                ========================= */}

                                <section className="create-info-section">

                                    {/* 教室名稱 */}

                                    <div className="create-field">

                                        <label htmlFor="roomName">
                                            教室名稱
                                        </label>

                                        <input
                                            id="roomName"
                                            className="app-input"
                                            type="text"
                                            value={roomName}
                                            placeholder="例如：數學小測驗"
                                            onChange={(event) =>
                                                setRoomName(
                                                    event.target.value
                                                )
                                            }
                                        />

                                    </div>


                                    {/* 教師密碼 */}

                                    <div className="create-field">

                                        <label htmlFor="teacherPassword">
                                            教師密碼
                                        </label>

                                        <input
                                            id="teacherPassword"
                                            className="app-input"
                                            type="password"
                                            value={teacherPassword}
                                            placeholder="至少 4 碼"
                                            onChange={(event) =>
                                                setTeacherPassword(
                                                    event.target.value
                                                )
                                            }
                                        />

                                        <span className="create-field-hint">
                                            之後進入教室管理頁時會使用
                                        </span>

                                    </div>


                                    {/* =========================
                                        Excel
                                    ========================= */}

                                    <div className="create-field">

                                        <div className="create-label-row">

                                            <label>
                                                Excel 題庫
                                            </label>

                                            <button
                                                type="button"
                                                className={`excel-help-button ${
                                                    showExcelHelp
                                                        ? "active"
                                                        : ""
                                                }`}
                                                onClick={() =>
                                                    setShowExcelHelp(
                                                        !showExcelHelp
                                                    )
                                                }
                                                aria-label="查看 Excel 格式"
                                            >
                                                ?
                                            </button>

                                        </div>


                                        {/* 上傳 */}

                                        <label
                                            className="create-file"
                                            htmlFor="excelFile"
                                        >

                                            <div className="create-file-icon">
                                                ↑
                                            </div>


                                            <div className="create-file-text">

                                                <strong>
                                                    {excelFile
                                                        ? excelFile.name
                                                        : "選擇 Excel 題庫"}
                                                </strong>

                                                <span>
                                                    支援 .xlsx、.xls
                                                </span>

                                            </div>


                                            <input
                                                id="excelFile"
                                                type="file"
                                                accept=".xlsx,.xls"
                                                onChange={handleExcelChange}
                                            />

                                        </label>


                                        {/* 成功 */}

                                        {questions.length > 0 && (
                                            <div className="create-file-success">
                                                ✓ 已成功讀取 {questions.length} 題
                                            </div>
                                        )}


                                        {/* =========================
                                            Excel 格式說明
                                        ========================= */}

                                        {showExcelHelp && (
                                            <div className="excel-help">

                                                <div className="excel-help-header">

                                                    <strong>
                                                        Excel 題庫格式
                                                    </strong>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setShowExcelHelp(false)
                                                        }
                                                    >
                                                        ×
                                                    </button>

                                                </div>


                                                <p>
                                                    第一列請依照以下格式填寫，
                                                    每一列代表一道題目。
                                                </p>


                                                <div className="excel-table-wrapper">

                                                    <table className="excel-format-table">

                                                        <thead>
                                                            <tr>
                                                                <th>題目</th>
                                                                <th>A</th>
                                                                <th>B</th>
                                                                <th>C</th>
                                                                <th>D</th>
                                                                <th>答案</th>
                                                            </tr>
                                                        </thead>

                                                        <tbody>
                                                            <tr>
                                                                <td>題目內容</td>
                                                                <td>選項A</td>
                                                                <td>選項B</td>
                                                                <td>選項C</td>
                                                                <td>選項D</td>
                                                                <td>A</td>
                                                            </tr>
                                                        </tbody>

                                                    </table>

                                                </div>


                                                <span className="excel-help-note">
                                                    答案欄請填寫 A、B、C 或 D
                                                </span>

                                            </div>
                                        )}

                                    </div>

                                </section>


                                {/* =========================
                                    右側：遊戲模式
                                ========================= */}

                                <section className="create-mode-section">

                                    <h2 className="create-section-title">
                                        遊戲模式
                                    </h2>


                                    <div className="game-mode-list">


                                        {/* 問答 */}

                                        <button
                                            type="button"
                                            className={`game-mode-card ${
                                                gameMode === "quiz"
                                                    ? "active"
                                                    : ""
                                            }`}
                                            onClick={() =>
                                                setGameMode("quiz")
                                            }
                                        >

                                            <div className="game-mode-top">

                                                <span className="game-mode-name">
                                                    問答
                                                </span>

                                                <span className="game-mode-status available">
                                                    可使用
                                                </span>

                                            </div>


                                            <p className="game-mode-description">
                                                依序進行題目作答，
                                                根據答題結果計算分數。
                                            </p>

                                        </button>


                                        {/* 跑酷 */}
                                        <button
                                            type="button"
                                            className={`game-mode-card ${
                                                gameMode === "runner"
                                                    ? "active"
                                                    : ""
                                            }`}
                                            onClick={() =>
                                                setGameMode("runner")
                                            }
                                        >

                                            <div className="game-mode-top">

                                                <span className="game-mode-name">
                                                    跑酷
                                                </span>

                                                <span className="game-mode-status available">
                                                    可使用
                                                </span>

                                            </div>

                                            <p className="game-mode-description">
                                                操作角色跳躍與下蹲躲避障礙，
                                                透過答題獲得復活與特殊效果。
                                            </p>

                                        </button>


                                        {/* 射擊 */}

                                        <button
                                            type="button"
                                            className="game-mode-card disabled"
                                            disabled
                                        >

                                            <div className="game-mode-top">

                                                <span className="game-mode-name">
                                                    射擊
                                                </span>

                                                <span className="game-mode-status">
                                                    待開發
                                                </span>

                                            </div>


                                            <p className="game-mode-description">
                                                根據題目選擇正確目標，
                                                結合射擊操作進行答題。
                                            </p>

                                        </button>


                                        {/* 配對 */}

                                        <button
                                            type="button"
                                            className="game-mode-card disabled"
                                            disabled
                                        >

                                            <div className="game-mode-top">

                                                <span className="game-mode-name">
                                                    配對
                                                </span>

                                                <span className="game-mode-status">
                                                    待開發
                                                </span>

                                            </div>


                                            <p className="game-mode-description">
                                                將題目與答案配對，
                                                訓練記憶與理解。
                                            </p>

                                        </button>

                                    </div>

                                </section>

                            </div>


                            {/* =========================
                                建立
                            ========================= */}

                            <button
                                className="primary-button create-submit"
                                type="button"
                                onClick={handleCreateRoom}
                                disabled={loading}
                            >
                                {loading
                                    ? "建立中..."
                                    : "建立教室 →"}
                            </button>

                        </div>

                    </div>

                </div>

            </main>

        </div>
    );
}

export default TeacherCreate;