import { useSelector } from "react-redux";
import { MAX_LEVEL, WEAPONS, AMMO } from "../game/constants.js";

export default function Hud() {
  const level = useSelector(s => s.game.level);
  const cash = useSelector(s => s.player.cash);
  const equippedId = useSelector(s => s.player.equippedId);
  const ammo = useSelector(s => s.player.ammo);

  const weapon = WEAPONS.find(w => w.id === equippedId) ?? WEAPONS[0];
  const ammoCfg = AMMO[weapon.id];
  const outOfAmmo = ammoCfg && (ammo[weapon.id] ?? 0) <= 0;
  const displayWeapon = outOfAmmo ? WEAPONS[0] : weapon;

  return (
    <div className="hud">
      <div className="hud-level">LEVEL {level} / {MAX_LEVEL}</div>
      <div className="hud-cash">${cash}</div>
      <div className="hud-weapon">
        <img src={`${import.meta.env.BASE_URL}assets/${displayWeapon.img}.svg`} alt="" />
        <span>{displayWeapon.name.toUpperCase()} <em>(keys 1-4)</em></span>
        {ammoCfg && !outOfAmmo && (
          <span className="hud-ammo">{ammo[weapon.id]} ammo</span>
        )}
        {outOfAmmo && (
          <span className="hud-ammo hud-ammo-out">{weapon.name} OUT</span>
        )}
      </div>
    </div>
  );
}
