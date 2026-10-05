/*
 * Parallax for the cel world. Each layer carries data-parallax (its depth,
 * 0 far to 1 near). Scrolling sinks nearer layers a little faster, so the
 * camera seems to rise; the pointer sways them sideways. Off under reduced
 * motion: the caller simply never starts it.
 */
export function startParallax(): () => void {
  const layers = [...document.querySelectorAll<HTMLElement | SVGElement>(".world [data-parallax]")].map((el) => ({
    el,
    depth: Number(el.getAttribute("data-parallax") ?? 0),
  }));
  let px = 0;
  let py = 0;
  let raf = 0;

  const apply = () => {
    raf = 0;
    const vh = window.innerHeight;
    // Capped so the ground never uncovers the city's base.
    const scroll = Math.min(window.scrollY / vh, 3);
    for (const { el, depth } of layers) {
      const x = -px * depth * 28;
      const y = scroll * depth * vh * 0.06 - py * depth * 10;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    }
  };
  const schedule = () => {
    if (!raf) raf = requestAnimationFrame(apply);
  };
  const onPointer = (e: PointerEvent) => {
    px = e.clientX / window.innerWidth - 0.5;
    py = e.clientY / window.innerHeight - 0.5;
    schedule();
  };

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("pointermove", onPointer, { passive: true });
  window.addEventListener("resize", schedule);
  apply();
  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("pointermove", onPointer);
    window.removeEventListener("resize", schedule);
    for (const { el } of layers) el.style.transform = "";
  };
}
