import { Alert, Box, CircularProgress, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import PageHeader from "../../components/platform/PageHeader";
import StatCard from "../../components/platform/StatCard";
import usePlatformData from "../../hooks/usePlatformData";
import { PROVIDER_LABEL, fmtDateTime, inr, monthLabel, num } from "../../utils/platformFormat";

function PlatformOverview() {
  const theme = useTheme();
  const { data, loading, error, reload } = usePlatformData("/overview");

  const subs = data?.subscriptions;
  const totals = data?.totals;
  const signups = (data?.signups || []).map((s) => ({ ...s, label: monthLabel(s.month) }));

  return (
    <Box sx={{ width: "100%", maxWidth: "100%", minWidth: 0, px: { xs: 0, sm: 1 } }}>
      <PageHeader
        title="Platform Overview"
        subtitle={data ? `Updated ${fmtDateTime(data.generatedAt)}` : "Subscriptions and app-wide numbers"}
        onRefresh={reload}
        loading={loading}
      />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && !data && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {data && (
        <>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Subscriptions</Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 6, md: 3 }}><StatCard label="Total firms" value={num(subs.totalFirms)} hint={`${num(data.newFirmsLast30Days)} joined in the last 30 days`} /></Grid>
            <Grid size={{ xs: 6, md: 3 }}><StatCard label="Paid & active" value={num(subs.states.active)} accent={theme.palette.success.main} hint="Currently paying plans" /></Grid>
            <Grid size={{ xs: 6, md: 3 }}><StatCard label="On free trial" value={num(subs.states.trial)} accent={theme.palette.info.main} /></Grid>
            <Grid size={{ xs: 6, md: 3 }}><StatCard label="Expired / cancelled" value={num(subs.states.expired + subs.states.cancelled)} accent={theme.palette.warning.main} hint={`${num(subs.states.expired)} expired, ${num(subs.states.cancelled)} cancelled`} /></Grid>
            <Grid size={{ xs: 6, md: 3 }}><StatCard label="No subscription" value={num(subs.states.none)} hint="Firms with no plan record" /></Grid>
            <Grid size={{ xs: 6, md: 3 }}><StatCard label="Expiring in 7 days" value={num(subs.expiringWithin7Days)} accent={theme.palette.warning.main} hint="Active or trial" /></Grid>
            <Grid size={{ xs: 6, md: 3 }}><StatCard label="Expiring in 30 days" value={num(subs.expiringWithin30Days)} hint="Active or trial" /></Grid>
            <Grid size={{ xs: 6, md: 3 }}><StatCard label="Latest paid amounts" value={inr(subs.activePaidValue)} hint="Last payment of each active plan (not lifetime revenue)" /></Grid>
          </Grid>

          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Plans taken</Typography>
          <Paper sx={{ mb: 3, borderRadius: 3 }}>
            <TableContainer>
              <Table size="small" sx={{ minWidth: 520 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Plan</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="right">Active</TableCell>
                    <TableCell align="right">Trial</TableCell>
                    <TableCell align="right">Ended</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {subs.byPlan.length === 0 ? (
                    <TableRow><TableCell colSpan={5} align="center">No plans yet.</TableCell></TableRow>
                  ) : (
                    subs.byPlan.map((p) => (
                      <TableRow key={p.key}>
                        <TableCell sx={{ fontWeight: 600 }}>{p.name}</TableCell>
                        <TableCell align="right">{inr(p.price)}{p.billingInterval ? ` / ${p.billingInterval}` : ""}</TableCell>
                        <TableCell align="right">{num(p.active)}</TableCell>
                        <TableCell align="right">{num(p.trial)}</TableCell>
                        <TableCell align="right">{num(p.ended)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>How active plans were paid</Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {Object.entries(subs.providers).map(([key, count]) => (
              <Grid key={key} size={{ xs: 6, md: 3 }}>
                <StatCard label={PROVIDER_LABEL[key] || key} value={num(count)} />
              </Grid>
            ))}
          </Grid>

          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>People & records in the app</Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 6, md: 3 }}><StatCard label="Users" value={num(totals.users)} hint={`${num(totals.admins)} admins, ${num(totals.staff)} staff`} /></Grid>
            <Grid size={{ xs: 6, md: 3 }}><StatCard label="Customers" value={num(totals.customers)} /></Grid>
            <Grid size={{ xs: 6, md: 3 }}><StatCard label="Sales / invoices" value={num(totals.sales)} /></Grid>
            <Grid size={{ xs: 6, md: 3 }}><StatCard label="Stock items" value={num(totals.stocks)} /></Grid>
            <Grid size={{ xs: 6, md: 3 }}><StatCard label="Raw materials" value={num(totals.rawMaterials)} /></Grid>
            <Grid size={{ xs: 6, md: 3 }}><StatCard label="Payments" value={num(totals.payments)} /></Grid>
            <Grid size={{ xs: 6, md: 3 }}><StatCard label="Udhar records" value={num(totals.udhar)} /></Grid>
            <Grid size={{ xs: 6, md: 3 }}><StatCard label="Borrows (Girvi)" value={num(totals.girvi)} hint={`${num(data.activityLast7Days)} app actions in the last 7 days`} /></Grid>
          </Grid>

          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>New firms per month</Typography>
          <Paper sx={{ p: 2, borderRadius: 3, minWidth: 0 }}>
            <Box sx={{ width: "100%", height: 260, minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={signups} margin={{ top: 5, right: 8, left: -16, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" interval="preserveStartEnd" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="firms" name="New firms" fill={theme.palette.primary.main} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </>
      )}
    </Box>
  );
}

export default PlatformOverview;
