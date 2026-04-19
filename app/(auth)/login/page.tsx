"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check } from "lucide-react";
import { GlassCard } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { PitchPatternSide } from "@/components/auth/pitch-side";
import { login } from "./actions";

type Status = "idle" | "pending" | "error";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("ahmet@elevenforge.app");
  const [pass, setPass] = useState("");
  const [remember, setRemember] = useState(true);
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
      body: "İstanbul Şehir FK seni bekliyor.",
      accent: "var(--emerald)",
    });
    router.push("/dashboard");
  };

  return (
    <div
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
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 28,
          width: "100%",
          minHeight: 560,
        }}
      >
        <PitchPatternSide />
        <GlassCard
          pad={36}
          hover={false}
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
            <span className="t-label" style={{ color: "var(--indigo)" }}>
              GİRİŞ
            </span>
            <div className="t-h1" style={{ marginTop: 8, marginBottom: 8 }}>
              Tekrar hoş geldin.
            </div>
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
              <LabeledField
                label="Şifre"
                right={
                  <span
                    style={{ fontSize: 12, color: "var(--muted)", cursor: "pointer" }}
                  >
                    Şifremi unuttum
                  </span>
                }
              >
                <input
                  className="input"
                  type="password"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </LabeledField>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                  marginTop: 4,
                }}
              >
                <Checkbox
                  checked={remember}
                  onChange={() => setRemember(!remember)}
                />
                <span style={{ fontSize: 13, color: "var(--text-2)" }}>
                  Beni hatırla
                </span>
              </label>
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
                <span style={{ color: "var(--indigo)" }}>Hesap aç</span>
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
  right,
  children,
}: {
  label: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span className="t-label">{label}</span>
        {right}
      </div>
      {children}
    </div>
  );
}

function Checkbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div
      onClick={onChange}
      style={{
        width: 16,
        height: 16,
        borderRadius: 4,
        background: checked ? "var(--accent)" : "var(--panel)",
        border: `1px solid ${checked ? "var(--accent)" : "var(--border-strong)"}`,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "all var(--t) var(--ease)",
      }}
    >
      {checked && <Check size={11} strokeWidth={2.5} color="#fff" />}
    </div>
  );
}
