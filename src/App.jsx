import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Teacher from "./pages/Teacher";
import TeacherCreate from "./pages/TeacherCreate";
import TeacherLogin from "./pages/TeacherLogin";
import TeacherLobby from "./pages/TeacherLobby";
import Student from "./pages/Student";
import Lobby from "./pages/Lobby";
import NotFound from "./pages/NotFound";
import Game from "./pages/Game";
import TeacherResult from "./pages/TeacherResult";
import StudentResult from "./pages/StudentResult";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />

                <Route path="/teacher" element={<Teacher />} />
                <Route
                    path="/teacher/create"
                    element={<TeacherCreate />}
                />
                <Route
                    path="/teacher/login"
                    element={<TeacherLogin />}
                />
                <Route
                    path="/teacher/lobby"
                    element={<TeacherLobby />}
                />

                <Route path="/student" element={<Student />} />
                <Route path="/lobby" element={<Lobby />} />

                <Route path="/game" element={<Game />} />

                <Route
                    path="/teacher/result"
                    element={<TeacherResult />}
                />

                <Route
                    path="/student/result"
                    element={<StudentResult />}
                />

                <Route path="*" element={<NotFound />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;