import { createTheme } from "@mui/material/styles";

// Surface container hierarchy (Material 3 roles) not natively modeled by MUI's palette.
const surfaces = {
  light: {
    lowest: "#ffffff",
    low: "#f2f3ff",
    container: "#eaedff",
    high: "#e2e7ff",
    highest: "#dae2fd",
  },
  dark: {
    lowest: "#131b2e",
    low: "#1a2338",
    container: "#202a42",
    high: "#283044",
    highest: "#333d59",
  },
};

const outline = {
  light: { main: "#74777e", variant: "#c4c6ce" },
  dark: { main: "#8e939c", variant: "#43474d" },
};

const tertiary = {
  light: {
    main: "#a2895f",
    fixed: "#fedeb2",
    fixedDim: "#e0c298",
    onFixed: "#281800",
    onFixedVariant: "#584323",
  },
  dark: {
    main: "#e0c298",
    fixed: "#fedeb2",
    fixedDim: "#e0c298",
    onFixed: "#281800",
    onFixedVariant: "#584323",
  },
};

export const getTheme = (mode) =>
  createTheme({
    palette: {
      mode,
      primary:
        mode === "light"
          ? {
              main: "#0a2540", // Sapphire (primary-container tone)
              dark: "#000f22", // Near-black primary tone, for pressed/high-emphasis states
              light: "#b0c8eb",
              contrastText: "#ffffff",
            }
          : {
              main: "#b0c8eb", // primary-fixed-dim promoted to accent in dark mode
              dark: "#768dad",
              light: "#d2e4ff",
              contrastText: "#001c37",
            },
      secondary:
        mode === "light"
          ? {
              main: "#006a61", // Emerald patina
              light: "#6bd8cb",
              dark: "#005049",
              contrastText: "#ffffff",
            }
          : {
              main: "#6bd8cb", // secondary-fixed-dim promoted to accent in dark mode
              light: "#89f5e7",
              dark: "#006a61",
              contrastText: "#00201d",
            },
      tertiary: tertiary[mode],
      surfaces: surfaces[mode],
      outline: outline[mode],
      error:
        mode === "light"
          ? {
              main: "#ba1a1a",
              light: "#ffdad6",
              dark: "#93000a",
              contrastText: "#ffffff",
            }
          : {
              main: "#ffb4ab",
              light: "#ffdad6",
              dark: "#690005",
              contrastText: "#690005",
            },
      background: {
        default: mode === "light" ? "#faf8ff" : "#0b0f1a",
        paper: mode === "light" ? "#ffffff" : "#131b2e",
      },
      text: {
        primary: mode === "light" ? "#131b2e" : "#eef0ff",
        secondary: mode === "light" ? "#43474d" : "#a9b4cc",
      },
      divider:
        mode === "light" ? "rgba(116, 119, 126, 0.20)" : "rgba(196, 198, 206, 0.16)",
    },
    typography: {
      fontFamily: "Plus Jakarta Sans, sans-serif",
      h1: { fontSize: "2.25rem", lineHeight: "2.75rem", fontWeight: 700, letterSpacing: "-0.02em" },
      h2: { fontSize: "1.5rem", lineHeight: "2rem", fontWeight: 600, letterSpacing: "-0.01em" },
      h3: { fontSize: "1.25rem", lineHeight: "1.75rem", fontWeight: 600 },
      h4: { fontSize: "1rem", lineHeight: "1.5rem", fontWeight: 600 },
      h5: { fontSize: "1rem", lineHeight: "1.5rem", fontWeight: 600 },
      h6: { fontSize: "0.875rem", lineHeight: "1.25rem", fontWeight: 600 },
      body1: { fontSize: "1rem", lineHeight: "1.5rem", fontWeight: 400 },
      body2: { fontSize: "0.875rem", lineHeight: "1.25rem", fontWeight: 400 },
      caption: { fontSize: "0.75rem", lineHeight: "1rem", fontWeight: 400 },
      button: { fontSize: "0.875rem", lineHeight: "1.25rem", fontWeight: 600, letterSpacing: "0.01em", textTransform: "none" },
      overline: {
        fontSize: "0.6875rem",
        lineHeight: "0.875rem",
        fontWeight: 600,
        letterSpacing: "0.03em",
        textTransform: "uppercase",
      },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: "none",
            borderRadius: 8,
            boxShadow: "none",
          },
          containedPrimary: {
            "&:hover": { boxShadow: "none" },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundImage: "none",
            border: `1px solid ${theme.palette.divider}`,
          }),
          elevation1: {
            boxShadow:
              "0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.02)",
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: 12,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow:
              "0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.02)",
          }),
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: { borderRadius: 12 },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: 8,
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: theme.palette.primary.main,
              borderWidth: 1,
            },
          }),
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundColor: theme.palette.surfaces.low,
          }),
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: ({ theme }) => ({
            fontSize: "0.6875rem",
            fontWeight: 600,
            letterSpacing: "0.03em",
            textTransform: "uppercase",
            color: theme.palette.text.secondary,
          }),
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: 9999 },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
          }),
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: ({ theme }) => ({
            backgroundColor: theme.palette.surfaces.lowest,
            borderRight: `1px solid ${theme.palette.divider}`,
          }),
        },
      },
    },
  });

export default getTheme;
