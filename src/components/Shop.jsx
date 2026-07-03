import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { WEAPONS } from "../game/constants.js";
import { buyWeapon, equipWeapon } from "../store/playerSlice.js";
import { initAudio, sfx } from "../game/sound.js";

function WeaponCard({ weapon }) {
  const dispatch = useDispatch();
  const cash = useSelector(s => s.player.cash);
  const owned = useSelector(s => !!s.player.owned[weapon.id]);
  const equipped = useSelector(s => s.player.equippedId === weapon.id);

  const onClick = () => {
    initAudio();
    if (owned) {
      if (!equipped) { dispatch(equipWeapon(weapon.id)); sfx.cash(); }
    } else if (cash >= weapon.price) {
      dispatch(buyWeapon(weapon.id));
      sfx.buy();
    } else {
      sfx.deny();
    }
  };

  const status = equipped
    ? <span className="card-status equipped">EQUIPPED</span>
    : owned
      ? <span className="card-status owned">CLICK TO EQUIP</span>
      : <span className={`card-status ${cash >= weapon.price ? "affordable" : "expensive"}`}>BUY ${weapon.price}</span>;

  return (
    <button
      className={`weapon-card ${equipped ? "is-equipped" : owned ? "is-owned" : ""}`}
      onClick={onClick}
      aria-pressed={equipped}
    >
      <div className="card-icon"><img src={`/assets/${weapon.img}.svg`} alt={weapon.name} /></div>
      <h3>{weapon.name}</h3>
      <div className="card-stat dmg">DMG&nbsp;&nbsp;{"■".repeat(Math.round(weapon.dmg * 2))}</div>
      <div className="card-stat blast">BLAST&nbsp;&nbsp;{weapon.blast}</div>
      <p className="card-blurb">{weapon.blurb}</p>
      {status}
    </button>
  );
}

export default function Shop() {
  const navigate = useNavigate();
  const cash = useSelector(s => s.player.cash);
  const level = useSelector(s => s.game.level);

  return (
    <div className="screen shop-screen">
      <header className="shop-header">
        <span className="shop-hint">Click a weapon to buy or equip</span>
        <h1>SUPPLY SHOP</h1>
        <span className="shop-cash">YOUR CASH: ${cash}</span>
      </header>
      <div className="shop-grid">
        {WEAPONS.map(w => <WeaponCard key={w.id} weapon={w} />)}
      </div>
      <button className="btn btn-big" onClick={() => navigate("/play")}>
        START LEVEL {level} ➤
      </button>
    </div>
  );
}
