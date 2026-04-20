"use client";

import { ClipboardList, HeartPulse, Search } from "lucide-react";
import { useState, useTransition } from "react";
import { useToast } from "@/components/ui/toast";
import { hireStaff, fireStaff } from "./staff-actions";
import {
  STAFF,
  parseStaffJson,
  staffByRole,
  type StaffRole,
} from "@/lib/staff";

const ROLE_META: Record<StaffRole, { label: string; Icon: typeof ClipboardList; tint: string }> = {
  headCoach: {
    label: "Başantrenör",
    Icon: ClipboardList,
    tint: "var(--indigo)",
  },
  physio: {
    label: "Fizyoterapist",
    Icon: HeartPulse,
    tint: "var(--emerald)",
  },
  scout: {
    label: "Baş Kaşif",
    Icon: Search,
    tint: "var(--accent)",
  },
};

export function StaffWidget({ staffJson }: { staffJson: string | null }) {
  const current = parseStaffJson(staffJson);
  const [openRole, setOpenRole] = useState<StaffRole | null>(null);
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  const hire = (id: string) => {
    startTransition(async () => {
      const res = await hireStaff({ staffId: id });
      if (!res.ok) {
        toast({
          icon: "⚠",
          title: "İşe alınamadı",
          body: res.error,
          accent: "var(--danger)",
        });
        return;
      }
      setOpenRole(null);
      toast({ icon: "🤝", title: "Anlaşıldı", body: "Yeni personel kadronda.", accent: "var(--emerald)" });
    });
  };

  const fire = (role: StaffRole) => {
    startTransition(async () => {
      await fireStaff({ role });
      toast({ icon: "👋", title: "Yola devam", body: "Slot boşaldı.", accent: "var(--muted)" });
    });
  };

  return (
    <div
      style={{
        padding: "14px 16px",
        borderRadius: 12,
        background: "color-mix(in oklab, var(--panel-2) 60%, transparent)",
        border: "1px solid var(--border)",
      }}
    >
      <span className="t-label" style={{ fontSize: 11 }}>
        TEKNİK KADRO
      </span>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 10 }}>
        {(["headCoach", "physio", "scout"] as const).map((role) => {
          const meta = ROLE_META[role];
          const member = current[role];
          return (
            <div
              key={role}
              style={{
                padding: 10,
                borderRadius: 8,
                background: "var(--panel)",
                border: "1px solid var(--border)",
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <meta.Icon size={14} strokeWidth={1.6} style={{ color: meta.tint }} />
                <span style={{ fontSize: 11, color: "var(--muted)" }}>{meta.label}</span>
              </div>
              {member ? (
                <>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{member.name}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>
                    T{member.tier} · €{(member.weeklyWageCents / 100 / 1000).toFixed(0)}K/hafta
                  </div>
                  <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ flex: 1, padding: "4px 8px", fontSize: 11 }}
                      onClick={() => setOpenRole(role)}
                      disabled={pending}
                    >
                      Değiş
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ padding: "4px 8px", fontSize: 11 }}
                      onClick={() => fire(role)}
                      disabled={pending}
                    >
                      Kov
                    </button>
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{
                    marginTop: 4,
                    width: "100%",
                    justifyContent: "center",
                    fontSize: 12,
                    background: `color-mix(in oklab, ${meta.tint} 14%, transparent)`,
                    color: meta.tint,
                  }}
                  onClick={() => setOpenRole(role)}
                  disabled={pending}
                >
                  İşe Al
                </button>
              )}
            </div>
          );
        })}
      </div>

      {openRole && (
        <div
          onClick={() => !pending && setOpenRole(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.6)",
            backdropFilter: "blur(4px)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            data-modal
            data-modal-panel
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--panel)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              padding: 24,
              maxWidth: 720,
              width: "100%",
              maxHeight: "85vh",
              overflow: "auto",
            }}
          >
            <span
              className="t-label"
              style={{ color: ROLE_META[openRole].tint }}
            >
              {ROLE_META[openRole].label.toUpperCase()} ADAYLAR
            </span>
            <div className="t-h2" style={{ marginTop: 4 }}>
              İşe alınacak kişiyi seç
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 10,
                marginTop: 14,
              }}
            >
              {staffByRole(openRole).map((s) => (
                <div
                  key={s.id}
                  style={{
                    padding: 12,
                    borderRadius: 10,
                    background:
                      s.tier === 3
                        ? "color-mix(in oklab, var(--gold) 14%, transparent)"
                        : s.tier === 2
                          ? "color-mix(in oklab, var(--indigo) 14%, transparent)"
                          : "color-mix(in oklab, var(--muted) 14%, transparent)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontWeight: 600 }}>{s.name}</span>
                    <span className="t-mono" style={{ fontSize: 10 }}>
                      T{s.tier}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                    {s.bio}
                  </div>
                  <div style={{ fontSize: 12, marginTop: 6 }}>
                    Bonus €{(s.hireCostCents / 100 / 1_000_000).toFixed(1)}M ·
                    €{(s.weeklyWageCents / 100 / 1000).toFixed(0)}K/hafta
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    style={{ marginTop: 8, width: "100%", justifyContent: "center" }}
                    disabled={pending}
                    onClick={() => hire(s.id)}
                  >
                    İmzala
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Avoid unused-import warning
void STAFF;
