import { ROUTES } from "../utils/routes";

// Single source of truth for app navigation. The desktop sidebar, tablet rail
// and mobile/tablet drawer all render from this list (see NavList).
export const menuItems = [
  { text: "Dashboard", icon: "grid_view", path: ROUTES.DASHBOARD, section: "Main" },
  {
    text: "Sales Management",
    icon: "point_of_sale",
    path: ROUTES.SALES_MANAGEMENT,
    section: "Sales & Billing",
  },
  { text: "Payments", icon: "payments", path: ROUTES.PAYMENTS, adminOnly: true, section: "Sales & Billing" },
  {
    text: "Raw Materials",
    icon: "toll",
    path: ROUTES.RAW_MATERIALS,
    section: "Inventory & Stock",
  },
  { text: "Categories", icon: "category", path: ROUTES.CATEGORIES, section: "Inventory & Stock" },
  {
    text: "Items Management",
    icon: "qr_code_scanner",
    path: ROUTES.ITEMS_MANAGEMENT,
    section: "Inventory & Stock",
  },
  {
    text: "Jewellery Panel",
    icon: "diamond",
    path: ROUTES.JEWELLERY_PANEL,
    section: "Inventory & Stock",
  },
  {
    text: "Customer Management",
    icon: "groups",
    path: ROUTES.CUSTOMER_MANAGEMENT,
    section: "Customers & Credit",
  },
  {
    text: "Udhar Management",
    icon: "menu_book",
    path: ROUTES.UDHAR_MANAGEMENT,
    adminOnly: true,
    section: "Customers & Credit",
  },
  {
    text: "Borrows Management",
    icon: "lock",
    path: ROUTES.GIRVI_MANAGEMENT,
    adminOnly: true,
    section: "Customers & Credit",
  },
  {
    text: "Day Book",
    icon: "auto_stories",
    path: ROUTES.DAY_BOOK,
    section: "Accounting & Reports",
  },
  { text: "User Management", icon: "badge", path: ROUTES.USER_MANAGEMENT, adminOnly: true, section: "System & Staff" },
  { text: "Firm Management", icon: "storefront", path: ROUTES.FIRM_MANAGEMENT, adminOnly: true, section: "System & Staff" },
  { text: "Subscription", icon: "workspace_premium", path: ROUTES.SUBSCRIBE, adminOnly: true, section: "System & Staff" },
  { text: "Account Settings", icon: "account_circle", path: ROUTES.ACCOUNT_SETTINGS, section: "System & Staff" },
  // Platform-owner panel: shown ONLY to the "superadmin" role (and that role
  // sees nothing else -- it has no firm).
  { text: "Overview", icon: "insights", path: ROUTES.PLATFORM_ADMIN, platformOnly: true, section: "Platform" },
  { text: "Firms & Subscribers", icon: "apartment", path: ROUTES.PLATFORM_FIRMS, platformOnly: true, section: "Platform" },
  { text: "App Usage", icon: "bar_chart", path: ROUTES.PLATFORM_USAGE, platformOnly: true, section: "Platform" },
];

export const getVisibleMenuItems = (isAdmin, isSuperAdmin = false) =>
  isSuperAdmin
    ? menuItems.filter((item) => item.platformOnly)
    : menuItems.filter((item) => !item.platformOnly && (!item.adminOnly || isAdmin));
