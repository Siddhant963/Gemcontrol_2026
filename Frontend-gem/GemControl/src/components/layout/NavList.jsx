import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useNavigate, useLocation } from "react-router-dom";
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import { getVisibleMenuItems } from "../../config/navigation";
import SymbolIcon from "../SymbolIcon";

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.1, duration: 0.3 },
  }),
  hover: { scale: 1.05, transition: { duration: 0.2 } },
};

/**
 * Renders the shared navigation config.
 *  variant "full" -> icon + label + section headings (desktop sidebar, drawer)
 *  variant "rail" -> icon only with tooltip, dividers between sections (tablet)
 */
function NavList({ variant = "full", animated = false, onNavigate }) {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const user = useSelector((state) => state.auth.user);
  const isAdmin = user?.role?.toLowerCase() === "admin";
  const items = getVisibleMenuItems(isAdmin);
  const isRail = variant === "rail";

  const [ready, setReady] = useState(!animated);
  useEffect(() => {
    setReady(true);
  }, []);

  const isActive = (path) => location.pathname === path;

  const handleClick = (path) => {
    navigate(path);
    if (onNavigate) onNavigate();
  };

  const Wrapper = animated ? motion.div : "div";

  return (
    <List sx={{ px: isRail ? 0.5 : 1, py: 1 }}>
      <AnimatePresence>
        {ready &&
          items.map((item, index) => {
            const isNewSection = index === 0 || items[index - 1].section !== item.section;
            const wrapperProps = animated
              ? {
                  custom: index,
                  variants: itemVariants,
                  initial: "hidden",
                  animate: "visible",
                  exit: "hidden",
                  whileHover: "hover",
                }
              : {};
            const active = isActive(item.path);
            const button = (
              <ListItem
                component="button"
                onClick={() => handleClick(item.path)}
                aria-label={isRail ? item.text : undefined}
                aria-current={active ? "page" : undefined}
                sx={{
                  p: 1.25,
                  mb: 0.5,
                  cursor: "pointer",
                  borderRadius: 2,
                  bgcolor: active ? "primary.main" : "transparent",
                  color: active ? theme.palette.primary.contrastText : "text.secondary",
                  "&:hover": {
                    bgcolor: active ? "primary.main" : "surfaces.high",
                    color: active ? theme.palette.primary.contrastText : "text.primary",
                  },
                  transition: "background-color 0.2s ease, color 0.2s ease",
                  minHeight: 48,
                  justifyContent: isRail ? "center" : "flex-start",
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: isRail ? 0 : 36,
                    color: "inherit",
                    justifyContent: "center",
                  }}
                >
                  <SymbolIcon name={item.icon} size={20} />
                </ListItemIcon>
                {!isRail && (
                  <ListItemText
                    primary={item.text}
                    sx={{
                      "& .MuiTypography-root": {
                        fontWeight: active ? 600 : 500,
                        fontSize: "0.85rem",
                      },
                    }}
                  />
                )}
              </ListItem>
            );

            return (
              <React.Fragment key={item.text}>
                {isNewSection &&
                  (isRail ? (
                    index !== 0 && <Divider sx={{ my: 1, mx: 1 }} />
                  ) : (
                    <Typography
                      variant="overline"
                      component="div"
                      sx={{
                        color: "outline.main",
                        px: 1.5,
                        pt: index === 0 ? 0 : 1.5,
                        pb: 0.5,
                      }}
                    >
                      {item.section}
                    </Typography>
                  ))}
                <Wrapper {...wrapperProps}>
                  {isRail ? (
                    <Tooltip title={item.text} placement="right" arrow>
                      {button}
                    </Tooltip>
                  ) : (
                    button
                  )}
                </Wrapper>
              </React.Fragment>
            );
          })}
      </AnimatePresence>
    </List>
  );
}

NavList.propTypes = {
  variant: PropTypes.oneOf(["full", "rail"]),
  animated: PropTypes.bool,
  onNavigate: PropTypes.func,
};

export default NavList;
