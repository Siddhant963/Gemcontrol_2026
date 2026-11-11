import { ToggleButton, ToggleButtonGroup, Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { LANGUAGES, useLanguage } from "./index";

// EN | हिं switch. `floating` pins it to the top-right corner (used on the
// login/register pages, which have no header).
function LanguageToggle({ floating = false, sx }) {
  const { lang, setLanguage } = useLanguage();
  const theme = useTheme();

  const group = (
    <ToggleButtonGroup
      exclusive
      size="small"
      value={lang}
      onChange={(_, value) => value && setLanguage(value)}
      aria-label="Language"
      translate="no"
      sx={{
        bgcolor: theme.palette.background.paper,
        "& .MuiToggleButton-root": {
          px: 1.25,
          py: 0.25,
          minWidth: 40,
          fontWeight: 700,
          textTransform: "none",
          lineHeight: 1.6,
          color: theme.palette.text.secondary,
          "&.Mui-selected": {
            bgcolor: theme.palette.tertiary.main,
            color: theme.palette.getContrastText(theme.palette.tertiary.main),
            "&:hover": { bgcolor: theme.palette.tertiary.main },
          },
        },
        ...sx,
      }}
    >
      {LANGUAGES.map((l) => (
        <ToggleButton key={l.code} value={l.code} aria-label={l.label}>
          {l.short}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );

  if (!floating) return group;
  return (
    <Box sx={{ position: "fixed", top: 12, right: 12, zIndex: 1300 }}>{group}</Box>
  );
}

export default LanguageToggle;
