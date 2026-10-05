import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert, Box, Card, CardActionArea, CardContent, CircularProgress, FormControl, InputLabel, MenuItem,
  Pagination, Paper, Select, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography,
} from "@mui/material";
import PageHeader from "../../components/platform/PageHeader";
import StateChip from "../../components/platform/StateChip";
import usePlatformData from "../../hooks/usePlatformData";
import { fmtDate, inr, num, STATE_META } from "../../utils/platformFormat";

const PAGE_SIZE = 20;
const SORTS = [
  { value: "createdAt", label: "Newest first" },
  { value: "name", label: "Name" },
  { value: "endDate", label: "Plan end date" },
  { value: "sales", label: "Sales amount" },
];

function PlatformFirms() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [state, setState] = useState("");
  const [plan, setPlan] = useState("");
  const [sort, setSort] = useState("createdAt");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  // Plans for the filter come from the overview (every plan, even unsold).
  const overview = usePlatformData("/overview");
  const planOptions = overview.data?.subscriptions.byPlan ?? [];

  const params = useMemo(
    () => ({ search: debounced, state, plan, sort, dir: sort === "name" || sort === "endDate" ? "asc" : "desc", page, limit: PAGE_SIZE }),
    [debounced, state, plan, sort, page]
  );
  const { data, loading, error, reload } = usePlatformData("/firms", params);

  const open = (id) => navigate(`/platform-admin/firms/${id}`);
  const items = data?.items ?? [];

  return (
    <Box sx={{ width: "100%", maxWidth: "100%", minWidth: 0, px: { xs: 0, sm: 1 } }}>
      <PageHeader
        title="Firms & Subscribers"
        subtitle={data ? `${num(data.total)} firm(s) match` : "Every shop on RatnSetu"}
        onRefresh={reload}
        loading={loading}
      />

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mb: 2, minWidth: 0 }}>
        <TextField
          size="small"
          label="Search firm, owner, email, phone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flex: "1 1 260px", minWidth: 0 }}
        />
        <FormControl size="small" sx={{ flex: "1 1 150px", minWidth: 0 }}>
          <InputLabel id="firms-plan-label">Plan</InputLabel>
          <Select labelId="firms-plan-label" id="firms-plan" label="Plan" value={plan} onChange={(e) => { setPlan(e.target.value); setPage(1); }}>
            <MenuItem value="">All plans</MenuItem>
            {planOptions.map((p) => <MenuItem key={p.key} value={p.key}>{p.name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ flex: "1 1 150px", minWidth: 0 }}>
          <InputLabel id="firms-status-label">Status</InputLabel>
          <Select labelId="firms-status-label" id="firms-status" label="Status" value={state} onChange={(e) => { setState(e.target.value); setPage(1); }}>
            <MenuItem value="">All statuses</MenuItem>
            {Object.entries(STATE_META).map(([key, m]) => <MenuItem key={key} value={key}>{m.label}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ flex: "1 1 150px", minWidth: 0 }}>
          <InputLabel id="firms-sort-label">Sort by</InputLabel>
          <Select labelId="firms-sort-label" id="firms-sort" label="Sort by" value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}>
            {SORTS.map((s) => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && !data && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress /></Box>
      )}

      {data && items.length === 0 && (
        <Typography sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>No firms found.</Typography>
      )}

      {items.length > 0 && (
        <>
          {/* Phones: one card per firm, every field kept */}
          <Box sx={{ display: { xs: "block", sm: "none" } }}>
            {items.map((f) => (
              <Card key={f.id} sx={{ mb: 2, borderRadius: 2 }}>
                <CardActionArea onClick={() => open(f.id)}>
                  <CardContent sx={{ overflowWrap: "anywhere" }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, alignItems: "flex-start" }}>
                      <Typography sx={{ fontWeight: 700 }}>{f.name}</Typography>
                      <StateChip state={f.subscription.state} />
                    </Box>
                    <Typography sx={{ fontSize: "0.8rem" }}>Owner: {f.owner?.name || "—"}</Typography>
                    <Typography sx={{ fontSize: "0.8rem" }}>{f.owner?.email || f.email || "—"} · {f.owner?.contact || f.contact || "—"}</Typography>
                    <Typography sx={{ fontSize: "0.8rem" }}>Plan: {f.subscription.plan?.name || "—"} · ends {fmtDate(f.subscription.endDate)}</Typography>
                    <Typography sx={{ fontSize: "0.8rem" }}>Users {num(f.users)} ({num(f.staff)} staff) · Customers {num(f.usage.customers)} · Stock {num(f.usage.stocks)}</Typography>
                    <Typography sx={{ fontSize: "0.8rem" }}>Sales {num(f.usage.sales)} · {inr(f.usage.salesAmount)}</Typography>
                    <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>Joined {fmtDate(f.createdAt)}</Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            ))}
          </Box>

          {/* Tablet / desktop: full table, scrolls inside its own container */}
          <Paper sx={{ display: { xs: "none", sm: "block" }, borderRadius: 3 }}>
            <TableContainer>
              <Table size="small" sx={{ minWidth: 1100 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Firm</TableCell>
                    <TableCell>Owner</TableCell>
                    <TableCell>Plan</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Plan ends</TableCell>
                    <TableCell align="right">Users</TableCell>
                    <TableCell align="right">Customers</TableCell>
                    <TableCell align="right">Stock</TableCell>
                    <TableCell align="right">Sales</TableCell>
                    <TableCell align="right">Sales amount</TableCell>
                    <TableCell>Joined</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((f) => (
                    <TableRow key={f.id} hover sx={{ cursor: "pointer" }} onClick={() => open(f.id)}>
                      <TableCell sx={{ maxWidth: 220, overflowWrap: "anywhere", fontWeight: 600 }}>{f.name}</TableCell>
                      <TableCell sx={{ maxWidth: 240, overflowWrap: "anywhere" }}>
                        {f.owner?.name || "—"}
                        <Typography component="div" sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
                          {f.owner?.email || f.email || "—"}
                        </Typography>
                        <Typography component="div" sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
                          {f.owner?.contact || f.contact || ""}
                        </Typography>
                      </TableCell>
                      <TableCell>{f.subscription.plan?.name || "—"}</TableCell>
                      <TableCell><StateChip state={f.subscription.state} /></TableCell>
                      <TableCell>{fmtDate(f.subscription.endDate)}</TableCell>
                      <TableCell align="right">{num(f.users)}<Typography component="span" sx={{ fontSize: "0.7rem", color: "text.secondary" }}> ({num(f.staff)} staff)</Typography></TableCell>
                      <TableCell align="right">{num(f.usage.customers)}</TableCell>
                      <TableCell align="right">{num(f.usage.stocks)}</TableCell>
                      <TableCell align="right">{num(f.usage.sales)}</TableCell>
                      <TableCell align="right">{inr(f.usage.salesAmount)}</TableCell>
                      <TableCell>{fmtDate(f.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
            <Pagination count={data.pages} page={page} onChange={(_e, p) => setPage(p)} siblingCount={0} />
          </Box>
        </>
      )}
    </Box>
  );
}

export default PlatformFirms;
