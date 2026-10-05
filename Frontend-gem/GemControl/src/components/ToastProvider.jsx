import { useCallback, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Alert, Portal, Snackbar } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { SAFE_TOP } from "../config/layout";
import { ToastContext } from "../hooks/useToast";

// ONE global toast for the web app, anchored TOP-CENTER. Sits on the MUI
// `snackbar` layer (theme.zIndex.snackbar = 1400), which is above dialogs
// (1300), the nav drawer and the app bar, so it is never hidden behind a
// modal. Top offset = safe-area inset + room for the fixed header + margin.
const TOP_OFFSET = `calc(${SAFE_TOP} + 72px)`;

function ToastProvider({ children }) {
  const theme = useTheme();
  const [toast, setToast] = useState({ open: false, message: "", severity: "info", id: 0 });

  const show = useCallback((message, severity = "info") => {
    setToast((prev) => ({ open: true, message, severity, id: prev.id + 1 }));
  }, []);

  const api = useMemo(
    () => ({
      show,
      success: (message) => show(message, "success"),
      error: (message) => show(message, "error"),
      warning: (message) => show(message, "warning"),
      info: (message) => show(message, "info"),
    }),
    [show]
  );

  const handleClose = (_event, reason) => {
    if (reason === "clickaway") return;
    setToast((prev) => ({ ...prev, open: false }));
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* Portalled into its own <body> child, created only while a toast is
          showing: MUI's modal manager marks every body child that existed
          when a dialog/drawer opened as aria-hidden, which would hide a toast
          raised over a dialog from screen readers. A node created later is
          not hidden, so the alert is still announced. */}
      {toast.open && (
        <Portal>
        <Snackbar
          key={toast.id}
          open={toast.open}
          onClose={handleClose}
          autoHideDuration={toast.severity === "error" ? 6000 : 4000}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
          sx={{
            zIndex: theme.zIndex.snackbar,
            top: TOP_OFFSET,
            [theme.breakpoints.up("sm")]: { top: TOP_OFFSET },
            // Phones: span the viewport with a 12px gutter (never wider than it).
            [theme.breakpoints.down("sm")]: {
              left: "max(12px, env(safe-area-inset-left, 0px))",
              right: "max(12px, env(safe-area-inset-right, 0px))",
            },
          }}
        >
          <Alert
            severity={toast.severity}
            variant="filled"
            onClose={handleClose}
            sx={{
              width: "100%",
              maxWidth: { xs: "calc(100vw - 24px)", sm: 520 },
              boxSizing: "border-box",
              alignItems: "center",
              overflowWrap: "anywhere",
            }}
          >
            {toast.message}
          </Alert>
        </Snackbar>
        </Portal>
      )}
    </ToastContext.Provider>
  );
}

ToastProvider.propTypes = { children: PropTypes.node };

export default ToastProvider;
