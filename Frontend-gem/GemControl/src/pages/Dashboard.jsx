import {
  Typography,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputBase,
  IconButton,
  Badge,
  Box,
  Divider,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Card,
  CardContent,
  Pagination,
  Chip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Search,
  Notifications,
  Close,
  MonetizationOn,
  Grain,
  Diamond,
  Update,
} from "@mui/icons-material";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setError as setAuthError } from "../redux/authSlice";
import { ROUTES } from "../utils/routes";
import api from "../utils/api";
import NotificationModal from "../components/NotificationModal";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";

// Mirrors GOLD_PURITY_FACTORS in Backend/Controllers/adminController.js —
// used only to preview derived rates before saving; the backend is the
// source of truth for what actually gets stored.
const GOLD_PURITY_FACTORS = {
  "24K": 1,
  "23K": 0.9583,
  "22K": 0.9167,
  "20K": 0.8333,
  "18K": 0.75,
};

const EMPTY_GOLD_RATES = { "24K": "N/A", "23K": "N/A", "22K": "N/A", "20K": "N/A", "18K": "N/A" };
const EMPTY_DIAMOND_RATES = {
  "0.5 Carat": "N/A",
  "1 Carat": "N/A",
  "1.5 Carat": "N/A",
  "2 Carat": "N/A",
  "2.5 Carat": "N/A",
  "3 Carat": "N/A",
};
const RATE_ITEMS_PER_PAGE = 7;

// fuction starts
function Dashboard() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user: currentUser } = useSelector((state) => state.auth);
  const isAdmin = currentUser?.role?.toLowerCase() === "admin";

  const [searchQuery, setSearchQuery] = useState("");
  const [notificationOpen, setNotificationOpen] = useState(false);

  const [dashboardStats, setDashboardStats] = useState({
    totalCustomers: 0,
    totalSales: 0,
    totalStockValue: 0,
    totalRawMaterialWeight: 0,
  });
  const [todayRates, setTodayRates] = useState({
    gold24K: "N/A",
    silver: "N/A",
    diamond1Carat: "N/A",
  });
  const [monthlySalesData, setMonthlySalesData] = useState([]);
  const [recentActivitiesData, setRecentActivitiesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rateError, setRateError] = useState(null);
  const [ratesLoading, setRatesLoading] = useState(false);

  // --- Rate Management state (merged in from the former standalone page) ---
  const [goldRates, setGoldRates] = useState(EMPTY_GOLD_RATES);
  const [silverRate, setSilverRate] = useState("N/A");
  const [diamondRates, setDiamondRates] = useState(EMPTY_DIAMOND_RATES);
  const [historicalRates, setHistoricalRates] = useState([]);
  const [openGoldModal, setOpenGoldModal] = useState(false);
  const [openSilverModal, setOpenSilverModal] = useState(false);
  const [openDiamondModal, setOpenDiamondModal] = useState(false);
  const [newRates, setNewRates] = useState({
    _id: null,
    date: new Date().toLocaleDateString("en-CA"),
    gold: { "24K": "", "23K": "", "22K": "", "20K": "", "18K": "" },
    silver: "",
    diamond: {
      "0.5 Carat": "",
      "1 Carat": "",
      "1.5 Carat": "",
      "2 Carat": "",
      "2.5 Carat": "",
      "3 Carat": "",
    },
  });
  const [rateFormErrors, setRateFormErrors] = useState({});
  const [rateActionLoading, setRateActionLoading] = useState(false);
  const [rateDialogOpen, setRateDialogOpen] = useState(false);
  const [rateDialogMessage, setRateDialogMessage] = useState("");
  const [rateDialogType, setRateDialogType] = useState("success");
  const [lastRateUpdateAction, setLastRateUpdateAction] = useState(null);
  const [ratePage, setRatePage] = useState(1);

  const notificationRef = useRef(null);

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" },
    }),
    hover: { scale: 1.02, transition: { duration: 0.3 } },
  };

  const notificationVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: {
      opacity: 1,
      height: "auto",
      transition: { duration: 0.3, ease: "easeOut" },
    },
    exit: {
      opacity: 0,
      height: 0,
      transition: { duration: 0.2, ease: "easeIn" },
    },
  };

  // Fetch all dashboard data except rates
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        dashboardResponse,
        monthlySalesResponse,
        recentActivitiesResponse,
      ] = await Promise.all([
        api.get("/getDashboardData"),
        api.get("/getMonthlySalesData"),
        api.get("/getRecentActivities"),
      ]);

      setDashboardStats({
        totalCustomers: dashboardResponse.data.totalCustomers || 0,
        totalSales: dashboardResponse.data.totalSales || 0,
        totalStockValue: dashboardResponse.data.totalStockValue || 0,
        totalRawMaterialWeight:
          dashboardResponse.data.totalRawMaterialWeight || 0,
      });

      const sortedMonthlySales = Array.isArray(monthlySalesResponse.data)
        ? monthlySalesResponse.data.sort((a, b) => {
            const monthOrder = [
              "January",
              "February",
              "March",
              "April",
              "May",
              "June",
              "July",
              "August",
              "September",
              "October",
              "November",
              "December",
            ];
            if (a.year !== b.year) return a.year - b.year;
            return monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month);
          })
        : [];
      setMonthlySalesData(sortedMonthlySales);

      setRecentActivitiesData(
        Array.isArray(recentActivitiesResponse.data)
          ? recentActivitiesResponse.data.sort(
              (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
            )
          : []
      );
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      const errorMessage =
        err.response?.status === 401
          ? "Please log in to view dashboard data."
          : err.response?.data?.message || "Failed to load dashboard data.";
      setError(errorMessage);
      if (err.response?.status === 401) {
        dispatch(setAuthError(errorMessage));
        navigate(ROUTES.LOGIN);
      }
    } finally {
      setLoading(false);
    }
  }, [dispatch, navigate]);

  // Helper: map frontend diamond carat keys ("0.5 Carat") to backend keys ("0_5 Carat")
  const mapFrontendDiamondToBackend = (frontendDiamondRates) => {
    return {
      "0_5 Carat": parseFloat(frontendDiamondRates["0.5 Carat"]) || 0,
      "1 Carat": parseFloat(frontendDiamondRates["1 Carat"]) || 0,
      "1_5 Carat": parseFloat(frontendDiamondRates["1.5 Carat"]) || 0,
      "2 Carat": parseFloat(frontendDiamondRates["2 Carat"]) || 0,
      "2_5 Carat": parseFloat(frontendDiamondRates["2.5 Carat"]) || 0,
      "3 Carat": parseFloat(frontendDiamondRates["3 Carat"]) || 0,
    };
  };

  const mapBackendDiamondToFrontend = (backendDiamondRates) => {
    return {
      "0.5 Carat": backendDiamondRates?.["0_5 Carat"] || "N/A",
      "1 Carat": backendDiamondRates?.["1 Carat"] || "N/A",
      "1.5 Carat": backendDiamondRates?.["1_5 Carat"] || "N/A",
      "2 Carat": backendDiamondRates?.["2 Carat"] || "N/A",
      "2.5 Carat": backendDiamondRates?.["2_5 Carat"] || "N/A",
      "3 Carat": backendDiamondRates?.["3 Carat"] || "N/A",
    };
  };

  // Fetch rates - drives both the quick stat cards and the full Rate Management section
  const fetchRates = useCallback(async () => {
    setRatesLoading(true);
    setRateError(null);
    try {
      const response = await api.get("/getAllDailrates");
      const allRates = Array.isArray(response.data) ? response.data : [];

      const sortedRates = allRates.sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );
      setHistoricalRates(sortedRates);
      const latestRate = sortedRates.length > 0 ? sortedRates[0] : null;

      const gold24K = latestRate?.rate?.gold?.["24K"];
      const silver = latestRate?.rate?.silver;
      const diamond1Carat = latestRate?.rate?.daimond?.["1 Carat"];

      if (!gold24K && !silver && !diamond1Carat) {
        setRateError(
          "Please update today's rates to see current market prices."
        );
        setTodayRates({ gold24K: "N/A", silver: "N/A", diamond1Carat: "N/A" });
        setGoldRates(EMPTY_GOLD_RATES);
        setSilverRate("N/A");
        setDiamondRates(EMPTY_DIAMOND_RATES);
      } else {
        setTodayRates({
          gold24K: gold24K || "N/A",
          silver: silver || "N/A",
          diamond1Carat: diamond1Carat || "N/A",
        });
        setGoldRates({
          "24K": latestRate.rate.gold?.["24K"] || "N/A",
          "23K": latestRate.rate.gold?.["23K"] || "N/A",
          "22K": latestRate.rate.gold?.["22K"] || "N/A",
          "20K": latestRate.rate.gold?.["20K"] || "N/A",
          "18K": latestRate.rate.gold?.["18K"] || "N/A",
        });
        setSilverRate(latestRate.rate.silver || "N/A");
        setDiamondRates(mapBackendDiamondToFrontend(latestRate.rate.daimond));
      }
    } catch (err) {
      console.error("Error fetching rates:", err);
      setRateError("Please update today's rates to see current market prices.");
      setTodayRates({ gold24K: "N/A", silver: "N/A", diamond1Carat: "N/A" });
      setGoldRates(EMPTY_GOLD_RATES);
      setSilverRate("N/A");
      setDiamondRates(EMPTY_DIAMOND_RATES);
    } finally {
      setRatesLoading(false);
    }
  }, []);

  useEffect(() => {
    // Load all dashboard data first (except rates)
    fetchDashboardData();
    // Try to fetch rates separately (won't block dashboard if it fails)
    fetchRates();
  }, [fetchDashboardData, fetchRates]);

  // Listen for rates update events to refresh rates
  useEffect(() => {
    const handleRatesUpdate = () => {
      fetchRates();
    };

    window.addEventListener("ratesUpdated", handleRatesUpdate);
    return () => {
      window.removeEventListener("ratesUpdated", handleRatesUpdate);
    };
  }, [fetchRates]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        notificationOpen &&
        notificationRef.current &&
        !notificationRef.current.contains(event.target) &&
        !event.target.closest('.MuiIconButton-root[aria-label="notifications"]')
      ) {
        setNotificationOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notificationOpen]);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleExportToExcel = async () => {
    try {
      setLoading(true);
      const response = await api.get('/exportAllDataToExcel', {
        responseType: 'blob', // Important for file download
      });

      // Create a blob from the response
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `GemControl_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Show success notification
      setError(null);
      alert('Data exported successfully!');
    } catch (err) {
      console.error('Error exporting data:', err);
      setError('Failed to export data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // --- Rate Management handlers (merged in from the former standalone page) ---

  const handleNewRateChange = (category, key) => (e) => {
    const value = e.target.value;
    setNewRates((prev) => {
      let updated = { ...prev };
      if (category === "silver") {
        updated.silver = value;
      } else if (category === "date") {
        updated.date = value;
      } else {
        updated[category] = { ...prev[category], [key]: value };
      }
      return updated;
    });
    setRateFormErrors((prev) => ({ ...prev, [key]: null, date: null }));
  };

  const validateRateForm = (material) => {
    const errors = {};
    if (!newRates.date || !/^\d{4}-\d{2}-\d{2}$/.test(newRates.date)) {
      errors.date = "Valid date (YYYY-MM-DD) is required";
    }

    if (material === "gold") {
      // Only 24K is entered by hand — 23K/22K/20K/18K are derived by the
      // backend from GOLD_PURITY_FACTORS, so there's nothing else to validate.
      const value = newRates.gold["24K"];
      if (value === "" || isNaN(parseFloat(value)) || parseFloat(value) <= 0) {
        errors["24K"] = "24K rate must be a positive number";
      }
    } else if (material === "silver") {
      if (
        newRates.silver === "" ||
        isNaN(parseFloat(newRates.silver)) ||
        parseFloat(newRates.silver) <= 0
      ) {
        errors.silver = "Silver rate must be a positive number";
      }
    } else if (material === "diamond") {
      const carats = [
        "0.5 Carat",
        "1 Carat",
        "1.5 Carat",
        "2 Carat",
        "2.5 Carat",
        "3 Carat",
      ];
      carats.forEach((type) => {
        const value = newRates.diamond[type];
        if (value === "" || isNaN(parseFloat(value)) || parseFloat(value) <= 0) {
          errors[type] = `${type} rate must be a positive number`;
        }
      });

      for (let i = 0; i < carats.length - 1; i++) {
        const smallerCarat = carats[i];
        const largerCarat = carats[i + 1];
        const smallerRate = parseFloat(newRates.diamond[smallerCarat]);
        const largerRate = parseFloat(newRates.diamond[largerCarat]);
        if (!isNaN(smallerRate) && !isNaN(largerRate) && smallerRate >= largerRate) {
          errors[largerCarat] = `${largerCarat} rate must be greater than ${smallerCarat}`;
        }
      }
    }
    setRateFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetNewRatesForm = () => {
    setNewRates({
      _id: null,
      date: new Date().toLocaleDateString("en-CA"),
      gold: { "24K": "", "23K": "", "22K": "", "20K": "", "18K": "" },
      silver: "",
      diamond: {
        "0.5 Carat": "",
        "1 Carat": "",
        "1.5 Carat": "",
        "2 Carat": "",
        "2.5 Carat": "",
        "3 Carat": "",
      },
    });
  };

  const handleSaveRates = async (materialType) => {
    if (!validateRateForm(materialType)) {
      return;
    }
    setRateActionLoading(true);

    const existingRateForDate = historicalRates.find(
      (rate) =>
        new Date(rate.date).toLocaleDateString("en-CA") ===
        new Date(newRates.date).toLocaleDateString("en-CA")
    );

    let rateDataToSend = {
      date: newRates.date,
      rate: {
        gold:
          existingRateForDate?.rate?.gold ||
          Object.fromEntries(
            Object.keys(goldRates).map((k) => [k, parseFloat(goldRates[k]) || 0])
          ),
        silver: existingRateForDate?.rate?.silver || parseFloat(silverRate) || 0,
        daimond:
          existingRateForDate?.rate?.daimond ||
          mapFrontendDiamondToBackend(diamondRates),
      },
    };

    if (materialType === "gold") {
      rateDataToSend.rate.gold = Object.fromEntries(
        Object.keys(newRates.gold).map((purity) => [
          purity,
          parseFloat(newRates.gold[purity]) || 0,
        ])
      );
    } else if (materialType === "silver") {
      rateDataToSend.rate.silver = parseFloat(newRates.silver) || 0;
    } else if (materialType === "diamond") {
      rateDataToSend.rate.daimond = mapFrontendDiamondToBackend(newRates.diamond);
    }

    try {
      if (existingRateForDate) {
        await api.put("/updateDailrate", {
          ...rateDataToSend,
          _id: existingRateForDate._id,
        });
        setRateDialogMessage(
          `${materialType.charAt(0).toUpperCase() + materialType.slice(1)} rates updated successfully!`
        );
      } else {
        await api.post("/createDailrate", rateDataToSend);
        setRateDialogMessage(
          `${materialType.charAt(0).toUpperCase() + materialType.slice(1)} rates added successfully!`
        );
      }
      setRateDialogType("success");
      setRateDialogOpen(true);
      await fetchRates();
      window.dispatchEvent(new Event("ratesUpdated"));

      if (materialType === "gold") setOpenGoldModal(false);
      else if (materialType === "silver") setOpenSilverModal(false);
      else if (materialType === "diamond") setOpenDiamondModal(false);

      resetNewRatesForm();
      setRateFormErrors({});
    } catch (error) {
      console.error(`Error saving ${materialType} rates:`, error);
      setRateDialogMessage(
        error.response?.data?.message || `Failed to save ${materialType} rates`
      );
      setRateDialogType("error");
      setRateDialogOpen(true);
      setLastRateUpdateAction(() => () => handleSaveRates(materialType));
    } finally {
      setRateActionLoading(false);
    }
  };

  const handleOpenRateModal = (materialType) => () => {
    const today = new Date().toLocaleDateString("en-CA");
    const existingRate = historicalRates.find(
      (rate) => new Date(rate.date).toLocaleDateString("en-CA") === today
    );

    const initialNewRates = {
      _id: existingRate?._id || null,
      date: today,
      gold: existingRate?.rate?.gold
        ? { ...existingRate.rate.gold }
        : { "24K": "", "23K": "", "22K": "", "20K": "", "18K": "" },
      silver: existingRate?.rate?.silver || "",
      diamond: existingRate?.rate?.daimond
        ? mapBackendDiamondToFrontend(existingRate.rate.daimond)
        : {
            "0.5 Carat": "",
            "1 Carat": "",
            "1.5 Carat": "",
            "2 Carat": "",
            "2.5 Carat": "",
            "3 Carat": "",
          },
    };

    setNewRates(initialNewRates);
    setRateFormErrors({});

    if (materialType === "gold") setOpenGoldModal(true);
    else if (materialType === "silver") setOpenSilverModal(true);
    else if (materialType === "diamond") setOpenDiamondModal(true);
  };

  const handleCloseGoldModal = () => {
    setOpenGoldModal(false);
    resetNewRatesForm();
    setRateFormErrors({});
  };
  const handleCloseSilverModal = () => {
    setOpenSilverModal(false);
    resetNewRatesForm();
    setRateFormErrors({});
  };
  const handleCloseDiamondModal = () => {
    setOpenDiamondModal(false);
    resetNewRatesForm();
    setRateFormErrors({});
  };

  const handleRefreshRates = async () => {
    setRateActionLoading(true);
    try {
      await fetchRates();
      setRateDialogMessage("Rates refreshed successfully");
      setRateDialogType("success");
      setRateDialogOpen(true);
    } catch (error) {
      console.error("Error refreshing rates:", error);
      setRateDialogMessage(error.response?.data?.message || "Failed to refresh rates");
      setRateDialogType("error");
      setRateDialogOpen(true);
      setLastRateUpdateAction(() => handleRefreshRates);
    } finally {
      setRateActionLoading(false);
    }
  };

  const handleRateDialogClose = () => {
    setRateDialogOpen(false);
    setLastRateUpdateAction(null);
  };

  const handleRateRetry = () => {
    setRateDialogOpen(false);
    if (lastRateUpdateAction) {
      lastRateUpdateAction();
    }
  };

  const rateUpdatedDateTime = new Date().toLocaleString("en-IN", {
    hour12: true,
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const paginatedHistoricalRates = useMemo(
    () =>
      historicalRates.slice(
        (ratePage - 1) * RATE_ITEMS_PER_PAGE,
        ratePage * RATE_ITEMS_PER_PAGE
      ),
    [historicalRates, ratePage]
  );

  const filteredActivities = useMemo(
    () =>
      recentActivitiesData.filter(
        (activity) =>
          (activity.activityType || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          (activity.description || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
      ),
    [recentActivitiesData, searchQuery]
  );
  const notifications = filteredActivities
    .map((activity) => ({
      id: activity._id,
      message: `${activity.activityType}: ${activity.description}`,
      time: new Date(activity.timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    }))
    .slice(0, 5);

  const statsDisplay = [
    {
      title: "Total Customers",
      value: dashboardStats.totalCustomers.toLocaleString(),
      change: "",
    },
    {
      title: "Total Sales",
      value: `₹${dashboardStats.totalSales.toLocaleString()}`,
      change: "",
    },
    {
      title: "Stock Value",
      value: `₹${dashboardStats.totalStockValue.toLocaleString()}`,
      change: "",
    },
    {
      title: "Raw Material Weight",
      value: `${dashboardStats.totalRawMaterialWeight.toFixed(2)} kg`,
      change: "",
    },
  ];

  // Data for the comparison chart of current totals
  const summaryComparisonData = [
    { name: "Customers", value: dashboardStats.totalCustomers },
    { name: "Sales", value: dashboardStats.totalSales },
    { name: "Stock Value", value: dashboardStats.totalStockValue },
    { name: "Raw Material (kg)", value: dashboardStats.totalRawMaterialWeight },
  ];

  // Data for the historical rates chart
  const historicalRatesData = monthlySalesData.map((d) => ({
    date: `${d.month.slice(0, 3)} ${d.year}`,
    gold: parseFloat(todayRates.gold24K) || 0,
    silver: parseFloat(todayRates.silver) || 0,
    diamond: parseFloat(todayRates.diamond1Carat) || 0,
  }));

  const rateCardSx = {
    p: { xs: 1, sm: 2, md: 3 },
    textAlign: "center",
    border: `2px solid ${theme.palette.primary.main}30`,
    borderRadius: 2,
    boxShadow: theme.shadows[6],
    transition: "box-shadow 0.3s ease, border-color 0.3s ease",
    "&:hover": { boxShadow: theme.shadows[10], borderColor: theme.palette.primary.main },
    height: "100%",
  };

  return (
    <Box
      sx={{
        maxWidth: "1200px",
        margin: "0 auto",
        width: "100%",
        px: {
          xs: theme.spacing(1),
          sm: theme.spacing(2),
          md: theme.spacing(3),
        },
        pt: { xs: theme.spacing(2), sm: theme.spacing(3) },
        pb: { xs: theme.spacing(2), sm: theme.spacing(3) },
      }}
    >
      {error && (
        <Alert
          severity="error"
          sx={{
            mb: theme.spacing(2),
            fontSize: { xs: "0.8rem", sm: "0.9rem" },
          }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {rateError && (
        <Alert
          severity="info"
          sx={{
            mb: theme.spacing(2),
            fontSize: { xs: "0.8rem", sm: "0.9rem" },
            bgcolor: theme.palette.info.light,
            color: theme.palette.info.contrastText,
          }}
          onClose={() => setRateError(null)}
        >
          {rateError}
        </Alert>
      )}

      {/* Top Section with Search and Notification */}
      <Box
        sx={{
          p: { xs: 2, sm: 2 },
          bgcolor: theme.palette.background.paper,
          borderBottom: `1px solid ${theme.palette.divider}`,
          borderRadius: 2,
          mb: { xs: 2, sm: 4 },
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          gap: { xs: 2, sm: 2 },
        }}
        component={motion.div}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', width: '100%', justifyContent: 'space-between' }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: "bold",
              fontSize: { xs: "1.5rem", sm: "2rem" },
            }}
          >
            Dashboard
          </Typography>

          {isAdmin && (
            <Button
              variant="contained"
              onClick={handleExportToExcel}
              disabled={loading}
              sx={{
                bgcolor: theme.palette.success.main,
                color: 'white',
                '&:hover': {
                  bgcolor: theme.palette.success.dark,
                },
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                py: 1,
              }}
            >
              {loading ? 'Exporting...' : 'Export All Data to Excel'}
            </Button>
          )}
        </Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            width: { xs: "100%", sm: "auto" },
            justifyContent: { xs: "flex-start", sm: "flex-end" },
            position: "relative",
            gap: { xs: 1, sm: 2 },
          }}
        >
          <Paper
            sx={{
              p: { xs: 0.5, sm: 1 },
              display: "flex",
              alignItems: "center",
              width: { xs: "100%", sm: 300 },
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 1,
              boxShadow: 1,
            }}
          >
            <IconButton sx={{ p: theme.spacing(1) }}>
              <Search sx={{ color: theme.palette.text.secondary }} />
            </IconButton>
            <InputBase
              sx={{
                ml: theme.spacing(1),
                flex: 1,
                color: theme.palette.text.primary,
              }}
              placeholder="Search Activities..."
              value={searchQuery}
              onChange={handleSearch}
            />
          </Paper>
          <IconButton
            onClick={() => setNotificationOpen(!notificationOpen)}
            sx={{
              ml: { xs: 0, sm: theme.spacing(1) },
              mt: { xs: theme.spacing(1), sm: 0 },
            }}
            aria-label="notifications"
          >
            <Badge badgeContent={notifications.length} color="secondary">
              <Notifications sx={{ color: theme.palette.text.primary }} />
            </Badge>
          </IconButton>
          {/* Notification Dropdown */}
          <AnimatePresence>
            {notificationOpen && (
              <motion.div
                ref={notificationRef}
                variants={notificationVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  zIndex: 1000,
                  width: 250,
                  marginTop: theme.spacing(1),
                }}
              >
                <Paper
                  sx={{
                    p: 1,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 1,
                    boxShadow: 6,
                    maxHeight: 300,
                    overflowY: "auto",
                  }}
                >
                  {notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <Box key={notif.id} sx={{ p: theme.spacing(1) }}>
                        <Typography
                          variant="body2"
                          sx={{
                            display: "flex",
                            color: theme.palette.text.primary,
                            fontSize: { xs: "0.8rem", sm: "0.9rem" },
                          }}
                        >
                          {notif.message}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: theme.palette.text.secondary,
                            fontSize: { xs: "0.6rem", sm: "0.7rem" },
                            display: "block",
                          }}
                        >
                          {notif.time}
                        </Typography>
                        <Divider sx={{ my: theme.spacing(0.5) }} />
                      </Box>
                    ))
                  ) : (
                    <Typography
                      variant="body2"
                      sx={{
                        p: theme.spacing(1),
                        color: theme.palette.text.secondary,
                      }}
                    >
                      No new notifications.
                    </Typography>
                  )}
                </Paper>
              </motion.div>
            )}
          </AnimatePresence>
        </Box>
      </Box>

      {loading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            py: theme.spacing(4),
          }}
        >
          <CircularProgress sx={{ color: theme.palette.primary.main }} />
        </Box>
      ) : (
        <>
          {/* Stats Grid */}
          <Grid
            container
            spacing={theme.spacing(2)}
            sx={{
              width: "100%",
              mt: { xs: theme.spacing(2), sm: theme.spacing(4) },
              px: { xs: theme.spacing(1), sm: theme.spacing(2) },
            }}
          >
            {statsDisplay.map((stat, index) => (
              <Grid item xs={12} sm={6} md={3} key={stat.title}>
                <motion.div
                  custom={index}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <Paper
                    sx={{
                      p: { xs: theme.spacing(2), sm: theme.spacing(3) },
                      textAlign: "center",
                      bgcolor: theme.palette.background.paper,
                      color: theme.palette.text.primary,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: theme.shape.borderRadius * 2,
                      transition: "all 0.3s ease",
                      "&:hover": { boxShadow: theme.shadows[8] },
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <Box>
                      <Typography
                        variant="h6"
                        sx={{
                          color: theme.palette.text.secondary,
                          mb: theme.spacing(1),
                          width: { xs: "200px" },
                          fontSize: { xs: "0.9rem", sm: "1rem" },
                        }}
                      >
                        {stat.title}
                      </Typography>
                      <Typography
                        variant="h4"
                        sx={{
                          color: theme.palette.primary.main,
                          mb: theme.spacing(1),
                          fontSize: { xs: "1.2rem", sm: "1.5rem" },
                        }}
                      >
                        {stat.value}
                      </Typography>
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{
                        color: stat.change.includes("-")
                          ? theme.palette.error.main
                          : theme.palette.text.secondary,
                        fontSize: { xs: "0.7rem", sm: "0.8rem" },
                        mt: "auto",
                      }}
                    >
                      {stat.change}
                    </Typography>
                  </Paper>
                </motion.div>
              </Grid>
            ))}
          </Grid>

          {/* Rate Management Section (merged in from the former standalone page, shown before the charts) */}
          <Box
            component={motion.div}
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            sx={{
              mt: { xs: theme.spacing(3), sm: theme.spacing(5) },
              px: { xs: theme.spacing(1), sm: theme.spacing(2) },
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: { xs: 1, sm: 2 },
                alignItems: { xs: "stretch", sm: "center" },
                justifyContent: "space-between",
                mb: { xs: 2, sm: 3 },
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  color: theme.palette.text.primary,
                  fontWeight: "bold",
                  fontSize: { xs: "1.1rem", sm: "1.3rem", md: "1.5rem" },
                }}
              >
                Rate Management
              </Typography>
              {isAdmin && (
                <Button
                  variant="contained"
                  startIcon={<Update />}
                  onClick={handleRefreshRates}
                  disabled={rateActionLoading}
                  sx={{
                    bgcolor: theme.palette.primary.main,
                    "&:hover": { bgcolor: theme.palette.primary.dark },
                    borderRadius: 1,
                    textTransform: "none",
                    width: { xs: "100%", sm: "auto" },
                  }}
                >
                  Refresh Rates
                </Button>
              )}
            </Box>

            <Grid container spacing={{ xs: 1, sm: 2, md: 3 }} sx={{ mb: { xs: 2, sm: 3 } }}>
              {/* Gold Rates Card */}
              <Grid item xs={12} sm={6} md={4}>
                <motion.div custom={0} variants={cardVariants} initial="hidden" animate="visible" whileHover="hover">
                  <Paper sx={rateCardSx}>
                    <MonetizationOn sx={{ fontSize: { xs: 30, sm: 36, md: 42 }, color: theme.palette.primary.main }} />
                    <Typography variant="h6" sx={{ color: theme.palette.text.primary, mt: 1, mb: 1, fontWeight: 700 }}>
                      Gold Rates
                    </Typography>
                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary, mb: 1, display: "block" }}>
                      Updated: {rateUpdatedDateTime}
                    </Typography>
                    {["24K", "23K", "22K", "20K", "18K"].map((purity) => (
                      <Box key={purity} sx={{ mb: 1 }}>
                        <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
                          {purity}
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{
                            color: theme.palette.primary.main,
                            fontWeight: 700,
                            backgroundColor: `${theme.palette.primary.main}10`,
                            borderRadius: 1,
                            px: 1,
                            py: 0.25,
                            display: "inline-block",
                          }}
                        >
                          {goldRates[purity]} ₹/gm
                        </Typography>
                      </Box>
                    ))}
                    {isAdmin && (
                      <Box sx={{ mt: 1.5 }}>
                        <Button
                          variant="outlined"
                          onClick={handleOpenRateModal("gold")}
                          sx={{ borderRadius: 1, textTransform: "none" }}
                        >
                          Update Rates
                        </Button>
                      </Box>
                    )}
                  </Paper>
                </motion.div>
              </Grid>

              {/* Silver Rate Card */}
              <Grid item xs={12} sm={6} md={4}>
                <motion.div custom={1} variants={cardVariants} initial="hidden" animate="visible" whileHover="hover">
                  <Paper sx={rateCardSx}>
                    <Grain sx={{ fontSize: { xs: 30, sm: 36, md: 42 }, color: theme.palette.primary.main }} />
                    <Typography variant="h6" sx={{ color: theme.palette.text.primary, mt: 1, mb: 1, fontWeight: 700 }}>
                      Silver Rates
                    </Typography>
                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary, mb: 1, display: "block" }}>
                      Updated: {rateUpdatedDateTime}
                    </Typography>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
                        Silver
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          color: theme.palette.primary.main,
                          fontWeight: 700,
                          backgroundColor: `${theme.palette.primary.main}10`,
                          borderRadius: 1,
                          px: 1,
                          py: 0.25,
                          display: "inline-block",
                        }}
                      >
                        {silverRate} ₹/g
                      </Typography>
                    </Box>
                    {isAdmin && (
                      <Box sx={{ mt: 1.5 }}>
                        <Button
                          variant="outlined"
                          onClick={handleOpenRateModal("silver")}
                          sx={{ borderRadius: 1, textTransform: "none" }}
                        >
                          Update Rates
                        </Button>
                      </Box>
                    )}
                  </Paper>
                </motion.div>
              </Grid>

              {/* Diamond Rates Card */}
              <Grid item xs={12} sm={6} md={4}>
                <motion.div custom={2} variants={cardVariants} initial="hidden" animate="visible" whileHover="hover">
                  <Paper sx={rateCardSx}>
                    <Diamond sx={{ fontSize: { xs: 30, sm: 36, md: 42 }, color: theme.palette.primary.main }} />
                    <Typography variant="h6" sx={{ color: theme.palette.text.primary, mt: 1, mb: 1, fontWeight: 700 }}>
                      Diamond Rates
                    </Typography>
                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary, mb: 1, display: "block" }}>
                      Updated: {rateUpdatedDateTime}
                    </Typography>
                    {["0.5 Carat", "1 Carat", "1.5 Carat", "2 Carat", "2.5 Carat", "3 Carat"].map((type) => (
                      <Box key={type} sx={{ mb: 1 }}>
                        <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
                          {type}
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{
                            color: theme.palette.primary.main,
                            fontWeight: 700,
                            backgroundColor: `${theme.palette.primary.main}10`,
                            borderRadius: 1,
                            px: 1,
                            py: 0.25,
                            display: "inline-block",
                          }}
                        >
                          {diamondRates[type]} ₹/pc
                        </Typography>
                      </Box>
                    ))}
                    {isAdmin && (
                      <Box sx={{ mt: 1.5 }}>
                        <Button
                          variant="outlined"
                          onClick={handleOpenRateModal("diamond")}
                          sx={{ borderRadius: 1, textTransform: "none" }}
                        >
                          Update Rates
                        </Button>
                      </Box>
                    )}
                  </Paper>
                </motion.div>
              </Grid>
            </Grid>

            {/* Rate history table */}
            <Typography variant="h6" sx={{ color: theme.palette.text.primary, mb: 1.5, fontWeight: "bold" }}>
              Last 7 Days Rates
            </Typography>
            <TableContainer component={Paper} sx={{ borderRadius: 1, boxShadow: theme.shadows[4], mb: 2, overflowX: "auto" }}>
              <Table sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow
                    sx={{
                      bgcolor: theme.palette.background.paper,
                      "& th": { fontWeight: "bold", borderBottom: `2px solid ${theme.palette.secondary.main}` },
                    }}
                  >
                    <TableCell>Date</TableCell>
                    <TableCell>Gold 24K (₹/gm)</TableCell>
                    <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>Gold 22K (₹/gm)</TableCell>
                    <TableCell>Silver (₹/g)</TableCell>
                    <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>Diamond 1 Carat (₹/pc)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedHistoricalRates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} sx={{ textAlign: "center" }}>
                        No rates available for the last 7 days
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedHistoricalRates.map((rate, index) => (
                      <TableRow key={index} sx={{ "&:hover": { bgcolor: theme.palette.action.hover } }}>
                        <TableCell sx={{ color: theme.palette.text.primary }}>
                          {new Date(rate.date).toLocaleDateString("en-CA")}
                        </TableCell>
                        <TableCell sx={{ color: theme.palette.text.primary }}>
                          {rate.rate.gold?.["24K"] || "N/A"}
                        </TableCell>
                        <TableCell sx={{ color: theme.palette.text.primary, display: { xs: "none", sm: "table-cell" } }}>
                          {rate.rate.gold?.["22K"] || "N/A"}
                        </TableCell>
                        <TableCell sx={{ color: theme.palette.text.primary }}>
                          {rate.rate.silver || "N/A"}
                        </TableCell>
                        <TableCell sx={{ color: theme.palette.text.primary, display: { xs: "none", md: "table-cell" } }}>
                          {rate.rate.daimond?.["1 Carat"] || "N/A"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            {historicalRates.length > 0 && (
              <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 2, flexDirection: { xs: "column", sm: "row" } }}>
                <Typography sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>
                  Total Records: {historicalRates.length}
                </Typography>
                <Pagination
                  count={Math.ceil(historicalRates.length / RATE_ITEMS_PER_PAGE)}
                  page={ratePage}
                  onChange={(e, value) => setRatePage(value)}
                />
              </Box>
            )}
          </Box>

          {/* Charts Section */}
          <Grid
            container
            spacing={theme.spacing(2)}
            sx={{
              width: "100%",
              mt: { xs: theme.spacing(2), sm: theme.spacing(4) },
              px: { xs: theme.spacing(1), sm: theme.spacing(2) },
            }}
          >
            {/* Monthly Sales Chart (Bar Chart) */}
            <Grid item xs={12} md={6}>
              <Paper
                sx={{
                  p: theme.spacing(2),
                  borderRadius: theme.shape.borderRadius * 2,
                  boxShadow: theme.shadows[4],
                  height: 400,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    mb: theme.spacing(2),
                    textAlign: "center",
                    color: theme.palette.text.primary,
                  }}
                >
                  Monthly Sales Revenue
                </Typography>
                <ResponsiveContainer width="100%" height="80%">
                  <BarChart
                    data={monthlySalesData.map((d) => ({
                      ...d,
                      name: `${d.month} ${d.year}`,
                    }))}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={theme.palette.divider}
                    />
                    <XAxis
                      dataKey="name"
                      stroke={theme.palette.text.secondary}
                    />
                    <YAxis stroke={theme.palette.text.secondary} />
                    <Tooltip
                      formatter={(value) => `₹${value.toLocaleString()}`}
                      labelFormatter={(label) => `Month: ${label}`}
                      contentStyle={{
                        backgroundColor: theme.palette.background.paper,
                        borderColor: theme.palette.divider,
                        borderRadius: theme.shape.borderRadius,
                      }}
                      itemStyle={{ color: theme.palette.text.primary }}
                      labelStyle={{ color: theme.palette.text.secondary }}
                    />
                    <Legend />
                    <Bar
                      dataKey="totalRevenue"
                      name="Total Revenue"
                      fill={theme.palette.primary.main}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            {/* Comparison Chart for Totals (Bar Chart) */}
            <Grid item xs={12} md={6}>
              <Paper
                sx={{
                  p: theme.spacing(2),
                  borderRadius: theme.shape.borderRadius * 2,
                  boxShadow: theme.shadows[4],
                  height: 400,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    mb: theme.spacing(2),
                    textAlign: "center",
                    color: theme.palette.text.primary,
                  }}
                >
                  Overall Metrics Comparison
                </Typography>
                <ResponsiveContainer width="100%" height="80%">
                  <BarChart
                    data={summaryComparisonData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={theme.palette.divider}
                    />
                    <XAxis
                      dataKey="name"
                      stroke={theme.palette.text.secondary}
                    />
                    <YAxis
                      stroke={theme.palette.text.secondary}
                      formatter={(value) => `₹${value.toLocaleString()}`}
                    />
                    <Tooltip
                      formatter={(value, name) => [
                        `₹${value.toLocaleString()}`,
                        name,
                      ]}
                      contentStyle={{
                        backgroundColor: theme.palette.background.paper,
                        borderColor: theme.palette.divider,
                        borderRadius: theme.shape.borderRadius,
                      }}
                      itemStyle={{ color: theme.palette.text.primary }}
                      labelStyle={{ color: theme.palette.text.secondary }}
                    />
                    <Legend />
                    <Bar
                      dataKey="value"
                      name="Amount/Count"
                      fill={theme.palette.secondary.main}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            {/* Historical Rates Chart (Line Chart) */}
            <Grid item xs={12} md={12}>
              <Paper
                sx={{
                  p: theme.spacing(2),
                  borderRadius: theme.shape.borderRadius * 2,
                  boxShadow: theme.shadows[4],
                  height: 400,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    mb: theme.spacing(2),
                    textAlign: "center",
                    color: theme.palette.text.primary,
                  }}
                >
                  Last 5 Months Rates Trend
                </Typography>
                <ResponsiveContainer width="100%" height="80%">
                  <LineChart
                    data={historicalRatesData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={theme.palette.divider}
                    />
                    <XAxis
                      dataKey="date"
                      stroke={theme.palette.text.secondary}
                    />
                    <YAxis
                      stroke={theme.palette.text.secondary}
                      formatter={(value) => `₹${value.toLocaleString()}`}
                    />
                    <Tooltip
                      formatter={(value) => `₹${value.toLocaleString()}`}
                      contentStyle={{
                        backgroundColor: theme.palette.background.paper,
                        borderColor: theme.palette.divider,
                        borderRadius: theme.shape.borderRadius,
                      }}
                      itemStyle={{ color: theme.palette.text.primary }}
                      labelStyle={{ color: theme.palette.text.secondary }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="gold"
                      stroke={theme.palette.primary.main}
                      name="Gold (24K)"
                    />
                    <Line
                      type="monotone"
                      dataKey="silver"
                      stroke={theme.palette.secondary.main}
                      name="Silver"
                    />
                    <Line
                      type="monotone"
                      dataKey="diamond"
                      stroke={theme.palette.error.main}
                      name="Diamond (1 Carat)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          </Grid>
        </>
      )}

      {/* Gold Modal */}
      <Dialog
        open={openGoldModal}
        onClose={handleCloseGoldModal}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { width: { xs: "95%", sm: 500 }, maxHeight: "90vh", overflowY: "auto", borderRadius: 1 } }}
      >
        <DialogTitle
          sx={{
            bgcolor: theme.palette.primary.main,
            color: theme.palette.getContrastText(theme.palette.primary.main),
            position: "relative",
          }}
        >
          Update Gold Rates
          <IconButton
            onClick={handleCloseGoldModal}
            sx={{ position: "absolute", top: 8, right: 8, color: theme.palette.getContrastText(theme.palette.primary.main) }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            label="Date"
            type="date"
            fullWidth
            margin="dense"
            value={newRates.date}
            onChange={handleNewRateChange("date")}
            error={!!rateFormErrors.date}
            helperText={rateFormErrors.date}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />
          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
            Gold Rate (₹/gm)
          </Typography>
          <TextField
            label="24K Rate"
            type="number"
            fullWidth
            margin="dense"
            value={newRates.gold["24K"]}
            onChange={handleNewRateChange("gold", "24K")}
            error={!!rateFormErrors["24K"]}
            helperText={rateFormErrors["24K"] || "23K/22K/20K/18K are calculated automatically"}
            inputProps={{ min: 0 }}
            sx={{ mb: 2 }}
          />
          {parseFloat(newRates.gold["24K"]) > 0 && (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 1 }}>
              {Object.entries(GOLD_PURITY_FACTORS)
                .filter(([purity]) => purity !== "24K")
                .map(([purity, factor]) => (
                  <Chip
                    key={purity}
                    label={`${purity}: ₹${(
                      Math.round(parseFloat(newRates.gold["24K"]) * factor * 100) / 100
                    ).toLocaleString("en-IN")}`}
                    size="small"
                  />
                ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ flexDirection: { xs: "column", sm: "row" }, gap: 1, px: 2, pb: 2 }}>
          <Button onClick={handleCloseGoldModal} sx={{ width: { xs: "100%", sm: "auto" }, textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            onClick={() => handleSaveRates("gold")}
            variant="contained"
            disabled={rateActionLoading}
            sx={{ width: { xs: "100%", sm: "auto" }, textTransform: "none" }}
          >
            Save Gold Rates
          </Button>
        </DialogActions>
      </Dialog>

      {/* Silver Modal */}
      <Dialog
        open={openSilverModal}
        onClose={handleCloseSilverModal}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { width: { xs: "95%", sm: 500 }, maxHeight: "90vh", overflowY: "auto", borderRadius: 1 } }}
      >
        <DialogTitle
          sx={{
            bgcolor: theme.palette.primary.main,
            color: theme.palette.getContrastText(theme.palette.primary.main),
            position: "relative",
          }}
        >
          Update Silver Rate
          <IconButton
            onClick={handleCloseSilverModal}
            sx={{ position: "absolute", top: 8, right: 8, color: theme.palette.getContrastText(theme.palette.primary.main) }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            label="Date"
            type="date"
            fullWidth
            margin="dense"
            value={newRates.date}
            onChange={handleNewRateChange("date")}
            error={!!rateFormErrors.date}
            helperText={rateFormErrors.date}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />
          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
            Silver Rate (₹/g)
          </Typography>
          <TextField
            label="Silver Rate"
            type="number"
            fullWidth
            margin="dense"
            value={newRates.silver}
            onChange={handleNewRateChange("silver")}
            error={!!rateFormErrors.silver}
            helperText={rateFormErrors.silver}
            inputProps={{ min: 0 }}
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions sx={{ flexDirection: { xs: "column", sm: "row" }, gap: 1, px: 2, pb: 2 }}>
          <Button onClick={handleCloseSilverModal} sx={{ width: { xs: "100%", sm: "auto" }, textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            onClick={() => handleSaveRates("silver")}
            variant="contained"
            disabled={rateActionLoading}
            sx={{ width: { xs: "100%", sm: "auto" }, textTransform: "none" }}
          >
            Save Silver Rate
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diamond Modal */}
      <Dialog
        open={openDiamondModal}
        onClose={handleCloseDiamondModal}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { width: { xs: "95%", sm: 500 }, maxHeight: "90vh", overflowY: "auto", borderRadius: 1 } }}
      >
        <DialogTitle
          sx={{
            bgcolor: theme.palette.primary.main,
            color: theme.palette.getContrastText(theme.palette.primary.main),
            position: "relative",
          }}
        >
          Update Diamond Rates
          <IconButton
            onClick={handleCloseDiamondModal}
            sx={{ position: "absolute", top: 8, right: 8, color: theme.palette.getContrastText(theme.palette.primary.main) }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            label="Date"
            type="date"
            fullWidth
            margin="dense"
            value={newRates.date}
            onChange={handleNewRateChange("date")}
            error={!!rateFormErrors.date}
            helperText={rateFormErrors.date}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />
          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
            Diamond Rates (₹/pc)
          </Typography>
          {["0.5 Carat", "1 Carat", "1.5 Carat", "2 Carat", "2.5 Carat", "3 Carat"].map((type) => (
            <TextField
              key={type}
              label={`${type} Rate`}
              type="number"
              fullWidth
              margin="dense"
              value={newRates.diamond[type]}
              onChange={handleNewRateChange("diamond", type)}
              error={!!rateFormErrors[type]}
              helperText={rateFormErrors[type]}
              inputProps={{ min: 0 }}
              sx={{ mb: 2 }}
            />
          ))}
        </DialogContent>
        <DialogActions sx={{ flexDirection: { xs: "column", sm: "row" }, gap: 1, px: 2, pb: 2 }}>
          <Button onClick={handleCloseDiamondModal} sx={{ width: { xs: "100%", sm: "auto" }, textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            onClick={() => handleSaveRates("diamond")}
            variant="contained"
            disabled={rateActionLoading}
            sx={{ width: { xs: "100%", sm: "auto" }, textTransform: "none" }}
          >
            Save Diamond Rates
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rate Success/Error Dialog */}
      <Dialog
        open={rateDialogOpen}
        onClose={handleRateDialogClose}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { width: { xs: "95%", sm: 400 }, borderRadius: 1 } }}
      >
        <DialogTitle sx={{ color: rateDialogType === "success" ? "green" : "red", position: "relative" }}>
          {rateDialogType === "success" ? "Success" : "Error"}
          <IconButton onClick={handleRateDialogClose} sx={{ position: "absolute", top: 8, right: 8 }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>{rateDialogMessage}</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ flexDirection: { xs: "column", sm: "row" }, gap: 1, px: 2, pb: 2 }}>
          <Button onClick={handleRateDialogClose} color="primary" sx={{ width: { xs: "100%", sm: "auto" }, textTransform: "none" }}>
            OK
          </Button>
          {rateDialogType === "error" && lastRateUpdateAction && (
            <Button onClick={handleRateRetry} color="secondary" sx={{ width: { xs: "100%", sm: "auto" }, textTransform: "none" }}>
              Retry
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Dashboard;
