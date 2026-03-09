"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useTheme } from "@/components/ThemeProvider"; // Adjust path as needed

export interface Login3DTheme {
  light: {
    topBg: string;
    bottomBg: string;
    shadowBg: string;
    textAndBorder: string;
    gloss: string;
  };
  dark: {
    topBg: string;
    bottomBg: string;
    shadowBg: string;
    textAndBorder: string;
    gloss: string;
  };
}

export interface LoginButtonProps {
  text?: string;
  themeColors?: Login3DTheme;
  animationDelay?: number;
  onClick?: () => void;
  className?: string;
}

const defaultTheme: Login3DTheme = {
  light: {
    topBg: "#E8E2D6",         // Beige
    bottomBg: "#C2D1D1",      // Light Blue
    shadowBg: "#856358",      // Medium Brown
    textAndBorder: "#5A403A", // Dark Brown
    gloss: "rgba(0, 0, 0, 0.1)",
  },
  dark: {
    topBg: "#5A403A",         // Dark Brown
    bottomBg: "#856358",      // Medium Brown
    shadowBg: "#110e0c",      // Very Dark Brown
    textAndBorder: "#E8E2D6", // Beige
    gloss: "rgba(255, 255, 255, 0.1)",
  },
};

export default function LoginButton3D({
  text = "LOGIN",
  themeColors = defaultTheme,
  animationDelay = 0.2,
  onClick,
  className = "",
}: LoginButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const topFaceRef = useRef<HTMLDivElement>(null);
  const glossRef = useRef<HTMLDivElement>(null);
  
  const { theme } = useTheme();
  const currentTheme = theme === "dark" ? themeColors.dark : themeColors.light;

  const { contextSafe } = useGSAP({ scope: containerRef });

  // 1. Entrance animation
  useGSAP(() => {
    gsap.fromTo(
      containerRef.current,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, delay: animationDelay, ease: "power3.out" }
    );
  }, [animationDelay]);

  // 2. GSAP Interaction logic for the 3D press and gloss sweep
  const handlePressDown = contextSafe(() => {
    // Push the top face down exactly 10px
    gsap.to(topFaceRef.current, { y: 10, duration: 0.1, ease: "power2.out" });
    // Sweep the gloss effect across the button
    gsap.to(glossRef.current, { left: "calc(100% + 20px)", duration: 0.25, ease: "power2.inOut" });
  });

  const handlePressRelease = contextSafe(() => {
    // Pop the face back up with a slight spring effect
    gsap.to(topFaceRef.current, { y: 0, duration: 0.3, ease: "back.out(1.5)" });
    // Reset the gloss back to the left side
    gsap.to(glossRef.current, { left: "-20px", duration: 0.3, ease: "power2.inOut" });
  });

  // 3. Accessibility: Support keyboard enter/spacebar pressing
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handlePressDown();
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handlePressRelease();
      if (onClick) onClick();
    }
  };

  return (
    <div ref={containerRef} className={`inline-block ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={onClick}
        onPointerDown={handlePressDown}
        onPointerUp={handlePressRelease}
        onPointerLeave={handlePressRelease} // Ensures it pops back up if they drag their mouse off
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        className="relative w-[140px] h-[50px] bg-transparent border-none p-0 m-0 cursor-pointer font-sans outline-none focus-visible:ring-4 focus-visible:ring-offset-2 transition-colors duration-500 rounded-xl"
        style={{ '--tw-ring-color': currentTheme.textAndBorder } as React.CSSProperties}
        aria-label="Login"
      >
        {/* Extra shading layer behind the base */}
        <div
          className="absolute top-[14px] -left-[1px] w-[calc(100%+2px)] h-full rounded-xl border-2 -z-20 transition-colors duration-500"
          style={{
            backgroundColor: currentTheme.shadowBg,
            borderColor: currentTheme.textAndBorder,
          }}
        />

        {/* Bottom shadow/surface */}
        <div
          className="absolute top-[10px] left-0 w-full h-full rounded-xl border-2 -z-10 transition-colors duration-500"
          style={{
            backgroundColor: currentTheme.bottomBg,
            borderColor: currentTheme.textAndBorder,
          }}
          aria-hidden="true"
        >
          {/* Small vertical posts on the base */}
          <div
            className="absolute bottom-0 left-[15%] w-[2px] h-[9px] transition-colors duration-500"
            style={{ backgroundColor: currentTheme.textAndBorder }}
          />
          <div
            className="absolute bottom-0 left-[85%] w-[2px] h-[9px] transition-colors duration-500"
            style={{ backgroundColor: currentTheme.textAndBorder }}
          />
        </div>

        {/* Top face (Animated via GSAP refs instead of CSS classes) */}
        <div
          ref={topFaceRef}
          className="absolute inset-0 w-full h-full flex items-center justify-center text-base rounded-xl border-2 overflow-hidden transition-colors duration-500"
          style={{
            backgroundColor: currentTheme.topBg,
            color: currentTheme.textAndBorder,
            borderColor: currentTheme.textAndBorder,
          }}
        >
          <span className="relative z-10 font-semibold tracking-wider uppercase pointer-events-none">
            {text}
          </span>
          
          {/* Gloss on the top face */}
          <div
            ref={glossRef}
            className="absolute w-[15px] h-full -skew-x-[30deg] -left-[20px] pointer-events-none transition-colors duration-500"
            style={{ backgroundColor: currentTheme.gloss }}
          />
        </div>
      </button>
    </div>
  );
}