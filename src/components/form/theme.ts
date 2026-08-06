import type { CSSProperties } from "react";
import type { FormTheme } from "@/forms";

export type ThemeVars = CSSProperties & {
  "--form-primary": string;
  "--form-primary-hover": string;
  "--form-on-primary": string;
};

export function toThemeVars(theme: FormTheme): ThemeVars {
  return {
    "--form-primary": theme.primaryColor,
    "--form-primary-hover": theme.primaryColorHover,
    "--form-on-primary": theme.onPrimaryColor,
  } as ThemeVars;
}
