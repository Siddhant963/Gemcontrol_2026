import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  GlobalStyles,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import { ROUTES } from "../utils/routes";
import SymbolIcon from "./SymbolIcon";

const ratnSetuLogo = "/ratnsetu-logo.png";

const menuItems = [
  { text: "Dashboard", icon: "grid_view", path: ROUTES.DASHBOARD, section: "Main" },
  {
    text: "Sales Management",
    icon: "point_of_sale",
    path: ROUTES.SALES_MANAGEMENT,
    section: "Sales & Billing",
  },
  { text: "Payments", icon: "payments", path: ROUTES.PAYMENTS, adminOnly: true, section: "Sales & Billing" },
  {
    text: "Raw Materials",
    icon: "toll",
    path: ROUTES.RAW_MATERIALS,
    section: "Inventory & Stock",
  },
  { text: "Categories", icon: "category", path: ROUTES.CATEGORIES, section: "Inventory & Stock" },
  {
    text: "Items Management",
    icon: "qr_code_scanner",
    path: ROUTES.ITEMS_MANAGEMENT,
    section: "Inventory & Stock",
  },
  {
    text: "Jewellery Panel",
    icon: "diamond",
    path: ROUTES.JEWELLERY_PANEL,
    section: "Inventory & Stock",
  },
  {
    text: "Customer Management",
    icon: "groups",
    path: ROUTES.CUSTOMER_MANAGEMENT,
    section: "Customers & Credit",
  },
  {
    text: "Udhar Management",
    icon: "menu_book",
    path: ROUTES.UDHAR_MANAGEMENT,
    adminOnly: true,
    section: "Customers & Credit",
  },
  {
    text: "Borrows Management",
    icon: "lock",
    path: ROUTES.GIRVI_MANAGEMENT,
    adminOnly: true,
    section: "Customers & Credit",
  },
  {
    text: "Day Book",
    icon: "auto_stories",
    path: ROUTES.DAY_BOOK,
    section: "Accounting & Reports",
  },
  { text: "User Management", icon: "badge", path: ROUTES.USER_MANAGEMENT, adminOnly: true, section: "System & Staff" },
  { text: "Firm Management", icon: "storefront", path: ROUTES.FIRM_MANAGEMENT, adminOnly: true, section: "System & Staff" },
];

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const user = useSelector((state) => state.auth.user);
  const isAdmin = user?.role?.toLowerCase() === "admin";
  const visibleMenuItems = menuItems.filter((item) => !item.adminOnly || isAdmin);

  const isActive = (path) => location.pathname === path;

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i) => ({
      opacity: 1,
      x: 0,
      transition: { delay: i * 0.1, duration: 0.3 },
    }),
    hover: { scale: 1.05, transition: { duration: 0.2 } },
  };

  useEffect(() => {
    setOpen(true);
  }, []);

  let lastSection = null;

  return (
    <>
      <GlobalStyles
        styles={{
          "::-webkit-scrollbar": {
            width: "6px",
            backgroundColor: theme.palette.surfaces.lowest,
          },
          "::-webkit-scrollbar-thumb": {
            backgroundColor: theme.palette.primary.main,
            borderRadius: "4px",
          },
        }}
      />
      <Drawer
        variant="permanent"
        sx={{
          width: { xs: 60, sm: 264 },
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: { xs: 60, sm: 264 },
            bgcolor: theme.palette.surfaces.lowest,
            borderRight: `1px solid ${theme.palette.divider}`,
            transition: "width 0.3s ease",
            overflowX: "hidden",
          },
        }}
      >
        <Box
          sx={{
            p: { xs: 1, sm: 2 },
            borderBottom: `1px solid ${theme.palette.divider}`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: { xs: "8px", sm: "60px" },
          }}
        >
          <Box
            component="img"
            src={ratnSetuLogo}
            alt="RatnSetu Logo"
            sx={{
              width: { xs: 50, sm: 80, md: 100 },
              height: "auto",
              maxWidth: "100%",
              objectFit: "contain",
              mb: { xs: 1, sm: 1.5 },
            }}
          />
          <Typography
            variant="h6"
            color="primary"
            fontWeight={600}
            sx={{
              display: { xs: "none", sm: "block" },
              fontSize: { xs: "0.9rem", sm: "1rem", md: "1.25rem" },
              textAlign: "center",
            }}
          >
            RatnSetu
          </Typography>
          <Typography
            variant="overline"
            sx={{
              display: { xs: "none", sm: "block" },
              color: "text.secondary",
              mt: 0.25,
            }}
          >
            Jewellery Retail ERP
          </Typography>
        </Box>
        <List sx={{ px: { xs: 0.5, sm: 1 }, py: 1 }}>
          <AnimatePresence>
            {open &&
              visibleMenuItems.map((item, index) => {
                const showSectionLabel = item.section !== lastSection;
                lastSection = item.section;
                return (
                  <React.Fragment key={item.text}>
                    {showSectionLabel && (
                      <Typography
                        variant="overline"
                        sx={{
                          display: { xs: "none", sm: "block" },
                          color: "outline.main",
                          px: 1.5,
                          pt: index === 0 ? 0 : 1.5,
                          pb: 0.5,
                        }}
                      >
                        {item.section}
                      </Typography>
                    )}
                    <motion.div
                      custom={index}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      whileHover="hover"
                    >
                      <ListItem
                        component="button"
                        onClick={() => navigate(item.path)}
                        sx={{
                          p: { xs: 1, sm: 1.25 },
                          mb: 0.5,
                          cursor: "pointer",
                          borderRadius: 2,
                          bgcolor: isActive(item.path)
                            ? "primary.main"
                            : "transparent",
                          color: isActive(item.path)
                            ? theme.palette.primary.contrastText
                            : "text.secondary",
                          "&:hover": {
                            bgcolor: isActive(item.path)
                              ? "primary.main"
                              : "surfaces.high",
                            color: isActive(item.path)
                              ? theme.palette.primary.contrastText
                              : "text.primary",
                          },
                          transition: "background-color 0.2s ease, color 0.2s ease",
                          minHeight: { xs: 48, sm: 44 },
                          justifyContent: { xs: "center", sm: "flex-start" },
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: { xs: 0, sm: 36 },
                            color: "inherit",
                            justifyContent: "center",
                          }}
                        >
                          <SymbolIcon name={item.icon} size={20} />
                        </ListItemIcon>
                        <ListItemText
                          primary={item.text}
                          sx={{
                            "& .MuiTypography-root": {
                              fontWeight: isActive(item.path) ? 600 : 500,
                              display: { xs: "none", sm: "block" },
                              fontSize: "0.85rem",
                            },
                          }}
                        />
                      </ListItem>
                    </motion.div>
                  </React.Fragment>
                );
              })}
          </AnimatePresence>
        </List>
      </Drawer>
    </>
  );
}

export default Sidebar;
