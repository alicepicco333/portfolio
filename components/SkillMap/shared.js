// Small pieces of the hero map kept apart from its layout code: the statement and two helpers.
import { useEffect, useState } from "react";

// the statement, in pieces: plain text, and [phrase, skill] pairs that open the part of the map they name
export const STATEMENT = [
  "I’m an ",
  ["HCI researcher and designer", "hci"],
  ". I ",
  ["design interactions, devices and interfaces", "ixd"],
  ", from first interview to working prototype, and ",
  ["test them with people", "ur"],
  ".",
];
export const STATEMENT_TEXT = STATEMENT.map((part) => (typeof part === "string" ? part : part[0])).join("");

// 1 to 5 select the first skill of each step of the method: listen, order, count, shape, play
export const STEP_KEYS = ["listening", "ordering", "counting", "shaping", "playing"];

// a plain key press inside this section, not typing in a field and not a browser shortcut
export const plainKey = (e) => !(e.metaKey || e.ctrlKey || e.altKey) && !/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName);

// true while the element is on screen: the map's loop pauses when it is not
export function useInView(ref) {
  const [inView, setInView] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return undefined;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return inView;
}
