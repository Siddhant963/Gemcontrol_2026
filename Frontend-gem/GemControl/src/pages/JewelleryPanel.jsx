import {
  Typography,
  Paper,
  Box,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { motion } from "framer-motion";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Close } from "@mui/icons-material";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setError as setAuthError } from "../redux/authSlice";
import { ROUTES } from "../utils/routes";
import api from "../utils/api";
import { OptimizedImage, getImageUrl } from "../utils/imageUtils";
import NotificationModal from "../components/NotificationModal";

function JewelleryPanel() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [notificationDialog, setNotificationDialog] = useState({
    open: false,
    message: "",
    type: "info",
    title: "",
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [categoriesRes, stocksRes] = await Promise.all([
        api.get("/getAllStockCategories"),
        api.get("/getAllStocks"),
      ]);
      setCategories(Array.isArray(categoriesRes.data) ? categoriesRes.data : []);
      setStocks(Array.isArray(stocksRes.data) ? stocksRes.data : []);
    } catch (err) {
      const errorMessage =
        err.response?.status === 401
          ? "Please log in to view the jewellery panel."
          : err.response?.data?.message || "Failed to load jewellery data.";
      setNotificationDialog({ open: true, message: errorMessage, type: "error", title: "Error" });
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

  const stocksByCategory = useMemo(() => {
    const map = new Map();
    for (const stock of stocks) {
      const catId = stock.category?._id || stock.category;
      if (!map.has(catId)) map.set(catId, []);
      map.get(catId).push(stock);
    }
    return map;
  }, [stocks]);

  const categorySummaries = useMemo(
    () =>
      categories.map((cat) => {
        const items = stocksByCategory.get(cat._id) || [];
        return {
          ...cat,
          itemCount: items.length,
          totalQuantity: items.reduce((sum, s) => sum + (s.quantity || 0), 0),
          totalValue: items.reduce((sum, s) => sum + (s.totalValue || 0) * (s.quantity || 0), 0),
        };
      }),
    [categories, stocksByCategory]
  );

  const selectedItems = selectedCategory ? stocksByCategory.get(selectedCategory._id) || [] : [];

  const handleDownloadCatalog = useCallback(
    (category, items) => {
      const printWindow = window.open("", "_blank");
      if (!printWindow) return;
      const rows = items
        .map(
          (item) => `
        <tr>
          <td>${
            item.stockImg
              ? `<img src="${getImageUrl(item.stockImg)}" style="width:60px;height:60px;object-fit:cover;" />`
              : ""
          }</td>
          <td>${item.name}</td>
          <td>${item.stockcode || ""}</td>
          <td>${item.karat || "—"}</td>
          <td>${(item.netWeight || item.waight || 0).toString()} g</td>
          <td>${item.quantity}</td>
          <td>₹${(item.totalValue || 0).toLocaleString("en-IN")}</td>
        </tr>`
        )
        .join("");
      printWindow.document.write(`
        <html>
          <head>
            <title>${category.name} Catalog</title>
            <style>
              body { font-family: Arial, sans-serif; }
              table { border-collapse: collapse; width: 100%; font-size: 12px; }
              th, td { border: 1px solid #999; padding: 6px; text-align: left; vertical-align: middle; }
              th { background: #eee; }
              h1 { text-align: center; }
            </style>
          </head>
          <body>
            <h1>${category.name} — Catalog</h1>
            <table>
              <thead>
                <tr>
                  <th>Photo</th><th>Name</th><th>Code</th><th>Karat</th><th>Weight</th><th>Qty</th><th>Price</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };
    },
    []
  );

  return (
    <Box sx={{ maxWidth: "100%", width: "100%", px: { xs: 1, sm: 2, md: 3 }, py: { xs: 1, sm: 2 } }}>
      <Typography
        variant="h4"
        fontWeight="bold"
        sx={{ mb: 3 }}
        component={motion.div}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Jewellery Panel
      </Typography>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={2}>
          {categorySummaries.map((cat) => (
            <Grid item xs={6} sm={4} md={3} lg={2} key={cat._id}>
              <Card sx={{ height: "100%" }}>
                <CardActionArea onClick={() => setSelectedCategory(cat)}>
                  <Box
                    sx={{
                      height: 100,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: theme.palette.action.hover,
                    }}
                  >
                    {cat.CategoryImg ? (
                      <OptimizedImage
                        src={cat.CategoryImg}
                        alt={cat.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <Typography variant="h4">💎</Typography>
                    )}
                  </Box>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="bold" noWrap>
                      {cat.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {cat.itemCount} item(s) • qty {cat.totalQuantity}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog
        open={Boolean(selectedCategory)}
        onClose={() => setSelectedCategory(null)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {selectedCategory?.name} — {selectedItems.length} item(s)
          <IconButton onClick={() => setSelectedCategory(null)}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Photo</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Code</TableCell>
                  <TableCell>Karat</TableCell>
                  <TableCell align="right">Weight</TableCell>
                  <TableCell align="right">Qty</TableCell>
                  <TableCell align="right">Price</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedItems.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell>
                      {item.stockImg ? (
                        <OptimizedImage
                          src={item.stockImg}
                          alt={item.name}
                          style={{ width: 40, height: 40, objectFit: "cover" }}
                        />
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.stockcode}</TableCell>
                    <TableCell>{item.karat || "—"}</TableCell>
                    <TableCell align="right">{item.netWeight || item.waight || 0} g</TableCell>
                    <TableCell align="right">{item.quantity}</TableCell>
                    <TableCell align="right">₹{(item.totalValue || 0).toLocaleString("en-IN")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedCategory(null)} sx={{ textTransform: "none" }}>
            Close
          </Button>
          <Button
            variant="contained"
            sx={{ textTransform: "none" }}
            onClick={() => handleDownloadCatalog(selectedCategory, selectedItems)}
          >
            Download Catalog (PDF)
          </Button>
        </DialogActions>
      </Dialog>

      <NotificationModal
        isOpen={notificationDialog.open}
        onClose={() => setNotificationDialog((prev) => ({ ...prev, open: false }))}
        title={notificationDialog.title}
        message={notificationDialog.message}
        type={notificationDialog.type}
      />
    </Box>
  );
}

export default JewelleryPanel;
