import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { Alert, Button } from "@mui/material";
import { ROUTES } from "../utils/routes";

// Explains a plan limit and links to the Subscription page.
function PlanLimitNotice({ children, severity = "warning" }) {
  const navigate = useNavigate();
  return (
    <Alert
      severity={severity}
      sx={{ mb: 2, alignItems: "center" }}
      action={
        <Button color="inherit" size="small" onClick={() => navigate(ROUTES.SUBSCRIBE)} sx={{ textTransform: "none", whiteSpace: "nowrap" }}>
          View plans
        </Button>
      }
    >
      {children}
    </Alert>
  );
}

PlanLimitNotice.propTypes = {
  children: PropTypes.node.isRequired,
  severity: PropTypes.oneOf(["info", "warning"]),
};

export default PlanLimitNotice;
