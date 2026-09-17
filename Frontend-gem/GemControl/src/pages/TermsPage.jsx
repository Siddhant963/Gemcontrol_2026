import { Box, Typography, Divider } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Link as RouterLink } from "react-router-dom";
import MarketingHeader from "../components/marketing/MarketingHeader";
import MarketingFooter from "../components/marketing/MarketingFooter";
import Seo from "../components/marketing/Seo";
import { ROUTES } from "../utils/routes";
import { SITE_CONFIG } from "../data/siteConfig";

const LAST_UPDATED = "September 17, 2026";

function Section({ title, children }) {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
        {title}
      </Typography>
      <Typography component="div" sx={{ color: "text.secondary", lineHeight: 1.75 }}>
        {children}
      </Typography>
    </Box>
  );
}

function TermsPage() {
  const theme = useTheme();
  return (
    <Box sx={{ bgcolor: theme.palette.background.default, minHeight: "100vh" }}>
      <Seo
        title="Terms & Conditions | RatnSetu"
        description="Terms and conditions for using RatnSetu's jewellery business management ERP."
        path={ROUTES.TERMS}
      />
      <MarketingHeader />
      <main>

      <Box sx={{ px: { xs: 2, sm: 4, md: 8 }, py: { xs: 6, sm: 8 } }}>
        <Box sx={{ maxWidth: 800, mx: "auto" }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
            Terms & Conditions
          </Typography>
          <Typography sx={{ color: "text.secondary", mb: 4 }}>Last updated: {LAST_UPDATED}</Typography>

          <Section title="1. Acceptance of Terms">
            By creating an account or using RatnSetu (the "Service"), operated by{" "}
            {SITE_CONFIG.legalCompanyName}, you agree to these Terms & Conditions. If you do not
            agree, please do not use the Service.
          </Section>

          <Section title="2. The Service">
            RatnSetu is a jewellery business management ERP that helps jewellery retailers manage
            inventory, purchases, sales, customers, outstanding payments (Udhaar), suppliers, and
            related business operations, accessible via web and our mobile app.
          </Section>

          <Section title="3. Accounts and Access">
            You are responsible for maintaining the confidentiality of your account credentials
            and for all activity under your account, including staff accounts your shop's admin
            creates and controls. Notify us promptly of any unauthorized use.
          </Section>

          <Section title="4. Subscriptions and Billing">
            RatnSetu is offered on paid monthly subscription plans, with a 14-day free trial for
            new accounts. Subscription payments are processed by Razorpay; RatnSetu does not
            store your card, UPI, or bank login credentials. Subscriptions renew monthly unless
            cancelled; you can cancel at any time, effective at the end of the current billing
            period.
          </Section>

          <Section title="5. Your Data">
            Business, inventory, customer, and transaction data you enter into RatnSetu belongs
            to you. We process it to provide the Service, as described in our{" "}
            <Box component={RouterLink} to={ROUTES.PRIVACY_POLICY} sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
              Privacy Policy
            </Box>
            . You are responsible for the accuracy of the data you and your staff enter,
            including for GST-compliant invoices generated through the Service.
          </Section>

          <Section title="6. Acceptable Use">
            You agree not to use the Service for any unlawful purpose, to attempt unauthorized
            access to other accounts or our systems, or to interfere with the Service's normal
            operation.
          </Section>

          <Section title="7. Third-Party Services">
            The Service relies on third-party providers to operate — including Razorpay
            (payments), Cloudinary (image storage), and MongoDB Atlas (database hosting). Your
            use of the Service is also subject to the applicable terms of these providers where
            relevant to their function.
          </Section>

          <Section title="8. Termination">
            We may suspend or terminate access to the Service for accounts that violate these
            terms or for non-payment of subscription fees, after reasonable notice where
            practicable.
          </Section>

          <Section title="9. Disclaimer and Limitation of Liability">
            The Service is provided "as is." While we work to keep it reliable and accurate, we
            do not guarantee uninterrupted availability or that it will be error-free. To the
            extent permitted by law, RatnSetu and {SITE_CONFIG.legalCompanyName} are not liable
            for indirect or consequential losses arising from use of the Service.
          </Section>

          <Section title="10. Changes to These Terms">
            We may update these terms from time to time. We will update the "Last updated" date
            above when we do. Continued use of the Service after a change means you accept the
            updated terms.
          </Section>

          <Section title="11. Governing Law">
            These terms are governed by the laws of India.
          </Section>

          <Divider sx={{ my: 4 }} />

          <Section title="Contact Us">
            Questions about these terms can be sent to{" "}
            <Box
              component="a"
              href={`mailto:${SITE_CONFIG.supportEmail}`}
              sx={{ color: theme.palette.primary.main, fontWeight: 600 }}
            >
              {SITE_CONFIG.supportEmail}
            </Box>
            .
          </Section>
        </Box>
      </Box>

      </main>
      <MarketingFooter />
    </Box>
  );
}

export default TermsPage;
