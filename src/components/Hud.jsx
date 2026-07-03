import { useSelector } from "react-redux";
import { MAX_LEVEL, WEAPONS } from "../game/constants.js";

export default function Hud() {
  const level = useSelector(s => s.game.level);
  const cash = useSelector(s => s.player.cash);
  const equippedId = useSelector(s => s.player.equippedId);
  const weapon = WEAPONS.find(w => w.id === equippedId) ?? WEAPONS[0];

  return (
    <div className="hud">
      <div className="hud-level">LEVEL {level} / {MAX_LEVEL}</div>
      <div className="hud-cash">${cash}</div>
      <div className="hud-weapon">
        <img src={`/assets/${weapon.img}.svg`} alt="" />
        <span>{weapon.name.toUpperCase()} <em>(keys 1-4)</em></span>
      </div>
    </div>
  );
}
