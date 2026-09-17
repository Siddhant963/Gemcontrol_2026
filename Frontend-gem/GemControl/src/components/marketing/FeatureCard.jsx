import { Paper, Typography, Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import SymbolIcon from "../SymbolIcon";

function FeatureCard({ icon, title, description }) {
  const theme = useTheme();
  return (
    <Paper
      sx={{
        p: 3,
        borderRadius: 3,
        height: "100%",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        "@media (hover: hover)": {
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: "0 12px 24px -12px rgba(10, 37, 64, 0.25)",
          },
        },
      }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: theme.palette.mode === "light" ? "rgba(162, 137, 95, 0.12)" : "rgba(224, 194, 152, 0.14)",
          mb: 2,
        }}
      >
        <SymbolIcon name={icon} size={26} sx={{ color: theme.palette.tertiary.main }} />
      </Box>
      <Typography sx={{ fontWeight: 700, mb: 0.75, color: theme.palette.text.primary }}>{title}</Typography>
      <Typography sx={{ fontSize: "0.9rem", color: theme.palette.text.secondary, lineHeight: 1.6 }}>
        {description}
      </Typography>
    </Paper>
  );
}

export default FeatureCard;
