import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { ROUTES } from "../utils/routes";

function AdminRoute() {
  const user = useSelector((state) => state.auth.user);

  if (user?.role?.toLowerCase() !== "admin") {
    return <Navigate to={ROUTES.DASHBOARD} />;
  }

  return <Outlet />;
}

export default AdminRoute;
