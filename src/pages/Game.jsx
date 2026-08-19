import { useLocation } from "react-router-dom";

import TeacherGame from "./TeacherGame";
import StudentGame from "./StudentGame";

function Game() {
    const location = useLocation();

    const role = location.state?.role;

    if (role === "teacher") {
        return <TeacherGame />;
    }

    if (role === "student") {
        return <StudentGame />;
    }

    return (
        <div>
            <h1>無法進入遊戲</h1>
            <p>缺少使用者身分。</p>
        </div>
    );
}

export default Game;