import { Routes, Route } from "react-router-dom";
import App from "./App";
import Start from "./Start";
import Detect from "./Detect";

function PageRoutes() {
    return (
        <div className="App">
            <Routes>
                <Route path="/" element={<Start />} />
                <Route path="/detect" element={<App />} />
                <Route path="/detect/run" element={<Detect />} />
            </Routes>
        </div>
    )
}

export default PageRoutes;