import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { resetGame } from "../store/gameSlice.js";
import { resetPlayer } from "../store/playerSlice.js";
import { initAudio, sfx } from "../game/sound.js";

export default function TitleScreen() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const start = () => {
    initAudio();
    sfx.cash();
    dispatch(resetGame());
    dispatch(resetPlayer());
    navigate("/play");
  };

  return (
    <div className="screen title-screen">
      <div className="title-cast">
        <img src={`${import.meta.env.BASE_URL}assets/player.svg`} alt="Baby hero" className="bob" />
        <img src={`${import.meta.env.BASE_URL}assets/ball.svg`} alt="Tennis ball" className="title-ball spin" />
        <img src={`${import.meta.env.BASE_URL}assets/enemy.svg`} alt="Pirate" className="bob delay" />
      </div>
      <h1 className="title-logo">RAFT RUMBLE</h1>
      <p className="title-sub">Pirates want your raft. Bean them with tennis balls.</p>
      <button className="btn btn-big" onClick={start}>START GAME</button>
      <p className="title-hint">Aim with the mouse, click to throw. Earn cash, buy bigger guns.</p>
      <div className="title-waves" aria-hidden="true" />
    </div>
  );
}
