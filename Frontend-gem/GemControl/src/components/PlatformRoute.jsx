import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { isSuperAdmin } from "../utils/roles";
import { ROUTES } from "../utils/routes";

// Platform-owner pages. Anyone else is sent back to the shop dashboard (and
// the backend rejects their API calls with 403 regardless).
function PlatformRoute() {
  const user = useSelector((state) => state.auth.user);
  if (!isSuperAdmin(user)) return <Navigate to={ROUTES.DASHBOARD} />;
  return <Outlet />;
}

export default PlatformRoute;
