import { Paper, Typography, Box, Chip } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Link as RouterLink } from "react-router-dom";
import { ROUTES } from "../../utils/routes";
import SymbolIcon from "../SymbolIcon";

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });
}

// Cover art is a gradient + icon treatment, not a stock photo -- kept
// dependency-free and avoids using unverified/generic stock imagery.
function BlogCard({ blog }) {
  const theme = useTheme();
  return (
    <Paper
      component={RouterLink}
      to={ROUTES.BLOGS + "/" + blog.slug}
      sx={{
        display: "block",
        textDecoration: "none",
        borderRadius: 3,
        overflow: "hidden",
        height: "100%",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        "@media (hover: hover)": {
          "&:hover": { transform: "translateY(-4px)", boxShadow: "0 12px 24px -12px rgba(10, 37, 64, 0.25)" },
        },
      }}
    >
      <Box
        sx={{
          height: 140,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
        }}
      >
        <SymbolIcon name={blog.coverIcon} size={44} sx={{ color: theme.palette.tertiary.fixed }} />
      </Box>
      <Box sx={{ p: 2.5 }}>
        <Chip label={blog.category} size="small" sx={{ mb: 1.25, bgcolor: theme.palette.surfaces.container }} />
        <Typography sx={{ fontWeight: 700, color: theme.palette.text.primary, mb: 1, lineHeight: 1.35 }}>
          {blog.title}
        </Typography>
        <Typography sx={{ fontSize: "0.85rem", color: theme.palette.text.secondary, mb: 1.5 }}>
          {blog.shortDescription}
        </Typography>
        <Typography sx={{ fontSize: "0.75rem", color: theme.palette.text.secondary }}>
          {formatDate(blog.publishedDate)} · {blog.readingTime} min read
        </Typography>
      </Box>
    </Paper>
  );
}

export default BlogCard;
