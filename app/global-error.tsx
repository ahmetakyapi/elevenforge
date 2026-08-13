"use client";

/**
 * Last-resort boundary. This catches errors thrown in the root layout, where
 * the normal (app)/error.tsx boundary cannot help — without it those render
 * as an unstyled browser error page.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="tr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#04070d",
          color: "#e8ecf5",
          fontFamily: "system-ui, sans-serif",
          padding: 24,
          textAlign: "center",
        }}
      >
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 10 }}>
            Bir şeyler ters gitti
          </h1>
          <p style={{ color: "#8b93a7", marginBottom: 8 }}>
            Beklenmedik bir hata oluştu. Tekrar denemek sorunu genelde çözer.
          </p>
          {error.digest && (
            <p
              style={{
                color: "#5b6478",
                fontFamily: "monospace",
                fontSize: 12,
                marginBottom: 20,
              }}
            >
              Hata kodu: {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={reset}
            style={{
              padding: "10px 18px",
              borderRadius: 10,
              border: "none",
              background: "#6366f1",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Tekrar Dene
          </button>
        </div>
      </body>
    </html>
  );
}
