import { useState, useEffect, useRef, useCallback } from "react";

let _trailId = 0;

function TrailImage({
  id,
  x,
  y,
  src,
  size,
  rotation,
  lifetime,
  borderRadius = 4,
  onComplete,
}) {
  const [phase, setPhase] = useState("enter");
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) ref.current.getBoundingClientRect();
    const raf = requestAnimationFrame(() => setPhase("visible"));
    const exitTimer = setTimeout(() => setPhase("exit"), lifetime * 0.6);
    const removeTimer = setTimeout(() => onComplete(id), lifetime);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, [id, lifetime, onComplete]);

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        pointerEvents: "none",

        /* IMPORTANT: keep trails behind content */
        zIndex: 1,

        willChange: "transform, opacity",
        borderRadius,
        overflow: "hidden",
        boxShadow: "0 12px 40px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)",
        transition:
          phase === "enter"
            ? "none"
            : phase === "visible"
            ? "transform 0.45s cubic-bezier(0.22,1,0.36,1), opacity 0.45s cubic-bezier(0.22,1,0.36,1)"
            : "transform 0.5s cubic-bezier(0.55,0,1,0.45), opacity 0.5s cubic-bezier(0.55,0,1,0.45)",
        transform:
          phase === "enter"
            ? `rotate(${rotation}deg) scale(0.3)`
            : phase === "visible"
            ? `rotate(${rotation}deg) scale(1)`
            : `rotate(${rotation + 8}deg) scale(0.85)`,
        opacity: phase === "enter" ? 0 : phase === "visible" ? 1 : 0,
      }}
    >
      <img
        src={src}
        alt=""
        draggable={false}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
          userSelect: "none",
        }}
      />
    </div>
  );
}

export function CursorImageTrail({
  images,
  imageSize = 180,
  rotationRange = 15,
  throttleMs = 120,
  lifetime = 1200,
  maxTrails = 12,
  minDistance = 40,
  borderRadius = 4,
  children,
  className,
  style,
}) {
  const [trails, setTrails] = useState([]);
  const containerRef = useRef(null);
  const imgIdx = useRef(0);
  const lastTime = useRef(0);
  const lastPos = useRef({ x: 0, y: 0 });

  const remove = useCallback(
    (id) => setTrails((p) => p.filter((t) => t.id !== id)),
    []
  );

  const onMove = useCallback(
    (e) => {
      const now = Date.now();
      if (now - lastTime.current < throttleMs) return;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const dx = x - lastPos.current.x;
      const dy = y - lastPos.current.y;

      if (Math.sqrt(dx * dx + dy * dy) < minDistance) return;

      lastTime.current = now;
      lastPos.current = { x, y };

      const rotation = (Math.random() - 0.5) * 2 * rotationRange;
      const src = images[imgIdx.current % images.length];
      imgIdx.current++;

      setTrails((p) => {
        const next = [...p, { id: ++_trailId, x, y, src, rotation }];
        return next.length > maxTrails ? next.slice(-maxTrails) : next;
      });
    },
    [images, rotationRange, throttleMs, maxTrails, minDistance]
  );

  return (
    <div
      ref={containerRef}
      onMouseMove={onMove}
      className={className}
      style={{ position: "relative", overflow: "hidden", ...style }}
    >
      {/* TRAILS (behind) */}
      {trails.map((t) => (
        <TrailImage
          key={t.id}
          {...t}
          size={imageSize}
          lifetime={lifetime}
          borderRadius={borderRadius}
          onComplete={remove}
        />
      ))}

      {/* CONTENT (always on top) */}
      <div style={{ position: "relative", zIndex: 10 }}>
        {children}
      </div>
    </div>
  );
}
