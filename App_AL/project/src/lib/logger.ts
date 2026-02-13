// src/lib/logger.ts
type Level = "debug" | "info" | "warn" | "error";

function isEnabled(ns: string): boolean {
  // Habilita logs con:
  //   localStorage.setItem('ALC_DEBUG','*')
  //   localStorage.setItem('ALC_DEBUG','backup')                 // 1 namespace exacto
  //   localStorage.setItem('ALC_DEBUG','backup,backup:ui')       // múltiples
  // También puedes hacer: window.ALC_DEBUG = true (global)
  const anyWin = window as any;
  if (anyWin.ALC_DEBUG === true) return true;

  const conf =
    (localStorage.getItem("ALC_DEBUG") ??
      (import.meta as any)?.env?.VITE_ALC_DEBUG ??
      ""
    ).toString();

  if (!conf) return false;
  const c = conf.trim();
  if (c === "*" || c === "all" || c === "1" || c.toLowerCase() === "true") return true;
  return c
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .some((token) => ns === token || ns.startsWith(token + ":"));
}

export function createLogger(namespace: string) {
  const base = `[ALC:${namespace}]`;
  const enabled = () => isEnabled(namespace);
  const tag = (...a: any[]) => [`${base}`, ...a];

  return {
    debug: (...a: any[]) => enabled() && console.debug(...tag(...a)),
    info:  (...a: any[]) => enabled() && console.info(...tag(...a)),
    warn:  (...a: any[]) => enabled() && console.warn(...tag(...a)),
    error: (...a: any[]) => enabled() && console.error(...tag(...a)),
    time: (lbl = "time") => enabled() && console.time(`${base} ${lbl}`),
    timeEnd: (lbl = "time") => enabled() && console.timeEnd(`${base} ${lbl}`),
  };
}
