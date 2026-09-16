import { Box, Typography, Divider } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Link as RouterLink } from "react-router-dom";
import { ROUTES } from "../utils/routes";

const LAST_UPDATED = "September 16, 2026";

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

function PrivacyPolicy() {
  const theme = useTheme();

  return (
    <Box sx={{ bgcolor: theme.palette.background.default, minHeight: "100vh", py: { xs: 4, sm: 6 } }}>
      <Box sx={{ maxWidth: 800, mx: "auto", px: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
          <Box component="img" src="/ratnsetu-icon.png" alt="RatnSetu" sx={{ width: 32, height: 32 }} />
          <Typography
            component={RouterLink}
            to={ROUTES.LANDING}
            variant="h6"
            sx={{ fontWeight: 700, color: theme.palette.primary.main, textDecoration: "none" }}
          >
            RatnSetu
          </Typography>
        </Box>

        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
          Privacy Policy
        </Typography>
        <Typography sx={{ color: "text.secondary", mb: 4 }}>Last updated: {LAST_UPDATED}</Typography>

        <Section title="Overview">
          RatnSetu ("RatnSetu", "we", "us") provides a jewellery retail management application
          (web and mobile) that lets jewellery shop owners and their staff manage inventory,
          billing, customers, and related business records ("the Service"). This policy explains
          what information we collect through the Service, how we use it, and the choices you
          have. It applies to the RatnSetu website, web application, and mobile apps.
        </Section>

        <Section title="Information We Collect">
          <b>Account information.</b> When you or your shop registers, we collect your name,
          email address, phone number, and a password (stored in hashed form, never in plain
          text).
          <br />
          <br />
          <b>Business/shop information.</b> Shop admins provide business details used to run the
          app and generate invoices, which may include shop name, address, GST number, PAN
          number, bank account and IFSC details, and a shop logo/stamp/signature image.
          <br />
          <br />
          <b>Customer records you create.</b> If you use RatnSetu to manage your own customers,
          you may enter their name, email, phone number, and address into the Service. This data
          is entered and controlled by your shop (the "Firm"), not by RatnSetu directly, and is
          only visible within that shop's account.
          <br />
          <br />
          <b>Images and documents.</b> Photos you upload for items, receipts, or shop branding
          are stored via our image-hosting provider (Cloudinary).
          <br />
          <br />
          <b>Payment information.</b> Subscription payments are processed by Razorpay. RatnSetu
          does not receive or store your card, UPI, or bank login credentials — Razorpay handles
          that directly and shares back only a payment/order reference and status with us.
          <br />
          <br />
          <b>Usage and device information.</b> We may automatically log basic technical data
          (such as IP address, device/browser type, and access timestamps) for security,
          fraud-prevention, and debugging purposes.
        </Section>

        <Section title="How We Use Information">
          We use the information above to: provide and operate the Service (inventory, billing,
          invoicing, customer/staff management); authenticate accounts and keep them secure;
          process subscription payments and send related notices; generate GST-compliant
          invoices on your behalf; respond to support requests; and maintain, debug, and improve
          the Service. We do not sell your personal information, and we do not use it for
          third-party advertising.
        </Section>

        <Section title="Third Parties We Share Data With">
          We share limited data with the following service providers, solely to operate the
          Service on our behalf:
          <br />
          <br />
          <b>Razorpay</b> — payment processing for subscription billing.
          <br />
          <b>Cloudinary</b> — storage and delivery of images you upload.
          <br />
          <b>MongoDB Atlas</b> — hosting of the application database.
          <br />
          <br />
          These providers only receive the data necessary to perform their function and are
          bound by their own privacy and security obligations. We do not share your data with
          any other third party for their own marketing purposes.
        </Section>

        <Section title="Data Storage and Security">
          Your data is stored on secured, access-controlled infrastructure, transmitted over
          encrypted (HTTPS) connections, and account passwords are stored using one-way hashing.
          Access to a shop's business and customer data is restricted to that shop's own admin
          and staff accounts. No method of transmission or storage is 100% secure, but we take
          reasonable, industry-standard measures to protect your information.
        </Section>

        <Section title="Data Retention and Deletion">
          We retain account and business data for as long as your account is active, or as
          needed to provide the Service, comply with legal/tax record-keeping obligations, or
          resolve disputes. If you want your account and associated data deleted, contact us
          using the details below and we will process the request, subject to any records we're
          legally required to keep (for example, invoicing/GST records).
        </Section>

        <Section title="Your Choices">
          You can review and update your account and shop information directly within the app.
          You may request a copy of your data, or request deletion of your account, by
          contacting us. If you are a staff member of a shop, your shop's admin controls your
          account and the customer records within that shop.
        </Section>

        <Section title="Children's Privacy">
          The Service is intended for business use by adults operating or working at a
          jewellery retail shop, and is not directed at children. We do not knowingly collect
          personal information from children.
        </Section>

        <Section title="Changes to This Policy">
          We may update this policy from time to time to reflect changes to the Service or legal
          requirements. We will update the "Last updated" date above when we do. Continued use
          of the Service after a change means you accept the updated policy.
        </Section>

        <Divider sx={{ my: 4 }} />

        <Section title="Contact Us">
          If you have questions about this policy, or want to exercise any of the choices
          above, contact us at{" "}
          <Box
            component="a"
            href="mailto:support@ratnsetu.com"
            sx={{ color: theme.palette.primary.main, fontWeight: 600 }}
          >
            support@ratnsetu.com
          </Box>
          .
        </Section>
      </Box>
    </Box>
  );
}

export default PrivacyPolicy;
