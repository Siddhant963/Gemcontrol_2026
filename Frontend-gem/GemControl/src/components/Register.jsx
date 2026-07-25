import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { setError } from "../redux/authSlice";
import { TextField, Button, Box, Typography, Alert, Link } from "@mui/material";
import api from "../utils/api";
import { ROUTES } from "../utils/routes";

function Register() {
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    contact: "",
    password: "",
  });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const error = useSelector((state) => state.auth.error);

  const handleChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // The public /register endpoint always creates a "staff" account, regardless
      // of role -- account creation with any other role requires an admin login.
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
        Sign Up
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          margin="normal"
          label="Name"
          name="name"
          value={userData.name}
          onChange={handleChange}
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
          required
        />
        <TextField
          fullWidth
          margin="normal"
          label="Contact"
          name="contact"
          value={userData.contact}
          onChange={handleChange}
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
