import { useNavigate } from "react-router-dom";
import { Alert, Box, CircularProgress, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import PageHeader from "../../components/platform/PageHeader";
import usePlatformData from "../../hooks/usePlatformData";
import { inr, monthLabel, num } from "../../utils/platformFormat";

function ChartCard({ title, children }) {
  return (
    <>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>{title}</Typography>
      <Paper sx={{ p: 2, mb: 3, borderRadius: 3, minWidth: 0 }}>{children}</Paper>
    </>
  );
}

function PlatformUsage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { data, loading, error, reload } = usePlatformData("/usage");

  const sales = (data?.salesByMonth || []).map((m) => ({ ...m, label: monthLabel(m.month) }));
  const activity = data?.activityByType30Days || [];

  return (
    <Box sx={{ width: "100%", maxWidth: "100%", minWidth: 0, px: { xs: 0, sm: 1 } }}>
      <PageHeader title="App Usage" subtitle="Sales and activity across every firm" onRefresh={reload} loading={loading} />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && !data && <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress /></Box>}

      {data && (
        <>
          <ChartCard title="Sales created per month (all firms)">
            <Box sx={{ width: "100%", height: 260, minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sales} margin={{ top: 5, right: 8, left: -16, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" interval="preserveStartEnd" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v, name) => (name === "Sales amount" ? inr(v) : num(v))} />
                  <Bar dataKey="count" name="Sales" fill={theme.palette.primary.main} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
            <TableContainer sx={{ mt: 2 }}>
              <Table size="small" sx={{ minWidth: 360 }}>
                <TableHead><TableRow><TableCell>Month</TableCell><TableCell align="right">Sales</TableCell><TableCell align="right">Sales amount</TableCell></TableRow></TableHead>
                <TableBody>
                  {sales.map((m) => (
                    <TableRow key={m.month}><TableCell>{m.label}</TableCell><TableCell align="right">{num(m.count)}</TableCell><TableCell align="right">{inr(m.amount)}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </ChartCard>

          <ChartCard title="Top firms by sales amount">
            <TableContainer>
              <Table size="small" sx={{ minWidth: 420 }}>
                <TableHead><TableRow><TableCell>#</TableCell><TableCell>Firm</TableCell><TableCell align="right">Sales</TableCell><TableCell align="right">Sales amount</TableCell></TableRow></TableHead>
                <TableBody>
                  {data.topFirmsBySales.length === 0 ? (
                    <TableRow><TableCell colSpan={4} align="center">No sales yet.</TableCell></TableRow>
                  ) : (
                    data.topFirmsBySales.map((f, i) => (
                      <TableRow key={f.firmId} hover sx={{ cursor: "pointer" }} onClick={() => navigate(`/platform-admin/firms/${f.firmId}`)}>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell sx={{ overflowWrap: "anywhere" }}>{f.name}</TableCell>
                        <TableCell align="right">{num(f.sales)}</TableCell>
                        <TableCell align="right">{inr(f.salesAmount)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </ChartCard>

          <ChartCard title="What people do in the app (last 30 days)">
            {activity.length === 0 ? (
              <Typography sx={{ color: "text.secondary" }}>No activity recorded.</Typography>
            ) : (
              <Box sx={{ width: "100%", height: Math.max(220, activity.length * 34), minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activity} layout="vertical" margin={{ top: 5, right: 16, left: 8, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="type" width={130} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" name="Actions" fill={theme.palette.secondary.main} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            )}
          </ChartCard>
        </>
      )}
    </Box>
  );
}

export default PlatformUsage;
