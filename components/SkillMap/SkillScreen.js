import React, { useEffect, useRef, useState } from "react";
import { withBase } from "../../utils";
import { STILLS } from "./stills";

// The skill's screen: a picture of a project that used the skill, behind the skill itself (its point,
// label and links are drawn on top), as the live-coding screen once sat behind Playing. No code and no
// effects: the work as it is, moving slowly (a slow pan and zoom) while motion is on, still otherwise.
export const SCREEN = { w: 380, h: 250 }; // stage units

const SkillScreen = ({ skill, box, animate }) => {
  const wrapRef = useRef(null);
  // the last skill shown stays on the screen while it fades out
  const [shown, setShown] = useState(skill);
  useEffect(() => {
    if (skill) setShown(skill);
  }, [skill]);
  const on = !!skill && !!box;

  // a screen opening on another skill fades in
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || !skill || !animate || !el.animate) return;
    el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 360, easing: "cubic-bezier(0.23, 1, 0.32, 1)" });
  }, [skill, animate]);

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      className="skill-screen pointer-events-none absolute z-0 overflow-hidden bg-ink"
      data-on={on ? "true" : "false"}
      style={box ? { left: box.x, top: box.y, width: SCREEN.w, height: SCREEN.h } : { left: 0, top: 0, width: SCREEN.w, height: SCREEN.h }}
    >
      {shown && (
        <img
          key={shown}
          src={withBase(STILLS[shown][1])}
          alt=""
          draggable={false}
          className={`block h-full w-full object-cover ${animate ? "skill-screen-move" : ""}`}
        />
      )}
    </div>
  );
};

export default SkillScreen;
