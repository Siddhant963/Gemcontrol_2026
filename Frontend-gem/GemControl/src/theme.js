import { createTheme } from "@mui/material/styles";

export const getTheme = (mode) =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: "#6B1042", // Deep Wine/Maroon
        light: "#8E2960",
        dark: "#4A0A2C",
        contrastText: "#FFFFFF",
      },
      secondary: {
        main: "#D4AF37", // Gold
        light: "#E5C863",
        dark: "#B8912B",
        contrastText: "#3A0A1E",
      },
      error: {
        main: "#B3273A", // Ruby
      },
      background: {
        default: mode === "light" ? "#F8F3F0" : "#1E0812", // Ivory / Deep Maroon-Black
        paper: mode === "light" ? "#FFFFFF" : "#2B0A1C", // White / Dark Maroon
      },
      text: {
        primary: mode === "light" ? "#3A0A1E" : "#F5EDE7", // Deep Maroon / Ivory
        secondary: mode === "light" ? "#7A5C68" : "#C9AEB8", // Muted Mauve / Dusty Rose
      },
      divider: mode === "light" ? "rgba(107, 16, 66, 0.12)" : "rgba(212, 175, 55, 0.16)",
    },
    typography: {
      fontFamily: "Work Sans, sans-serif", // Using Work Sans from Google Fonts
      h1: { fontWeight: 700 }, // Bold for headings
      h4: { fontWeight: 600 }, // Semibold for subheadings
      body1: { fontWeight: 400 }, // Regular for body text
      button: { fontWeight: 500 }, // Medium for buttons
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: "none",
          },
        },
      },
    },
  });

export default getTheme;
