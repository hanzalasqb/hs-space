import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { HISTORY_PATH } from "../shared/navigation";

const appSource = readFileSync(resolve(process.cwd(), "client/src/App.tsx"), "utf8");
const homeSource = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");
const cssSource = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8");

describe("history route registration", () => {
  it("binds the shared path to HistoryPage", () => {
    expect(appSource).toContain("<Route path={HISTORY_PATH} component={HistoryPage} />");
  });

  it("uses the dedicated route from the sidebar History button", () => {
    expect(homeSource).toContain("window.location.href = HISTORY_PATH");
    expect(HISTORY_PATH).toBe("/history");
  });

  it("registers project detail navigation and project chat links", () => {
    expect(appSource).toContain('<Route path="/projects/:id" component={ProjectPage} />');
    expect(homeSource).toContain("window.location.href = `/projects/${id}`");
  });

  it("keeps Projects and History as dedicated sidebar destinations", () => {
    expect(homeSource).toContain('window.location.href = "/projects"');
    expect(homeSource).toContain("window.location.href = HISTORY_PATH");
    expect(homeSource).not.toContain('placeholder="Search history…"');
    expect(homeSource).not.toContain("messages ·");
  });

  it("keeps the composer below a bounded chat panel", () => {
    expect(homeSource).toContain('min-h-[calc(100dvh-110px)]');
    expect(homeSource).toContain('height="100%"');
    expect(homeSource).toContain('className="mt-2 flex shrink-0 min-w-0 items-center justify-between');
  });

  it("exposes theme selection and token usage from System operational", () => {
    expect(homeSource).toContain('System operational');
    expect(homeSource).toContain('setTheme?.("light")');
    expect(homeSource).toContain('setTheme?.("dark")');
    expect(homeSource).toContain('Token usage');
    expect(homeSource).toContain('usage.data?.tokens');
    expect(appSource).toContain('<ThemeProvider defaultTheme="dark" switchable>');
    expect(cssSource).toContain(':root { font-family:');
    expect(cssSource).toContain('.dark { color-scheme: dark;');
    expect(cssSource).toContain('.theme-transitioning');
    expect(homeSource).toContain('>Clear Chat</DropdownMenuItem>');
    expect(homeSource).toContain('onSelect={() => newChat()}');
    expect(homeSource).toContain('app-sidebar');
    expect(homeSource).toContain('app-header');
  });

  it("contains admin layout measurements without global error suppression", () => {
    expect(homeSource).toContain('admin-dashboard');
    expect(cssSource).toContain('.admin-dashboard { contain: layout style; }');
    expect(cssSource).toContain('.admin-dashboard .transition-opacity { transition: none !important; }');
  });
});
