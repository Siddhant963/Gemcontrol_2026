import PropTypes from "prop-types";
import { Box, Button, Typography } from "@mui/material";
import SymbolIcon from "../SymbolIcon";

// Title + subtitle + Refresh. Wraps on narrow screens instead of overflowing.
function PageHeader({ title, subtitle, onRefresh, loading, children }) {
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 1.5, mb: 3, minWidth: 0 }}>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h4" sx={{ fontWeight: "bold", fontSize: { xs: "1.4rem", sm: "1.75rem", md: "2rem" } }}>
          {title}
        </Typography>
        {subtitle && <Typography sx={{ color: "text.secondary", fontSize: "0.85rem" }}>{subtitle}</Typography>}
      </Box>
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", minWidth: 0 }}>
        {children}
        {onRefresh && (
          <Button
            variant="outlined"
            onClick={onRefresh}
            disabled={loading}
            startIcon={<SymbolIcon name="refresh" />}
            sx={{ textTransform: "none" }}
          >
            {loading ? "Loading..." : "Refresh"}
          </Button>
        )}
      </Box>
    </Box>
  );
}

PageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  onRefresh: PropTypes.func,
  loading: PropTypes.bool,
  children: PropTypes.node,
};

export default PageHeader;
