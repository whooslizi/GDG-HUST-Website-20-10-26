import type { getRouter } from "./router";

declare const __BUILD_ID__: string; // injected by vite.config.ts

// Reloads open tabs after a new deploy so nobody has to hard-refresh.
// Reloads on the next navigation, on returning to the tab, or right away if nothing is being typed.
export function startVersionCheck(router: ReturnType<typeof getRouter>) {
  if (!import.meta.env.PROD) return;
  let stale = false;

  const isTyping = () =>
    [...document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input, textarea")].some((el) => el.value);

  async function check() {
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}version.json?t=${Date.now()}`, { cache: "no-store" });
      if (res.ok) stale = (await res.json()).id !== __BUILD_ID__;
    } catch {
      // offline or blocked: try again next time
    }
  }

  setInterval(async () => {
    await check();
    if (stale && !isTyping()) location.reload();
  }, 60_000);

  document.addEventListener("visibilitychange", async () => {
    if (document.visibilityState !== "visible") return;
    await check();
    if (stale) location.reload();
  });

  router.subscribe("onResolved", () => {
    if (stale) location.reload();
  });
}
