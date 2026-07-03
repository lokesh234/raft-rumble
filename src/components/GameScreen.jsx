import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { createEngine } from "../game/engine.js";
import { W, H, MAX_LEVEL, LEVEL_BONUS, WEAPONS } from "../game/constants.js";
import { addCash, equipWeapon } from "../store/playerSlice.js";
import { levelCleared, shotFired, pirateSunk } from "../store/gameSlice.js";
import Hud from "./Hud.jsx";

export default function GameScreen() {
  const canvasRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const level = useSelector(s => s.game.level);
  const cash = useSelector(s => s.player.cash);
  const equippedId = useSelector(s => s.player.equippedId);
  const [outcome, setOutcome] = useState(null); // null | "win" | "lose"

  // the engine reads the equipped weapon live through a ref so we don't
  // rebuild the battle every time the player switches weapons
  const equippedRef = useRef(equippedId);
  equippedRef.current = equippedId;

  useEffect(() => {
    setOutcome(null);
    const engine = createEngine(canvasRef.current, {
      level,
      getWeaponId: () => equippedRef.current,
      onCash: amount => dispatch(addCash(amount)),
      onShot: () => dispatch(shotFired()),
      onPirateSunk: () => dispatch(pirateSunk()),
      onLevelWin: () => {
        dispatch(addCash(LEVEL_BONUS));
        setOutcome("win");
      },
      onGameOver: () => setOutcome("lose"),
    });
    return () => engine.destroy();
  }, [level, dispatch]);

  // weapon hotkeys 1-4
  useEffect(() => {
    const onKey = e => {
      const i = ["1", "2", "3", "4"].indexOf(e.key);
      if (i >= 0) dispatch(equipWeapon(WEAPONS[i].id));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dispatch]);

  const goToShop = () => {
    if (outcome === "win") dispatch(levelCleared());
    navigate("/shop");
  };

  const finishRun = () => {
    dispatch(levelCleared());
    navigate("/victory");
  };
  const lastLevel = level >= MAX_LEVEL;

  return (
    <div className="screen game-screen">
      <div className="game-wrap">
        <canvas ref={canvasRef} width={W} height={H} className="game-canvas" />
        <Hud />
        {outcome === "win" && (
          <div className="overlay">
            <h2 className="overlay-title">LEVEL CLEAR!</h2>
            <p className="overlay-sub">+${LEVEL_BONUS} bonus &nbsp;•&nbsp; total ${cash}</p>
            {lastLevel
              ? <button className="btn btn-big" onClick={finishRun}>CLAIM VICTORY</button>
              : <button className="btn btn-big" onClick={goToShop}>VISIT THE SHOP</button>}
          </div>
        )}
        {outcome === "lose" && (
          <div className="overlay">
            <h2 className="overlay-title overlay-bad">SOAKED!</h2>
            <p className="overlay-sub">Your crew went overboard on level {level}.</p>
            <button className="btn btn-big" onClick={goToShop}>GEAR UP &amp; RETRY</button>
          </div>
        )}
      </div>
    </div>
  );
}
