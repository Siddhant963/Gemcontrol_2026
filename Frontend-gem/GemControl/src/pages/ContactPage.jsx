import { Box, Typography, Paper } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import MarketingHeader from "../components/marketing/MarketingHeader";
import MarketingFooter from "../components/marketing/MarketingFooter";
import ContactForm from "../components/marketing/ContactForm";
import Seo from "../components/marketing/Seo";
import SymbolIcon from "../components/SymbolIcon";
import { SITE_CONFIG, PAGE_SEO } from "../data/siteConfig";

const INFO_ROWS = [
  { icon: "mail", label: "Email", value: SITE_CONFIG.supportEmail, href: `mailto:${SITE_CONFIG.supportEmail}` },
  { icon: "call", label: "Phone", value: SITE_CONFIG.supportPhone || "Coming soon", href: null },
  { icon: "chat", label: "WhatsApp", value: SITE_CONFIG.whatsappNumber || "Coming soon", href: null },
  { icon: "schedule", label: "Business Hours", value: SITE_CONFIG.businessHours, href: null },
];

function ContactPage() {
  const theme = useTheme();
  return (
    <Box sx={{ bgcolor: theme.palette.background.default, minHeight: "100vh" }}>
      <Seo title={PAGE_SEO.contact.title} description={PAGE_SEO.contact.description} path={PAGE_SEO.contact.path} />
      <MarketingHeader />
      <main>

      <Box sx={{ px: { xs: 2, sm: 4, md: 8 }, py: { xs: 6, sm: 8 } }}>
        <Box sx={{ maxWidth: 640, mx: "auto", textAlign: "center", mb: 6 }}>
          <Typography variant="h3" component="h1" sx={{ fontWeight: 700, fontSize: { xs: "2rem", sm: "2.5rem" }, mb: 2 }}>
            Let's Simplify Your Jewellery Business
          </Typography>
          <Typography sx={{ color: theme.palette.text.secondary }}>
            Tell us a bit about your shop and we'll get back to you.
          </Typography>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1.2fr 1fr" },
            gap: 4,
            maxWidth: 1000,
            mx: "auto",
          }}
        >
          <Paper sx={{ p: { xs: 3, sm: 4 }, borderRadius: 3 }}>
            <ContactForm />
          </Paper>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {INFO_ROWS.map((row) => (
              <Paper key={row.label} sx={{ p: 2.5, borderRadius: 3, display: "flex", gap: 2, alignItems: "center" }}>
                <SymbolIcon name={row.icon} size={24} sx={{ color: theme.palette.tertiary.main }} />
                <Box>
                  <Typography sx={{ fontSize: "0.75rem", color: theme.palette.text.secondary }}>
                    {row.label}
                  </Typography>
                  {row.href ? (
                    <Typography
                      component="a"
                      href={row.href}
                      sx={{ fontWeight: 600, color: theme.palette.text.primary, textDecoration: "none" }}
                    >
                      {row.value}
                    </Typography>
                  ) : (
                    <Typography sx={{ fontWeight: 600, color: theme.palette.text.primary }}>{row.value}</Typography>
                  )}
                </Box>
              </Paper>
            ))}
          </Box>
        </Box>
      </Box>

      </main>
      <MarketingFooter />
    </Box>
  );
}

export default ContactPage;
