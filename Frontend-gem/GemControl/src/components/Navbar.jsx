import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Switch,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
} from "@mui/material";
import SymbolIcon from "./SymbolIcon";
import { logout } from "../redux/authSlice";
import { toggleTheme } from "../redux/themeSlice";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../utils/routes";
import api from "../utils/api";
import { useTheme } from "@mui/material/styles";
import PropTypes from "prop-types";
import { SAFE_LEFT, SAFE_RIGHT, SAFE_TOP } from "../config/layout";

function Navbar({ onMenuClick }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const darkMode = useSelector((state) => state.theme.darkMode);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const [openDialog, setOpenDialog] = useState(false);
  const theme = useTheme();

  const handleLogout = () => {
    setOpenDialog(true);
  };

  const handleConfirmLogout = async () => {
    try {
      await api.get("/logout");
    } catch (err) {
    } finally {
      dispatch(logout());
      navigate(ROUTES.LOGIN);
      setOpenDialog(false);
    }
  };

  const handleCancelLogout = () => {
    setOpenDialog(false);
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        zIndex: theme.zIndex.drawer + 1,
        backgroundColor: theme.palette.surfaces.lowest,
        boxShadow: "0 1px 8px rgba(0,0,0,0.04)",
        borderBottom: `1px solid ${theme.palette.divider}`,
        paddingTop: SAFE_TOP,
      }}
    >
      <Toolbar
        sx={{
          justifyContent: "space-between",
          pl: {
            xs: `max(8px, ${SAFE_LEFT})`,
            sm: `max(16px, ${SAFE_LEFT})`,
            md: `max(24px, ${SAFE_LEFT})`,
          },
          pr: {
            xs: `max(8px, ${SAFE_RIGHT})`,
            sm: `max(16px, ${SAFE_RIGHT})`,
            md: `max(24px, ${SAFE_RIGHT})`,
          },
          py: { xs: 0.5, sm: 1 },
        }}
      >
        {isAuthenticated && onMenuClick && (
          <IconButton
            onClick={onMenuClick}
            aria-label="Open navigation menu"
            aria-haspopup="dialog"
            sx={{
              display: { xs: "inline-flex", lg: "none" },
              width: 44,
              height: 44,
              mr: 0.5,
              color: "text.secondary",
              borderRadius: 2,
              "&:hover": { bgcolor: "surfaces.high", color: "text.primary" },
            }}
          >
            <SymbolIcon name="menu" size={24} />
          </IconButton>
        )}
        <Typography
          variant="h6"
          sx={{
            flexGrow: 1,
            fontSize: { xs: "1rem", sm: "1.2rem", md: "1.5rem" },
            whiteSpace: { xs: "nowrap", sm: "normal" },
            overflow: "hidden",
            textOverflow: "ellipsis",
            color: "primary.main",
          }}
        >
          RatnSetu
        </Typography>
        {isAuthenticated && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: { xs: 0.5, sm: 1 },
            }}
          >
            <SymbolIcon
              name={darkMode ? "dark_mode" : "light_mode"}
              size={18}
              sx={{ color: "text.secondary" }}
            />
            <Switch
              checked={darkMode}
              onChange={() => dispatch(toggleTheme())}
              color="secondary"
              sx={{ mr: { xs: 0, sm: 1 } }}
            />
            <IconButton
              onClick={handleLogout}
              aria-label="Log out"
              sx={{
                p: { xs: 0.5, sm: 1 },
                minWidth: { xs: 44, lg: 0 },
                minHeight: { xs: 44, lg: 0 },
                color: "text.secondary",
                borderRadius: 2,
                "&:hover": { bgcolor: "surfaces.high", color: "text.primary" },
              }}
            >
              <SymbolIcon name="logout" size={20} />
            </IconButton>
          </Box>
        )}
      </Toolbar>
      <Dialog
        open={openDialog}
        onClose={handleCancelLogout}
        aria-labelledby="logout-dialog-title"
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            bgcolor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            borderRadius: 3,
          }
        }}
      >
        <DialogTitle id="logout-dialog-title" sx={{ color: theme.palette.text.primary }}>Confirm Logout</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: { xs: "0.9rem", sm: "1rem" }, color: theme.palette.text.secondary }}>
            Are you sure you want to logout?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ flexDirection: { xs: "column", sm: "row" }, gap: 1 }}>
          <Button
            onClick={handleCancelLogout}
            color="primary"
            variant="outlined"
            fullWidth={true}
            sx={{ m: { xs: 0.5, sm: 1 }, textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmLogout}
            color="primary"
            variant="contained"
            autoFocus
            fullWidth={true}
            sx={{ m: { xs: 0.5, sm: 1 }, textTransform: 'none' }}
          >
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </AppBar>
  );
}

Navbar.propTypes = {
  onMenuClick: PropTypes.func,
};

export default Navbar;
