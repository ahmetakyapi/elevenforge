/**
 * Copy text, and tell the truth about whether it worked.
 *
 * Three call sites did `navigator.clipboard?.writeText(code)` and then
 * immediately rendered "Kopyalandı". Two problems with that:
 *
 *  1. `writeText` returns a promise that was never awaited or caught, so a
 *     refusal surfaced as an unhandled rejection. It is easy to trigger:
 *     the Clipboard API needs a secure context and a permission that the
 *     browser can deny, and it throws outright over plain http — which is
 *     how anyone testing on a phone against a laptop's dev server reaches
 *     the app.
 *  2. The UI claimed success unconditionally. A user whose copy failed was
 *     told it had worked, pasted nothing into the group chat, and had no
 *     reason to suspect the button.
 *
 * So: await it, fall back to the old selection trick when the modern API is
 * unavailable, and return whether the text actually made it.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Denied or unavailable — fall through to the legacy path rather than
    // giving up, because that path still works where the modern one does not.
  }

  // execCommand is deprecated and still the only thing that works in an
  // insecure context. Off-screen rather than hidden: a display:none element
  // cannot be selected.
  try {
    const el = document.createElement("textarea");
    el.value = text;
    el.setAttribute("readonly", "");
    el.style.position = "fixed";
    el.style.top = "-1000px";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}
