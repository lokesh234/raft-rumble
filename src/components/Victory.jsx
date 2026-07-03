import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { resetGame } from "../store/gameSlice.js";
import { resetPlayer } from "../store/playerSlice.js";

export default function Victory() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cash = useSelector(s => s.player.cash);
  const { shotsFired, piratesSunk } = useSelector(s => s.game);

  const playAgain = () => {
    dispatch(resetGame());
    dispatch(resetPlayer());
    navigate("/");
  };

  return (
    <div className="screen victory-screen">
      <img src="/assets/player.svg" alt="Victorious baby" className="victory-hero bob" />
      <h1 className="title-logo">YOU WIN!</h1>
      <p className="title-sub">The seas are yours.</p>
      <div className="victory-stats">
        <div><strong>${cash}</strong><span>final haul</span></div>
        <div><strong>{piratesSunk}</strong><span>pirates sunk</span></div>
        <div><strong>{shotsFired}</strong><span>shots thrown</span></div>
      </div>
      <button className="btn btn-big" onClick={playAgain}>PLAY AGAIN</button>
    </div>
  );
}
