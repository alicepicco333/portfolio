import React, { useState, useEffect, useRef } from "react";

const ScrambleText = ({ text, className, delay = 0, highlight = false }) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  
  // Start with actual text to avoid hydration mismatch
  const [displayText, setDisplayText] = useState(text);
  const [mounted, setMounted] = useState(false);
  const animationRef = useRef(null);
  const hasAnimated = useRef(false);
  
  // Mark as mounted on client
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || hasAnimated.current) return;
    hasAnimated.current = true;

    const timeout = setTimeout(() => {
      let iteration = 0;
      const totalIterations = text.length * 3;
      const revealedChars = new Array(text.length).fill(false);
      let currentRevealed = 0;

      const scramble = () => {
        let result = "";
        
        for (let i = 0; i < text.length; i++) {
          if (text[i] === " ") {
            result += " ";
            if (!revealedChars[i]) {
              revealedChars[i] = true;
            }
          } else if (revealedChars[i]) {
            result += text[i];
          } else {
            result += chars[Math.floor(Math.random() * chars.length)];
          }
        }

        setDisplayText(result);

        const revealThreshold = Math.floor(iteration / 3);
        if (revealThreshold > currentRevealed && currentRevealed < text.length) {
          for (let i = 0; i < text.length; i++) {
            if (!revealedChars[i] && text[i] !== " ") {
              revealedChars[i] = true;
              currentRevealed++;
              break;
            }
          }
        }

        iteration++;

        const allRevealed = revealedChars.every((revealed, i) => revealed || text[i] === " ");
        
        if (!allRevealed && iteration < totalIterations + text.length * 2) {
          animationRef.current = requestAnimationFrame(() => {
            setTimeout(scramble, 30);
          });
        } else {
          setDisplayText(text);
        }
      };

      scramble();
    }, delay);

    return () => {
      clearTimeout(timeout);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [mounted, text, delay]);

  const highlightStyle = highlight ? {
    backgroundColor: "#A8C69F",
    padding: "0 8px",
    borderRadius: "8px",
  } : {};

  return (
    <span className={className} style={highlightStyle}>
      {displayText || text}
    </span>
  );
};

export default ScrambleText;
