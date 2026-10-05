import PropTypes from "prop-types";
import { Box, Paper, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";

// One headline number. Long values wrap instead of overflowing the card.
function StatCard({ label, value, hint, accent }) {
  const theme = useTheme();
  return (
    <Paper sx={{ p: 2, height: "100%", minWidth: 0, borderRadius: 3 }}>
      <Typography sx={{ fontSize: "0.8rem", color: theme.palette.text.secondary }}>{label}</Typography>
      <Box sx={{ mt: 0.5 }}>
        <Typography
          component="div"
          sx={{
            fontSize: { xs: "1.5rem", sm: "1.75rem" },
            fontWeight: 700,
            lineHeight: 1.2,
            overflowWrap: "anywhere",
            color: accent || theme.palette.text.primary,
          }}
        >
          {value}
        </Typography>
      </Box>
      {hint && (
        <Typography sx={{ mt: 0.5, fontSize: "0.75rem", color: theme.palette.text.secondary }}>{hint}</Typography>
      )}
    </Paper>
  );
}

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  hint: PropTypes.string,
  accent: PropTypes.string,
};

export default StatCard;
