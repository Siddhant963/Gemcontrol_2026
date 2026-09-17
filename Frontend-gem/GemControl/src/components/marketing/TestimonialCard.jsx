import { Paper, Typography, Box, Avatar, Chip } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import SymbolIcon from "../SymbolIcon";

function initials(name) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

function TestimonialCard({ testimonial }) {
  const theme = useTheme();
  return (
    <Paper
      sx={{
        p: 3,
        borderRadius: 3,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "box-shadow 0.2s ease",
        "@media (hover: hover)": {
          "&:hover": { boxShadow: "0 12px 24px -12px rgba(10, 37, 64, 0.2)" },
        },
      }}
    >
      <Box sx={{ display: "flex", gap: 0.25, mb: 1.5 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <SymbolIcon
            key={i}
            name="star"
            size={18}
            fill={i < testimonial.rating}
            sx={{ color: theme.palette.tertiary.main }}
          />
        ))}
      </Box>
      <Typography sx={{ color: theme.palette.text.primary, flexGrow: 1, mb: 2.5, lineHeight: 1.65 }}>
        “{testimonial.quote}”
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Avatar sx={{ bgcolor: theme.palette.surfaces.container, color: theme.palette.primary.main, fontWeight: 700 }}>
          {initials(testimonial.name)}
        </Avatar>
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", color: theme.palette.text.primary }}>
            {testimonial.name}
          </Typography>
          <Typography sx={{ fontSize: "0.78rem", color: theme.palette.text.secondary }}>
            {testimonial.role} · {testimonial.location}
          </Typography>
        </Box>
      </Box>
      {testimonial.isSample && (
        <Chip
          label="Sample testimonial"
          size="small"
          sx={{ alignSelf: "flex-start", mt: 2, fontSize: "0.65rem", bgcolor: theme.palette.surfaces.low }}
        />
      )}
    </Paper>
  );
}

export default TestimonialCard;
