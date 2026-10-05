// Roles a FIRM admin may hand out (POST /admin/register, POST /UpdateUser).
// "superadmin" is the platform owner and is deliberately NOT here: it can only
// be created out-of-band with seed/createSuperAdmin.js, so no request body can
// ever mint one. Matches the User schema enum minus "superadmin".
const ASSIGNABLE_ROLES = ["admin", "staff", "user"];

const isAssignableRole = (role) => ASSIGNABLE_ROLES.includes(role);

module.exports = { ASSIGNABLE_ROLES, isAssignableRole };
