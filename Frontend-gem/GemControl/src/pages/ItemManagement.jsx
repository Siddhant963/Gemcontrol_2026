import {
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputBase,
  IconButton,
  Button,
  Select,
  MenuItem,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  Tabs,
  Tab,
  Menu,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { motion } from "framer-motion";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  Add,
  Delete,
  Print as PrintIcon,
  Close,
} from "@mui/icons-material";
import { OptimizedImage } from "../utils/imageUtils";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setError as setAuthError } from "../redux/authSlice";
import { ROUTES } from "../utils/routes";
import api, { BASE_URL } from "../utils/api";
import JsBarcode from "jsbarcode";
import NotificationModal from "../components/NotificationModal";

const GOLD_KARATS = ["24K", "23K", "22K", "20K", "18K"];
const DIAMOND_CARATS = ["0.5 Carat", "1 Carat", "1.5 Carat", "2 Carat", "2.5 Carat", "3 Carat"];

// Suggests a unit price from today's rate: gold/silver are priced per gram (rate x weight),
// diamond rates are a flat per-piece price at that carat rating (not multiplied by weight).
function computeSuggestedPrice(materialgitType, karat, waight, latestRate) {
  if (!latestRate) return null;
  const weightNum = parseFloat(waight);
  if (materialgitType === "silver") {
    const rate = parseFloat(latestRate.silver);
    if (!rate || !weightNum || weightNum <= 0) return null;
    return Math.round(rate * weightNum * 100) / 100;
  }
  if (materialgitType === "gold") {
    if (!karat) return null;
    const rate = parseFloat(latestRate.gold?.[karat]);
    if (!rate || !weightNum || weightNum <= 0) return null;
    return Math.round(rate * weightNum * 100) / 100;
  }
  if (materialgitType === "diamond") {
    if (!karat) return null;
    const rate = parseFloat(latestRate.daimond?.[karat.replace(".", "_")]);
    if (!rate) return null;
    return rate;
  }
  return null;
}

function ItemManagement() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user: currentUser } = useSelector((state) => state.auth);
  const isAdmin = currentUser?.role?.toLowerCase() === "admin";
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [metalFilter, setMetalFilter] = useState("all");
  const [columnFilters, setColumnFilters] = useState({
    stockcode: "",
    name: "",
    karat: "",
    priceMin: "",
    priceMax: "",
  });
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [bulkImportFile, setBulkImportFile] = useState(null);
  const [bulkImporting, setBulkImporting] = useState(false);
  const [bulkImportResult, setBulkImportResult] = useState(null);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [stocks, setStocks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [firms, setFirms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [newItem, setNewItem] = useState({
    name: "",
    materialgitType: "gold", // Fixed typo
    waight: "", // Fixed typo — this is the Gross Weight
    lessWeight: "",
    karat: "",
    category: "",
    firm: "",
    quantity: "",
    price: "",
    stockType: "retail",
    hsnCode: "",
    wastageSupplier: "",
    wastageCustomer: "",
    makingCharge: "",
    makingChargeUnit: "fixed",
    labourChargeValue: "",
    labourChargeUnit: "fixed",
    stoneCharge: "",
    stockImg: null,
  });
  const [priceTouched, setPriceTouched] = useState(false);
  const [latestRate, setLatestRate] = useState(null);

  const [openEditModal, setOpenEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editItem, setEditItem] = useState({
    name: "",
    materialgitType: "gold",
    waight: "",
    lessWeight: "",
    karat: "",
    category: "",
    firm: "",
    quantity: "",
    price: "",
    stockType: "retail",
    hsnCode: "",
    wastageSupplier: "",
    wastageCustomer: "",
    makingCharge: "",
    makingChargeUnit: "fixed",
    labourChargeValue: "",
    labourChargeUnit: "fixed",
    stoneCharge: "",
    stockImg: null,
  });
  const [editPriceTouched, setEditPriceTouched] = useState(true);

  const [notificationDialog, setNotificationDialog] = useState({
    open: false,
    message: "",
    type: "info",
    title: "",
  });

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  const tableVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.5, delay: 0.3, ease: "easeOut" },
    },
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [stockResponse, categoryResponse, firmResponse, rateResponse] =
        await Promise.all([
          api.get("/getAllStocks"),
          api.get("/getAllStockCategories"),
          api.get("/getAllFirms"),
          api.get("/getAllDailrates"),
        ]);
      setStocks(Array.isArray(stockResponse.data) ? stockResponse.data : []);
      setCategories(
        Array.isArray(categoryResponse.data) ? categoryResponse.data : []
      );
      setFirms(Array.isArray(firmResponse.data) ? firmResponse.data : []);
      const allRates = Array.isArray(rateResponse.data) ? rateResponse.data : [];
      const sortedRates = allRates.sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );
      setLatestRate(sortedRates.length > 0 ? sortedRates[0].rate : null);
      setError(null);
    } catch (err) {
      console.error("FetchData error:", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      const errorMessage =
        err.response?.status === 401
          ? "Please log in to view items."
          : err.response?.data?.message || "Failed to load data.";
      setError(errorMessage);
      if (err.response?.status === 401) {
        dispatch(setAuthError(errorMessage));
        navigate(ROUTES.LOGIN);
      }
    } finally {
      setLoading(false);
    }
  }, [dispatch, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const validateForm = useCallback(() => {
    const errors = {};
    if (!newItem.name.trim()) errors.name = "Item name is required";
    if (!newItem.materialgitType)
      errors.materialgitType = "Material type is required"; // Fixed typo
    if (!newItem.waight || isNaN(newItem.waight) || newItem.waight <= 0)
      errors.waight = "Valid waight is required"; // Fixed typo
    if (
      (newItem.materialgitType === "gold" || newItem.materialgitType === "diamond") &&
      !newItem.karat
    )
      errors.karat = "Karat is required for gold and diamond items";
    if (!newItem.category) errors.category = "Category is required";
    if (!newItem.firm) errors.firm = "Firm is required";
    if (!newItem.quantity || isNaN(newItem.quantity) || newItem.quantity <= 0)
      errors.quantity = "Valid quantity is required";
    if (!newItem.price || isNaN(newItem.price) || newItem.price <= 0)
      errors.price = "Valid price is required";
    if (
      !newItem.makingCharge ||
      isNaN(newItem.makingCharge) ||
      newItem.makingCharge < 0
    )
      errors.makingCharge = "Valid making charge is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [newItem]);

  const generateStockCode = useCallback(() => {
    return `STOCK-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  }, []);

  const handleAddItem = useCallback(() => {
    if (!currentUser) {
      setError("Please log in to add items.");
      dispatch(setAuthError("Please log in to add items."));
      navigate(ROUTES.LOGIN);
      return;
    }
    setNewItem({
      name: "",
      materialgitType: "gold", // Fixed typo
      waight: "", // Fixed typo — this is the Gross Weight
      lessWeight: "",
      karat: "",
      category: "",
      firm: "",
      quantity: "",
      price: "",
      stockType: "retail",
      hsnCode: "",
      wastageSupplier: "",
      wastageCustomer: "",
      makingCharge: "",
      makingChargeUnit: "fixed",
      labourChargeValue: "",
      labourChargeUnit: "fixed",
      stoneCharge: "",
      stockImg: null,
    });
    setPriceTouched(false);
    setFormErrors({});
    setOpenAddModal(true);
  }, [currentUser, dispatch, navigate]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    if (name === "price") setPriceTouched(true);
    setNewItem((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "materialgitType" && value === "silver") updated.karat = "";
      return updated;
    });
    setFormErrors((prev) => ({ ...prev, [name]: null, submit: null }));
  }, []);

  // Net weight is what the customer actually pays metal-rate on — gross
  // weight minus any artificial stone / moti weight.
  const newItemNetWeight =
    (parseFloat(newItem.waight) || 0) - (parseFloat(newItem.lessWeight) || 0);

  // Auto-suggest the price from today's rate whenever material/karat/weight change,
  // as long as the user hasn't manually edited the price field themselves.
  useEffect(() => {
    if (priceTouched) return;
    const suggested = computeSuggestedPrice(
      newItem.materialgitType,
      newItem.karat,
      newItemNetWeight,
      latestRate
    );
    if (suggested != null) {
      setNewItem((prev) => ({ ...prev, price: String(suggested) }));
    }
  }, [newItem.materialgitType, newItem.karat, newItemNetWeight, latestRate, priceTouched]);

  const handleFileChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      setNewItem((prev) => ({ ...prev, stockImg: file }));
      setFormErrors((prev) => ({ ...prev, stockImg: null, submit: null }));
    }
  }, []);

  const handleSaveItem = useCallback(async () => {
    if (!validateForm()) {
      setFormErrors((prev) => ({
        ...prev,
        submit: "Please fill in all required fields.",
      }));
      return;
    }

    try {
      setLoading(true);
      const stockcode = generateStockCode();
      const formData = new FormData();
      formData.append("name", newItem.name);
      formData.append("materialgitType", newItem.materialgitType); // Fixed typo
      formData.append("waight", newItem.waight); // Fixed typo — legacy, treated as gross weight fallback
      formData.append("grossWeight", newItem.waight);
      formData.append("lessWeight", newItem.lessWeight || "0");
      formData.append("karat", newItem.materialgitType === "silver" ? "" : newItem.karat);
      formData.append("category", newItem.category);
      formData.append("firm", newItem.firm);
      formData.append("quantity", newItem.quantity);
      formData.append("price", newItem.price);
      formData.append("stockType", newItem.stockType || "retail");
      formData.append("hsnCode", newItem.hsnCode || "");
      formData.append("wastageSupplier", newItem.wastageSupplier || "0");
      formData.append("wastageCustomer", newItem.wastageCustomer || "0");
      formData.append("makingChargeValue", newItem.makingCharge || "0");
      formData.append("makingChargeUnit", newItem.makingChargeUnit || "fixed");
      formData.append("labourChargeValue", newItem.labourChargeValue || "0");
      formData.append("labourChargeUnit", newItem.labourChargeUnit || "fixed");
      formData.append("stoneCharge", newItem.stoneCharge || "0");
      formData.append("stockcode", stockcode);
      if (newItem.stockImg) formData.append("stock", newItem.stockImg);

      const response = await api.post("/Addstock", formData);
      setStocks((prev) => [...prev, response.data.stock]);
      setOpenAddModal(false);
      setNewItem({
        name: "",
        materialgitType: "gold", // Fixed typo
        waight: "", // Fixed typo
        lessWeight: "",
        category: "",
        firm: "",
        quantity: "",
        price: "",
        stockType: "retail",
        hsnCode: "",
        wastageSupplier: "",
        wastageCustomer: "",
        makingCharge: "",
        makingChargeUnit: "fixed",
        labourChargeValue: "",
        labourChargeUnit: "fixed",
        stoneCharge: "",
        stockImg: null,
      });
      setFormErrors({});
      setError(null);
      setNotificationDialog({
        open: true,
        message: "Item added successfully!",
        type: "success",
        title: "Success",
      });
    } catch (err) {
      console.error("AddStock error:", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      const errorMessage =
        err.response?.status === 401
          ? "Please log in to add items."
          : err.response?.status === 403
          ? "Admin access required to add items."
          : err.response?.data?.message || "Failed to add item.";
      setFormErrors((prev) => ({ ...prev, submit: errorMessage }));
    } finally {
      setLoading(false);
    }
  }, [newItem, generateStockCode, validateForm]);

  const handleRemoveItem = useCallback(async (stockId) => {
    if (!window.confirm("Are you sure you want to remove this item?")) return;
    try {
      setLoading(true);
      await api.get(`/removeStock?stockId=${stockId}`);
      setStocks((prev) => prev.filter((stock) => stock._id !== stockId));
      setError(null);
      setNotificationDialog({
        open: true,
        message: "Item removed successfully!",
        type: "success",
        title: "Success",
      });
    } catch (err) {
      console.error("RemoveStock error:", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      const errorMessage =
        err.response?.data?.message || "Failed to remove item.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePrintBarcode = useCallback(
    (item) => {
      if (!item.stockcode) {
        setNotificationDialog({
          open: true,
          message: "Stock code not available for this item.",
          type: "error",
          title: "Error",
        });
        return;
      }

      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        setNotificationDialog({
          open: true,
          message:
            "Failed to open print window. Please allow pop-ups for this site.",
          type: "error",
          title: "Error",
        });
        return;
      }

      printWindow.document.write(`
      <html>
        <head>
          <title>Print Barcode</title>
          <style>
            @page { size: auto; margin: 0mm; }
            body { margin: 0; padding: 10mm; font-family: sans-serif; text-align: center; }
            .barcode-container { display: inline-block; padding: 5mm; border: 1px solid #ccc; margin: 5mm; }
            .item-info { font-size: 10px; margin-top: 5px; }
            svg { max-width: 100%; height: auto; }
          </style>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
        </head>
        <body>
          <div class="barcode-container">
            <div class="item-info">${item.name || "Item"}</div>
            <div class="item-info">Code: ${item.stockcode}</div>
            <svg id="print-barcode"></svg>
          </div>
        </body>
      </html>
    `);
      printWindow.document.close();

      printWindow.addEventListener("DOMContentLoaded", () => {
        if (typeof printWindow.JsBarcode === "undefined") {
          console.error("JsBarcode library not loaded in print window");
          setNotificationDialog({
            open: true,
            message: "Barcode library failed to load.",
            type: "error",
            title: "Error",
          });
          printWindow.close();
          return;
        }

        const svgElement = printWindow.document.getElementById("print-barcode");
        if (svgElement) {
          try {
            printWindow.JsBarcode(svgElement, item.stockcode, {
              format: "CODE128",
              width: 2,
              height: 80,
              displayValue: true,
              fontSize: 14,
              margin: 10,
              background: "#FFFFFF",
              lineColor: "#000000",
            });

            setTimeout(() => {
              try {
                printWindow.print();
                printWindow.close();
              } catch (printError) {
                console.error("Print error:", printError);
                setNotificationDialog({
                  open: true,
                  message: "Failed to trigger print dialog.",
                  type: "error",
                  title: "Error",
                });
                printWindow.close();
              }
            }, 1000); // Increased delay to ensure rendering
          } catch (error) {
            console.error("Barcode generation error:", {
              message: error.message,
              stack: error.stack,
              stockcode: item.stockcode,
            });
            setNotificationDialog({
              open: true,
              message: "Failed to generate barcode for printing.",
              type: "error",
              title: "Error",
            });
            printWindow.close();
          }
        } else {
          console.error("SVG element not found in print window");
          setNotificationDialog({
            open: true,
            message: "Error preparing print window: SVG element not found.",
            type: "error",
            title: "Error",
          });
          printWindow.close();
        }
      });
    },
    [setNotificationDialog]
  );

  const handleSearch = useCallback((e) => setSearchQuery(e.target.value), []);
  const handleCategoryChange = useCallback(
    (e) => setCategoryFilter(e.target.value),
    []
  );
  const handleMetalChange = useCallback(
    (e) => setMetalFilter(e.target.value),
    []
  );

  const handleCancel = useCallback(() => {
    setOpenAddModal(false);
    setNewItem({
      name: "",
      materialgitType: "gold", // Fixed typo
      waight: "", // Fixed typo
      lessWeight: "",
      karat: "",
      category: "",
      firm: "",
      quantity: "",
      price: "",
      stockType: "retail",
      hsnCode: "",
      wastageSupplier: "",
      wastageCustomer: "",
      makingCharge: "",
      makingChargeUnit: "fixed",
      labourChargeValue: "",
      labourChargeUnit: "fixed",
      stoneCharge: "",
      stockImg: null,
    });
    setPriceTouched(false);
    setFormErrors({});
  }, []);

  const handleEditItem = useCallback((item) => {
    setEditingItem(item);
    setEditItem({
      name: item.name,
      materialgitType: item.materialgitType,
      waight: item.grossWeight || item.waight,
      lessWeight: item.lessWeight || "",
      karat: item.karat || "",
      category: item.category._id || item.category,
      firm: item.firm._id || item.firm,
      quantity: item.quantity,
      price: item.price,
      stockType: item.stockType || "retail",
      hsnCode: item.hsnCode || "",
      wastageSupplier: item.wastage?.supplier || "",
      wastageCustomer: item.wastage?.customer || "",
      makingCharge: item.makingChargeConfig?.value ?? item.makingCharge,
      makingChargeUnit: item.makingChargeConfig?.unit || "fixed",
      labourChargeValue: item.labourCharge?.value || "",
      labourChargeUnit: item.labourCharge?.unit || "fixed",
      stoneCharge: item.stoneCharge || "",
      stockImg: null,
    });
    setEditPriceTouched(true);
    setFormErrors({});
    setOpenEditModal(true);
  }, []);

  const handleEditInputChange = useCallback((e) => {
    const { name, value } = e.target;
    if (name === "price") setEditPriceTouched(true);
    setEditItem((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "materialgitType" && value === "silver") updated.karat = "";
      return updated;
    });
    if (name === "karat" || name === "waight" || name === "lessWeight" || name === "materialgitType") {
      setEditPriceTouched(false);
    }
    setFormErrors((prev) => ({ ...prev, [name]: null, submit: null }));
  }, []);

  // Net weight is what the customer actually pays metal-rate on.
  const editItemNetWeight =
    (parseFloat(editItem.waight) || 0) - (parseFloat(editItem.lessWeight) || 0);

  // Same auto-suggest behavior as the Add form, but only once the user has actively
  // changed karat/weight/material type in this edit session (not on initial dialog open,
  // so an existing item's real price isn't silently overwritten just by opening Edit).
  useEffect(() => {
    if (editPriceTouched) return;
    const suggested = computeSuggestedPrice(
      editItem.materialgitType,
      editItem.karat,
      editItemNetWeight,
      latestRate
    );
    if (suggested != null) {
      setEditItem((prev) => ({ ...prev, price: String(suggested) }));
    }
  }, [editItem.materialgitType, editItem.karat, editItemNetWeight, latestRate, editPriceTouched]);

  const handleEditFileChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      setEditItem((prev) => ({ ...prev, stockImg: file }));
      setFormErrors((prev) => ({ ...prev, stockImg: null, submit: null }));
    }
  }, []);

  const validateEditForm = useCallback(() => {
    const errors = {};
    if (!editItem.name.trim()) errors.name = "Item name is required";
    if (!editItem.materialgitType)
      errors.materialgitType = "Material type is required";
    if (!editItem.waight || isNaN(editItem.waight) || editItem.waight <= 0)
      errors.waight = "Valid weight is required";
    if (
      (editItem.materialgitType === "gold" || editItem.materialgitType === "diamond") &&
      !editItem.karat
    )
      errors.karat = "Karat is required for gold and diamond items";
    if (!editItem.category) errors.category = "Category is required";
    if (!editItem.firm) errors.firm = "Firm is required";
    if (
      !editItem.quantity ||
      isNaN(editItem.quantity) ||
      editItem.quantity <= 0
    )
      errors.quantity = "Valid quantity is required";
    if (!editItem.price || isNaN(editItem.price) || editItem.price <= 0)
      errors.price = "Valid price is required";
    if (
      !editItem.makingCharge ||
      isNaN(editItem.makingCharge) ||
      editItem.makingCharge < 0
    )
      errors.makingCharge = "Valid making charge is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [editItem]);

  const handleUpdateItem = useCallback(async () => {
    if (!validateEditForm()) {
      setFormErrors((prev) => ({
        ...prev,
        submit: "Please fill in all required fields.",
      }));
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("name", editItem.name);
      formData.append("materialgitType", editItem.materialgitType);
      formData.append("waight", String(editItem.waight));
      formData.append("grossWeight", String(editItem.waight));
      formData.append("lessWeight", String(editItem.lessWeight || "0"));
      formData.append("karat", editItem.materialgitType === "silver" ? "" : editItem.karat || "");
      formData.append("category", editItem.category);
      formData.append("firm", editItem.firm);
      formData.append("quantity", String(editItem.quantity));
      formData.append("price", String(editItem.price));
      formData.append("stockType", editItem.stockType || "retail");
      formData.append("hsnCode", editItem.hsnCode || "");
      formData.append("wastageSupplier", String(editItem.wastageSupplier || "0"));
      formData.append("wastageCustomer", String(editItem.wastageCustomer || "0"));
      formData.append("makingChargeValue", String(editItem.makingCharge || "0"));
      formData.append("makingChargeUnit", editItem.makingChargeUnit || "fixed");
      formData.append("labourChargeValue", String(editItem.labourChargeValue || "0"));
      formData.append("labourChargeUnit", editItem.labourChargeUnit || "fixed");
      formData.append("stoneCharge", String(editItem.stoneCharge || "0"));
      if (editItem.stockImg) formData.append("stock", editItem.stockImg);

      const response = await api.put(
        `/updateStock/${editingItem._id}`,
        formData
      );

      setStocks((prev) =>
        prev.map((stock) =>
          stock._id === editingItem._id ? response.data.stock : stock
        )
      );
      setOpenEditModal(false);
      setEditingItem(null);
      setEditItem({
        name: "",
        materialgitType: "gold",
        waight: "",
        lessWeight: "",
        karat: "",
        category: "",
        firm: "",
        quantity: "",
        price: "",
        stockType: "retail",
        hsnCode: "",
        wastageSupplier: "",
        wastageCustomer: "",
        makingCharge: "",
        makingChargeUnit: "fixed",
        labourChargeValue: "",
        labourChargeUnit: "fixed",
        stoneCharge: "",
        stockImg: null,
      });
      setEditPriceTouched(true);
      setFormErrors({});
      setError(null);
      setNotificationDialog({
        open: true,
        message: "Item updated successfully!",
        type: "success",
        title: "Success",
      });
    } catch (err) {
      console.error("UpdateStock error:", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      const errorMessage =
        err.response?.status === 401
          ? "Please log in to update items."
          : err.response?.status === 403
          ? "Admin access required to update items."
          : err.response?.data?.message || "Failed to update item.";
      setFormErrors((prev) => ({ ...prev, submit: errorMessage }));
    } finally {
      setLoading(false);
    }
  }, [editItem, editingItem, validateEditForm]);

  const handleEditCancel = useCallback(() => {
    setOpenEditModal(false);
    setEditingItem(null);
    setEditItem({
      name: "",
      materialgitType: "gold",
      waight: "",
      lessWeight: "",
      karat: "",
      category: "",
      firm: "",
      quantity: "",
      price: "",
      stockType: "retail",
      hsnCode: "",
      wastageSupplier: "",
      wastageCustomer: "",
      makingCharge: "",
      makingChargeUnit: "fixed",
      labourChargeValue: "",
      labourChargeUnit: "fixed",
      stoneCharge: "",
      stockImg: null,
    });
    setEditPriceTouched(true);
    setFormErrors({});
  }, []);

  const handleNotificationClose = useCallback(() => {
    setNotificationDialog({
      open: false,
      message: "",
      type: "info",
      title: "",
    });
  }, []);

  const filteredItems = useMemo(
    () =>
      stocks.filter((item) => {
        const matchesGlobalSearch =
          (item.category.name || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          (item.materialgitType || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          (item.stockcode || "").toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory =
          categoryFilter === "all" || item.category?.name === categoryFilter;
        const matchesMetal = metalFilter === "all" || item.materialgitType === metalFilter; // Fixed typo
        const matchesStockcode = (item.stockcode || "")
          .toLowerCase()
          .includes(columnFilters.stockcode.toLowerCase());
        const matchesName = (item.name || "")
          .toLowerCase()
          .includes(columnFilters.name.toLowerCase());
        const matchesKarat = (item.karat || "")
          .toLowerCase()
          .includes(columnFilters.karat.toLowerCase());
        const price = Number(item.price) || 0;
        const matchesPriceMin =
          columnFilters.priceMin === "" || price >= Number(columnFilters.priceMin);
        const matchesPriceMax =
          columnFilters.priceMax === "" || price <= Number(columnFilters.priceMax);
        return (
          matchesGlobalSearch &&
          matchesCategory &&
          matchesMetal &&
          matchesStockcode &&
          matchesName &&
          matchesKarat &&
          matchesPriceMin &&
          matchesPriceMax
        );
      }),
    [stocks, searchQuery, categoryFilter, metalFilter, columnFilters]
  );

  const handleColumnFilterChange = useCallback((field) => (e) => {
    setColumnFilters((prev) => ({ ...prev, [field]: e.target.value }));
  }, []);

  // ---- Export (Excel/CSV/PDF/Word) ----
  // Excel/Word are generated as an HTML table saved with the matching MIME
  // type + extension — both applications open HTML tables natively, so this
  // avoids pulling in a heavy client-side spreadsheet/docx library just for
  // a flat export.
  const EXPORT_COLUMNS = [
    { key: "stockcode", label: "Stock Code" },
    { key: "name", label: "Name" },
    { key: "materialgitType", label: "Material" },
    { key: "karat", label: "Karat" },
    { key: "categoryName", label: "Category" },
    { key: "grossWeight", label: "Gross Wt (g)" },
    { key: "lessWeight", label: "Less Wt (g)" },
    { key: "netWeight", label: "Net Wt (g)" },
    { key: "quantity", label: "Quantity" },
    { key: "price", label: "Price" },
    { key: "makingCharge", label: "Making Charge" },
    { key: "totalValue", label: "Total Value" },
    { key: "hsnCode", label: "HSN Code" },
  ];

  const buildExportRows = useCallback(
    () =>
      filteredItems.map((item) => ({
        stockcode: item.stockcode || "",
        name: item.name || "",
        materialgitType: item.materialgitType || "",
        karat: item.karat || "",
        categoryName: item.category?.name || "",
        grossWeight: item.grossWeight || item.waight || 0,
        lessWeight: item.lessWeight || 0,
        netWeight: item.netWeight || item.waight || 0,
        quantity: item.quantity || 0,
        price: item.price || 0,
        makingCharge: item.makingCharge || 0,
        totalValue: item.totalValue || 0,
        hsnCode: item.hsnCode || "",
      })),
    [filteredItems]
  );

  const downloadBlob = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = useCallback(
    (format) => {
      setExportMenuAnchor(null);
      const rows = buildExportRows();
      if (rows.length === 0) return;

      if (format === "csv") {
        const header = EXPORT_COLUMNS.map((c) => `"${c.label}"`).join(",");
        const body = rows
          .map((row) =>
            EXPORT_COLUMNS.map((c) => `"${String(row[c.key]).replace(/"/g, '""')}"`).join(",")
          )
          .join("\n");
        downloadBlob(`${header}\n${body}`, "stock-export.csv", "text/csv;charset=utf-8;");
        return;
      }

      const tableHtml = `
        <table border="1">
          <thead><tr>${EXPORT_COLUMNS.map((c) => `<th>${c.label}</th>`).join("")}</tr></thead>
          <tbody>
            ${rows
              .map(
                (row) =>
                  `<tr>${EXPORT_COLUMNS.map((c) => `<td>${row[c.key]}</td>`).join("")}</tr>`
              )
              .join("")}
          </tbody>
        </table>`;

      if (format === "excel") {
        downloadBlob(
          `<html><head><meta charset="utf-8"></head><body>${tableHtml}</body></html>`,
          "stock-export.xls",
          "application/vnd.ms-excel"
        );
      } else if (format === "word") {
        downloadBlob(
          `<html><head><meta charset="utf-8"></head><body>${tableHtml}</body></html>`,
          "stock-export.doc",
          "application/msword"
        );
      } else if (format === "pdf") {
        const printWindow = window.open("", "_blank");
        if (!printWindow) return;
        printWindow.document.write(`
          <html>
            <head>
              <title>Stock Export</title>
              <style>
                table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; font-size: 12px; }
                th, td { border: 1px solid #999; padding: 4px 6px; text-align: left; }
                th { background: #eee; }
              </style>
            </head>
            <body>${tableHtml}</body>
          </html>
        `);
        printWindow.document.close();
        printWindow.onload = () => {
          printWindow.focus();
          printWindow.print();
        };
      }
    },
    [buildExportRows] // eslint-disable-line react-hooks/exhaustive-deps -- EXPORT_COLUMNS is a static local constant
  );

  // ---- Bulk stock import (wholesale, via Excel) ----
  const handleDownloadTemplate = useCallback(async () => {
    try {
      const response = await api.get("/downloadStockBulkTemplate", {
        responseType: "blob",
      });
      downloadBlob(response.data, "stock-bulk-template.xlsx", response.data.type);
    } catch {
      setNotificationDialog({
        open: true,
        message: "Failed to download the bulk stock template.",
        type: "error",
        title: "Error",
      });
    }
  }, []);

  const handleBulkImportFileChange = useCallback((e) => {
    setBulkImportFile(e.target.files[0] || null);
    setBulkImportResult(null);
  }, []);

  const handleBulkImportSubmit = useCallback(async () => {
    if (!bulkImportFile) return;
    try {
      setBulkImporting(true);
      const formData = new FormData();
      formData.append("file", bulkImportFile);
      const response = await api.post("/bulkImportStock", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setBulkImportResult(response.data);
      await fetchData();
    } catch (err) {
      setBulkImportResult(
        err.response?.data || { message: "Failed to import stock.", errors: [] }
      );
    } finally {
      setBulkImporting(false);
    }
  }, [bulkImportFile, fetchData]);

  const handleCloseBulkImport = useCallback(() => {
    setBulkImportOpen(false);
    setBulkImportFile(null);
    setBulkImportResult(null);
  }, []);
  console.log(stocks, "d");
  return (
    <Box
      sx={{
        maxWidth: "100%",
        margin: "0 auto",
        width: "100%",
        px: { xs: 1, sm: 2, md: 3 },
        py: { xs: 1, sm: 2 },
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
      }}
    >
      {error && (
        <NotificationModal
          isOpen={true}
          onClose={() => setError(null)}
          title="Error"
          message={error}
          type="error"
        />
      )}
      <Box
        sx={{
          flexShrink: 0,
          mb: { xs: 2, sm: 3, md: 4 },
        }}
        component={motion.div}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: { xs: 1, sm: 2 },
            alignItems: { xs: "stretch", sm: "center" },
            justifyContent: "space-between",
          }}
        >
          <Typography
            variant="h4"
            sx={{
              color: theme.palette.text.primary,
              fontWeight: "bold",
              fontSize: { xs: "1.25rem", sm: "1.5rem", md: "2rem" },
              textAlign: { xs: "center", sm: "left" },
              mb: { xs: 1, sm: 0 },
            }}
          >
            Items Management
          </Typography>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: { xs: 1, sm: 2 },
              width: { xs: "100%", sm: "auto" },
              alignItems: { xs: "stretch", sm: "center" },
            }}
          >
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddItem}
              sx={{
                bgcolor: theme.palette.primary.main,
                color: theme.palette.getContrastText(
                  theme.palette.primary.main
                ),
                "&:hover": { bgcolor: theme.palette.primary.dark },
                borderRadius: 1,
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                px: { xs: 1, sm: 2 },
                py: { xs: 0.5, sm: 1 },
                width: { xs: "100%", sm: "auto" },
                textTransform: "none",
              }}
            >
              Add Item
            </Button>
            <Paper
              sx={{
                p: "4px 8px",
                display: "flex",
                alignItems: "center",
                width: { xs: "100%", sm: 200, md: 250 },
                bgcolor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 1,
              }}
            >
              <IconButton sx={{ p: { xs: 0.5, sm: 1 } }}>
                <Search sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }} />
              </IconButton>
              <InputBase
                sx={{
                  ml: 1,
                  flex: 1,
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                }}
                placeholder="Search items..."
                value={searchQuery}
                onChange={handleSearch}
              />
            </Paper>
            <Select
              value={categoryFilter}
              onChange={handleCategoryChange}
              sx={{
                width: { xs: "100%", sm: 150 },
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                borderRadius: 1,
                ".MuiSelect-icon": { fontSize: { xs: "1rem", sm: "1.25rem" } },
              }}
            >
              <MenuItem
                value="all"
                sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
              >
                All Categories
              </MenuItem>
              {categories.map((cat) => (
                <MenuItem
                  key={cat._id}
                  value={cat.name}
                  sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
                >
                  {cat.name}
                </MenuItem>
              ))}
            </Select>
            <Select
              value={metalFilter}
              onChange={handleMetalChange}
              sx={{
                width: { xs: "100%", sm: 150 },
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                borderRadius: 1,
                ".MuiSelect-icon": { fontSize: { xs: "1rem", sm: "1.25rem" } },
              }}
            >
              <MenuItem
                value="all"
                sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
              >
                All Materials
              </MenuItem>
              <MenuItem
                value="gold"
                sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
              >
                Gold
              </MenuItem>
              <MenuItem
                value="silver"
                sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
              >
                Silver
              </MenuItem>
              <MenuItem
                value="platinum"
                sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
              >
                Platinum
              </MenuItem>
              <MenuItem
                value="diamond"
                sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
              >
                Diamond
              </MenuItem>
              <MenuItem
                value="other"
                sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
              >
                Other
              </MenuItem>
            </Select>
          </Box>
        </Box>

        <Tabs
          value={metalFilter}
          onChange={(e, value) => setMetalFilter(value)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mt: { xs: 1, sm: 2 }, borderBottom: 1, borderColor: "divider" }}
        >
          <Tab label="All" value="all" />
          <Tab label="Gold" value="gold" />
          <Tab label="Silver" value="silver" />
          <Tab label="Platinum" value="platinum" />
          <Tab label="Diamond" value="diamond" />
          <Tab label="Other" value="other" />
        </Tabs>

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1,
            mt: { xs: 1, sm: 2 },
            alignItems: "center",
          }}
        >
          <TextField
            size="small"
            label="Search Code"
            value={columnFilters.stockcode}
            onChange={handleColumnFilterChange("stockcode")}
            sx={{ width: 140 }}
          />
          <TextField
            size="small"
            label="Search Name"
            value={columnFilters.name}
            onChange={handleColumnFilterChange("name")}
            sx={{ width: 140 }}
          />
          <TextField
            size="small"
            label="Search Karat"
            value={columnFilters.karat}
            onChange={handleColumnFilterChange("karat")}
            sx={{ width: 120 }}
          />
          <TextField
            size="small"
            label="Min Price"
            type="number"
            value={columnFilters.priceMin}
            onChange={handleColumnFilterChange("priceMin")}
            sx={{ width: 110 }}
          />
          <TextField
            size="small"
            label="Max Price"
            type="number"
            value={columnFilters.priceMax}
            onChange={handleColumnFilterChange("priceMax")}
            sx={{ width: 110 }}
          />
          <Box sx={{ flexGrow: 1 }} />
          <Button
            variant="outlined"
            size="small"
            onClick={handleDownloadTemplate}
            sx={{ textTransform: "none" }}
          >
            Download Bulk Template
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setBulkImportOpen(true)}
            sx={{ textTransform: "none" }}
          >
            Bulk Import (Wholesale)
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={(e) => setExportMenuAnchor(e.currentTarget)}
            sx={{ textTransform: "none" }}
          >
            Export
          </Button>
          <Menu
            anchorEl={exportMenuAnchor}
            open={Boolean(exportMenuAnchor)}
            onClose={() => setExportMenuAnchor(null)}
          >
            <MenuItem onClick={() => handleExport("excel")}>Excel (.xls)</MenuItem>
            <MenuItem onClick={() => handleExport("csv")}>CSV</MenuItem>
            <MenuItem onClick={() => handleExport("pdf")}>PDF (print)</MenuItem>
            <MenuItem onClick={() => handleExport("word")}>Word (.doc)</MenuItem>
          </Menu>
        </Box>
      </Box>

      <Box
        sx={{
          flexGrow: 1,
          overflow: "auto",
        }}
      >
        <motion.div variants={tableVariants} initial="hidden" animate="visible">
          {loading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                py: { xs: 2, sm: 3 },
              }}
            >
              <CircularProgress sx={{ color: theme.palette.primary.main }} />
            </Box>
          ) : filteredItems.length === 0 ? (
            <Typography
              sx={{
                color: theme.palette.text.primary,
                textAlign: "center",
                py: { xs: 2, sm: 3 },
                fontSize: { xs: "0.875rem", sm: "1rem" },
              }}
            >
              No items found.
            </Typography>
          ) : (
            <>
              {/* Mobile Card Layout */}
              <Box sx={{ display: { xs: "block", sm: "none" } }}>
                {filteredItems.map((item) => (
                  <Card
                    key={item._id}
                    sx={{
                      mb: 2,
                      borderRadius: 2,
                      boxShadow: theme.shadows[3],
                      transition: "all 0.3s ease",
                      "&:hover": {
                        boxShadow: theme.shadows[6],
                        transform: "translateY(-4px)",
                      },
                    }}
                  >
                    <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                      <Box
                        sx={{ display: "flex", gap: 2, alignItems: "center" }}
                      >
                        {item.stockImg ? (
                          <Box
                            sx={{
                              width: 60,
                              height: 60,
                              borderRadius: 1,
                              overflow: "hidden",
                              border: `1px solid ${theme.palette.divider}`,
                              flexShrink: 0,
                            }}
                          >
                            <OptimizedImage
                              src={item.stockImg}
                              alt={item.name || "Stock"}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "contain",
                              }}
                            />
                          </Box>
                        ) : (
                          <Box
                            sx={{
                              width: 60,
                              height: 60,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              bgcolor: theme.palette.grey[100],
                              borderRadius: 1,
                              border: `1px solid ${theme.palette.divider}`,
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: "0.7rem",
                                color: theme.palette.text.secondary,
                              }}
                            >
                              No Image
                            </Typography>
                          </Box>
                        )}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            sx={{
                              fontSize: { xs: "0.875rem", sm: "1rem" },
                              fontWeight: "bold",
                              mb: 0.5,
                            }}
                          >
                            {item.name || "N/A"}
                          </Typography>
                          <Typography sx={{ fontSize: "0.75rem", mb: 0.5 }}>
                            <strong>Code:</strong>{" "}
                            <span style={{ fontFamily: "monospace" }}>
                              {item.stockcode || "N/A"}
                            </span>
                          </Typography>
                          <Typography sx={{ fontSize: "0.75rem", mb: 0.5 }}>
                            <strong>Category:</strong>{" "}
                            {item.category?.name || "N/A"}
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: "0.75rem",
                              mb: 0.5,
                              textTransform: "capitalize",
                            }}
                          >
                            <strong>Material:</strong>{" "}
                            {item.materialgitType || "N/A"}
                            {item.karat ? ` (${item.karat})` : ""}
                          </Typography>
                          <Typography sx={{ fontSize: "0.75rem", mb: 0.5 }}>
                            <strong>Firm:</strong> {item.firm?.name || "N/A"}
                          </Typography>
                          <Typography sx={{ fontSize: "0.75rem", mb: 0.5 }}>
                            <strong>Weight:</strong> {item.waight || "N/A"}g
                          </Typography>
                          <Typography sx={{ fontSize: "0.75rem", mb: 0.5 }}>
                            <strong>Making Charge:</strong> ₹
                            {item.makingCharge?.toLocaleString() || "N/A"}
                          </Typography>
                          <Typography sx={{ fontSize: "0.75rem", mb: 0.5 }}>
                            <strong>Stock:</strong> {item.quantity || "N/A"}
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: "0.875rem",
                              fontWeight: 600,
                              color: theme.palette.primary.main,
                            }}
                          >
                            <strong>Total Value:</strong> ₹
                            {item.totalValue?.toLocaleString() || "N/A"}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                    <CardActions
                      sx={{
                        p: 1.5,
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 1,
                      }}
                    >
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleEditItem(item)}
                        sx={{
                          fontSize: "0.75rem",
                          textTransform: "none",
                          borderRadius: 2,
                        }}
                      >
                        Edit
                      </Button>
                      {isAdmin && (
                        <Button
                          variant="outlined"
                          size="small"
                          color="error"
                          startIcon={<Delete fontSize="small" />}
                          onClick={() => handleRemoveItem(item._id)}
                          sx={{
                            fontSize: "0.75rem",
                            textTransform: "none",
                            borderRadius: 2,
                          }}
                        >
                          Remove
                        </Button>
                      )}
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<PrintIcon fontSize="small" />}
                        onClick={() => handlePrintBarcode(item)}
                        disabled={!item.stockcode}
                        sx={{
                          fontSize: "0.75rem",
                          textTransform: "none",
                          borderRadius: 2,
                        }}
                      >
                        Print
                      </Button>
                    </CardActions>
                  </Card>
                ))}
              </Box>

              {/* Desktop Table Layout */}
              <TableContainer
                component={Paper}
                sx={{
                  display: { xs: "none", sm: "block" },
                  width: "100%",
                  overflowX: "auto",
                  borderRadius: 2,
                  boxShadow: theme.shadows[4],
                  "&:hover": { boxShadow: theme.shadows[8] },
                }}
              >
                <Table
                  sx={{
                    minWidth: 650,
                    "& .MuiTableCell-root": {
                      fontSize: { xs: "0.8rem", sm: "0.9rem" },
                    },
                  }}
                >
                  <TableHead>
                    <TableRow
                      sx={{
                        bgcolor: theme.palette.background.paper,
                        "& th": {
                          fontWeight: "bold",
                          borderBottom: `2px solid ${theme.palette.secondary.main}`,
                          px: { xs: 1, sm: 2 },
                          py: 1,
                        },
                      }}
                    >
                      <TableCell sx={{ minWidth: 80 }}>Image</TableCell>
                      <TableCell sx={{ minWidth: 120 }}>Item Name</TableCell>
                      <TableCell
                        sx={{
                          minWidth: 100,
                          display: { xs: "none", md: "table-cell" },
                        }}
                      >
                        Stock Code
                      </TableCell>
                      <TableCell
                        sx={{
                          minWidth: 100,
                          display: { xs: "none", md: "table-cell" },
                        }}
                      >
                        Category
                      </TableCell>
                      <TableCell
                        sx={{
                          minWidth: 100,
                          display: { xs: "none", lg: "table-cell" },
                        }}
                      >
                        Material Type
                      </TableCell>
                      <TableCell
                        sx={{
                          minWidth: 80,
                          display: { xs: "none", lg: "table-cell" },
                        }}
                      >
                        Karat
                      </TableCell>
                      <TableCell
                        sx={{
                          minWidth: 100,
                          display: { xs: "none", md: "table-cell" },
                        }}
                      >
                        Firm
                      </TableCell>
                      <TableCell sx={{ minWidth: 80 }}>Weight (g)</TableCell>
                      <TableCell
                        sx={{
                          minWidth: 100,
                          display: { xs: "none", lg: "table-cell" },
                        }}
                      >
                        Making Charge (₹)
                      </TableCell>
                      <TableCell sx={{ minWidth: 80 }}>Stock</TableCell>
                      <TableCell
                        sx={{
                          minWidth: 100,
                          display: { xs: "none", lg: "table-cell" },
                        }}
                      >
                        Total Value (₹)
                      </TableCell>
                      <TableCell sx={{ minWidth: 250 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredItems.map((item) => (
                      <TableRow
                        key={item._id}
                        sx={{
                          "&:hover": { bgcolor: theme.palette.action.hover },
                          "& td": {
                            px: { xs: 1, sm: 2 },
                            py: 1,
                          },
                        }}
                      >
                        <TableCell>
                          {item.stockImg ? (
                            <Box
                              sx={{
                                width: { xs: 50, sm: 60 },
                                height: { xs: 50, sm: 60 },
                                borderRadius: 1,
                                overflow: "hidden",
                                border: `1px solid ${theme.palette.divider}`,
                              }}
                            >
                              <OptimizedImage
                                src={item.stockImg}
                                alt={item.name || "Stock"}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "contain",
                                }}
                              />
                            </Box>
                          ) : (
                            <Typography
                              sx={{
                                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                                color: theme.palette.text.secondary,
                              }}
                            >
                              No Image
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>{item.name || "N/A"}</TableCell>
                        <TableCell
                          sx={{ display: { xs: "none", md: "table-cell" } }}
                        >
                          {item.stockcode || "N/A"}
                        </TableCell>
                        <TableCell
                          sx={{ display: { xs: "none", md: "table-cell" } }}
                        >
                          {item.category?.name || "N/A"}
                        </TableCell>
                        <TableCell
                          sx={{ display: { xs: "none", lg: "table-cell" } }}
                        >
                          {item.materialgitType || "N/A"}
                        </TableCell>
                        <TableCell
                          sx={{ display: { xs: "none", lg: "table-cell" } }}
                        >
                          {item.karat || "—"}
                        </TableCell>
                        <TableCell
                          sx={{ display: { xs: "none", md: "table-cell" } }}
                        >
                          {item.firm?.name || "N/A"}
                        </TableCell>
                        <TableCell>{item.waight || "N/A"}g</TableCell>
                        <TableCell
                          sx={{ display: { xs: "none", lg: "table-cell" } }}
                        >
                          ₹{item.makingCharge?.toLocaleString() || "N/A"}
                        </TableCell>
                        <TableCell>{item.quantity || "N/A"}</TableCell>
                        <TableCell
                          sx={{ display: { xs: "none", lg: "table-cell" } }}
                        >
                          ₹{item.totalValue?.toLocaleString() || "N/A"}
                        </TableCell>
                        <TableCell
                          sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}
                        >
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleEditItem(item)}
                            sx={{
                              fontSize: { xs: "0.7rem", sm: "0.8rem" },
                              px: 1,
                              textTransform: "none",
                            }}
                          >
                            Edit
                          </Button>
                          {isAdmin && (
                            <Button
                              variant="outlined"
                              size="small"
                              color="error"
                              startIcon={<Delete fontSize="small" />}
                              onClick={() => handleRemoveItem(item._id)}
                              sx={{
                                fontSize: { xs: "0.7rem", sm: "0.8rem" },
                                px: 1,
                                textTransform: "none",
                              }}
                            >
                              Remove
                            </Button>
                          )}
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<PrintIcon fontSize="small" />}
                            onClick={() => handlePrintBarcode(item)}
                            disabled={!item.stockcode}
                            sx={{
                              fontSize: { xs: "0.7rem", sm: "0.8rem" },
                              px: 1,
                              textTransform: "none",
                            }}
                          >
                            Print
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {filteredItems.length > 0 && (
                <Box
                  sx={{
                    mt: 3,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 2,
                    flexDirection: { xs: "column", sm: "row" },
                  }}
                >
                  <Typography sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
                    Total Items: {filteredItems.length}
                  </Typography>
                </Box>
              )}
            </>
          )}
        </motion.div>
      </Box>

      <Dialog
        open={openAddModal}
        onClose={handleCancel}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            width: { xs: "95%", sm: 500 },
            maxHeight: "90vh",
            overflowY: "auto",
            borderRadius: 1,
          },
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: theme.palette.primary.main,
            color: theme.palette.getContrastText(theme.palette.primary.main),
            fontSize: { xs: "0.875rem", sm: "1rem" },
            py: 1,
            position: "relative",
          }}
        >
          Add New Item
          <IconButton
            onClick={handleCancel}
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              p: 0.5,
            }}
          >
            <Close sx={{ fontSize: "1rem" }} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: { xs: 1, sm: 2 } }}>
          {formErrors.submit && (
            <Alert
              severity="error"
              sx={{ mb: 1, fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
              onClose={() =>
                setFormErrors((prev) => ({ ...prev, submit: null }))
              }
            >
              {formErrors.submit}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Item Name"
            type="text"
            fullWidth
            value={newItem.name}
            onChange={handleInputChange}
            error={!!formErrors.name}
            helperText={formErrors.name}
            sx={{
              mb: 1,
              "& .MuiInputBase-input": {
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
              },
              "& .MuiInputLabel-root": {
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
              },
            }}
            required
          />
          <Select
            name="materialgitType" // Fixed typo
            value={newItem.materialgitType}
            onChange={handleInputChange}
            fullWidth
            sx={{
              mb: 1,
              fontSize: { xs: "0.75rem", sm: "0.875rem" },
            }}
            error={!!formErrors.materialgitType}
            required
          >
            <MenuItem
              value="gold"
              sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
            >
              Gold
            </MenuItem>
            <MenuItem
              value="silver"
              sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
            >
              Silver
            </MenuItem>
            <MenuItem
              value="platinum"
              sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
            >
              Platinum
            </MenuItem>
            <MenuItem
              value="diamond"
              sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
            >
              Diamond
            </MenuItem>
            <MenuItem
              value="other"
              sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
            >
              Other
            </MenuItem>
          </Select>
          {(newItem.materialgitType === "gold" || newItem.materialgitType === "diamond") && (
            <Select
              name="karat"
              value={newItem.karat}
              onChange={handleInputChange}
              fullWidth
              displayEmpty
              sx={{ mb: 1, fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
              error={!!formErrors.karat}
              required
            >
              <MenuItem value="" disabled sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>
                Select {newItem.materialgitType === "gold" ? "Karat" : "Carat"}
              </MenuItem>
              {(newItem.materialgitType === "gold" ? GOLD_KARATS : DIAMOND_CARATS).map((k) => (
                <MenuItem key={k} value={k} sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>
                  {k}
                </MenuItem>
              ))}
            </Select>
          )}
          {formErrors.karat && (
            <Typography variant="caption" color="error" sx={{ display: "block", mb: 1 }}>
              {formErrors.karat}
            </Typography>
          )}
          <Select
            name="category"
            value={newItem.category}
            onChange={handleInputChange}
            fullWidth
            sx={{
              mb: { xs: 1, sm: 2 },
              "& .MuiSelect-select": {
                fontSize: { xs: "0.8rem", sm: "0.9rem" },
              },
            }}
            error={!!formErrors.category}
            required
          >
            <MenuItem
              value=""
              disabled
              sx={{ fontSize: { xs: "0.8rem", sm: "0.9rem" } }}
            >
              Select Category
            </MenuItem>
            {categories.map((cat) => (
              <MenuItem
                key={cat._id}
                value={cat._id}
                sx={{ fontSize: { xs: "0.8rem", sm: "0.9rem" } }}
              >
                {cat.name}
              </MenuItem>
            ))}
          </Select>
          <Select
            name="firm"
            value={newItem.firm}
            onChange={handleInputChange}
            fullWidth
            sx={{
              mb: { xs: 1, sm: 2 },
              "& .MuiSelect-select": {
                fontSize: { xs: "0.8rem", sm: "0.9rem" },
              },
            }}
            error={!!formErrors.firm}
            required
          >
            <MenuItem
              value=""
              disabled
              sx={{ fontSize: { xs: "0.8rem", sm: "0.9rem" } }}
            >
              Select Firm
            </MenuItem>
            {firms.map((firm) => (
              <MenuItem
                key={firm._id}
                value={firm._id}
                sx={{ fontSize: { xs: "0.8rem", sm: "0.9rem" } }}
              >
                {firm.name}
              </MenuItem>
            ))}
          </Select>
          <Select
            name="stockType"
            value={newItem.stockType}
            onChange={handleInputChange}
            fullWidth
            displayEmpty
            sx={{ mb: { xs: 1, sm: 2 }, fontSize: { xs: "0.8rem", sm: "0.9rem" } }}
          >
            <MenuItem value="retail">Retail (added individually)</MenuItem>
            <MenuItem value="wholesale">Wholesale (bulk stock)</MenuItem>
          </Select>
          <TextField
            margin="dense"
            name="waight" // Fixed typo — this is the Gross Weight
            label="Gross Weight (g)"
            type="number"
            fullWidth
            value={newItem.waight}
            onChange={handleInputChange}
            error={!!formErrors.waight}
            helperText={formErrors.waight}
            sx={{
              mb: { xs: 1, sm: 2 },
              "& .MuiInputBase-input": {
                fontSize: { xs: "0.8rem", sm: "0.9rem" },
              },
              "& .MuiInputLabel-root": {
                fontSize: { xs: "0.8rem", sm: "0.9rem" },
              },
            }}
            required
          />
          <TextField
            margin="dense"
            name="lessWeight"
            label="Less Weight — stone/moti (g)"
            type="number"
            fullWidth
            value={newItem.lessWeight}
            onChange={handleInputChange}
            sx={{
              mb: { xs: 1, sm: 2 },
              "& .MuiInputBase-input": {
                fontSize: { xs: "0.8rem", sm: "0.9rem" },
              },
              "& .MuiInputLabel-root": {
                fontSize: { xs: "0.8rem", sm: "0.9rem" },
              },
            }}
          />
          <Typography
            variant="body2"
            sx={{ mb: { xs: 1, sm: 2 }, color: theme.palette.text.secondary }}
          >
            Net Weight: {newItemNetWeight > 0 ? newItemNetWeight.toFixed(3) : 0} g
          </Typography>
          <TextField
            margin="dense"
            name="quantity"
            label="Stock Quantity"
            type="number"
            fullWidth
            value={newItem.quantity}
            onChange={handleInputChange}
            error={!!formErrors.quantity}
            helperText={formErrors.quantity}
            sx={{
              mb: { xs: 1, sm: 2 },
              "& .MuiInputBase-input": {
                fontSize: { xs: "0.8rem", sm: "0.9rem" },
              },
              "& .MuiInputLabel-root": {
                fontSize: { xs: "0.8rem", sm: "0.9rem" },
              },
            }}
            required
          />
          <TextField
            margin="dense"
            name="hsnCode"
            label="HSN Code"
            type="text"
            fullWidth
            value={newItem.hsnCode}
            onChange={handleInputChange}
            sx={{ mb: { xs: 1, sm: 2 } }}
          />
          <TextField
            margin="dense"
            name="price"
            label="Price (₹)"
            type="number"
            fullWidth
            value={newItem.price}
            onChange={handleInputChange}
            error={!!formErrors.price}
            helperText={formErrors.price}
            sx={{
              mb: { xs: 1, sm: 2 },
              "& .MuiInputBase-input": {
                fontSize: { xs: "0.8rem", sm: "0.9rem" },
              },
              "& .MuiInputLabel-root": {
                fontSize: { xs: "0.8rem", sm: "0.9rem" },
              },
            }}
            required
          />
          <Box sx={{ display: "flex", gap: 1, mb: { xs: 1, sm: 2 } }}>
            <TextField
              margin="dense"
              name="wastageSupplier"
              label="Supplier Wastage %"
              type="number"
              fullWidth
              value={newItem.wastageSupplier}
              onChange={handleInputChange}
            />
            <TextField
              margin="dense"
              name="wastageCustomer"
              label="Customer Wastage %"
              type="number"
              fullWidth
              value={newItem.wastageCustomer}
              onChange={handleInputChange}
            />
          </Box>
          <Box sx={{ display: "flex", gap: 1, mb: { xs: 1, sm: 2 } }}>
            <TextField
              margin="dense"
              name="makingCharge"
              label="Making Charge"
              type="number"
              fullWidth
              value={newItem.makingCharge}
              onChange={handleInputChange}
              error={!!formErrors.makingCharge}
              helperText={formErrors.makingCharge}
              required
            />
            <Select
              name="makingChargeUnit"
              value={newItem.makingChargeUnit}
              onChange={handleInputChange}
              sx={{ minWidth: 130 }}
            >
              <MenuItem value="fixed">Fixed (₹)</MenuItem>
              <MenuItem value="per_gram">Per Gram</MenuItem>
              <MenuItem value="per_kg">Per Kg</MenuItem>
              <MenuItem value="per_mg">Per Mg</MenuItem>
              <MenuItem value="percent">% of Price</MenuItem>
            </Select>
          </Box>
          <Box sx={{ display: "flex", gap: 1, mb: { xs: 1, sm: 2 } }}>
            <TextField
              margin="dense"
              name="labourChargeValue"
              label="Labour / Polishing Charge"
              type="number"
              fullWidth
              value={newItem.labourChargeValue}
              onChange={handleInputChange}
            />
            <Select
              name="labourChargeUnit"
              value={newItem.labourChargeUnit}
              onChange={handleInputChange}
              sx={{ minWidth: 130 }}
            >
              <MenuItem value="fixed">Fixed (₹)</MenuItem>
              <MenuItem value="per_gram">Per Gram</MenuItem>
              <MenuItem value="per_kg">Per Kg</MenuItem>
              <MenuItem value="per_mg">Per Mg</MenuItem>
              <MenuItem value="percent">% of Price</MenuItem>
            </Select>
          </Box>
          <TextField
            margin="dense"
            name="stoneCharge"
            label="Stone Charge (₹)"
            type="number"
            fullWidth
            value={newItem.stoneCharge}
            onChange={handleInputChange}
            sx={{ mb: { xs: 1, sm: 2 } }}
          />
          <Box sx={{ mb: { xs: 1, sm: 2 } }}>
            <Button
              variant="contained"
              component="label"
              sx={{
                bgcolor: theme.palette.secondary.main,
                color: theme.palette.getContrastText(
                  theme.palette.secondary.main
                ),
                "&:hover": { bgcolor: theme.palette.secondary.dark },
                fontSize: { xs: "0.8rem", sm: "0.9rem" },
                width: { xs: "100%", sm: "auto" },
                textTransform: "none",
              }}
            >
              Upload Image
              <input
                type="file"
                hidden
                name="stock"
                onChange={handleFileChange}
                accept="image/*"
              />
            </Button>
            <Typography
              variant="body2"
              sx={{
                mt: 1,
                color: theme.palette.text.secondary,
                fontSize: { xs: "0.7rem", sm: "0.8rem" },
              }}
            >
              {newItem.stockImg ? newItem.stockImg.name : "No file chosen"}
            </Typography>
            {newItem.stockImg && (
              <img
                src={URL.createObjectURL(newItem.stockImg)}
                alt="Preview"
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 4,
                  marginTop: 8,
                  objectFit: "contain",
                }}
                onError={(e) => {
                  console.error("Failed to preview image");
                  e.target.src = "/fallback-image.png";
                }}
              />
            )}
            {formErrors.stockImg && (
              <Typography
                color="error"
                variant="caption"
                sx={{ fontSize: { xs: "0.7rem", sm: "0.8rem" }, mt: 1 }}
              >
                {formErrors.stockImg}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            flexDirection: { xs: "column", sm: "row" },
            gap: 1,
            p: 1,
          }}
        >
          <Button
            onClick={handleCancel}
            sx={{
              fontSize: { xs: "0.75rem", sm: "0.875rem" },
              width: { xs: "100%", sm: "auto" },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveItem}
            variant="contained"
            sx={{
              fontSize: { xs: "0.75rem", sm: "0.875rem" },
              width: { xs: "100%", sm: "auto" },
            }}
          >
            Save Item
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Item Modal */}
      <Dialog
        open={openEditModal}
        onClose={handleEditCancel}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            width: { xs: "95%", sm: 500 },
            maxHeight: "90vh",
            overflowY: "auto",
            borderRadius: 1,
          },
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: theme.palette.primary.main,
            color: theme.palette.getContrastText(theme.palette.primary.main),
            fontSize: { xs: "0.875rem", sm: "1rem" },
            py: 1,
            position: "relative",
          }}
        >
          Edit Item
          <IconButton
            onClick={handleEditCancel}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: theme.palette.getContrastText(theme.palette.primary.main),
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: { xs: 1, sm: 2 } }}>
          {formErrors.submit && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formErrors.submit}
            </Alert>
          )}

          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              label="Item Name"
              name="name"
              value={editItem.name}
              onChange={handleEditInputChange}
              error={!!formErrors.name}
              helperText={formErrors.name}
              size="small"
              sx={{ mb: 1 }}
            />
          </Box>

          <Box sx={{ mb: 2 }}>
            <Select
              fullWidth
              label="Material Type"
              name="materialgitType"
              value={editItem.materialgitType}
              onChange={handleEditInputChange}
              displayEmpty
              size="small"
              sx={{ mb: 1 }}
            >
              <MenuItem value="" disabled>
                Select Material
              </MenuItem>
              <MenuItem value="gold">Gold</MenuItem>
              <MenuItem value="silver">Silver</MenuItem>
              <MenuItem value="platinum">Platinum</MenuItem>
              <MenuItem value="diamond">Diamond</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
            {formErrors.materialgitType && (
              <Typography
                sx={{ color: theme.palette.error.main, fontSize: "0.75rem" }}
              >
                {formErrors.materialgitType}
              </Typography>
            )}
          </Box>

          {(editItem.materialgitType === "gold" || editItem.materialgitType === "diamond") && (
            <Box sx={{ mb: 2 }}>
              <Select
                fullWidth
                name="karat"
                value={editItem.karat}
                onChange={handleEditInputChange}
                displayEmpty
                size="small"
                sx={{ mb: 1 }}
              >
                <MenuItem value="" disabled>
                  Select {editItem.materialgitType === "gold" ? "Karat" : "Carat"}
                </MenuItem>
                {(editItem.materialgitType === "gold" ? GOLD_KARATS : DIAMOND_CARATS).map((k) => (
                  <MenuItem key={k} value={k}>
                    {k}
                  </MenuItem>
                ))}
              </Select>
              {formErrors.karat && (
                <Typography sx={{ color: theme.palette.error.main, fontSize: "0.75rem" }}>
                  {formErrors.karat}
                </Typography>
              )}
            </Box>
          )}

          <Box sx={{ mb: 2 }}>
            <Select
              fullWidth
              name="stockType"
              value={editItem.stockType}
              onChange={handleEditInputChange}
              size="small"
              sx={{ mb: 1 }}
            >
              <MenuItem value="retail">Retail (added individually)</MenuItem>
              <MenuItem value="wholesale">Wholesale (bulk stock)</MenuItem>
            </Select>
          </Box>

          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              label="Gross Weight (g)"
              name="waight"
              type="number"
              value={editItem.waight}
              onChange={handleEditInputChange}
              error={!!formErrors.waight}
              helperText={formErrors.waight}
              size="small"
              sx={{ mb: 1 }}
            />
            <TextField
              fullWidth
              label="Less Weight — stone/moti (g)"
              name="lessWeight"
              type="number"
              value={editItem.lessWeight}
              onChange={handleEditInputChange}
              size="small"
              sx={{ mb: 1 }}
            />
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              Net Weight: {editItemNetWeight > 0 ? editItemNetWeight.toFixed(3) : 0} g
            </Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Select
              fullWidth
              name="category"
              value={editItem.category}
              onChange={handleEditInputChange}
              displayEmpty
              size="small"
              sx={{ mb: 1 }}
            >
              <MenuItem value="" disabled>
                Select Category
              </MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat._id} value={cat._id}>
                  {cat.name}
                </MenuItem>
              ))}
            </Select>
            {formErrors.category && (
              <Typography
                sx={{ color: theme.palette.error.main, fontSize: "0.75rem" }}
              >
                {formErrors.category}
              </Typography>
            )}
          </Box>

          <Box sx={{ mb: 2 }}>
            <Select
              fullWidth
              name="firm"
              value={editItem.firm}
              onChange={handleEditInputChange}
              displayEmpty
              size="small"
              sx={{ mb: 1 }}
            >
              <MenuItem value="" disabled>
                Select Firm
              </MenuItem>
              {firms.map((firm) => (
                <MenuItem key={firm._id} value={firm._id}>
                  {firm.name}
                </MenuItem>
              ))}
            </Select>
            {formErrors.firm && (
              <Typography
                sx={{ color: theme.palette.error.main, fontSize: "0.75rem" }}
              >
                {formErrors.firm}
              </Typography>
            )}
          </Box>

          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              label="Quantity"
              name="quantity"
              type="number"
              value={editItem.quantity}
              onChange={handleEditInputChange}
              error={!!formErrors.quantity}
              helperText={formErrors.quantity}
              size="small"
              sx={{ mb: 1 }}
            />
            <TextField
              fullWidth
              label="HSN Code"
              name="hsnCode"
              type="text"
              value={editItem.hsnCode}
              onChange={handleEditInputChange}
              size="small"
            />
          </Box>

          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              label="Price (₹)"
              name="price"
              type="number"
              value={editItem.price}
              onChange={handleEditInputChange}
              error={!!formErrors.price}
              helperText={formErrors.price}
              size="small"
              sx={{ mb: 1 }}
            />
            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField
                fullWidth
                label="Supplier Wastage %"
                name="wastageSupplier"
                type="number"
                value={editItem.wastageSupplier}
                onChange={handleEditInputChange}
                size="small"
              />
              <TextField
                fullWidth
                label="Customer Wastage %"
                name="wastageCustomer"
                type="number"
                value={editItem.wastageCustomer}
                onChange={handleEditInputChange}
                size="small"
              />
            </Box>
          </Box>

          <Box sx={{ mb: 2, display: "flex", gap: 1 }}>
            <TextField
              fullWidth
              label="Making Charge"
              name="makingCharge"
              type="number"
              value={editItem.makingCharge}
              onChange={handleEditInputChange}
              error={!!formErrors.makingCharge}
              helperText={formErrors.makingCharge}
              size="small"
            />
            <Select
              name="makingChargeUnit"
              value={editItem.makingChargeUnit}
              onChange={handleEditInputChange}
              size="small"
              sx={{ minWidth: 130 }}
            >
              <MenuItem value="fixed">Fixed (₹)</MenuItem>
              <MenuItem value="per_gram">Per Gram</MenuItem>
              <MenuItem value="per_kg">Per Kg</MenuItem>
              <MenuItem value="per_mg">Per Mg</MenuItem>
              <MenuItem value="percent">% of Price</MenuItem>
            </Select>
          </Box>

          <Box sx={{ mb: 2, display: "flex", gap: 1 }}>
            <TextField
              fullWidth
              label="Labour / Polishing Charge"
              name="labourChargeValue"
              type="number"
              value={editItem.labourChargeValue}
              onChange={handleEditInputChange}
              size="small"
            />
            <Select
              name="labourChargeUnit"
              value={editItem.labourChargeUnit}
              onChange={handleEditInputChange}
              size="small"
              sx={{ minWidth: 130 }}
            >
              <MenuItem value="fixed">Fixed (₹)</MenuItem>
              <MenuItem value="per_gram">Per Gram</MenuItem>
              <MenuItem value="per_kg">Per Kg</MenuItem>
              <MenuItem value="per_mg">Per Mg</MenuItem>
              <MenuItem value="percent">% of Price</MenuItem>
            </Select>
          </Box>

          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              label="Stone Charge (₹)"
              name="stoneCharge"
              type="number"
              value={editItem.stoneCharge}
              onChange={handleEditInputChange}
              size="small"
            />
          </Box>

          <Box sx={{ mb: { xs: 1, sm: 2 } }}>
            <Button
              variant="contained"
              component="label"
              sx={{
                bgcolor: theme.palette.secondary.main,
                color: theme.palette.getContrastText(
                  theme.palette.secondary.main
                ),
                "&:hover": { bgcolor: theme.palette.secondary.dark },
                fontSize: { xs: "0.8rem", sm: "0.9rem" },
                width: { xs: "100%", sm: "auto" },
                textTransform: "none",
              }}
            >
              Upload Image (Optional)
              <input
                type="file"
                hidden
                name="stock"
                onChange={handleEditFileChange}
                accept="image/*"
              />
            </Button>
            {editingItem?.stockImg && !editItem.stockImg && (
              <Typography
                variant="body2"
                sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" }, mt: 1 }}
              >
                ✓ Current image will be kept if no new image is selected
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            flexDirection: { xs: "column", sm: "row" },
            gap: 1,
            p: 1,
          }}
        >
          <Button
            onClick={handleEditCancel}
            sx={{
              fontSize: { xs: "0.75rem", sm: "0.875rem" },
              width: { xs: "100%", sm: "auto" },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdateItem}
            variant="contained"
            sx={{
              fontSize: { xs: "0.75rem", sm: "0.875rem" },
              width: { xs: "100%", sm: "auto" },
            }}
          >
            Update Item
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={bulkImportOpen} onClose={handleCloseBulkImport} fullWidth maxWidth="sm">
        <DialogTitle
          sx={{
            bgcolor: theme.palette.primary.main,
            color: theme.palette.getContrastText(theme.palette.primary.main),
          }}
        >
          Bulk Import Stock (Wholesale)
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Download the template, fill in one row per item, then upload it here.
            Every row is imported as <strong>wholesale</strong> stock.
          </Typography>
          <Button
            variant="outlined"
            onClick={handleDownloadTemplate}
            sx={{ mb: 2, textTransform: "none" }}
          >
            Download Template
          </Button>
          <Box>
            <Button variant="contained" component="label" sx={{ textTransform: "none" }}>
              Choose Excel File
              <input
                type="file"
                hidden
                accept=".xlsx,.xls"
                onChange={handleBulkImportFileChange}
              />
            </Button>
            {bulkImportFile && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                {bulkImportFile.name}
              </Typography>
            )}
          </Box>

          {bulkImportResult && (
            <Box sx={{ mt: 2 }}>
              <Alert severity={bulkImportResult.insertedCount > 0 ? "success" : "error"}>
                {bulkImportResult.message}
              </Alert>
              {bulkImportResult.errors?.length > 0 && (
                <Box sx={{ mt: 1, maxHeight: 200, overflowY: "auto" }}>
                  {bulkImportResult.errors.map((err, idx) => (
                    <Typography
                      key={idx}
                      variant="body2"
                      sx={{ color: theme.palette.error.main, fontSize: "0.8rem" }}
                    >
                      Row {err.row} ({err.name}): {err.message}
                    </Typography>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBulkImport} sx={{ textTransform: "none" }}>
            Close
          </Button>
          <Button
            variant="contained"
            onClick={handleBulkImportSubmit}
            disabled={!bulkImportFile || bulkImporting}
            sx={{ textTransform: "none" }}
          >
            {bulkImporting ? <CircularProgress size={20} /> : "Import"}
          </Button>
        </DialogActions>
      </Dialog>

      <NotificationModal
        isOpen={notificationDialog.open}
        onClose={handleNotificationClose}
        title={notificationDialog.title}
        message={notificationDialog.message}
        type={notificationDialog.type}
      />
    </Box>
  );
}

export default ItemManagement;
