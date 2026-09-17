import { useState, useRef } from "react";
import { Box, TextField, Button, Typography, Alert } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { SITE_CONFIG } from "../../data/siteConfig";
import { trackEvent } from "../../utils/analytics";

const initialForm = {
  fullName: "",
  businessName: "",
  mobile: "",
  email: "",
  city: "",
  numberOfUsers: "",
  message: "",
};

// There's no backend endpoint yet for contact-form submissions (only the
// authenticated ERP API exists). Rather than pretending this saves
// somewhere it doesn't, submitting opens the visitor's own email client
// with the details pre-filled to SITE_CONFIG.supportEmail. Swap this for a
// real POST once a /contact endpoint exists.
function ContactForm() {
  const theme = useTheme();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const startedRef = useRef(false);

  const handleChange = (field) => (e) => {
    if (!startedRef.current) {
      startedRef.current = true;
      trackEvent("contact_form_start");
    }
    setForm((f) => ({ ...f, [field]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.fullName || !form.businessName || !form.mobile || !form.city) {
      setError("Please fill in all required fields.");
      return;
    }
    setError("");
    trackEvent("contact_form_submit");

    const subject = `Demo request from ${form.fullName} (${form.businessName})`;
    const body = [
      `Name: ${form.fullName}`,
      `Business: ${form.businessName}`,
      `Mobile: ${form.mobile}`,
      form.email && `Email: ${form.email}`,
      `City: ${form.city}`,
      form.numberOfUsers && `Number of users: ${form.numberOfUsers}`,
      "",
      form.message || "",
    ]
      .filter(Boolean)
      .join("\n");

    window.location.href = `mailto:${SITE_CONFIG.supportEmail}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      {error && <Alert severity="error">{error}</Alert>}
      <TextField label="Full Name" required value={form.fullName} onChange={handleChange("fullName")} fullWidth />
      <TextField
        label="Business Name"
        required
        value={form.businessName}
        onChange={handleChange("businessName")}
        fullWidth
      />
      <Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", sm: "row" } }}>
        <TextField label="Mobile Number" required value={form.mobile} onChange={handleChange("mobile")} fullWidth />
        <TextField label="Email" type="email" value={form.email} onChange={handleChange("email")} fullWidth />
      </Box>
      <Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", sm: "row" } }}>
        <TextField label="City" required value={form.city} onChange={handleChange("city")} fullWidth />
        <TextField
          label="Number of Users"
          type="number"
          value={form.numberOfUsers}
          onChange={handleChange("numberOfUsers")}
          fullWidth
        />
      </Box>
      <TextField
        label="Message"
        multiline
        minRows={4}
        value={form.message}
        onChange={handleChange("message")}
        fullWidth
      />
      <Button
        type="submit"
        variant="contained"
        size="large"
        sx={{
          textTransform: "none",
          alignSelf: { xs: "stretch", sm: "flex-start" },
          px: 4,
          bgcolor: theme.palette.tertiary.main,
          color: theme.palette.getContrastText(theme.palette.tertiary.main),
          "&:hover": { bgcolor: theme.palette.tertiary.fixedDim },
        }}
      >
        Request a Demo
      </Button>
      <Typography sx={{ fontSize: "0.78rem", color: theme.palette.text.secondary }}>
        This opens your email app with the details filled in, addressed to {SITE_CONFIG.supportEmail}.
      </Typography>
    </Box>
  );
}

export default ContactForm;
