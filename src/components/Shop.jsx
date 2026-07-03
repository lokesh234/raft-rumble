import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { WEAPONS, AMMO } from "../game/constants.js";
import { buyWeapon, equipWeapon, buyAmmo } from "../store/playerSlice.js";
import { initAudio, sfx } from "../game/sound.js";

function AmmoPanel({ weapon }) {
  const dispatch = useDispatch();
  const cash = useSelector(s => s.player.cash);
  const owned = useSelector(s => !!s.player.owned[weapon.id]);
  const ammoCount = useSelector(s => s.player.ammo[weapon.id] ?? 0);
  const cfg = AMMO[weapon.id];

  if (!owned) return null;

  const canAfford = cash >= cfg.refillPrice;

  const handleBuy = () => {
    initAudio();
    if (canAfford) { dispatch(buyAmmo(weapon.id)); sfx.buy(); }
    else sfx.deny();
  };

  return (
    <div className="ammo-panel">
      <span className={`ammo-count${ammoCount === 0 ? " ammo-empty" : ""}`}>{ammoCount} ammo left</span>
      <button
        className={`ammo-btn ${canAfford ? "affordable" : "expensive"}`}
        onClick={handleBuy}
      >
        +{cfg.refillQty} for ${cfg.refillPrice}
      </button>
    </div>
  );
}

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
      <div className="card-icon"><img src={`${import.meta.env.BASE_URL}assets/${weapon.img}.svg`} alt={weapon.name} /></div>
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
        {WEAPONS.map(w => (
          <div key={w.id} className="weapon-slot">
            <WeaponCard weapon={w} />
            {AMMO[w.id] && <AmmoPanel weapon={w} />}
          </div>
        ))}
      </div>
      <button className="btn btn-big" onClick={() => navigate("/play")}>
        START LEVEL {level} ➤
      </button>
    </div>
  );
}
