/**
 * The loading mark shown above every route skeleton: a spinning ball with
 * a pulsing core and a line of match-day copy, so a slow query
 * reads as "the club is getting ready" rather than a frozen page.
 */
export function ForgeLoader({ label }: { label?: string }) {
  const text = label ?? "Kadro hazırlanıyor";
  return (
    <div
      role="status"
      aria-live="polite"
      style={{ display: "flex", justifyContent: "center", padding: "6px 0 18px" }}
    >
      <span className="forge-loader">
        <span className="forge-loader-ball" aria-hidden />
        <span>
          {text}
          <span className="forge-loader-dots" aria-hidden>
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </span>
        </span>
      </span>
    </div>
  );
}
