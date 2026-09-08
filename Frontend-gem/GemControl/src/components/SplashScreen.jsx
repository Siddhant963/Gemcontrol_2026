import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";

// Shown once for ~2s while the app boots (see App.jsx). Fades out rather
// than unmounting abruptly so the transition into the real UI feels
// intentional rather than a flash.
function SplashScreen({ visible }) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: theme.palette.background.default,
        opacity: visible ? 1 : 0,
        visibility: visible ? "visible" : "hidden",
        transition: "opacity 0.5s ease, visibility 0.5s ease",
      }}
    >
      <Box
        component="img"
        src="/ratnsetu-logo.png"
        alt="RatnSetu Logo"
        sx={{
          width: { xs: 140, sm: 180, md: 220 },
          height: "auto",
          objectFit: "contain",
          mb: 2,
          animation: "ratnsetu-splash-pop 0.6s ease",
          "@keyframes ratnsetu-splash-pop": {
            "0%": { opacity: 0, transform: "scale(0.85)" },
            "100%": { opacity: 1, transform: "scale(1)" },
          },
        }}
      />
      <Typography
        variant="body1"
        sx={{
          color: theme.palette.text.secondary,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          fontSize: { xs: "0.75rem", sm: "0.85rem" },
          mb: 3,
        }}
      >
        Bridging Trust in Every Gem
      </Typography>
      <Box
        sx={{
          width: { xs: 120, sm: 160 },
          height: 3,
          borderRadius: 2,
          bgcolor: `${theme.palette.primary.main}22`,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            height: "100%",
            width: "40%",
            borderRadius: 2,
            bgcolor: theme.palette.primary.main,
            animation: "ratnsetu-splash-loading 1s ease-in-out infinite",
            "@keyframes ratnsetu-splash-loading": {
              "0%": { transform: "translateX(-100%)" },
              "100%": { transform: "translateX(350%)" },
            },
          }}
        />
      </Box>
    </Box>
  );
}

export default SplashScreen;
