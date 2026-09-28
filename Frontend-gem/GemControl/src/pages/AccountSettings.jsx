import { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Alert,
  Avatar,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import SymbolIcon from "../components/SymbolIcon";
import { logout } from "../redux/authSlice";
import { ROUTES } from "../utils/routes";
import api from "../utils/api";

// Self-service account deletion -- required by Apple App Store guideline
// 5.1.1(v) (any app offering account creation must also offer in-app
// deletion), and offered on web/Android too for consistency. See
// Backend/Controllers/adminController.js's deleteMyAccount for the actual
// policy: deletion deactivates login immediately but keeps business
// records (customers, sales, GST invoices, stock) intact, since India's
// GST rules require those retained regardless of account deletion.
function AccountSettings() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const isAdmin = user?.role?.toLowerCase() === "admin";

  const [dialogOpen, setDialogOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const openDialog = () => {
    setPassword("");
    setError("");
    setDialogOpen(true);
  };
  const closeDialog = () => {
    if (submitting) return;
    setDialogOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!password) {
      setError("Enter your password to confirm.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await api.post("/deleteAccount", { password });
      dispatch(logout());
      navigate(ROUTES.LOGIN, {
        state: { message: "Your account has been deleted." },
      });
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete your account. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 640, mx: "auto" }}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
        Account Settings
      </Typography>

      <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }} elevation={0} variant="outlined">
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar sx={{ bgcolor: "primary.main", width: 48, height: 48 }}>
            <SymbolIcon name="person" size={24} />
          </Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight={600}>
              {user?.name || (isAdmin ? "Admin" : "Staff")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user?.email}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {isAdmin ? "Admin" : "Staff"}
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Card
        variant="outlined"
        sx={{
          borderRadius: 3,
          borderColor: theme.palette.error.main,
        }}
      >
        <CardContent>
          <Typography variant="subtitle1" fontWeight={700} color="error" sx={{ mb: 1 }}>
            Danger Zone
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {isAdmin
              ? "Deleting your account will immediately revoke login for you AND every staff member under your firm. Your firm's customers, sales, GST invoices and stock records are kept (as required for GST record-keeping) but the shop will no longer be manageable from RatnSetu."
              : "Deleting your account will immediately revoke your own login. Sales and other records you created stay attached to your firm."}
          </Typography>
          <Button
            variant="outlined"
            color="error"
            startIcon={<SymbolIcon name="delete_forever" size={18} />}
            onClick={openDialog}
            sx={{ textTransform: "none" }}
          >
            Delete Account
          </Button>
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: { bgcolor: theme.palette.background.paper, color: theme.palette.text.primary, borderRadius: 3 },
        }}
      >
        <DialogTitle sx={{ color: "error.main" }}>Delete your account?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2, color: theme.palette.text.secondary }}>
            {isAdmin
              ? "This deactivates your account and every staff account under your firm right away. This cannot be undone by you -- contact support within 30 days if this was a mistake."
              : "This deactivates your account right away. This cannot be undone by you -- contact support within 30 days if this was a mistake."}
          </DialogContentText>
          {isAdmin && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              If you're subscribed via Razorpay or the App Store, deleting your account here does
              NOT automatically stop future charges. Cancel your subscription separately first.
            </Alert>
          )}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            type="password"
            label="Confirm your password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ flexDirection: { xs: "column", sm: "row" }, gap: 1, p: 2 }}>
          <Button
            onClick={closeDialog}
            variant="outlined"
            fullWidth
            disabled={submitting}
            sx={{ textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            fullWidth
            disabled={submitting}
            sx={{ textTransform: "none" }}
          >
            {submitting ? "Deleting..." : "Delete My Account"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AccountSettings;
