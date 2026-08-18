import { describe, expect, it } from "vitest";
import { applyThemeToRoot } from "./ThemeContext";

describe("theme root application", () => {
  it("adds the dark class for dark mode", () => {
    const classes = new Set<string>();
    const root = { classList: { add: (name: string) => classes.add(name), remove: (name: string) => classes.delete(name) } };
    applyThemeToRoot("dark", root);
    expect(classes.has("dark")).toBe(true);
  });

  it("removes the dark class for light mode", () => {
    const classes = new Set(["dark"]);
    const root = { classList: { add: (name: string) => classes.add(name), remove: (name: string) => classes.delete(name) } };
    applyThemeToRoot("light", root);
    expect(classes.has("dark")).toBe(false);
  });
});
