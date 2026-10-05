import { createContext, useContext } from "react";

// Context + hook live apart from <ToastProvider> (components/ToastProvider.jsx)
// so that file only exports a component (keeps fast-refresh happy).
export const ToastContext = createContext(null);

export default function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
