import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useLocation } from "react-router-dom";
import { Box } from "@mui/material";
import Sidebar from "../Sidebar";
import Navbar from "../Navbar";
import MobileSidebarDrawer from "./MobileSidebarDrawer";
import useLayoutMode from "../../hooks/useLayoutMode";
import { SAFE_BOTTOM, SAFE_LEFT, SAFE_RIGHT, SAFE_TOP } from "../../config/layout";

/**
 * Authenticated app shell.
 *   desktop: permanent sidebar | header + content
 *   tablet : icon rail         | header (with menu button) + content
 *   mobile : header (with menu button) + content
 * Below desktop, the menu button opens the full labelled navigation drawer.
 * Drawer open state is local UI state only.
 */
function AppLayout({ children }) {
  const mode = useLayoutMode();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Close on any route change (covers back/forward and in-menu navigation).
  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  // The drawer is not used on desktop; make sure it cannot reopen stale.
  useEffect(() => {
    if (mode === "desktop") setMobileNavOpen(false);
  }, [mode]);

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        "@supports (height: 100dvh)": { minHeight: "100dvh" },
        width: "100%",
        maxWidth: "100%",
        bgcolor: "background.default",
      }}
    >
      <Sidebar />
      {mode !== "desktop" && (
        <MobileSidebarDrawer
          open={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
        />
      )}
      <Box
        sx={{
          flexGrow: 1,
          minWidth: 0,
          maxWidth: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Navbar onMenuClick={() => setMobileNavOpen(true)} />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            minWidth: 0,
            maxWidth: "100%",
            boxSizing: "border-box",
            pt: { xs: `calc(68px + ${SAFE_TOP})`, sm: `calc(76px + ${SAFE_TOP})` },
            pb: { xs: `max(12px, ${SAFE_BOTTOM})`, sm: `max(20px, ${SAFE_BOTTOM})` },
            pl: { xs: `max(12px, ${SAFE_LEFT})`, sm: `max(20px, ${SAFE_LEFT})` },
            pr: { xs: `max(12px, ${SAFE_RIGHT})`, sm: `max(20px, ${SAFE_RIGHT})` },
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}

AppLayout.propTypes = {
  children: PropTypes.node,
};

export default AppLayout;
