import PropTypes from "prop-types";
import { Chip } from "@mui/material";
import { STATE_META } from "../../utils/platformFormat";

function StateChip({ state }) {
  const meta = STATE_META[state] || STATE_META.none;
  return <Chip size="small" label={meta.label} color={meta.color} variant={meta.color === "default" ? "outlined" : "filled"} />;
}

StateChip.propTypes = { state: PropTypes.string };

export default StateChip;
