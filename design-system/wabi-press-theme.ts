/**
 * Wabi-Press · 侘寂刊本 — theme controller.
 *
 * Native TypeScript, zero dependencies. Drives the [data-theme] attribute that
 * `wabi-press.css` consumes:
 *
 *   1. An explicit user choice is persisted in `localStorage` and wins.
 *   2. Otherwise the system `prefers-color-scheme` preference applies.
 *   3. When the system preference changes and no explicit choice is stored,
 *      the theme follows the system automatically.
 *
 * Guard-clause driven, functionally composed, no global state besides the
 * persisted preference.
 */

export type WabiTheme = "light" | "dark";

const WABI_THEMES: readonly WabiTheme[] = ["light", "dark"] as const;

const DEFAULT_STORAGE_KEY = "wabi-press:theme";
const SYSTEM_DARK_QUERY = "(prefers-color-scheme: dark)";

/** Type guard: is an unknown value a valid Wabi-Press theme token? */
export function isWabiTheme(value: unknown): value is WabiTheme {
  return typeof value === "string" && (WABI_THEMES as readonly string[]).includes(value);
}

/** Read the persisted choice; corrupt or absent storage resolves to `null`. */
export function readStoredTheme(storageKey: string = DEFAULT_STORAGE_KEY): WabiTheme | null {
  const store = globalThis.localStorage;
  if (!store) {
    return null;
  }
  try {
    const raw = store.getItem(storageKey);
    if (raw === null) {
      return null;
    }
    return isWabiTheme(raw) ? raw : null;
  } catch {
    // Storage may be unavailable (private mode, sandboxed iframe); fail open.
    return null;
  }
}

/** Persist a choice; failures are non-fatal (the session still works). */
export function storeTheme(theme: WabiTheme, storageKey: string = DEFAULT_STORAGE_KEY): void {
  const store: Storage | null = globalThis.localStorage ?? null;
  if (!store) {
    return;
  }
  if (!isWabiTheme(theme)) {
    return;
  }
  try {
    store.setItem(storageKey, theme);
  } catch {
    // Ignore quota/availability errors; the choice remains for this session.
  }
}

/** Resolve the initial theme: stored choice → system preference → light. */
export function resolveInitialTheme(
  readStored: () => WabiTheme | null,
  systemPrefersDark: () => boolean,
): WabiTheme {
  const stored = readStored();
  if (stored) {
    return stored;
  }
  return systemPrefersDark() ? "dark" : "light";
}

/** Apply a theme to the document root (`[data-theme="dark"]` overrides CSS). */
export function applyThemeToDocument(theme: WabiTheme): void {
  const root = globalThis.document?.documentElement;
  if (!root) {
    return;
  }
  if (isWabiTheme(theme)) {
    root.setAttribute("data-theme", theme);
  }
}

export interface WabiPressThemeOptions {
  storageKey?: string;
  onThemeChange?: (theme: WabiTheme) => void;
}

export interface WabiPressThemeController {
  readonly storageKey: string;
  current: () => WabiTheme;
  setTheme: (theme: WabiTheme) => WabiTheme;
  toggle: () => WabiTheme;
  destroy: () => void;
}

/**
 * Initialize the Wabi-Press theme controller for the current document.
 *
 * Returns a small controller surface (functional composition over a closure
 * cell) instead of mutating module globals. `destroy` detaches the system
 * preference listener so the controller can be torn down in tests and HMR.
 */
export function initWabiPressTheme(options: WabiPressThemeOptions = {}): WabiPressThemeController {
  if (!globalThis.document) {
    throw new Error("initWabiPressTheme requires a DOM document.");
  }

  const storageKey = options.storageKey ?? DEFAULT_STORAGE_KEY;
  const notify = options.onThemeChange;

  const media = globalThis.matchMedia?.(SYSTEM_DARK_QUERY) ?? null;
  const systemPrefersDark = (): boolean => media ? media.matches : false;

  let activeTheme: WabiTheme = resolveInitialTheme(
    () => readStoredTheme(storageKey),
    systemPrefersDark,
  );
  applyThemeToDocument(activeTheme);

  const commit = (nextTheme: WabiTheme): WabiTheme => {
    if (!isWabiTheme(nextTheme)) {
      return activeTheme;
    }
    activeTheme = nextTheme;
    applyThemeToDocument(activeTheme);
    storeTheme(activeTheme, storageKey);
    if (notify) {
      notify(activeTheme);
    }
    return activeTheme;
  };

  const followSystem = (event: MediaQueryListEvent): void => {
    // Only follow the system while the user has not made an explicit choice.
    if (readStoredTheme(storageKey) !== null) {
      return;
    }
    commit(event.matches ? "dark" : "light");
  };

  const detach = (): void => {
    if (media?.removeEventListener) {
      media.removeEventListener("change", followSystem);
    }
  };

  if (media?.addEventListener) {
    media.addEventListener("change", followSystem);
  }

  return {
    storageKey,
    current: (): WabiTheme => activeTheme,
    setTheme: (theme: WabiTheme): WabiTheme => commit(theme),
    toggle: (): WabiTheme => commit(activeTheme === "dark" ? "light" : "dark"),
    destroy: detach,
  };
}

/**
 * Convenience wiring for semantic-HTML surfaces: bind every
 * `[data-wabi-theme-toggle]` control to a shared controller.
 * Returns the controller (or `null` when no DOM is available).
 */
export function bindWabiThemeToggles(options: WabiPressThemeOptions = {}): WabiPressThemeController | null {
  if (!globalThis.document) {
    return null;
  }
  const controller = initWabiPressTheme(options);
  const controls = Array.from(
    globalThis.document.querySelectorAll<HTMLElement>("[data-wabi-theme-toggle]"),
  );
  for (const control of controls) {
    control.addEventListener("click", () => {
      const next = controller.toggle();
      control.setAttribute("aria-pressed", String(next === "dark"));
      const label = control.getAttribute("data-wabi-theme-label");
      if (label) {
        control.textContent = next === "dark" ? "日间 · 和纸" : "夜间 · 砚石";
      }
    });
  }
  return controller;
}
