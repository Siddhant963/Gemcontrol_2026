import { Box, Typography, Button } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../utils/routes";
import SymbolIcon from "../components/SymbolIcon";

function NotFound() {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: theme.palette.background.default,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        px: 3,
        gap: 1.5,
      }}
    >
      <SymbolIcon name="search_off" size={64} sx={{ color: theme.palette.text.secondary, mb: 1 }} />
      <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
        Page Not Found
      </Typography>
      <Typography variant="body1" sx={{ color: theme.palette.text.secondary, maxWidth: 420, mb: 2 }}>
        The page you're looking for doesn't exist or may have been moved.
      </Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={() => navigate(ROUTES.DASHBOARD)}
        sx={{ textTransform: "none" }}
      >
        Back to Dashboard
      </Button>
    </Box>
  );
}

export default NotFound;
