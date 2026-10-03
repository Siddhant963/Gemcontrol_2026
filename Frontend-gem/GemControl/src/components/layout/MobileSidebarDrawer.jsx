import PropTypes from "prop-types";
import { Box, Drawer, IconButton, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import NavList from "./NavList";
import SymbolIcon from "../SymbolIcon";
import { DRAWER_WIDTH, SAFE_BOTTOM, SAFE_LEFT, SAFE_TOP } from "../../config/layout";

const ratnSetuLogo = "/ratnsetu-logo.png";

/**
 * Temporary left drawer with the full labelled navigation. Used below 1200px
 * (mobile hamburger, and as the "full menu" companion to the tablet rail).
 * MUI's Modal provides the backdrop, outside-click/Esc close and body scroll lock.
 */
function MobileSidebarDrawer({ open, onClose }) {
  const theme = useTheme();
  return (
    <Drawer
      variant="temporary"
      open={open}
      onClose={onClose}
      sx={{
        // The fixed AppBar sits at drawer + 1; the temporary drawer (and its
        // backdrop) must cover it, otherwise header controls overlap the drawer.
        zIndex: theme.zIndex.drawer + 2,
        "& .MuiDrawer-paper": {
          width: DRAWER_WIDTH,
          maxWidth: "100%",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          bgcolor: theme.palette.surfaces.lowest,
          paddingTop: SAFE_TOP,
          paddingBottom: SAFE_BOTTOM,
          paddingLeft: SAFE_LEFT,
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          px: 2,
          py: 1,
          minHeight: 64,
          flexShrink: 0,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box
          component="img"
          src={ratnSetuLogo}
          alt="RatnSetu Logo"
          sx={{ width: 40, height: "auto", maxWidth: "100%", objectFit: "contain" }}
        />
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="h6" color="primary" fontWeight={600} noWrap sx={{ fontSize: "1.1rem" }}>
            RatnSetu
          </Typography>
          <Typography variant="overline" sx={{ color: "text.secondary", display: "block" }} noWrap>
            Jewellery Retail ERP
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          aria-label="Close navigation menu"
          sx={{
            width: 44,
            height: 44,
            color: "text.secondary",
            borderRadius: 2,
            "&:hover": { bgcolor: "surfaces.high", color: "text.primary" },
          }}
        >
          <SymbolIcon name="close" size={22} />
        </IconButton>
      </Box>
      <Box
        component="nav"
        aria-label="Main navigation"
        sx={{ flexGrow: 1, minHeight: 0, overflowY: "auto", overscrollBehavior: "contain" }}
      >
        <NavList variant="full" onNavigate={onClose} />
      </Box>
    </Drawer>
  );
}

MobileSidebarDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default MobileSidebarDrawer;
