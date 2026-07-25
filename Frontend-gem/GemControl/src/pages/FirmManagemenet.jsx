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
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  Pagination,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { motion } from "framer-motion";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Search, Add, Delete, Close, Edit } from "@mui/icons-material";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { OptimizedImage } from "../utils/imageUtils";
import { setError as setAuthError } from "../redux/authSlice";
import { ROUTES } from "../utils/routes";
import api from "../utils/api";
import NotificationModal from "../components/NotificationModal";

function FirmManagement() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user: currentUser } = useSelector((state) => state.auth);
  const [searchQuery, setSearchQuery] = useState("");
  const [firms, setFirms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const emptyFirm = {
    logo: null,
    firmStamp: null,
    ownerSignature: null,
    name: "",
    location: "",
    size: "",
    proprietorName: "",
    gst: "",
    email: "",
    contact: "",
    bankName: "",
    branch: "",
    accountNo: "",
    ifscCode: "",
  };
  const [newFirm, setNewFirm] = useState(emptyFirm);
  const [editFirm, setEditFirm] = useState(null);
  const [notificationDialog, setNotificationDialog] = useState({
    open: false,
    message: "",
    type: "info",
    title: "",
  });
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

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

  const fetchFirms = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/getAllFirms");
      setFirms(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("GetFirms error:", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      const errorMessage =
        err.response?.status === 401
          ? "Please log in to view firms."
          : err.response?.data?.message || "Failed to load firms.";
      setNotificationDialog({
        open: true,
        message: errorMessage,
        type: "error",
        title: "Error",
      });
      if (err.response?.status === 401) {
        dispatch(setAuthError(errorMessage));
        navigate(ROUTES.LOGIN);
      }
    } finally {
      setLoading(false);
    }
  }, [dispatch, navigate]);

  useEffect(() => {
    fetchFirms();
  }, [fetchFirms]);

  const validateForm = (firm) => {
    const errors = {};
    
    if (!firm.name.trim()) errors.name = "Name is required";
    if (!firm.location.trim()) errors.location = "Location is required";
    else if (!/^([^0-9]*)$/.test(firm.location))
      errors.location = "Invalid location ";
    if (!firm.size.trim()) errors.size = "Size is required";
    else if (/^([^0-9]*)$/.test(firm.size))
      errors.size = "Size should be number ";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddFirm = () => {
    if (!currentUser) {
      setNotificationDialog({
        open: true,
        message: "Please log in to add firms.",
        type: "error",
        title: "Authentication Required",
      });
      dispatch(setAuthError("Please log in to add firms."));
      navigate(ROUTES.LOGIN);
      return;
    }
    setNewFirm(emptyFirm);
    setFormErrors({});
    setOpenAddModal(true);
  };

  const handleEditFirm = (firm) => {
    setEditFirm({
      _id: firm._id,
      logo: null,
      firmStamp: null,
      ownerSignature: null,
      existingLogo: firm.logo || "",
      existingFirmStamp: firm.firmStamp || "",
      existingOwnerSignature: firm.ownerSignature || "",
      name: firm.name || "",
      location: firm.location || "",
      size: firm.size || "",
      proprietorName: firm.proprietorName || "",
      gst: firm.gst || "",
      email: firm.email || "",
      contact: firm.contact || "",
      bankName: firm.bankName || "",
      branch: firm.branch || "",
      accountNo: firm.accountNo || "",
      ifscCode: firm.ifscCode || "",
    });
    setFormErrors({});
    setOpenEditModal(true);
  };

  const handleDeleteFirm = async (firmId) => {
    if (!window.confirm("Are you sure you want to delete this firm?")) return;
    try {
      setLoading(true);
      await api.get(`/removeFirm?firmId=${firmId}`);
      setFirms(firms.filter((firm) => firm._id !== firmId));
      setNotificationDialog({
        open: true,
        message: "Firm deleted successfully!",
        type: "success",
        title: "Success",
      });
    } catch (err) {
      console.error("DeleteFirm error:", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      const errorMessage =
        err.response?.data?.message || "Failed to delete firm.";
      setNotificationDialog({
        open: true,
        message: errorMessage,
        type: "error",
        title: "Error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setPage(1); // Reset to first page on search
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    setNewFirm({
      ...newFirm,
      [name]: files ? files[0] : value,
    });
    setFormErrors({ ...formErrors, [name]: null, submit: null });
  };

  const handleSaveFirm = useCallback(async () => {
    if (!validateForm(newFirm)) {
      setNotificationDialog({
        open: true,
        message: "Please correct the form errors.",
        type: "error",
        title: "Validation Error",
      });
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      if (newFirm.logo) formData.append("logo", newFirm.logo);
      if (newFirm.firmStamp) formData.append("firmStamp", newFirm.firmStamp);
      if (newFirm.ownerSignature)
        formData.append("ownerSignature", newFirm.ownerSignature);
      formData.append("name", newFirm.name);
      formData.append("location", newFirm.location);
      formData.append("size", newFirm.size);
      formData.append("proprietorName", newFirm.proprietorName);
      formData.append("gst", newFirm.gst);
      formData.append("email", newFirm.email);
      formData.append("contact", newFirm.contact);
      formData.append("bankName", newFirm.bankName);
      formData.append("branch", newFirm.branch);
      formData.append("accountNo", newFirm.accountNo);
      formData.append("ifscCode", newFirm.ifscCode);

      await api.post("/createFirm", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await fetchFirms();
      setOpenAddModal(false);
      setNewFirm(emptyFirm);
      setFormErrors({});
      setNotificationDialog({
        open: true,
        message: "Firm added successfully!",
        type: "success",
        title: "Success",
      });
    } catch (err) {
      console.error("CreateFirm error:", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      const errorMessage = err.response?.data?.message || "Failed to add firm.";
      setFormErrors({ submit: errorMessage });
      setNotificationDialog({
        open: true,
        message: errorMessage,
        type: "error",
        title: "Error",
      });
    } finally {
      setLoading(false);
    }
  }, [newFirm, fetchFirms]);

  const handleEditInputChange = (e) => {
    const { name, value, files } = e.target;
    setEditFirm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
    setFormErrors({ ...formErrors, [name]: null, submit: null });
  };

  const handleUpdateFirm = useCallback(async () => {
    if (!editFirm || !validateForm(editFirm)) {
      setNotificationDialog({
        open: true,
        message: "Please correct the form errors.",
        type: "error",
        title: "Validation Error",
      });
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("firmId", editFirm._id);
      if (editFirm.logo) formData.append("logo", editFirm.logo);
      if (editFirm.firmStamp) formData.append("firmStamp", editFirm.firmStamp);
      if (editFirm.ownerSignature)
        formData.append("ownerSignature", editFirm.ownerSignature);
      formData.append("name", editFirm.name);
      formData.append("location", editFirm.location);
      formData.append("size", editFirm.size);
      formData.append("proprietorName", editFirm.proprietorName);
      formData.append("gst", editFirm.gst);
      formData.append("email", editFirm.email);
      formData.append("contact", editFirm.contact);
      formData.append("bankName", editFirm.bankName);
      formData.append("branch", editFirm.branch);
      formData.append("accountNo", editFirm.accountNo);
      formData.append("ifscCode", editFirm.ifscCode);

      await api.put("/updateFirm", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await fetchFirms();
      setOpenEditModal(false);
      setEditFirm(null);
      setFormErrors({});
      setNotificationDialog({
        open: true,
        message: "Firm updated successfully!",
        type: "success",
        title: "Success",
      });
    } catch (err) {
      console.error("UpdateFirm error:", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      const errorMessage =
        err.response?.data?.message || "Failed to update firm.";
      setFormErrors({ submit: errorMessage });
      setNotificationDialog({
        open: true,
        message: errorMessage,
        type: "error",
        title: "Error",
      });
    } finally {
      setLoading(false);
    }
  }, [editFirm, fetchFirms]);

  const handleCancel = () => {
    setOpenAddModal(false);
    setOpenEditModal(false);
    setNewFirm(emptyFirm);
    setEditFirm(null);
    setFormErrors({});
  };

  const handleNotificationClose = () => {
    setNotificationDialog({ ...notificationDialog, open: false });
  };

  const filteredFirms = useMemo(
    () =>
      firms.filter(
        (firm) =>
          firm &&
          ((firm.name || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
            (firm.location || "")
              .toLowerCase()
              .includes(searchQuery.toLowerCase()))
      ),
    [firms, searchQuery]
  );

  const paginatedFirms = useMemo(
    () => filteredFirms.slice((page - 1) * itemsPerPage, page * itemsPerPage),
    [filteredFirms, page]
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
            Firm Management
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
              onClick={handleAddFirm}
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
              aria-label="Add new firm"
            >
              Add Firm
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
              <IconButton
                sx={{ p: { xs: 0.5, sm: 1 } }}
                aria-label="Search firms"
              >
                <Search sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }} />
              </IconButton>
              <InputBase
                sx={{
                  ml: 1,
                  flex: 1,
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                }}
                placeholder="Search firms..."
                value={searchQuery}
                onChange={handleSearch}
                inputProps={{ "aria-label": "Search firms" }}
              />
            </Paper>
          </Box>
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
          ) : filteredFirms.length === 0 ? (
            <Typography
              sx={{
                color: theme.palette.text.primary,
                textAlign: "center",
                py: { xs: 2, sm: 3 },
                fontSize: { xs: "0.875rem", sm: "1rem" },
              }}
            >
              No firms found.
            </Typography>
          ) : (
            <>
              {/* Mobile Card Layout */}
              <Box sx={{ display: { xs: "block", sm: "none" } }}>
                {paginatedFirms.map((firm) => (
                  <Card
                    key={firm._id}
                    sx={{
                      mb: 2,
                      borderRadius: 1,
                      boxShadow: theme.shadows[2],
                      "&:hover": { boxShadow: theme.shadows[4] },
                    }}
                  >
                    <CardContent
                      sx={{
                        p: { xs: 1, sm: 2 },
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                      }}
                    >
                      {firm.logo ? (
                        <Box
                          sx={{
                            width: 60,
                            height: 60,
                            borderRadius: 1,
                            overflow: "hidden",
                            alignSelf: "center",
                          }}
                        >
                          <OptimizedImage
                            src={firm.logo}
                            alt={`${firm.name || "Firm"} logo`}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "contain",
                            }}
                            fallbackSrc="/fallback-logo.png"
                          />
                        </Box>
                      ) : (
                        <Typography
                          sx={{ fontSize: "0.75rem", textAlign: "center" }}
                        >
                          No Logo
                        </Typography>
                      )}
                      <Typography
                        sx={{ fontSize: "0.875rem", fontWeight: "bold" }}
                      >
                        {firm.name || "N/A"}
                      </Typography>
                      <Typography sx={{ fontSize: "0.75rem" }}>
                        Location: {firm.location || "N/A"}
                      </Typography>
                      <Typography sx={{ fontSize: "0.75rem" }}>
                        Size: {firm.size || "N/A"}
                      </Typography>
                    </CardContent>
                    <CardActions sx={{ p: 1, justifyContent: "center", gap: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Edit fontSize="small" />}
                        onClick={() => handleEditFirm(firm)}
                        sx={{ fontSize: "0.75rem", px: 1, textTransform: "none" }}
                        aria-label="Edit firm"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        color="error"
                        startIcon={<Delete fontSize="small" />}
                        onClick={() => handleDeleteFirm(firm._id)}
                        sx={{
                          fontSize: "0.75rem",
                          px: 1,
                          textTransform: "none",
                        }}
                        aria-label="Delete firm"
                      >
                        Delete
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
                  borderRadius: 1,
                  boxShadow: theme.shadows[2],
                }}
              >
                <Table
                  sx={{
                    minWidth: 650,
                    "& .MuiTableCell-root": {
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
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
                      <TableCell sx={{ minWidth: 100 }}>Logo</TableCell>
                      <TableCell sx={{ minWidth: 150 }}>Firm Name</TableCell>
                      <TableCell sx={{ minWidth: 150 }}>Location</TableCell>
                      <TableCell
                        sx={{
                          minWidth: 100,
                          display: { xs: "none", md: "table-cell" },
                        }}
                      >
                        Size
                      </TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedFirms.map((firm) => (
                      <TableRow
                        key={firm._id}
                        sx={{
                          "&:hover": { bgcolor: theme.palette.action.hover },
                          "& td": {
                            px: { xs: 1, sm: 2 },
                            py: 1,
                          },
                        }}
                      >
                        <TableCell>
                          {firm.logo ? (
                            <Box
                              sx={{
                                width: { xs: 40, sm: 50 },
                                height: { xs: 40, sm: 50 },
                                borderRadius: 1,
                                overflow: "hidden",
                              }}
                            >
                              <OptimizedImage
                                src={firm.logo}
                                alt={`${firm.name || "Firm"} logo`}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "contain",
                                }}
                                fallbackSrc="/fallback-logo.png"
                              />
                            </Box>
                          ) : (
                            <Typography
                              sx={{
                                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                              }}
                            >
                              No Logo
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>{firm.name || "N/A"}</TableCell>
                        <TableCell>{firm.location || "N/A"}</TableCell>
                        <TableCell
                          sx={{ display: { xs: "none", md: "table-cell" } }}
                        >
                          {firm.size || "N/A"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Edit fontSize="small" />}
                            onClick={() => handleEditFirm(firm)}
                            sx={{ fontSize: "0.75rem", px: 1, mr: 1, textTransform: "none" }}
                            aria-label="Edit firm"
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            color="error"
                            startIcon={<Delete fontSize="small" />}
                            onClick={() => handleDeleteFirm(firm._id)}
                            sx={{
                              fontSize: "0.75rem",
                              px: 1,
                              textTransform: "none",
                            }}
                            aria-label="Delete firm"
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {filteredFirms.length > 0 && (
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
                  <Typography
                    sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
                  >
                    Total Firms: {filteredFirms.length}
                  </Typography>
                  <Pagination
                    count={Math.ceil(filteredFirms.length / itemsPerPage)}
                    page={page}
                    onChange={(e, value) => setPage(value)}
                    sx={{
                      "& .MuiPaginationItem-root": {
                        fontSize: { xs: "0.75rem", sm: "0.875rem" },
                      },
                    }}
                  />
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
            boxShadow: theme.shadows[10],
          },
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: theme.palette.primary.main,
            color: theme.palette.getContrastText(theme.palette.primary.main),
            py: { xs: 1, sm: 1.5 },
            fontSize: { xs: "0.875rem", sm: "1rem" },
            position: "relative",
          }}
        >
          Add New Firm
          <IconButton
            onClick={handleCancel}
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              color: theme.palette.getContrastText(theme.palette.primary.main),
              p: 0.5,
            }}
            aria-label="Close dialog"
          >
            <Close sx={{ fontSize: { xs: "1rem", sm: "1.2rem" } }} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: { xs: 1, sm: 2 }, pb: { xs: 1, sm: 2 } }}>
          {formErrors.submit && (
            <Box
              sx={{
                mb: 1,
                p: 1,
                bgcolor: theme.palette.error.light,
                borderRadius: 1,
                color: theme.palette.error.contrastText,
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
              }}
            >
              {formErrors.submit}
            </Box>
          )}
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Firm Name"
            type="text"
            fullWidth
            value={newFirm.name}
            onChange={handleInputChange}
            error={!!formErrors.name}
            helperText={formErrors.name}
            sx={{
              mb: { xs: 1, sm: 2 },
              "& .MuiInputBase-input": {
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
              },
              "& .MuiInputLabel-root": {
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
              },
            }}
            required
            inputProps={{ "aria-label": "Firm name" }}
          />
          <TextField
            margin="dense"
            name="location"
            label="Location"
            type="text"
            fullWidth
            value={newFirm.location}
            onChange={handleInputChange}
            error={!!formErrors.location}
            helperText={formErrors.location}
            sx={{
              mb: { xs: 1, sm: 2 },
              "& .MuiInputBase-input": {
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
              },
              "& .MuiInputLabel-root": {
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
              },
            }}
            required
            inputProps={{ "aria-label": "Firm location" }}
          />
          <TextField
            margin="dense"
            name="size"
            label="Size"
            type="text"
            fullWidth
            value={newFirm.size}
            onChange={handleInputChange}
            error={!!formErrors.size}
            helperText={formErrors.size}
            sx={{
              mb: { xs: 1, sm: 2 },
              "& .MuiInputBase-input": {
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
              },
              "& .MuiInputLabel-root": {
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
              },
            }}
            required
            inputProps={{ "aria-label": "Firm size" }}
          />
          <TextField
            margin="dense"
            name="proprietorName"
            label="Proprietor Name (printed on invoices)"
            type="text"
            fullWidth
            value={newFirm.proprietorName}
            onChange={handleInputChange}
            sx={{ mb: { xs: 1, sm: 2 } }}
            inputProps={{ "aria-label": "Proprietor name" }}
          />
          <TextField
            margin="dense"
            name="gst"
            label="GSTIN"
            type="text"
            fullWidth
            value={newFirm.gst}
            onChange={handleInputChange}
            sx={{ mb: { xs: 1, sm: 2 } }}
            inputProps={{ "aria-label": "GSTIN" }}
          />
          <TextField
            margin="dense"
            name="email"
            label="Email"
            type="email"
            fullWidth
            value={newFirm.email}
            onChange={handleInputChange}
            sx={{ mb: { xs: 1, sm: 2 } }}
            inputProps={{ "aria-label": "Firm email" }}
          />
          <TextField
            margin="dense"
            name="contact"
            label="Contact / Mobile No."
            type="text"
            fullWidth
            value={newFirm.contact}
            onChange={handleInputChange}
            sx={{ mb: { xs: 1, sm: 2 } }}
            inputProps={{ "aria-label": "Firm contact" }}
          />
          <TextField
            margin="dense"
            name="bankName"
            label="Bank Name"
            type="text"
            fullWidth
            value={newFirm.bankName}
            onChange={handleInputChange}
            sx={{ mb: { xs: 1, sm: 2 } }}
            inputProps={{ "aria-label": "Bank name" }}
          />
          <TextField
            margin="dense"
            name="branch"
            label="Branch"
            type="text"
            fullWidth
            value={newFirm.branch}
            onChange={handleInputChange}
            sx={{ mb: { xs: 1, sm: 2 } }}
            inputProps={{ "aria-label": "Bank branch" }}
          />
          <TextField
            margin="dense"
            name="accountNo"
            label="Account No."
            type="text"
            fullWidth
            value={newFirm.accountNo}
            onChange={handleInputChange}
            sx={{ mb: { xs: 1, sm: 2 } }}
            inputProps={{ "aria-label": "Account number" }}
          />
          <TextField
            margin="dense"
            name="ifscCode"
            label="IFSC Code"
            type="text"
            fullWidth
            value={newFirm.ifscCode}
            onChange={handleInputChange}
            sx={{ mb: { xs: 1, sm: 2 } }}
            inputProps={{ "aria-label": "IFSC code" }}
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
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                width: { xs: "100%", sm: "auto" },
                textTransform: "none",
              }}
              aria-label="Upload firm logo"
            >
              Upload Logo
              <input
                type="file"
                hidden
                name="logo"
                onChange={handleInputChange}
                accept="image/*"
                aria-label="Select firm logo"
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
              {newFirm.logo ? newFirm.logo.name : "No file chosen"}
            </Typography>
            {newFirm.logo && (
              <img
                src={URL.createObjectURL(newFirm.logo)}
                alt="Logo preview"
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 4,
                  marginTop: 8,
                  objectFit: "contain",
                }}
                onError={(e) => {
                  console.error("Failed to preview logo");
                  e.target.src = "/fallback-logo.png";
                }}
              />
            )}
            {formErrors.logo && (
              <Typography
                color="error"
                variant="caption"
                sx={{ fontSize: { xs: "0.7rem", sm: "0.8rem" }, mt: 1 }}
              >
                {formErrors.logo}
              </Typography>
            )}
          </Box>
          <Box sx={{ mb: { xs: 1, sm: 2 } }}>
            <Button
              variant="contained"
              component="label"
              sx={{
                bgcolor: theme.palette.secondary.main,
                color: theme.palette.getContrastText(theme.palette.secondary.main),
                "&:hover": { bgcolor: theme.palette.secondary.dark },
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                width: { xs: "100%", sm: "auto" },
                textTransform: "none",
              }}
              aria-label="Upload firm stamp"
            >
              Upload Firm Stamp
              <input
                type="file"
                hidden
                name="firmStamp"
                onChange={handleInputChange}
                accept="image/*"
                aria-label="Select firm stamp"
              />
            </Button>
            <Typography
              variant="body2"
              sx={{ mt: 1, color: theme.palette.text.secondary, fontSize: { xs: "0.7rem", sm: "0.8rem" } }}
            >
              {newFirm.firmStamp ? newFirm.firmStamp.name : "No file chosen"}
            </Typography>
          </Box>
          <Box sx={{ mb: { xs: 1, sm: 2 } }}>
            <Button
              variant="contained"
              component="label"
              sx={{
                bgcolor: theme.palette.secondary.main,
                color: theme.palette.getContrastText(theme.palette.secondary.main),
                "&:hover": { bgcolor: theme.palette.secondary.dark },
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                width: { xs: "100%", sm: "auto" },
                textTransform: "none",
              }}
              aria-label="Upload owner signature"
            >
              Upload Owner Signature
              <input
                type="file"
                hidden
                name="ownerSignature"
                onChange={handleInputChange}
                accept="image/*"
                aria-label="Select owner signature"
              />
            </Button>
            <Typography
              variant="body2"
              sx={{ mt: 1, color: theme.palette.text.secondary, fontSize: { xs: "0.7rem", sm: "0.8rem" } }}
            >
              {newFirm.ownerSignature ? newFirm.ownerSignature.name : "No file chosen"}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            flexDirection: { xs: "column", sm: "row" },
            gap: { xs: 1, sm: 2 },
            px: { xs: 1, sm: 2 },
            pb: { xs: 1, sm: 2 },
          }}
        >
          <Button
            onClick={handleCancel}
            sx={{
              fontSize: { xs: "0.75rem", sm: "0.875rem" },
              width: { xs: "100%", sm: "auto" },
              textTransform: "none",
            }}
            aria-label="Cancel"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveFirm}
            variant="contained"
            sx={{
              bgcolor: theme.palette.primary.main,
              color: theme.palette.getContrastText(theme.palette.primary.main),
              "&:hover": { bgcolor: theme.palette.primary.dark },
              fontSize: { xs: "0.75rem", sm: "0.875rem" },
              width: { xs: "100%", sm: "auto" },
              textTransform: "none",
            }}
            aria-label="Save firm"
          >
            Save Firm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Firm Modal */}
      <Dialog
        open={openEditModal}
        onClose={handleCancel}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            width: { xs: "95%", sm: 500 },
            maxHeight: "90vh",
            overflowY: "auto",
            borderRadius: 1,
            boxShadow: theme.shadows[10],
          },
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: theme.palette.primary.main,
            color: theme.palette.getContrastText(theme.palette.primary.main),
            py: { xs: 1, sm: 1.5 },
            fontSize: { xs: "0.875rem", sm: "1rem" },
            position: "relative",
          }}
        >
          Edit Firm
          <IconButton
            onClick={handleCancel}
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              color: theme.palette.getContrastText(theme.palette.primary.main),
              p: 0.5,
            }}
            aria-label="Close dialog"
          >
            <Close sx={{ fontSize: { xs: "1rem", sm: "1.2rem" } }} />
          </IconButton>
        </DialogTitle>
        {editFirm && (
          <>
            <DialogContent sx={{ pt: { xs: 1, sm: 2 }, pb: { xs: 1, sm: 2 } }}>
              {formErrors.submit && (
                <Box
                  sx={{
                    mb: 1,
                    p: 1,
                    bgcolor: theme.palette.error.light,
                    borderRadius: 1,
                    color: theme.palette.error.contrastText,
                    fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  }}
                >
                  {formErrors.submit}
                </Box>
              )}
              <TextField
                autoFocus
                margin="dense"
                name="name"
                label="Firm Name"
                fullWidth
                value={editFirm.name}
                onChange={handleEditInputChange}
                error={!!formErrors.name}
                helperText={formErrors.name}
                sx={{ mb: { xs: 1, sm: 2 } }}
                required
              />
              <TextField
                margin="dense"
                name="location"
                label="Location"
                fullWidth
                value={editFirm.location}
                onChange={handleEditInputChange}
                error={!!formErrors.location}
                helperText={formErrors.location}
                sx={{ mb: { xs: 1, sm: 2 } }}
                required
              />
              <TextField
                margin="dense"
                name="size"
                label="Size"
                fullWidth
                value={editFirm.size}
                onChange={handleEditInputChange}
                error={!!formErrors.size}
                helperText={formErrors.size}
                sx={{ mb: { xs: 1, sm: 2 } }}
                required
              />
              <TextField
                margin="dense"
                name="proprietorName"
                label="Proprietor Name (printed on invoices)"
                fullWidth
                value={editFirm.proprietorName}
                onChange={handleEditInputChange}
                sx={{ mb: { xs: 1, sm: 2 } }}
              />
              <TextField
                margin="dense"
                name="gst"
                label="GSTIN"
                fullWidth
                value={editFirm.gst}
                onChange={handleEditInputChange}
                sx={{ mb: { xs: 1, sm: 2 } }}
              />
              <TextField
                margin="dense"
                name="email"
                label="Email"
                type="email"
                fullWidth
                value={editFirm.email}
                onChange={handleEditInputChange}
                sx={{ mb: { xs: 1, sm: 2 } }}
              />
              <TextField
                margin="dense"
                name="contact"
                label="Contact / Mobile No."
                fullWidth
                value={editFirm.contact}
                onChange={handleEditInputChange}
                sx={{ mb: { xs: 1, sm: 2 } }}
              />
              <TextField
                margin="dense"
                name="bankName"
                label="Bank Name"
                fullWidth
                value={editFirm.bankName}
                onChange={handleEditInputChange}
                sx={{ mb: { xs: 1, sm: 2 } }}
              />
              <TextField
                margin="dense"
                name="branch"
                label="Branch"
                fullWidth
                value={editFirm.branch}
                onChange={handleEditInputChange}
                sx={{ mb: { xs: 1, sm: 2 } }}
              />
              <TextField
                margin="dense"
                name="accountNo"
                label="Account No."
                fullWidth
                value={editFirm.accountNo}
                onChange={handleEditInputChange}
                sx={{ mb: { xs: 1, sm: 2 } }}
              />
              <TextField
                margin="dense"
                name="ifscCode"
                label="IFSC Code"
                fullWidth
                value={editFirm.ifscCode}
                onChange={handleEditInputChange}
                sx={{ mb: { xs: 1, sm: 2 } }}
              />

              {[
                { key: "logo", label: "Logo", existingKey: "existingLogo" },
                { key: "firmStamp", label: "Firm Stamp", existingKey: "existingFirmStamp" },
                { key: "ownerSignature", label: "Owner Signature", existingKey: "existingOwnerSignature" },
              ].map(({ key, label, existingKey }) => (
                <Box key={key} sx={{ mb: { xs: 1, sm: 2 } }}>
                  <Button
                    variant="contained"
                    component="label"
                    sx={{
                      bgcolor: theme.palette.secondary.main,
                      color: theme.palette.getContrastText(theme.palette.secondary.main),
                      "&:hover": { bgcolor: theme.palette.secondary.dark },
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                      width: { xs: "100%", sm: "auto" },
                      textTransform: "none",
                    }}
                  >
                    Replace {label}
                    <input
                      type="file"
                      hidden
                      name={key}
                      onChange={handleEditInputChange}
                      accept="image/*"
                    />
                  </Button>
                  <Box sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1 }}>
                    {editFirm[key] ? (
                      <Typography sx={{ fontSize: { xs: "0.7rem", sm: "0.8rem" } }}>
                        {editFirm[key].name}
                      </Typography>
                    ) : editFirm[existingKey] ? (
                      <>
                        <Box sx={{ width: 40, height: 40, borderRadius: 1, overflow: "hidden" }}>
                          <OptimizedImage
                            src={editFirm[existingKey]}
                            alt={label}
                            style={{ width: "100%", height: "100%", objectFit: "contain" }}
                            fallbackSrc="/fallback-logo.png"
                          />
                        </Box>
                        <Typography sx={{ fontSize: { xs: "0.7rem", sm: "0.8rem" }, color: theme.palette.text.secondary }}>
                          Current {label.toLowerCase()} on file
                        </Typography>
                      </>
                    ) : (
                      <Typography sx={{ fontSize: { xs: "0.7rem", sm: "0.8rem" }, color: theme.palette.text.secondary }}>
                        No {label.toLowerCase()} uploaded yet
                      </Typography>
                    )}
                  </Box>
                </Box>
              ))}
            </DialogContent>
            <DialogActions
              sx={{
                flexDirection: { xs: "column", sm: "row" },
                gap: { xs: 1, sm: 2 },
                px: { xs: 1, sm: 2 },
                pb: { xs: 1, sm: 2 },
              }}
            >
              <Button
                onClick={handleCancel}
                sx={{
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  width: { xs: "100%", sm: "auto" },
                  textTransform: "none",
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateFirm}
                variant="contained"
                sx={{
                  bgcolor: theme.palette.primary.main,
                  color: theme.palette.getContrastText(theme.palette.primary.main),
                  "&:hover": { bgcolor: theme.palette.primary.dark },
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  width: { xs: "100%", sm: "auto" },
                  textTransform: "none",
                }}
              >
                Update Firm
              </Button>
            </DialogActions>
          </>
        )}
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

export default FirmManagement;
