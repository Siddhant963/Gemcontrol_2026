// Viewport-based layout modes (never device-based).
//   mobile  < 768px    -> header hamburger + temporary drawer
//   tablet  768-1199px -> 72px icon rail (+ hamburger for the full menu)
//   desktop >= 1200px  -> permanent 264px sidebar
// 1200px equals MUI's default `lg`, so CSS-only code can use `lg` for the
// desktop cut-off; the 768px cut-off is only needed for structure (hook below).
export const TABLET_MIN_QUERY = "(min-width:768px)";
export const DESKTOP_MIN_QUERY = "(min-width:1200px)";

// For CSS-in-JS (theme overrides): the same <768px cut-off as the layout hook.
export const MOBILE_MAX_MEDIA = "@media screen and (max-width:767.95px)";

export const SIDEBAR_WIDTH = 264;
export const RAIL_WIDTH = 72;
export const DRAWER_WIDTH = "min(86vw, 300px)";

export const SAFE_TOP = "env(safe-area-inset-top, 0px)";
export const SAFE_BOTTOM = "env(safe-area-inset-bottom, 0px)";
export const SAFE_LEFT = "env(safe-area-inset-left, 0px)";
export const SAFE_RIGHT = "env(safe-area-inset-right, 0px)";
