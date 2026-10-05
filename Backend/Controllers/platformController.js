// Platform-owner panel API -- READ ONLY. Mounted at /api/admin/platform by
// Routes/platformRoutes.js behind isLoggedIn + isSuperAdmin. Nothing here
// writes, and nothing returns passwords or tokens: users/firms are always
// read through an explicit field list.
const mongoose = require("mongoose");
const FirmModel = require("../Models/FirmModel");
const UserModel = require("../Models/UserModel");
const SubscriptionModel = require("../Models/SubscriptionModel");
const SubscriptionPlanModel = require("../Models/SubscriptionPlanModel");
const CustomerModel = require("../Models/CustomersModel");
const StockModel = require("../Models/StockModel");
const RawMaterialModel = require("../Models/RawMaterialModel");
const SaleModel = require("../Models/SaleModel");
const PaymentModel = require("../Models/PaymentModel");
const UdharModel = require("../Models/UdharModel");
const GirviModel = require("../Models/GirviModel");
const ActivityModel = require("../Models/ActivitesModel");
const {
  DAY_MS,
  effectiveSubscriptionState,
  lastMonthKeys,
  fillMonths,
  monthKeyOf,
  summarizeSubscriptions,
  escapeRegExp,
} = require("../Utils/platformStats");

const FIRM_FIELDS =
  "name shopName location gst email contact createdAt owner invoicePrefix proprietorName";
const USER_FIELDS = "name email contact role firm";
const FIRM_SORTS = new Set(["createdAt", "name", "endDate", "sales"]);

// Subscriptions/users/firms are small collections (one subscription per
// firm), so the list views join them in memory and only run per-page
// aggregates against the big collections.
async function loadFirms() {
  const firms = await FirmModel.find({ removeAt: null }).select(FIRM_FIELDS).lean();
  const ids = firms.map((f) => f._id);
  const [subs, users] = await Promise.all([
    SubscriptionModel.find({ firm: { $in: ids } })
      .populate("plan", "key name price billingInterval")
      .lean(),
    UserModel.find({ firm: { $in: ids }, removeAt: null }).select(USER_FIELDS).lean(),
  ]);
  return { firms, ids, subs, users };
}

function groupUsersByFirm(users) {
  const map = new Map();
  for (const u of users) {
    const key = String(u.firm);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(u);
  }
  return map;
}

function ownerOf(firm, firmUsers = []) {
  const owner =
    firmUsers.find((u) => String(u._id) === String(firm.owner)) ||
    firmUsers.find((u) => u.role === "admin") ||
    null;
  return owner ? { name: owner.name, email: owner.email, contact: owner.contact } : null;
}

function subscriptionView(sub, now) {
  if (!sub) return { state: "none", plan: null, endDate: null, startDate: null, provider: null, amountPaid: 0 };
  return {
    state: effectiveSubscriptionState(sub, now),
    rawStatus: sub.status,
    plan: sub.plan
      ? { key: sub.plan.key, name: sub.plan.name, price: sub.plan.price, billingInterval: sub.plan.billingInterval }
      : null,
    startDate: sub.startDate ?? null,
    endDate: sub.endDate ?? null,
    provider: sub.paymentProvider ?? null,
    amountPaid: sub.amountPaid ?? 0,
    paymentReference: sub.paymentReference || null,
  };
}

async function countByFirm(Model, ids, match = { removeAt: null }) {
  const rows = await Model.aggregate([
    { $match: { firm: { $in: ids }, ...match } },
    { $group: { _id: "$firm", count: { $sum: 1 } } },
  ]);
  return new Map(rows.map((r) => [String(r._id), r.count]));
}

async function salesByFirm(ids) {
  const rows = await SaleModel.aggregate([
    { $match: { firm: { $in: ids }, removeAt: null } },
    { $group: { _id: "$firm", count: { $sum: 1 }, amount: { $sum: "$totalAmount" }, last: { $max: "$saleDate" } } },
  ]);
  return new Map(rows.map((r) => [String(r._id), r]));
}

async function lastActivityByFirm(ids) {
  const rows = await ActivityModel.aggregate([
    { $match: { firm: { $in: ids } } },
    { $group: { _id: "$firm", last: { $max: "$timestamp" } } },
  ]);
  return new Map(rows.map((r) => [String(r._id), r.last]));
}

module.exports.getOverview = async (req, res) => {
  try {
    const now = Date.now();
    const { firms, ids, subs, users } = await loadFirms();
    const plans = await SubscriptionPlanModel.find().sort({ price: 1 }).lean();

    const summary = summarizeSubscriptions(ids, subs, now);
    // Plans nobody has taken must still be listed (with zeros).
    for (const p of plans) {
      if (!summary.byPlan.some((e) => e.key === p.key)) {
        summary.byPlan.push({ key: p.key, name: p.name, price: p.price, trial: 0, active: 0, ended: 0 });
      }
    }
    summary.byPlan = summary.byPlan.map((e) => ({
      ...e,
      billingInterval: plans.find((p) => p.key === e.key)?.billingInterval ?? null,
    }));

    // Only records that belong to active (non-removed) firms are counted, so
    // the totals agree with the firm list and a deleted shop's retained data
    // never inflates the numbers.
    const inFirms = { removeAt: null, firm: { $in: ids } };
    const [customers, stocks, rawMaterials, sales, payments, udhar, girvi, activity7] = await Promise.all([
      CustomerModel.countDocuments(inFirms),
      StockModel.countDocuments(inFirms),
      RawMaterialModel.countDocuments(inFirms),
      SaleModel.countDocuments(inFirms),
      PaymentModel.countDocuments(inFirms),
      UdharModel.countDocuments(inFirms),
      GirviModel.countDocuments(inFirms),
      ActivityModel.countDocuments({ firm: { $in: ids }, timestamp: { $gte: new Date(now - 7 * DAY_MS) } }),
    ]);

    const monthKeys = lastMonthKeys(12, new Date(now));
    const signupCounts = new Map();
    for (const f of firms) {
      const key = monthKeyOf(f.createdAt ?? new Date(f._id.getTimestamp()));
      signupCounts.set(key, (signupCounts.get(key) ?? 0) + 1);
    }
    const signups = monthKeys.map((month) => ({ month, firms: signupCounts.get(month) ?? 0 }));

    res.set("Cache-Control", "no-store").status(200).json({
      generatedAt: new Date(now).toISOString(),
      totals: {
        firms: firms.length,
        users: users.length,
        admins: users.filter((u) => u.role === "admin").length,
        staff: users.filter((u) => u.role === "staff").length,
        customers,
        stocks,
        rawMaterials,
        sales,
        payments,
        udhar,
        girvi,
      },
      subscriptions: summary,
      signups,
      newFirmsLast30Days: firms.filter((f) => now - new Date(f.createdAt).getTime() <= 30 * DAY_MS).length,
      activityLast7Days: activity7,
    });
  } catch (error) {
    console.error("platform overview error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.getFirms = async (req, res) => {
  try {
    const now = Date.now();
    const search = String(req.query.search || "").trim();
    const state = String(req.query.state || "");
    const planKey = String(req.query.plan || "").toLowerCase();
    const sort = FIRM_SORTS.has(req.query.sort) ? req.query.sort : "createdAt";
    const dir = req.query.dir === "asc" ? 1 : -1;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);

    const { firms, subs, users } = await loadFirms();
    const subByFirm = new Map(subs.map((s) => [String(s.firm), s]));
    const usersByFirm = groupUsersByFirm(users);

    let rows = firms.map((f) => {
      const fu = usersByFirm.get(String(f._id)) ?? [];
      return {
        id: String(f._id),
        name: f.name,
        shopName: f.shopName || "",
        location: f.location || "",
        gst: f.gst || "",
        email: f.email || "",
        contact: f.contact || "",
        createdAt: f.createdAt,
        owner: ownerOf(f, fu),
        users: fu.length,
        staff: fu.filter((u) => u.role === "staff").length,
        subscription: subscriptionView(subByFirm.get(String(f._id)), now),
      };
    });

    if (search) {
      const re = new RegExp(escapeRegExp(search), "i");
      rows = rows.filter(
        (r) =>
          re.test(r.name) || re.test(r.shopName) || re.test(r.email) || re.test(r.contact) ||
          re.test(r.owner?.name ?? "") || re.test(r.owner?.email ?? "") || re.test(r.owner?.contact ?? "")
      );
    }
    if (["none", "trial", "active", "expired", "cancelled"].includes(state)) {
      rows = rows.filter((r) => r.subscription.state === state);
    }
    if (planKey) rows = rows.filter((r) => r.subscription.plan?.key === planKey);

    // Per-firm usage numbers only for the page being returned (and for the
    // whole filtered set when sorting by sales, which needs them up front).
    let salesMap = null;
    if (sort === "sales") {
      salesMap = await salesByFirm(firms.map((f) => f._id));
      rows.forEach((r) => (r._salesAmount = salesMap.get(r.id)?.amount ?? 0));
    }
    const byName = (a, b) => String(a.name).localeCompare(String(b.name));
    rows.sort((a, b) => {
      let cmp;
      if (sort === "name") cmp = byName(a, b);
      else if (sort === "endDate")
        cmp = new Date(a.subscription.endDate ?? 0) - new Date(b.subscription.endDate ?? 0);
      else if (sort === "sales") cmp = (a._salesAmount ?? 0) - (b._salesAmount ?? 0);
      else cmp = new Date(a.createdAt) - new Date(b.createdAt);
      return cmp * dir;
    });

    const total = rows.length;
    const pageRows = rows.slice((page - 1) * limit, page * limit);
    const pageIds = pageRows.map((r) => new mongoose.Types.ObjectId(r.id));

    const [customers, stocks, sales, lastActivity] = await Promise.all([
      countByFirm(CustomerModel, pageIds),
      countByFirm(StockModel, pageIds),
      salesMap && salesMap.size ? Promise.resolve(salesMap) : salesByFirm(pageIds),
      lastActivityByFirm(pageIds),
    ]);
    const items = pageRows.map(({ _salesAmount, ...r }) => ({
      ...r,
      usage: {
        customers: customers.get(r.id) ?? 0,
        stocks: stocks.get(r.id) ?? 0,
        sales: sales.get(r.id)?.count ?? 0,
        salesAmount: sales.get(r.id)?.amount ?? 0,
        lastSaleAt: sales.get(r.id)?.last ?? null,
        lastActivityAt: lastActivity.get(r.id) ?? null,
      },
    }));

    res.set("Cache-Control", "no-store").status(200).json({
      page, limit, total, pages: Math.max(Math.ceil(total / limit), 1), items,
    });
  } catch (error) {
    console.error("platform firms error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.getFirmDetail = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid firm id" });
    }
    const firm = await FirmModel.findOne({ _id: id, removeAt: null }).select(FIRM_FIELDS).lean();
    if (!firm) return res.status(404).json({ message: "Firm not found" });

    const now = Date.now();
    const firmId = firm._id;
    const [sub, users, activities] = await Promise.all([
      SubscriptionModel.findOne({ firm: firmId }).populate("plan", "key name price billingInterval").lean(),
      UserModel.find({ firm: firmId }).select(`${USER_FIELDS} removeAt`).lean(),
      ActivityModel.find({ firm: firmId }).sort({ timestamp: -1 }).limit(15).select("activityType description timestamp").lean(),
    ]);
    const [customers, stocks, rawMaterials, sales, payments, udhar, girvi, salesAgg] = await Promise.all([
      CustomerModel.countDocuments({ firm: firmId, removeAt: null }),
      StockModel.countDocuments({ firm: firmId, removeAt: null }),
      RawMaterialModel.countDocuments({ firm: firmId, removeAt: null }),
      SaleModel.countDocuments({ firm: firmId, removeAt: null }),
      PaymentModel.countDocuments({ firm: firmId, removeAt: null }),
      UdharModel.countDocuments({ firm: firmId, removeAt: null }),
      GirviModel.countDocuments({ firm: firmId, removeAt: null }),
      salesByFirm([firmId]),
    ]);
    const active = users.filter((u) => !u.removeAt);

    res.set("Cache-Control", "no-store").status(200).json({
      firm: {
        id: String(firm._id),
        name: firm.name,
        shopName: firm.shopName || "",
        location: firm.location || "",
        gst: firm.gst || "",
        email: firm.email || "",
        contact: firm.contact || "",
        proprietorName: firm.proprietorName || "",
        invoicePrefix: firm.invoicePrefix || "",
        createdAt: firm.createdAt,
      },
      owner: ownerOf(firm, active),
      subscription: subscriptionView(sub, now),
      users: users.map((u) => ({
        name: u.name, email: u.email, contact: u.contact, role: u.role, active: !u.removeAt,
      })),
      usage: {
        customers, stocks, rawMaterials, sales, payments, udhar, girvi,
        salesAmount: salesAgg.get(String(firmId))?.amount ?? 0,
        lastSaleAt: salesAgg.get(String(firmId))?.last ?? null,
      },
      recentActivity: activities.map((a) => ({ type: a.activityType, description: a.description, at: a.timestamp })),
    });
  } catch (error) {
    console.error("platform firm detail error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.getUsage = async (req, res) => {
  try {
    const now = new Date();
    const monthKeys = lastMonthKeys(12, now);
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1));

    // Active (non-removed) firms only -- same population as the firm list.
    const firmRows = await FirmModel.find({ removeAt: null }).select("name").lean();
    const ids = firmRows.map((f) => f._id);

    const [salesRows, topRows, activityRows] = await Promise.all([
      SaleModel.aggregate([
        { $match: { removeAt: null, firm: { $in: ids }, saleDate: { $gte: start } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$saleDate" } }, count: { $sum: 1 }, amount: { $sum: "$totalAmount" } } },
      ]),
      SaleModel.aggregate([
        { $match: { removeAt: null, firm: { $in: ids } } },
        { $group: { _id: "$firm", count: { $sum: 1 }, amount: { $sum: "$totalAmount" } } },
        { $sort: { amount: -1 } },
        { $limit: 10 },
      ]),
      ActivityModel.aggregate([
        { $match: { firm: { $in: ids }, timestamp: { $gte: new Date(now.getTime() - 30 * DAY_MS) } } },
        { $group: { _id: "$activityType", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 12 },
      ]),
    ]);

    const names = new Map(firmRows.map((f) => [String(f._id), f.name]));
    res.set("Cache-Control", "no-store").status(200).json({
      salesByMonth: fillMonths(monthKeys, salesRows, { count: 0, amount: 0 }),
      topFirmsBySales: topRows
        .filter((r) => names.has(String(r._id)))
        .map((r) => ({ firmId: String(r._id), name: names.get(String(r._id)), sales: r.count, salesAmount: r.amount })),
      activityByType30Days: activityRows.map((r) => ({ type: r._id, count: r.count })),
    });
  } catch (error) {
    console.error("platform usage error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
