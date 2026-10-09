import Link from "next/link";

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "70vh",
        display: "grid",
        placeItems: "center",
        padding: "40px 24px",
        textAlign: "center",
      }}
    >
      <div>
        <p
          style={{
            fontFamily: "var(--font-mono, monospace)",
            fontSize: 13,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--muted, #8b93a7)",
            marginBottom: 10,
          }}
        >
          404
        </p>
        <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 10 }}>
          Bu Sayfa Yok
        </h1>
        <p style={{ color: "var(--muted, #8b93a7)", marginBottom: 22 }}>
          Aradığın sayfa taşınmış ya da hiç var olmamış olabilir.
        </p>
        <Link
          href="/dashboard"
          style={{
            display: "inline-block",
            padding: "10px 18px",
            borderRadius: 10,
            background: "var(--accent, #6366f1)",
            color: "#fff",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Kulübüne Dön
        </Link>
      </div>
    </main>
  );
}
