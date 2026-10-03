import { Drawer, Box, GlobalStyles, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import NavList from "./layout/NavList";
import useLayoutMode from "../hooks/useLayoutMode";
import { RAIL_WIDTH, SIDEBAR_WIDTH } from "../config/layout";

const ratnSetuLogo = "/ratnsetu-logo.png";

/**
 * Permanent sidebar for desktop (full, 264px) and tablet (icon rail, 72px).
 * On mobile nothing is rendered here; navigation lives in MobileSidebarDrawer.
 * Menu entries come from config/navigation via NavList.
 */
function Sidebar() {
  const theme = useTheme();
  const mode = useLayoutMode();
  const isRail = mode === "tablet";
  const width = isRail ? RAIL_WIDTH : SIDEBAR_WIDTH;

  return (
    <>
      <GlobalStyles
        styles={{
          "::-webkit-scrollbar": {
            width: "6px",
            backgroundColor: theme.palette.surfaces.lowest,
          },
          "::-webkit-scrollbar-thumb": {
            backgroundColor: theme.palette.primary.main,
            borderRadius: "4px",
          },
        }}
      />
      {mode !== "mobile" && (
        <Drawer
          variant="permanent"
          sx={{
            width,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width,
              bgcolor: theme.palette.surfaces.lowest,
              borderRight: `1px solid ${theme.palette.divider}`,
              transition: "width 0.3s ease",
              overflowX: "hidden",
            },
          }}
        >
          <Box
            sx={{
              p: isRail ? 1 : 2,
              borderBottom: `1px solid ${theme.palette.divider}`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginTop: "60px",
            }}
          >
            <Box
              component="img"
              src={ratnSetuLogo}
              alt="RatnSetu Logo"
              sx={{
                width: isRail ? 44 : 100,
                height: "auto",
                maxWidth: "100%",
                objectFit: "contain",
                mb: isRail ? 0.5 : 1.5,
              }}
            />
            {!isRail && (
              <>
                <Typography
                  variant="h6"
                  color="primary"
                  fontWeight={600}
                  sx={{ fontSize: "1.25rem", textAlign: "center" }}
                >
                  RatnSetu
                </Typography>
                <Typography variant="overline" sx={{ color: "text.secondary", mt: 0.25 }}>
                  Jewellery Retail ERP
                </Typography>
              </>
            )}
          </Box>
          <Box component="nav" aria-label="Main navigation">
            <NavList variant={isRail ? "rail" : "full"} animated />
          </Box>
        </Drawer>
      )}
    </>
  );
}

export default Sidebar;
