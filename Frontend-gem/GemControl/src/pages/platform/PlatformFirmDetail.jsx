import { useNavigate, useParams } from "react-router-dom";
import { Alert, Box, Button, Chip, CircularProgress, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import PageHeader from "../../components/platform/PageHeader";
import StatCard from "../../components/platform/StatCard";
import StateChip from "../../components/platform/StateChip";
import SymbolIcon from "../../components/SymbolIcon";
import usePlatformData from "../../hooks/usePlatformData";
import { PROVIDER_LABEL, fmtDate, fmtDateTime, inr, num } from "../../utils/platformFormat";
import { ROUTES } from "../../utils/routes";

function Field({ label, value }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>{label}</Typography>
      <Typography sx={{ overflowWrap: "anywhere" }}>{value || "—"}</Typography>
    </Box>
  );
}

function PlatformFirmDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, loading, error, reload } = usePlatformData(`/firms/${id}`);

  const sub = data?.subscription;

  return (
    <Box sx={{ width: "100%", maxWidth: "100%", minWidth: 0, px: { xs: 0, sm: 1 } }}>
      <Button onClick={() => navigate(ROUTES.PLATFORM_FIRMS)} startIcon={<SymbolIcon name="arrow_back" />} sx={{ textTransform: "none", mb: 1 }}>
        All firms
      </Button>
      <PageHeader title={data?.firm.name || "Firm"} subtitle={data ? `Joined ${fmtDate(data.firm.createdAt)}` : ""} onRefresh={reload} loading={loading} />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && !data && <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress /></Box>}

      {data && (
        <>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper sx={{ p: 2, borderRadius: 3, height: "100%" }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>Subscription</Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, 1fr)" }, gap: 2 }}>
                  <Box><Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>Status</Typography><StateChip state={sub.state} /></Box>
                  <Field label="Plan" value={sub.plan ? `${sub.plan.name} (${inr(sub.plan.price)} / ${sub.plan.billingInterval})` : ""} />
                  <Field label="Paid via" value={PROVIDER_LABEL[sub.provider] || sub.provider} />
                  <Field label="Started" value={fmtDate(sub.startDate)} />
                  <Field label="Ends" value={fmtDate(sub.endDate)} />
                  <Field label="Last payment" value={sub.amountPaid ? inr(sub.amountPaid) : ""} />
                  <Field label="Payment reference" value={sub.paymentReference} />
                  <Field label="Stored status" value={sub.rawStatus} />
                </Box>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper sx={{ p: 2, borderRadius: 3, height: "100%" }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>Firm</Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" }, gap: 2 }}>
                  <Field label="Owner" value={data.owner?.name} />
                  <Field label="Owner email" value={data.owner?.email} />
                  <Field label="Owner phone" value={data.owner?.contact} />
                  <Field label="Proprietor" value={data.firm.proprietorName} />
                  <Field label="Shop email" value={data.firm.email} />
                  <Field label="Shop phone" value={data.firm.contact} />
                  <Field label="Location" value={data.firm.location} />
                  <Field label="GSTIN" value={data.firm.gst} />
                  <Field label="Invoice prefix" value={data.firm.invoicePrefix} />
                </Box>
              </Paper>
            </Grid>
          </Grid>

          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Usage</Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 6, md: 3 }}><StatCard label="Sales / invoices" value={num(data.usage.sales)} hint={`${inr(data.usage.salesAmount)} total`} /></Grid>
            <Grid size={{ xs: 6, md: 3 }}><StatCard label="Customers" value={num(data.usage.customers)} /></Grid>
            <Grid size={{ xs: 6, md: 3 }}><StatCard label="Stock items" value={num(data.usage.stocks)} /></Grid>
            <Grid size={{ xs: 6, md: 3 }}><StatCard label="Raw materials" value={num(data.usage.rawMaterials)} /></Grid>
            <Grid size={{ xs: 6, md: 3 }}><StatCard label="Payments" value={num(data.usage.payments)} /></Grid>
            <Grid size={{ xs: 6, md: 3 }}><StatCard label="Udhar records" value={num(data.usage.udhar)} /></Grid>
            <Grid size={{ xs: 6, md: 3 }}><StatCard label="Borrows (Girvi)" value={num(data.usage.girvi)} /></Grid>
            <Grid size={{ xs: 6, md: 3 }}><StatCard label="Last sale" value={fmtDate(data.usage.lastSaleAt)} /></Grid>
          </Grid>

          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Users ({data.users.length})</Typography>
          <Paper sx={{ mb: 3, borderRadius: 3 }}>
            <TableContainer>
              <Table size="small" sx={{ minWidth: 560 }}>
                <TableHead>
                  <TableRow><TableCell>Name</TableCell><TableCell>Email</TableCell><TableCell>Phone</TableCell><TableCell>Role</TableCell><TableCell>Status</TableCell></TableRow>
                </TableHead>
                <TableBody>
                  {data.users.map((u) => (
                    <TableRow key={u.email}>
                      <TableCell sx={{ overflowWrap: "anywhere" }}>{u.name}</TableCell>
                      <TableCell sx={{ overflowWrap: "anywhere" }}>{u.email}</TableCell>
                      <TableCell>{u.contact}</TableCell>
                      <TableCell>{u.role}</TableCell>
                      <TableCell><Chip size="small" label={u.active ? "Active" : "Removed"} color={u.active ? "success" : "default"} variant={u.active ? "filled" : "outlined"} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Recent activity</Typography>
          <Paper sx={{ p: 2, borderRadius: 3 }}>
            {data.recentActivity.length === 0 ? (
              <Typography sx={{ color: "text.secondary" }}>No activity yet.</Typography>
            ) : (
              data.recentActivity.map((a, i) => (
                <Box key={i} sx={{ py: 1, borderBottom: i < data.recentActivity.length - 1 ? 1 : 0, borderColor: "divider" }}>
                  <Typography sx={{ fontSize: "0.85rem", overflowWrap: "anywhere" }}><b>{a.type}</b> — {a.description}</Typography>
                  <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>{fmtDateTime(a.at)}</Typography>
                </Box>
              ))
            )}
          </Paper>
        </>
      )}
    </Box>
  );
}

export default PlatformFirmDetail;
