/** Spinner — animated loading indicator. */
import { Loader2 } from "lucide-react";

/**
 * @param {{ size?: number, color?: string, label?: string }} props
 */
export default function Spinner({ size = 16, color = "var(--color-accent)", label = "Loading…" }) {
  return (
    <Loader2
      size={size}
      className="spin"
      aria-label={label}
      role="status"
      style={{ color, flexShrink: 0 }}
    />
  );
}
