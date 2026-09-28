import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { setError } from "../redux/authSlice";
import {
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  Link,
  Divider,
} from "@mui/material";
import api from "../utils/api";
import { ROUTES } from "../utils/routes";

// A "name" must contain at least one letter -- rejects garbage like "11222"
// while staying permissive about legitimate business names with digits.
const NAME_REGEX = /[A-Za-z]/;
const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
const PHONE_REGEX = /^\d{10}$/;
const MIN_PASSWORD_LENGTH = 6;

function Register() {
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    contact: "",
    password: "",
    firmName: "",
    firmLocation: "",
    firmSize: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const error = useSelector((state) => state.auth.error);

  const handleChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const validate = () => {
    const errors = {};
    if (!userData.name.trim() || !NAME_REGEX.test(userData.name)) {
      errors.name = "Name must contain letters, not just numbers";
    }
    if (!EMAIL_REGEX.test(userData.email)) {
      errors.email = "Enter a valid email address";
    }
    if (!PHONE_REGEX.test(userData.contact)) {
      errors.contact = "Contact number must be exactly 10 digits";
    }
    if (userData.password.length < MIN_PASSWORD_LENGTH) {
      errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
    }
    if (!userData.firmName.trim() || !NAME_REGEX.test(userData.firmName)) {
      errors.firmName = "Shop name must contain letters, not just numbers";
    }
    if (!userData.firmLocation.trim()) {
      errors.firmLocation = "Shop location is required";
    }
    if (!userData.firmSize || isNaN(userData.firmSize) || Number(userData.firmSize) <= 0) {
      errors.firmSize = "Enter a valid shop size";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      // The public /register endpoint creates a brand-new shop (Firm) and
      // its admin account together in one step.
      await api.post("/register", userData);
      dispatch(setError(null)); // Clear error on success
      navigate(ROUTES.LOGIN);
    } catch (err) {
      dispatch(setError(err.response?.data?.message || "Registration failed"));
    }
  };

  return (
    <Box sx={{ maxWidth: 400, mx: "auto", mt: 8, p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Set Up Your Shop
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <form onSubmit={handleSubmit}>
        <Typography variant="subtitle2" sx={{ mt: 1, color: "text.secondary" }}>
          Your account
        </Typography>
        <TextField
          fullWidth
          margin="normal"
          label="Name"
          name="name"
          value={userData.name}
          onChange={handleChange}
          error={!!fieldErrors.name}
          helperText={fieldErrors.name}
          required
        />
        <TextField
          fullWidth
          margin="normal"
          label="Email"
          name="email"
          type="email"
          value={userData.email}
          onChange={handleChange}
          error={!!fieldErrors.email}
          helperText={fieldErrors.email}
          required
        />
        <TextField
          fullWidth
          margin="normal"
          label="Contact"
          name="contact"
          value={userData.contact}
          onChange={handleChange}
          error={!!fieldErrors.contact}
          helperText={fieldErrors.contact}
          required
        />
        <TextField
          fullWidth
          margin="normal"
          label="Password"
          name="password"
          type="password"
          value={userData.password}
          onChange={handleChange}
          error={!!fieldErrors.password}
          helperText={fieldErrors.password}
          required
        />

        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2" sx={{ color: "text.secondary" }}>
          Your shop
        </Typography>
        <TextField
          fullWidth
          margin="normal"
          label="Shop Name"
          name="firmName"
          value={userData.firmName}
          onChange={handleChange}
          error={!!fieldErrors.firmName}
          helperText={fieldErrors.firmName}
          required
        />
        <TextField
          fullWidth
          margin="normal"
          label="Shop Location"
          name="firmLocation"
          value={userData.firmLocation}
          onChange={handleChange}
          error={!!fieldErrors.firmLocation}
          helperText={fieldErrors.firmLocation}
          required
        />
        <TextField
          fullWidth
          margin="normal"
          label="Shop Size (sq. ft.)"
          name="firmSize"
          type="number"
          value={userData.firmSize}
          onChange={handleChange}
          error={!!fieldErrors.firmSize}
          helperText={fieldErrors.firmSize}
          required
        />

        <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
          Sign Up
        </Button>
      </form>
      <Typography sx={{ mt: 2, textAlign: "center", fontSize: "0.9rem" }}>
        Already have an account?{" "}
        <Link component={RouterLink} to={ROUTES.LOGIN}>
          Log in
        </Link>
      </Typography>
    </Box>
  );
}

export default Register;
