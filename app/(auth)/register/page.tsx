"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { GlassCard } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { PitchPatternSide } from "@/components/auth/pitch-side";
import { register } from "./actions";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [team, setTeam] = useState("");
  const [invite, setInvite] = useState("");
  const [status, setStatus] = useState<"idle" | "pending" | "error">("idle");
  const [err, setErr] = useState<string | null>(null);
  const toast = useToast();

  const emailValid = /.+@.+\..+/.test(email);
  const passValid = p1.length >= 6;
  const passMatch = p1 !== "" && p1 === p2;
  const canSubmit = emailValid && passValid && passMatch && team.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus("pending");
    setErr(null);
    const result = await register({
      email,
      password: p1,
      teamName: team,
      inviteCode: invite,
    });
    if (!result.ok) {
      setStatus("error");
      setErr(result.error);
      return;
    }
    toast({
      icon: "⚽",
      title: result.joinedExisting ? "Lige katıldın" : "Takımın kuruldu",
      body: result.joinedExisting
        ? `${team} — arkadaşının ligindesin.`
        : `${team} — davet kodun: ${result.inviteCode}`,
      accent: "var(--indigo)",
    });
    router.push("/dashboard");
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
          minHeight: 600,
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
            <span className="t-label" style={{ color: "var(--emerald)" }}>
              KAYIT
            </span>
            <div className="t-h1" style={{ marginTop: 8, marginBottom: 8 }}>
              Takımını kur.
            </div>
            <div style={{ color: "var(--muted)", fontSize: 14, marginBottom: 24 }}>
              5 dakikada ligini kur, arkadaşlarını davet et.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <LabeledField label="E-posta">
                <input
                  className={`input ${
                    email ? (emailValid ? "valid" : "invalid") : ""
                  }`}
                  type="email"
                  placeholder="sen@ornek.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </LabeledField>
              <LabeledField label="Takım adı">
                <input
                  className="input"
                  placeholder="İstanbul Şehir FK"
                  value={team}
                  onChange={(e) => setTeam(e.target.value)}
                  required
                />
                {team && <PreviewCrest name={team} />}
              </LabeledField>
              <LabeledField label="Şifre">
                <input
                  className={`input ${
                    p1 ? (passValid ? "valid" : "invalid") : ""
                  }`}
                  type="password"
                  placeholder="En az 6 karakter"
                  value={p1}
                  onChange={(e) => setP1(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </LabeledField>
              <LabeledField label="Şifre tekrar">
                <input
                  className={`input ${
                    p2 ? (passMatch ? "valid" : "invalid") : ""
                  }`}
                  type="password"
                  value={p2}
                  onChange={(e) => setP2(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </LabeledField>
              <LabeledField label="Davet kodu (opsiyonel)">
                <input
                  className="input"
                  placeholder="Arkadaşının ligine katılmak için"
                  value={invite}
                  onChange={(e) => setInvite(e.target.value.toUpperCase())}
                  maxLength={6}
                  style={{
                    fontFamily: "var(--font-jetbrains)",
                    letterSpacing: "0.2em",
                  }}
                />
              </LabeledField>
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
                style={{ marginTop: 12, justifyContent: "center" }}
                disabled={!canSubmit || status === "pending"}
              >
                {status === "pending" ? "Takımın kuruluyor…" : "Takımımı Kur"}
              </button>
              <Link
                href="/login"
                className="btn btn-ghost btn-sm"
                style={{ justifyContent: "center", textDecoration: "none" }}
              >
                Zaten hesabın var mı?{" "}
                <span style={{ color: "var(--indigo)" }}>Giriş yap</span>
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
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span className="t-label">{label}</span>
      {children}
    </div>
  );
}

function PreviewCrest({ name }: { name: string }) {
  const letters = name
    .split(/\s+/)
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10 }}>
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: "linear-gradient(135deg, var(--indigo), var(--emerald))",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-manrope)",
          fontWeight: 700,
          color: "#fff",
          fontSize: 13,
        }}
      >
        {letters}
      </div>
      <span className="t-small">Arma önizlemesi · daha sonra değiştir</span>
    </div>
  );
}
