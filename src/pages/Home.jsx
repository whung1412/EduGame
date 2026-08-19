import { Link } from "react-router-dom";
import "../styles/Home.css";

function Home() {
    return (
        <div className="home-page">

            <header className="home-header">
                <div className="home-logo">
                    <div className="home-logo-icon">
                        E
                    </div>

                    <span>EduGame</span>
                </div>

                <Link
                    to="/teacher"
                    className="teacher-link"
                >
                    教師入口
                </Link>
            </header>

            <main className="home-main">

                {/* 左側 */}
                <section className="home-left">

                    <h1 className="home-title">
                        學習
                        <br />

                        <span>
                            更好玩！
                        </span>
                    </h1>

                    <p className="home-description">
                        輸入老師提供的教室代碼，
                        和同學一起進行即時問答與互動遊戲。
                    </p>

                    <p className="home-hint">
                        不需要註冊帳號即可加入
                    </p>

                </section>

                {/* 右側 */}
                <section className="home-right">

                    <Link
                        to="/student"
                        className="join-link"
                    >
                        <div className="join-card">

                            <div className="join-card-content">

                                <div className="join-small-tag">
                                    STUDENT
                                </div>

                                <h2>加入教室</h2>

                                <div className="join-arrow">
                                    →
                                </div>

                            </div>

                        </div>
                    </Link>

                </section>

            </main>

        </div>
    );
}

export default Home;