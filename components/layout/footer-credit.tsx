// Inline GitHub mark — the lucide version pinned to this project doesn't
// ship a Github icon, so we inline the official mark instead of bumping
// the dependency.
function GithubMark({ size = 14 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.084 1.84 1.236 1.84 1.236 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.93 0-1.31.467-2.38 1.236-3.22-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.3 1.23.957-.266 1.98-.398 3-.403 1.02.005 2.043.137 3 .403 2.29-1.552 3.297-1.23 3.297-1.23.652 1.652.242 2.873.118 3.176.77.84 1.234 1.91 1.234 3.22 0 4.61-2.807 5.624-5.48 5.92.43.372.823 1.102.823 2.222 0 1.606-.014 2.898-.014 3.293 0 .322.218.694.825.576C20.565 22.092 24 17.594 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

/**
 * Footer credit pinned to the bottom of every authenticated page. Links to
 * the project author's GitHub profile so visitors can find more work.
 */
export function FooterCredit() {
  return (
    <footer
      style={{
        marginTop: 60,
        padding: "24px 28px",
        borderTop: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        flexWrap: "wrap",
        color: "var(--muted)",
        fontSize: 13,
      }}
    >
      <span>ElevenForge</span>
      <span style={{ opacity: 0.5 }}>·</span>
      <a
        href="https://github.com/ahmetakyapi"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          color: "var(--text)",
          textDecoration: "none",
          padding: "4px 10px",
          borderRadius: 8,
          border: "1px solid var(--border)",
          background: "color-mix(in oklab, var(--panel) 50%, transparent)",
          transition: "border-color .15s",
        }}
      >
        <GithubMark size={14} />
        <span style={{ fontFamily: "var(--font-jetbrains, monospace)" }}>
          @ahmetakyapi
        </span>
      </a>
      <span style={{ opacity: 0.5 }}>·</span>
      <span>made by Ahmet Akyapı</span>
    </footer>
  );
}
