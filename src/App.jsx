import { Routes, Route, Navigate } from "react-router-dom";
import TitleScreen from "./components/TitleScreen.jsx";
import GameScreen from "./components/GameScreen.jsx";
import Shop from "./components/Shop.jsx";
import Victory from "./components/Victory.jsx";

export default function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<TitleScreen />} />
        <Route path="/play" element={<GameScreen />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/victory" element={<Victory />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
