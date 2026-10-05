"use client";

import { useEffect, useRef } from "react";
import { threshold } from "@/config/site";

interface Props {
  /** 0 to 1: how far the blade is drawn. Tracks real loading. */
  progress: number;
  ready: boolean;
  leaving: boolean;
  onEnter: (withSound: boolean) => void;
  onSkip: () => void;
}

/**
 * Scene 1: the CRT powers on. A cream dot stretches to a line and fills the
 * screen (pure CSS, from the first frame); the boot line types in; loading
 * draws a blade as the progress bar; then the two ways in. "Skip the
 * ceremony" is there from the first frame and works without JavaScript.
 */
export function Threshold({ progress, ready, leaving, onEnter, onSkip }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);

  const percent = Math.round(progress * 100);

  return (
    <div
      ref={ref}
      className="threshold"
      data-ready={ready ? "" : undefined}
      data-leaving={leaving ? "" : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby="boot-title"
      tabIndex={-1}
    >
      <div className="tube" aria-hidden="true" />
      <div className="boot">
        <p id="boot-title" className="boot-line">
          <span className="boot-type" style={{ ["--chars" as string]: threshold.boot.length }}>
            {threshold.boot}
          </span>
          <i className="term-cursor" aria-hidden="true" />
        </p>
        <div
          className="boot-blade"
          role="progressbar"
          aria-label={threshold.loadLabel}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
        >
          <svg viewBox="0 0 480 28" aria-hidden="true" focusable="false">
            {/* The grip and guard stay put; the blade is drawn out by the load. */}
            <rect x="2" y="9" width="58" height="10" fill="var(--moss)" stroke="var(--outline)" strokeWidth="2" />
            <rect x="60" y="3" width="10" height="22" fill="var(--sun-gold)" stroke="var(--outline)" strokeWidth="2" />
            <g className="boot-blade-steel" style={{ clipPath: `inset(0 ${(1 - progress) * 100}% 0 0)` }}>
              <path d="M70 9 H448 L476 15 L448 19 H70 Z" fill="var(--cel-cream)" stroke="var(--outline)" strokeWidth="2" strokeLinejoin="round" />
              <path d="M74 16 H452" stroke="var(--moss)" strokeWidth="1.5" />
            </g>
          </svg>
        </div>
        <p className="boot-load" aria-hidden="true">
          {threshold.loadLabel} {String(percent).padStart(3, "0")}%
        </p>
        <div className="boot-choices" aria-hidden={!ready}>
          <button type="button" className="boot-choice" tabIndex={ready ? 0 : -1} onClick={() => onEnter(true)}>
            {threshold.withSound}
          </button>
          <button type="button" className="boot-choice" tabIndex={ready ? 0 : -1} onClick={() => onEnter(false)}>
            {threshold.inSilence}
          </button>
        </div>
      </div>
      {/* The screen is dark until the tube warms: a dot, a line, then it opens from the middle. */}
      <div className="tube-cover" aria-hidden="true">
        <i className="cover-top" />
        <i className="cover-bottom" />
        <i className="tube-flash" />
      </div>
      <a
        href="#blades"
        className="boot-skip"
        onClick={(e) => {
          e.preventDefault();
          onSkip();
        }}
      >
        {threshold.skip}
      </a>
    </div>
  );
}
