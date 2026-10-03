import useMediaQuery from "@mui/material/useMediaQuery";
import { DESKTOP_MIN_QUERY, TABLET_MIN_QUERY } from "../config/layout";

/** Returns "mobile" | "tablet" | "desktop" from the viewport width. */
export default function useLayoutMode() {
  const isTabletUp = useMediaQuery(TABLET_MIN_QUERY, { noSsr: true });
  const isDesktop = useMediaQuery(DESKTOP_MIN_QUERY, { noSsr: true });
  if (isDesktop) return "desktop";
  if (isTabletUp) return "tablet";
  return "mobile";
}
