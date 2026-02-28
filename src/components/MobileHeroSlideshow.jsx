import { useEffect, useMemo, useRef, useState } from "react";

export default function MobileHeroSlideshow({
  images,
  holdMs = 2000,
  slideMs = 700,
  children,
  className = "",
}) {
  const [index, setIndex] = useState(0);
  const [transitionOn, setTransitionOn] = useState(true);
  const timerRef = useRef(null);

  // slides = images + first image cloned at the end
  const slides = useMemo(() => {
    if (!images?.length) return [];
    return [...images, images[0]];
  }, [images]);

  const lastIndex = slides.length - 1; // this is the cloned first slide

  // autoplay
  useEffect(() => {
    if (!images?.length) return;

    const tick = () => {
      // go to next slide (including the clone)
      setIndex((prev) => prev + 1);
    };

    timerRef.current = setInterval(tick, holdMs + slideMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [images, holdMs, slideMs]);

  // after sliding to the clone, reset invisibly to real first slide
  const handleTransitionEnd = () => {
    if (index === lastIndex) {
      // 1) turn off transition
      setTransitionOn(false);
      // 2) jump to real first slide (same image as clone)
      setIndex(0);

      // 3) re-enable transition on next frame so next move animates
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setTransitionOn(true));
      });
    }
  };

  if (!slides.length) return null;

  return (
    <div className={`mhero ${className}`}>
      <div
        className="mhero__track"
        onTransitionEnd={handleTransitionEnd}
        style={{
          transform: `translateY(-${index * 100}vh)`,
          transition: transitionOn
            ? `transform ${slideMs}ms ease-in-out`
            : "none",
        }}
      >
        {slides.map((img, i) => (
          <div
            key={`${img}-${i}`}
            className="mhero__slide"
            style={{ backgroundImage: `url(${img})` }}
          />
        ))}
      </div>

      <div className="mhero__overlay">{children}</div>
    </div>
  );
}