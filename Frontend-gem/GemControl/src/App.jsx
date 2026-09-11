import { useEffect, useState } from "react";
import { Provider } from "react-redux";
import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import store from "./redux/store";
import { getTheme } from "./theme.js";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard.jsx";
import UserManagement from "./pages/UserManagement";
import FirmManagement from "./pages/FirmManagemenet";
import CustomerManagement from "./pages/CustomerManagement";
import RawMaterials from "./pages/RawMaterials";
import Categories from "./pages/Categories";
import ItemsManagement from "./pages/ItemManagement";
import SalesManagement from "./pages/SalesManagement";
import PaymentManagement from "./pages/PaymentManagement";
import UdharManagement from "./pages/UdharManagement";
import Login from "./pages/Login";
import Register from "./components/Register";
import LandingPage from "./pages/LandingPage.jsx";
import SubscribePage from "./pages/SubscribePage.jsx";
import NotFound from "./pages/NotFound";
import { ROUTES } from "./utils/routes";
import ErrorBoundary from "./ErrorBoundary.jsx";
import GirviManagement from "./pages/GirviManagement.jsx";
import JewelleryPanel from "./pages/JewelleryPanel.jsx";
import DayBook from "./pages/DayBook.jsx";
import AdminRoute from "./components/AdminRoute.jsx";
import SplashScreen from "./components/SplashScreen.jsx";
import {useTheme} from "@mui/material/styles";

const SPLASH_DURATION_MS = 2000;

function App() {
  return (
    <Provider store={store}>
      <ErrorBoundary>
        <MainApp />
      </ErrorBoundary>
    </Provider>
  );
}

function MainApp() {
  const darkMode = useSelector((state) => state.theme.darkMode);
  const theme = getTheme(darkMode ? "dark" : "light");
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const muiTheme = useTheme();

  // Splash shows once per full page load (not on in-app navigation).
  const [showSplash, setShowSplash] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), SPLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SplashScreen visible={showSplash} />
      <BrowserRouter>
        <Routes>
          {/* Public marketing landing page — shown regardless of auth state,
              same as any SaaS homepage. Login/Register handle their own
              already-authenticated redirect below. */}
          <Route path={ROUTES.LANDING} element={<LandingPage />} />

          {/* Public Routes */}
          <Route
            path={ROUTES.LOGIN}
            element={
              isAuthenticated ? <Navigate to={ROUTES.DASHBOARD} /> : <Login />
            }
          />
          <Route
            path={ROUTES.REGISTER}
            element={
              isAuthenticated ? <Navigate to={ROUTES.DASHBOARD} /> : <Register />
            }
          />

          {/* Requires auth but deliberately NOT wrapped in ProtectedRoute --
              this is the page ProtectedRoute redirects to when the firm's
              subscription isn't active, so it can't itself require one. */}
          <Route
            path={ROUTES.SUBSCRIBE}
            element={
              isAuthenticated ? <SubscribePage /> : <Navigate to={ROUTES.LOGIN} />
            }
          />
          {/* Protected Routes with Layout */}
          
          <Route
            element={
             <div style={{ display: "flex", minHeight: "100vh", }}>
                <Sidebar />
                <div style={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
                  <Navbar />
                  <main style={{ flexGrow: 1, padding: "20px", paddingTop: muiTheme.mixins.toolbar.minHeight + 20 }}>
                    <ProtectedRoute />
                  </main>
                </div>
              </div>
            }
          >
            {/* Nested protected routes accessible to both admin and staff */}
            <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
            <Route path={ROUTES.CUSTOMER_MANAGEMENT} element={<CustomerManagement />} />
            <Route path={ROUTES.RAW_MATERIALS} element={<RawMaterials />} />
            <Route path={ROUTES.ITEMS_MANAGEMENT} element={<ItemsManagement />} />
            <Route path={ROUTES.SALES_MANAGEMENT} element={<SalesManagement />} />
            <Route path={ROUTES.JEWELLERY_PANEL} element={<JewelleryPanel />} />
            <Route path={ROUTES.DAY_BOOK} element={<DayBook />} />
            <Route path={ROUTES.CATEGORIES} element={<Categories />} />

            {/* Admin-only routes */}
            <Route element={<AdminRoute />}>
              <Route path={ROUTES.USER_MANAGEMENT} element={<UserManagement />} />
              <Route path={ROUTES.FIRM_MANAGEMENT} element={<FirmManagement />} />
              <Route path={ROUTES.PAYMENTS} element={<PaymentManagement />} />
              <Route path={ROUTES.UDHAR_MANAGEMENT} element={<UdharManagement />} />
              <Route path={ROUTES.GIRVI_MANAGEMENT} element={<GirviManagement />} />
            </Route>
          </Route>

         
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
