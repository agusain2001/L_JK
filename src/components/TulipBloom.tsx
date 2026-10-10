import type { CSSProperties } from "react";

/** Curved, overlapping petals also work without a graphics context. */
export default function TulipBloom({ className = "", color = "#e3a0aa", open = false }: { className?: string; color?: string; open?: boolean }) {
  return <span className={`tulip-bloom ${open ? "bloom-open" : ""} ${className}`} style={{ "--tulip-color": color } as CSSProperties} aria-hidden="true"><span className="tulip-petal petal-back" /><span className="tulip-petal petal-left" /><span className="tulip-petal petal-right" /><span className="tulip-petal petal-front" /></span>;
}
