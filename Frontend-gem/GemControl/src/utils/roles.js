import { ROUTES } from "./routes";

// "superadmin" = the platform owner (no firm). It only ever sees the platform
// panel; every other role uses the shop screens. The real gate is server-side
// (Backend isSuperAdmin) -- this only decides which screens to show.
export const isSuperAdmin = (user) => user?.role?.toLowerCase() === "superadmin";

export const homeRouteFor = (user) =>
  isSuperAdmin(user) ? ROUTES.PLATFORM_ADMIN : ROUTES.DASHBOARD;
