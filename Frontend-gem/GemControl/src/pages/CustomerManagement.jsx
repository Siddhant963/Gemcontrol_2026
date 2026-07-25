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
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  FormHelperText,
  Tooltip,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  Pagination,
  Divider,
  Grid,
  Link,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { motion } from "framer-motion";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Search, Add, Close, Delete, Edit } from "@mui/icons-material";
import { useSelector } from "react-redux";
import api from "../utils/api";
import NotificationModal from "../components/NotificationModal";

function CustomerManagement() {
  const theme = useTheme();
  const { user: currentUser } = useSelector((state) => state.auth);
  const isAdmin = currentUser?.role?.toLowerCase() === "admin";
  const [searchQuery, setSearchQuery] = useState("");
  const [customerType, setCustomerType] = useState("all");
  const [customers, setCustomers] = useState([]);
  const [firms, setFirms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [errors, setErrors] = useState({});
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    contact: "",
    email: "",
    address: "",
    firm: "",
  });
  const [notificationDialog, setNotificationDialog] = useState({
    open: false,
    message: "",
    type: "info",
    title: "",
  });
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [customerDetail, setCustomerDetail] = useState(null);

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

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.3, ease: "easeOut" },
    },
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [customerResponse, firmResponse] = await Promise.all([
        api.get("/getAllCustomers"),
        api.get("/getAllFirms"),
      ]);
      setCustomers(
        Array.isArray(customerResponse.data) ? customerResponse.data : []
      );
      setFirms(Array.isArray(firmResponse.data) ? firmResponse.data : []);
    } catch (error) {
      console.error("Error fetching data:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      setNotificationDialog({
        open: true,
        message: error.response?.data?.message || "Failed to fetch data",
        type: "error",
        title: "Error",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const validateForm = () => {
    const newErrors = {};
    if (!newCustomer.name.trim()) newErrors.name = "Name is required";
    if (!newCustomer.contact.trim()) newErrors.contact = "Contact is required";
    else if (!/^\d{10}$/.test(newCustomer.contact.trim()))
      newErrors.contact = "Contact must be 10 digits";
    if (!newCustomer.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(newCustomer.email))
      newErrors.email = "Invalid email format";
    if (!newCustomer.firm) newErrors.firm = "Firm is required";
    if (!newCustomer.address.trim()) newErrors.address = "Address is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveCustomer = useCallback(async () => {
    if (!validateForm()) {
      setNotificationDialog({
        open: true,
        message: "Please correct the form errors.",
        type: "error",
        title: "Validation Error",
      });
      return;
    }

    const isDuplicate = customers.some(
      (cust) =>
        (cust.contact === newCustomer.contact ||
          cust.email.toLowerCase() === newCustomer.email.toLowerCase()) &&
        cust._id !== editingId
    );

    if (isDuplicate) {
      setErrors({
        submit: "Customer with this contact or email already exists.",
      });
      return;
    }

    try {
      setLoading(true);
      if (editingId) {
        const payload = {
          ...newCustomer,
          customerId: editingId,
          _id: editingId,
        };
        await api.post(`/UpdateCustomer?customerId=${editingId}`, payload);
      } else {
        await api.post("/AddCustomer", newCustomer);
      }
      await fetchData();
      setNotificationDialog({
        open: true,
        message: `Customer ${editingId ? "updated" : "added"} successfully!`,
        type: "success",
        title: "Success",
      });
      handleCloseModal();
    } catch (error) {
      console.error("Error saving customer:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      const errorMessage =
        error.response?.data?.message ||
        `Failed to ${editingId ? "update" : "add"} customer`;
      setErrors({ submit: errorMessage });
      setNotificationDialog({
        open: true,
        message: errorMessage,
        type: "error",
        title: "Error",
      });
    } finally {
      setLoading(false);
    }
  }, [newCustomer, fetchData, editingId]);

  const handleDeleteCustomer = async (customerId) => {
    if (!window.confirm("Are you sure you want to delete this customer?"))
      return;
    try {
      setLoading(true);
      await api.get(`/removeCustomer?customerId=${customerId}`);
      setCustomers(customers.filter((customer) => customer._id !== customerId));
      setNotificationDialog({
        open: true,
        message: "Customer deleted successfully!",
        type: "success",
        title: "Success",
      });
    } catch (error) {
      console.error("DeleteCustomer error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      setNotificationDialog({
        open: true,
        message: error.response?.data?.message || "Failed to delete customer",
        type: "error",
        title: "Error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => setOpenModal(true);

  const handleCloseModal = () => {
    setOpenModal(false);
    setEditingId(null);
    setNewCustomer({
      name: "",
      contact: "",
      email: "",
      address: "",
      firm: "",
    });
    setErrors({});
  };

  const handleEditCustomer = (customer) => {
    setEditingId(customer._id);
    setNewCustomer({
      name: customer.name,
      contact: customer.contact,
      email: customer.email,
      address: customer.address,
      firm: customer.firm?._id || customer.firm || "",
    });
    setOpenModal(true);
    setErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewCustomer({ ...newCustomer, [name]: value });
    setErrors({ ...errors, [name]: null, submit: null });
  };

  const handleOpenCustomerDetail = useCallback(async (customer) => {
    setSelectedCustomer(customer);
    setDetailDialogOpen(true);
    setDetailLoading(true);
    setCustomerDetail(null);
    try {
      const [salesRes, paymentsRes, udharRes, settlementsRes] = await Promise.all([
        api.get(`/getSaleByCustomer?customerId=${customer._id}`),
        api.get(`/getPaymentByCustomer?customerId=${customer._id}`),
        api.get(`/getUdharByCustomer?customerId=${customer._id}`),
        api.get(`/getUdharSetelmentByCustomer?customerId=${customer._id}`),
      ]);
      const sales = Array.isArray(salesRes.data) ? salesRes.data : [];
      const payments = Array.isArray(paymentsRes.data) ? paymentsRes.data : [];
      const udhar = Array.isArray(udharRes.data) ? udharRes.data : [];
      const settlements = Array.isArray(settlementsRes.data) ? settlementsRes.data : [];

      const totalPurchased = sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
      const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const totalUdharIssued = udhar.reduce((sum, u) => sum + (u.amount || 0), 0);
      const totalSettled = settlements.reduce((sum, s) => sum + (s.amount || 0), 0);

      setCustomerDetail({
        sales: [...sales].sort((a, b) => new Date(b.saleDate) - new Date(a.saleDate)),
        totalPurchased,
        totalPaid,
        totalUdharIssued,
        totalSettled,
        outstanding: totalUdharIssued - totalSettled,
      });
    } catch (error) {
      console.error("Error fetching customer detail:", error);
      setCustomerDetail({
        sales: [],
        totalPurchased: 0,
        totalPaid: 0,
        totalUdharIssued: 0,
        totalSettled: 0,
        outstanding: 0,
        error: error.response?.data?.message || "Failed to load customer history",
      });
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const handleCloseCustomerDetail = () => {
    setDetailDialogOpen(false);
    setSelectedCustomer(null);
    setCustomerDetail(null);
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setPage(1); // Reset to first page on search
  };

  const handleNotificationClose = () => {
    setNotificationDialog({ ...notificationDialog, open: false });
  };

  const filteredCustomers = useMemo(
    () =>
      customers.filter((customer) => {
        const matchesSearch =
          (customer.firm.name || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          (customer.address || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
        return matchesSearch;
      }),
    [customers, searchQuery]
  );

  const paginatedCustomers = useMemo(
    () =>
      filteredCustomers.slice((page - 1) * itemsPerPage, page * itemsPerPage),
    [filteredCustomers, page]
  );

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
            Customer Management
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
              onClick={handleOpenModal}
              sx={{
                bgcolor: theme.palette.primary.main,
                color: theme.palette.getContrastText(
                  theme.palette.primary.main
                ),
                "&:hover": { bgcolor: theme.palette.primary.dark },
                borderRadius: 2,
                fontSize: { xs: "0.8rem", sm: "0.9rem" },
                px: { xs: 1, sm: 2 },
                py: { xs: 0.5, sm: 1 },
                width: { xs: "100%", sm: "auto" },
                textTransform: "none",
              }}
            >
              Add Customer
            </Button>
            <Paper
              sx={{
                p: "4px 8px",
                display: "flex",
                alignItems: "center",
                width: { xs: "100%", sm: 200, md: 300 },
                bgcolor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
              }}
            >
              <IconButton sx={{ p: { xs: 0.5, sm: 1 } }}>
                <Search sx={{ fontSize: { xs: "1rem", sm: "1.2rem" } }} />
              </IconButton>
              <InputBase
                sx={{
                  ml: 1,
                  flex: 1,
                  fontSize: { xs: "0.8rem", sm: "0.9rem" },
                }}
                placeholder="Search customers..."
                value={searchQuery}
                onChange={handleSearch}
              />
            </Paper>
          </Box>
        </Box>
      </Box>

      <Dialog
        open={openModal}
        onClose={handleCloseModal}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          component: motion.div,
          variants: modalVariants,
          initial: "hidden",
          animate: "visible",
          sx: {
            minWidth: { xs: 300, sm: 500 },
            borderRadius: 2,
            boxShadow: theme.shadows[10],
            maxHeight: "90vh",
            overflowY: "auto",
          },
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: theme.palette.primary.main,
            color: theme.palette.getContrastText(theme.palette.primary.main),
            py: { xs: 1.5, sm: 2 },
            fontSize: { xs: "1rem", sm: "1.25rem" },
            position: "relative",
          }}
        >
          {editingId ? "Edit Customer" : "Add New Customer"}
          <IconButton
            onClick={handleCloseModal}
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              color: theme.palette.getContrastText(theme.palette.primary.main),
              p: { xs: 0.5, sm: 1 },
            }}
            aria-label="Close dialog"
          >
            <Close sx={{ fontSize: { xs: "1rem", sm: "1.2rem" } }} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: { xs: 1, sm: 2 }, pb: { xs: 1, sm: 2 } }}>
          {errors.submit && (
            <Box
              sx={{
                mb: 2,
                p: 2,
                bgcolor: theme.palette.error.light,
                borderRadius: 1,
                color: theme.palette.error.contrastText,
                fontSize: { xs: "0.8rem", sm: "0.9rem" },
              }}
            >
              {errors.submit}
            </Box>
          )}
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Name"
            type="text"
            fullWidth
            value={newCustomer.name}
            onChange={handleInputChange}
            error={!!errors.name}
            helperText={errors.name}
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
            name="contact"
            label="Contact"
            type="text"
            fullWidth
            value={newCustomer.contact}
            onChange={handleInputChange}
            error={!!errors.contact}
            helperText={errors.contact}
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
            name="email"
            label="Email"
            type="email"
            fullWidth
            value={newCustomer.email}
            onChange={handleInputChange}
            error={!!errors.email}
            helperText={errors.email}
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
            name="address"
            label="Address"
            type="text"
            fullWidth
            value={newCustomer.address}
            onChange={handleInputChange}
            error={!!errors.address}
            helperText={errors.address}
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
          <FormControl
            fullWidth
            sx={{ mb: { xs: 1, sm: 2 } }}
            error={!!errors.firm}
          >
            <InputLabel sx={{ fontSize: { xs: "0.8rem", sm: "0.9rem" } }}>
              Firm
            </InputLabel>
            <Select
              name="firm"
              value={newCustomer.firm}
              onChange={handleInputChange}
              label="Firm"
              sx={{
                "& .MuiSelect-select": {
                  fontSize: { xs: "0.8rem", sm: "0.9rem" },
                },
                "& .MuiInputLabel-root": {
                  fontSize: { xs: "0.8rem", sm: "0.9rem" },
                },
              }}
            >
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
            {errors.firm && (
              <FormHelperText sx={{ fontSize: { xs: "0.7rem", sm: "0.8rem" } }}>
                {errors.firm}
              </FormHelperText>
            )}
          </FormControl>
        </DialogContent>
        <DialogActions
          sx={{
            flexDirection: { xs: "column", sm: "row" },
            gap: { xs: 1, sm: 2 },
            px: { xs: 1, sm: 2 },
            pb: { xs: 1.5, sm: 2 },
          }}
        >
          <Button
            onClick={handleCloseModal}
            sx={{
              color: theme.palette.text.primary,
              width: { xs: "100%", sm: "auto" },
              fontSize: { xs: "0.8rem", sm: "0.9rem" },
              textTransform: "none",
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveCustomer}
            sx={{
              bgcolor: theme.palette.primary.main,
              color: theme.palette.getContrastText(theme.palette.primary.main),
              "&:hover": { bgcolor: theme.palette.primary.dark },
              width: { xs: "100%", sm: "auto" },
              fontSize: { xs: "0.8rem", sm: "0.9rem" },
              textTransform: "none",
            }}
          >
            {editingId ? "Update" : "Add Customer"}
          </Button>
        </DialogActions>
      </Dialog>

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
          ) : filteredCustomers.length === 0 ? (
            <Typography
              sx={{
                color: theme.palette.text.primary,
                textAlign: "center",
                py: { xs: 2, sm: 3 },
                fontSize: { xs: "0.875rem", sm: "1rem" },
              }}
            >
              No customers found.
            </Typography>
          ) : (
            <>
              {/* Mobile Card Layout */}
              <Box sx={{ display: { xs: "block", sm: "none" } }}>
                {paginatedCustomers.map((customer) => (
                  <Card
                    key={customer._id}
                    sx={{
                      mb: 2,
                      borderRadius: 1,
                      boxShadow: theme.shadows[2],
                      "&:hover": { boxShadow: theme.shadows[4] },
                    }}
                  >
                    <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
                      <Typography
                        onClick={() => handleOpenCustomerDetail(customer)}
                        sx={{
                          fontSize: "0.875rem",
                          fontWeight: "bold",
                          color: theme.palette.primary.main,
                          cursor: "pointer",
                          "&:hover": { textDecoration: "underline" },
                        }}
                      >
                        {customer.name || "N/A"}
                      </Typography>
                      <Typography sx={{ fontSize: "0.75rem" }}>
                        Contact: {customer.contact || "N/A"}
                      </Typography>
                      <Typography sx={{ fontSize: "0.75rem" }}>
                        Email: {customer.email || "N/A"}
                      </Typography>
                      <Typography sx={{ fontSize: "0.75rem" }}>
                        Address: {customer.address || "N/A"}
                      </Typography>
                      <Typography sx={{ fontSize: "0.75rem" }}>
                        Firm: {customer.firm?.name || "N/A"}
                      </Typography>
                    </CardContent>
                    <CardActions
                      sx={{
                        p: 1,
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                      }}
                    >
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Edit fontSize="small" />}
                        onClick={() => handleEditCustomer(customer)}
                        sx={{
                          fontSize: "0.75rem",
                          px: 1,
                          textTransform: "none",
                          m: 0.5,
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
                          onClick={() => handleDeleteCustomer(customer._id)}
                          sx={{
                            fontSize: "0.75rem",
                            px: 1,
                            textTransform: "none",
                            m: 0.5,
                          }}
                        >
                          Delete
                        </Button>
                      )}
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
                      <TableCell sx={{ minWidth: 150 }}>Name</TableCell>
                      <TableCell sx={{ minWidth: 120 }}>Contact</TableCell>
                      <TableCell
                        sx={{
                          minWidth: 150,
                          display: { xs: "none", sm: "table-cell" },
                        }}
                      >
                        Email
                      </TableCell>
                      <TableCell
                        sx={{
                          minWidth: 150,
                          display: { xs: "none", md: "table-cell" },
                        }}
                      >
                        Address
                      </TableCell>
                      <TableCell
                        sx={{
                          minWidth: 100,
                          display: { xs: "none", md: "table-cell" },
                        }}
                      >
                        Firm
                      </TableCell>
                      <TableCell sx={{ minWidth: 150 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedCustomers.map((customer) => (
                      <TableRow
                        key={customer._id}
                        sx={{
                          "&:hover": { bgcolor: theme.palette.action.hover },
                          "& td": {
                            px: { xs: 1, sm: 2 },
                            py: 1,
                          },
                        }}
                      >
                        <TableCell>
                          <Link
                            component="button"
                            onClick={() => handleOpenCustomerDetail(customer)}
                            sx={{ fontWeight: 600, textAlign: "left" }}
                          >
                            {customer.name || "N/A"}
                          </Link>
                        </TableCell>
                        <TableCell>{customer.contact || "N/A"}</TableCell>
                        <TableCell
                          sx={{ display: { xs: "none", sm: "table-cell" } }}
                        >
                          {customer.email || "N/A"}
                        </TableCell>
                        <TableCell
                          sx={{ display: { xs: "none", md: "table-cell" } }}
                        >
                          {customer.address || "N/A"}
                        </TableCell>
                        <TableCell
                          sx={{ display: { xs: "none", md: "table-cell" } }}
                        >
                          {customer.firm?.name || "N/A"}
                        </TableCell>
                        <TableCell
                          sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}
                        >
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Edit fontSize="small" />}
                            onClick={() => handleEditCustomer(customer)}
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
                              onClick={() => handleDeleteCustomer(customer._id)}
                              sx={{
                                fontSize: { xs: "0.7rem", sm: "0.8rem" },
                                px: 1,
                                textTransform: "none",
                              }}
                            >
                              Delete
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {filteredCustomers.length > 0 && (
                <Box
                  sx={{
                    mt: 2,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 2,
                    flexDirection: { xs: "column", sm: "row" },
                  }}
                >
                  <Typography sx={{ fontSize: { xs: "0.8rem", sm: "0.9rem" } }}>
                    Total Customers: {filteredCustomers.length}
                  </Typography>
                  <Pagination
                    count={Math.ceil(filteredCustomers.length / itemsPerPage)}
                    page={page}
                    onChange={(e, value) => setPage(value)}
                    sx={{
                      "& .MuiPaginationItem-root": {
                        fontSize: { xs: "0.8rem", sm: "0.9rem" },
                      },
                    }}
                  />
                </Box>
              )}
            </>
          )}
        </motion.div>
      </Box>

      <NotificationModal
        isOpen={notificationDialog.open}
        onClose={handleNotificationClose}
        title={notificationDialog.title}
        message={notificationDialog.message}
        type={notificationDialog.type}
      />

      {/* Customer Detail Popup */}
      <Dialog
        open={detailDialogOpen}
        onClose={handleCloseCustomerDetail}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { width: { xs: "95%", sm: 600 }, maxHeight: "90vh", overflowY: "auto", borderRadius: 1 } }}
      >
        <DialogTitle
          sx={{
            bgcolor: theme.palette.primary.main,
            color: theme.palette.getContrastText(theme.palette.primary.main),
            position: "relative",
          }}
        >
          Customer Details
          <IconButton
            onClick={handleCloseCustomerDetail}
            sx={{ position: "absolute", top: 8, right: 8, color: theme.palette.getContrastText(theme.palette.primary.main) }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {selectedCustomer && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                {selectedCustomer.name}
              </Typography>
              <Grid container spacing={1} sx={{ mt: 0.5 }}>
                <Grid item xs={12} sm={6}>
                  <Typography sx={{ fontSize: "0.875rem" }}>
                    <strong>Contact:</strong> {selectedCustomer.contact || "N/A"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography sx={{ fontSize: "0.875rem" }}>
                    <strong>Email:</strong> {selectedCustomer.email || "N/A"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography sx={{ fontSize: "0.875rem" }}>
                    <strong>Firm:</strong> {selectedCustomer.firm?.name || "N/A"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography sx={{ fontSize: "0.875rem" }}>
                    <strong>Customer Since:</strong>{" "}
                    {selectedCustomer.createdAt
                      ? new Date(selectedCustomer.createdAt).toLocaleDateString("en-CA")
                      : "N/A"}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography sx={{ fontSize: "0.875rem" }}>
                    <strong>Address:</strong> {selectedCustomer.address || "N/A"}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}

          <Divider sx={{ mb: 2 }} />

          {detailLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress size={28} />
            </Box>
          ) : customerDetail?.error ? (
            <Typography color="error" sx={{ fontSize: "0.875rem" }}>
              {customerDetail.error}
            </Typography>
          ) : customerDetail ? (
            <>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6} sm={3}>
                  <Typography sx={{ fontSize: "0.75rem", color: theme.palette.text.secondary }}>
                    Total Purchased
                  </Typography>
                  <Typography sx={{ fontWeight: 700 }}>
                    ₹{customerDetail.totalPurchased.toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography sx={{ fontSize: "0.75rem", color: theme.palette.text.secondary }}>
                    Total Paid
                  </Typography>
                  <Typography sx={{ fontWeight: 700 }}>
                    ₹{customerDetail.totalPaid.toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography sx={{ fontSize: "0.75rem", color: theme.palette.text.secondary }}>
                    Udhar Issued
                  </Typography>
                  <Typography sx={{ fontWeight: 700 }}>
                    ₹{customerDetail.totalUdharIssued.toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography sx={{ fontSize: "0.75rem", color: theme.palette.text.secondary }}>
                    Outstanding Due
                  </Typography>
                  <Typography
                    sx={{
                      fontWeight: 700,
                      color: customerDetail.outstanding > 0 ? theme.palette.error.main : theme.palette.success.main,
                    }}
                  >
                    ₹{customerDetail.outstanding.toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>

              <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                Purchase History
              </Typography>
              {customerDetail.sales.length === 0 ? (
                <Typography sx={{ fontSize: "0.875rem", color: theme.palette.text.secondary }}>
                  No purchases yet.
                </Typography>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Invoice #</TableCell>
                        <TableCell>Payment</TableCell>
                        <TableCell align="right">Amount (₹)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {customerDetail.sales.map((sale) => (
                        <TableRow key={sale._id}>
                          <TableCell>
                            {new Date(sale.saleDate).toLocaleDateString("en-CA")}
                          </TableCell>
                          <TableCell>{sale.invoiceNumber || "N/A"}</TableCell>
                          <TableCell sx={{ textTransform: "capitalize" }}>
                            {sale.paymentMethod || "N/A"}
                          </TableCell>
                          <TableCell align="right">
                            {(sale.totalAmount || 0).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2 }}>
          <Button onClick={handleCloseCustomerDetail} sx={{ textTransform: "none" }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default CustomerManagement;
