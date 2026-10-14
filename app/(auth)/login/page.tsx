"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { GlassCard } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { PitchPatternSide } from "@/components/auth/pitch-side";
import { login } from "./actions";

type Status = "idle" | "pending" | "error";

/**
 * Where to go after signing in.
 *
 * proxy.ts sends a signed-out visitor to `/login?from=/transfer`, but the
 * form always went to /dashboard — a bookmark or an expired session lost the
 * page it was opened for. Read at submit time (not with useSearchParams, which
 * would need its own Suspense boundary here), and only a same-site path: an
 * absolute URL or a protocol-relative "//host" would make this an open
 * redirect.
 *
 * Checked by resolving it the way the browser will, not by string prefix.
 * The URL parser drops tabs and newlines, so "/%09/evil.com" passed a
 * `startsWith("/") && !startsWith("//")` test and then navigated to
 * //evil.com after a successful login.
 *
 * The resolved path is checked AGAIN before it is returned: dot segments
 * collapse during parsing, so "/.//evil.com" or "/a/..//evil.com" resolve to
 * the right origin with the pathname "//evil.com" — which, pushed as-is, is a
 * protocol-relative URL to evil.com.
 */
function returnPath(): string {
  try {
    const origin = window.location.origin;
    const from = new URLSearchParams(window.location.search).get("from");
    if (from && from.startsWith("/")) {
      const url = new URL(from, origin);
      const path = `${url.pathname}${url.search}${url.hash}`;
      if (
        url.origin === origin &&
        !path.startsWith("//") &&
        !path.startsWith("/\\") &&
        new URL(path, origin).origin === origin &&
        url.pathname !== "/login" &&
        !url.pathname.startsWith("/login/")
      ) {
        return path;
      }
    }
  } catch {}
  return "/dashboard";
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [err, setErr] = useState<string | null>(null);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("pending");
    setErr(null);
    const result = await login({ email, password: pass });
    if (!result.ok) {
      setStatus("error");
      setErr(result.error);
      return;
    }
    toast({
      icon: "✓",
      title: `Hoş geldin ${result.userName}`,
      body: "Takımın seni bekliyor.",
      accent: "var(--emerald)",
    });
    router.push(returnPath());
  };

  return (
    <div
      data-auth-shell
      style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: "40px 24px",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
      }}
    >
      <div
        data-auth-grid
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 28,
          width: "100%",
          minHeight: 560,
        }}
      >
        <div data-auth-art>
          <PitchPatternSide />
        </div>
        <GlassCard
          pad={36}
          hover={false}
          className="auth-card"
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <form
            onSubmit={handleSubmit}
            style={{
              maxWidth: 360,
              marginLeft: "auto",
              marginRight: 0,
              width: "100%",
            }}
          >
            <h1 className="t-h1" style={{ marginBottom: 8 }}>
              Tekrar Hoş Geldin
            </h1>
            <div style={{ color: "var(--muted)", fontSize: 14, marginBottom: 24 }}>
              Kaldığın yerden devam et.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <LabeledField label="E-posta">
                <input
                  className="input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </LabeledField>
              {/* "Şifremi unuttum" sat here as a pointer-cursor span that did
                  nothing: there is no reset flow (no e-mail is sent anywhere
                  in the app). A link that goes nowhere is worse than none. */}
              <LabeledField label="Şifre">
                <input
                  className="input"
                  type="password"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </LabeledField>
              {/* "Beni hatırla" was removed with the same reasoning: the
                  checkbox toggled local state that nothing read — every
                  session is a 30-day JWT whether it was ticked or not. */}
              {err && (
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: 10,
                    background:
                      "color-mix(in oklab, var(--danger) 10%, transparent)",
                    border:
                      "1px solid color-mix(in oklab, var(--danger) 40%, var(--border))",
                    color: "var(--danger)",
                    fontSize: 13,
                  }}
                >
                  {err}
                </div>
              )}
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={status === "pending"}
                style={{ marginTop: 8, justifyContent: "center" }}
              >
                {status === "pending" ? "Giriş yapılıyor…" : "Giriş Yap"}
              </button>
              <Link
                href="/register"
                className="btn btn-ghost btn-sm"
                style={{ justifyContent: "center", textDecoration: "none" }}
              >
                Hesabın yok mu?{" "}
                <span style={{ color: "var(--indigo)" }}>Hesap Aç</span>
              </Link>
            </div>
          </form>
        </GlassCard>
      </div>
    </div>
  );
}

function LabeledField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  // A <label>, so the input inside it is named by its caption. As a div with
  // a span, "E-posta" and "Şifre" were only visual — a screen reader
  // announced two unnamed edit fields.
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span className="t-label">{label}</span>
      {children}
    </label>
  );
}
