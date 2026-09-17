import PropTypes from "prop-types";
import Box from "@mui/material/Box";

/**
 * Google "Material Symbols Outlined" font icon, styled to drop into MUI slots
 * (startIcon, IconButton children, ListItemIcon) in place of @mui/icons-material.
 * Built on MUI's Box so `sx` resolves theme tokens (e.g. sx={{ color: "primary.main" }}).
 */
const SymbolIcon = ({ name, size = 20, weight, fill, sx, className, ...rest }) => (
  <Box
    component="span"
    className={["material-symbols-outlined", className].filter(Boolean).join(" ")}
    sx={{
      fontSize: size,
      fontVariationSettings: `"FILL" ${fill ? 1 : 0}, "wght" ${weight || 400}, "GRAD" 0, "opsz" 24`,
      ...sx,
    }}
    {...rest}
  >
    {name}
  </Box>
);

SymbolIcon.propTypes = {
  name: PropTypes.string.isRequired,
  size: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  weight: PropTypes.number,
  fill: PropTypes.bool,
  sx: PropTypes.object,
  className: PropTypes.string,
};

export default SymbolIcon;
