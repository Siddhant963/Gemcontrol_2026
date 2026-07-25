import {
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  TextField,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { motion } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setError as setAuthError } from "../redux/authSlice";
import { ROUTES } from "../utils/routes";
import api from "../utils/api";
import NotificationModal from "../components/NotificationModal";

const todayStr = () => new Date().toLocaleDateString("en-CA");

function SummaryCard({ label, value, color }) {
  const theme = useTheme();
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
          {label}
        </Typography>
        <Typography variant="h5" fontWeight="bold" sx={{ color: color || theme.palette.text.primary }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

function DayBook() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [date, setDate] = useState(todayStr());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notificationDialog, setNotificationDialog] = useState({
    open: false,
    message: "",
    type: "info",
    title: "",
  });

  const fetchDayBook = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/getDayBook", { params: { date } });
      setData(response.data);
    } catch (err) {
      const errorMessage =
        err.response?.status === 401
          ? "Please log in to view the day book."
          : err.response?.data?.message || "Failed to load the day book.";
      setNotificationDialog({ open: true, message: errorMessage, type: "error", title: "Error" });
      if (err.response?.status === 401) {
        dispatch(setAuthError(errorMessage));
        navigate(ROUTES.LOGIN);
      }
    } finally {
      setLoading(false);
    }
  }, [date, dispatch, navigate]);

  useEffect(() => {
    fetchDayBook();
  }, [fetchDayBook]);

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

  const handleExportCsv = useCallback(() => {
    if (!data) return;
    const lines = [
      "Section,Detail,Amount",
      `Summary,Sales Count,${data.summary.salesCount}`,
      `Summary,Total Sales Amount,${data.summary.totalSalesAmount}`,
      `Summary,Total Payments Received,${data.summary.totalPaymentsReceived}`,
      `Summary,New Stock Added,${data.summary.newStockCount}`,
      `Summary,Udhar Given,${data.summary.udharGivenAmount}`,
      `Summary,Udhar Settled,${data.summary.udharSettledAmount}`,
      "",
      "Sales,Invoice No,Customer,Firm,Total Amount",
      ...data.sales.map(
        (s) => `Sale,${s.invoiceNumber || ""},${s.customer?.name || ""},${s.firm?.name || ""},${s.totalAmount}`
      ),
      "",
      "Payments,Mode,Customer,Amount",
      ...data.payments.map((p) => `Payment,${p.paymentType},${p.customer?.name || ""},${p.amount}`),
      "",
      "New Stock,Name,Category,Quantity,Total Value",
      ...data.newStock.map(
        (s) => `Stock,${s.name},${s.category?.name || ""},${s.quantity},${s.totalValue}`
      ),
    ];
    downloadBlob(lines.join("\n"), `day-book-${date}.csv`, "text/csv;charset=utf-8;");
  }, [data, date]);

  const handlePrint = useCallback(() => {
    if (!data) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const rows = (arr, cols) =>
      arr
        .map((row) => `<tr>${cols.map((c) => `<td>${c(row)}</td>`).join("")}</tr>`)
        .join("");
    printWindow.document.write(`
      <html>
        <head>
          <title>Day Book - ${date}</title>
          <style>
            body { font-family: Arial, sans-serif; font-size: 12px; }
            table { border-collapse: collapse; width: 100%; margin-bottom: 16px; }
            th, td { border: 1px solid #999; padding: 4px 6px; text-align: left; }
            th { background: #eee; }
            h2 { margin-top: 24px; }
          </style>
        </head>
        <body>
          <h1>Day Book — ${date}</h1>
          <h2>Summary</h2>
          <table>
            <tr><td>Sales Count</td><td>${data.summary.salesCount}</td></tr>
            <tr><td>Total Sales Amount</td><td>₹${data.summary.totalSalesAmount.toLocaleString("en-IN")}</td></tr>
            <tr><td>Total Payments Received</td><td>₹${data.summary.totalPaymentsReceived.toLocaleString("en-IN")}</td></tr>
            <tr><td>New Stock Added</td><td>${data.summary.newStockCount}</td></tr>
            <tr><td>Udhar Given</td><td>₹${data.summary.udharGivenAmount.toLocaleString("en-IN")}</td></tr>
            <tr><td>Udhar Settled</td><td>₹${data.summary.udharSettledAmount.toLocaleString("en-IN")}</td></tr>
          </table>
          <h2>Sales</h2>
          <table>
            <tr><th>Invoice No</th><th>Customer</th><th>Firm</th><th>Total</th></tr>
            ${rows(data.sales, [
              (s) => s.invoiceNumber || "",
              (s) => s.customer?.name || "",
              (s) => s.firm?.name || "",
              (s) => `₹${(s.totalAmount || 0).toLocaleString("en-IN")}`,
            ])}
          </table>
          <h2>Payments</h2>
          <table>
            <tr><th>Mode</th><th>Customer</th><th>Amount</th></tr>
            ${rows(data.payments, [
              (p) => p.paymentType,
              (p) => p.customer?.name || "",
              (p) => `₹${(p.amount || 0).toLocaleString("en-IN")}`,
            ])}
          </table>
          <h2>New Stock Added</h2>
          <table>
            <tr><th>Name</th><th>Category</th><th>Quantity</th><th>Total Value</th></tr>
            ${rows(data.newStock, [
              (s) => s.name,
              (s) => s.category?.name || "",
              (s) => s.quantity,
              (s) => `₹${(s.totalValue || 0).toLocaleString("en-IN")}`,
            ])}
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  }, [data, date]);

  return (
    <Box sx={{ maxWidth: "100%", width: "100%", px: { xs: 1, sm: 2, md: 3 }, py: { xs: 1, sm: 2 } }}>
      <Box
        component={motion.div}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "stretch", sm: "center" },
          gap: 2,
          mb: 3,
        }}
      >
        <Typography variant="h4" fontWeight="bold">
          Day Book
        </Typography>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <TextField
            type="date"
            size="small"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <Button variant="outlined" onClick={handleExportCsv} disabled={!data} sx={{ textTransform: "none" }}>
            Export CSV
          </Button>
          <Button variant="contained" onClick={handlePrint} disabled={!data} sx={{ textTransform: "none" }}>
            Print / PDF
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : data ? (
        <>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={4} md={2}>
              <SummaryCard label="Sales" value={data.summary.salesCount} />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <SummaryCard
                label="Sales Amount"
                value={`₹${data.summary.totalSalesAmount.toLocaleString("en-IN")}`}
                color={theme.palette.primary.main}
              />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <SummaryCard
                label="Payments Received"
                value={`₹${data.summary.totalPaymentsReceived.toLocaleString("en-IN")}`}
                color={theme.palette.success.main}
              />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <SummaryCard label="New Stock Added" value={data.summary.newStockCount} />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <SummaryCard
                label="Udhar Given"
                value={`₹${data.summary.udharGivenAmount.toLocaleString("en-IN")}`}
                color={theme.palette.warning.main}
              />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <SummaryCard
                label="Udhar Settled"
                value={`₹${data.summary.udharSettledAmount.toLocaleString("en-IN")}`}
                color={theme.palette.info.main}
              />
            </Grid>
          </Grid>

          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 3 }}>
            {Object.entries(data.paymentsByMode).map(([mode, amount]) => (
              <Chip key={mode} label={`${mode}: ₹${amount.toLocaleString("en-IN")}`} />
            ))}
          </Box>

          <Typography variant="h6" sx={{ mb: 1 }}>
            Sales ({data.sales.length})
          </Typography>
          <TableContainer component={Paper} sx={{ mb: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Invoice No</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Firm</TableCell>
                  <TableCell>Payment Mode</TableCell>
                  <TableCell align="right">Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.sales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No sales on this date.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.sales.map((sale) => (
                    <TableRow key={sale._id}>
                      <TableCell>{sale.invoiceNumber || "—"}</TableCell>
                      <TableCell>{sale.customer?.name || "—"}</TableCell>
                      <TableCell>{sale.firm?.name || "—"}</TableCell>
                      <TableCell>{sale.paymentMethod}</TableCell>
                      <TableCell align="right">₹{(sale.totalAmount || 0).toLocaleString("en-IN")}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="h6" sx={{ mb: 1 }}>
            Payments ({data.payments.length})
          </Typography>
          <TableContainer component={Paper} sx={{ mb: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Mode</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell align="right">Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      No payments on this date.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.payments.map((p) => (
                    <TableRow key={p._id}>
                      <TableCell>{p.paymentType}</TableCell>
                      <TableCell>{p.customer?.name || "—"}</TableCell>
                      <TableCell align="right">₹{(p.amount || 0).toLocaleString("en-IN")}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="h6" sx={{ mb: 1 }}>
            New Stock Added ({data.newStock.length})
          </Typography>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Firm</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell align="right">Total Value</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.newStock.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No stock added on this date.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.newStock.map((s) => (
                    <TableRow key={s._id}>
                      <TableCell>{s.name}</TableCell>
                      <TableCell>{s.category?.name || "—"}</TableCell>
                      <TableCell>{s.firm?.name || "—"}</TableCell>
                      <TableCell align="right">{s.quantity}</TableCell>
                      <TableCell align="right">₹{(s.totalValue || 0).toLocaleString("en-IN")}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      ) : null}

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

export default DayBook;
