"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  ArrowLeftRight,
  Compass,
  Newspaper,
  Sparkles,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { Crest, GlassCard } from "@/components/ui/primitives";
import type { CrewPageData } from "@/lib/queries/crew";
import { sendChatMessage } from "./actions";

const FEED_ICON: Record<
  CrewPageData["feed"][number]["type"],
  { Icon: LucideIcon; bg: string; c: string }
> = {
  transfer: {
    Icon: ArrowLeftRight,
    bg: "color-mix(in oklab, var(--indigo) 18%, transparent)",
    c: "var(--indigo)",
  },
  match: {
    Icon: Trophy,
    bg: "color-mix(in oklab, var(--gold) 18%, transparent)",
    c: "var(--gold)",
  },
  scout: {
    Icon: Compass,
    bg: "color-mix(in oklab, var(--cyan) 18%, transparent)",
    c: "var(--cyan)",
  },
  paper: {
    Icon: Newspaper,
    bg: "color-mix(in oklab, var(--emerald) 18%, transparent)",
    c: "var(--emerald)",
  },
  morale: {
    Icon: Sparkles,
    bg: "color-mix(in oklab, var(--warn) 18%, transparent)",
    c: "var(--warn)",
  },
};

const EMOJI = ["⚽", "🔥", "💎", "🏆", "🟨", "🟥", "😂", "💀"] as const;

export default function CrewUi({ data }: { data: CrewPageData }) {
  const router = useRouter();

  // Poll the server every 5s while the tab is visible — chat is the page
  // most users keep open; new messages from other players show up without
  // a manual refresh. Pause when backgrounded so we're not burning a
  // request every 5s on an idle tab.
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (timer) return;
      timer = setInterval(() => router.refresh(), 5_000);
    };
    const stop = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };
    const onVis = () => {
      if (document.visibilityState === "visible") {
        router.refresh();
        start();
      } else {
        stop();
      }
    };
    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [router]);
  const [input, setInput] = useState("");
  const [pending, startTransition] = useTransition();

  const send = () => {
    if (!input.trim() || pending) return;
    const body = input;
    setInput("");
    startTransition(async () => {
      const res = await sendChatMessage(body);
      if (res.ok) {
        router.refresh();
      } else {
        setInput(body);
      }
    });
  };

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "20px 28px" }}>
      <GlassCard
        pad={12}
        hover={false}
        style={{
          marginBottom: 16,
          display: "flex",
          gap: 10,
          overflowX: "auto",
          alignItems: "center",
        }}
      >
        <span
          className="t-label"
          style={{ marginRight: 10, whiteSpace: "nowrap" }}
        >
          CREW
        </span>
        {data.roster.map((m) => (
          <div
            key={m.clubId}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 8px",
              borderRadius: 999,
              background: m.isMe
                ? "color-mix(in oklab, var(--accent) 16%, var(--panel-2))"
                : "var(--panel-2)",
              border: m.isMe
                ? "1px solid color-mix(in oklab, var(--accent) 40%, var(--border))"
                : "1px solid var(--border)",
              whiteSpace: "nowrap",
            }}
          >
            <Crest
              clubId={m.clubId}
              size={18}
              club={data.crestLookup[m.clubId]}
            />
            <span style={{ fontSize: 12, fontWeight: 500 }}>
              {m.userName.split(" ")[0]}
            </span>
            {m.isBot && (
              <span
                className="t-caption"
                style={{ fontSize: 9, color: "var(--muted)" }}
              >
                BOT
              </span>
            )}
          </div>
        ))}
      </GlassCard>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr)",
          gap: 16,
          minHeight: 640,
        }}
      >
        <GlassCard
          pad={0}
          hover={false}
          style={{
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: "14px 18px",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <span className="t-label">#genel</span>
            <div className="t-h3" style={{ marginTop: 2 }}>
              Crew sohbeti
            </div>
          </div>
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px 18px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {data.messages.length === 0 && (
              <div
                className="t-small"
                style={{ color: "var(--muted)", margin: "auto" }}
              >
                İlk mesajı sen at.
              </div>
            )}
            {data.messages.map((m) => (
              <div
                key={m.id}
                style={{
                  display: "flex",
                  gap: 10,
                  flexDirection: m.isMe ? "row-reverse" : "row",
                }}
              >
                <Crest
                  clubId={m.clubId}
                  size={28}
                  club={data.crestLookup[m.clubId]}
                />
                <div style={{ maxWidth: "70%" }}>
                  <div
                    style={{
                      display: "flex",
                      gap: 6,
                      alignItems: "center",
                      marginBottom: 4,
                      justifyContent: m.isMe ? "flex-end" : "flex-start",
                    }}
                  >
                    <span style={{ fontSize: 12, fontWeight: 600 }}>
                      {m.userName}
                    </span>
                    <span className="t-caption" style={{ fontSize: 10 }}>
                      {m.timeLabel}
                    </span>
                  </div>
                  <div
                    style={{
                      padding: "10px 14px",
                      borderRadius: 12,
                      fontSize: 14,
                      lineHeight: 1.5,
                      background: m.isMe
                        ? "color-mix(in oklab, var(--accent) 16%, var(--panel))"
                        : "var(--panel-2)",
                      border: `1px solid ${
                        m.isMe
                          ? "color-mix(in oklab, var(--accent) 30%, var(--border))"
                          : "var(--border)"
                      }`,
                    }}
                  >
                    {m.body}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              padding: "12px 18px",
              borderTop: "1px solid var(--border)",
              display: "flex",
              gap: 8,
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", gap: 2 }}>
              {EMOJI.map((e) => (
                <button
                  key={e}
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ padding: "4px 8px", fontSize: 15 }}
                  onClick={() => setInput(input + e)}
                >
                  {e}
                </button>
              ))}
            </div>
            <input
              className="input"
              placeholder="Mesajını yaz…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              disabled={pending}
            />
            <button
              type="button"
              className="btn btn-primary"
              onClick={send}
              disabled={pending}
            >
              {pending ? "…" : "Gönder"}
            </button>
          </div>
        </GlassCard>

        <GlassCard
          pad={0}
          hover={false}
          style={{
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: "14px 18px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span className="t-label">PAYLAŞILAN EVREN</span>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--emerald)",
                animation: "pulse-accent 2s ease-in-out infinite",
                marginLeft: 4,
              }}
            />
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {data.feed.length === 0 && (
              <div
                className="t-small"
                style={{ color: "var(--muted)", padding: 24 }}
              >
                Henüz aktivite yok.
              </div>
            )}
            {data.feed.map((f, i) => {
              const { Icon, bg, c } = FEED_ICON[f.type];
              return (
                <div
                  key={f.id}
                  style={{
                    padding: "14px 18px",
                    borderBottom:
                      i < data.feed.length - 1
                        ? "1px solid var(--border)"
                        : "none",
                    display: "flex",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      background: bg,
                      color: c,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={14} strokeWidth={1.6} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 3,
                      }}
                    >
                      {f.clubId && (
                        <Crest
                          clubId={f.clubId}
                          size={16}
                          club={data.crestLookup[f.clubId]}
                        />
                      )}
                      <span className="t-caption" style={{ fontSize: 11 }}>
                        {f.relativeTime} önce
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: 13.5,
                        color: "var(--text-2)",
                        lineHeight: 1.5,
                      }}
                    >
                      {f.text}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
