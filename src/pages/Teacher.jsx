import { Link } from "react-router-dom";
import "../styles/Teacher.css";

function Teacher() {
    return (
        <div className="teacher-page">

            <header className="teacher-header">

                <Link to="/" className="teacher-logo">
                    <div className="teacher-logo-icon">
                        E
                    </div>

                    <span>EduGame</span>
                </Link>

                <Link to="/" className="teacher-back">
                    ← 返回首頁
                </Link>

            </header>


            <main className="teacher-main">

                <div className="teacher-content">

                    <div className="teacher-title-area">
                        <h1>教師入口</h1>

                        <p>
                            選擇你要進行的操作
                        </p>
                    </div>


                    <div className="teacher-options">

                        <Link
                            to="/teacher/create"
                            className="teacher-option-link"
                        >
                            <div className="teacher-option teacher-option-create">

                                <div className="teacher-option-icon">
                                    ＋
                                </div>

                                <h2>建立新教室</h2>

                                <p>
                                    建立新的遊戲教室
                                </p>

                                <span className="teacher-option-arrow">
                                    →
                                </span>

                            </div>
                        </Link>


                        <Link
                            to="/teacher/login"
                            className="teacher-option-link"
                        >
                            <div className="teacher-option teacher-option-login">

                                <div className="teacher-option-icon">
                                    →
                                </div>

                                <h2>進入既有教室</h2>

                                <p>
                                    使用教室代碼進入
                                </p>

                                <span className="teacher-option-arrow">
                                    →
                                </span>

                            </div>
                        </Link>

                    </div>

                </div>

            </main>

        </div>
    );
}

export default Teacher;