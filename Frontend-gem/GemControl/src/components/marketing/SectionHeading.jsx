import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";

function SectionHeading({ eyebrow, title, subtitle, align = "center", sx }) {
  const theme = useTheme();
  return (
    <Box sx={{ textAlign: align, maxWidth: 720, mx: align === "center" ? "auto" : 0, mb: 5, ...sx }}>
      {eyebrow && (
        <Typography
          variant="overline"
          sx={{ color: theme.palette.tertiary.main, fontWeight: 700, display: "block", mb: 1 }}
        >
          {eyebrow}
        </Typography>
      )}
      <Typography
        variant="h4"
        component="h2"
        sx={{ fontWeight: 700, color: theme.palette.text.primary, fontSize: { xs: "1.5rem", sm: "2rem" } }}
      >
        {title}
      </Typography>
      {subtitle && (
        <Typography sx={{ color: theme.palette.text.secondary, mt: 1.5, fontSize: { xs: "0.95rem", sm: "1.05rem" } }}>
          {subtitle}
        </Typography>
      )}
    </Box>
  );
}

export default SectionHeading;
