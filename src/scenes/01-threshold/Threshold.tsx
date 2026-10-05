"use client";

import { useEffect, useRef } from "react";
import { threshold } from "@/config/site";

interface Props {
  /** 0 to 1: how far the blade is out of its sheath. Tracks real loading. */
  progress: number;
  ready: boolean;
  leaving: boolean;
  onEnter: (withSound: boolean) => void;
  onSkip: () => void;
}

/**
 * Scene 1: a black screen and one line of light. Loading draws the blade
 * from its sheath; once it is out, the two ways in appear. "Skip the
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
      aria-labelledby="threshold-word"
      tabIndex={-1}
    >
      <div className="threshold-stage">
        <p id="threshold-word" className="threshold-word">
          {threshold.word}
        </p>
        <div
          className="threshold-blade"
          role="progressbar"
          aria-label={threshold.loading}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
        >
          <span className="threshold-sheath" />
          <span className="threshold-light" style={{ transform: `scaleX(${0.03 + 0.97 * progress})` }} />
        </div>
        <div className="threshold-choices" aria-hidden={!ready}>
          <button type="button" className="threshold-choice" tabIndex={ready ? 0 : -1} onClick={() => onEnter(true)}>
            {threshold.withSound}
          </button>
          <button type="button" className="threshold-choice" tabIndex={ready ? 0 : -1} onClick={() => onEnter(false)}>
            {threshold.inSilence}
          </button>
        </div>
      </div>
      <a
        href="#blades"
        className="threshold-skip"
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
