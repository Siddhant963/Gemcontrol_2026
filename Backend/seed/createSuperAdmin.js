// Creates (or promotes) the PLATFORM OWNER account that can open the
// platform admin panel (/platform-admin on the web). There is deliberately no
// API or signup path for this role -- it can only be created here, by someone
// with access to the server and its .env.
//
// Usage (run from Backend/):
//   node seed/createSuperAdmin.js "Owner Name" owner@example.com 9999999999 strongPassword
//
// The account has no firm, so it can't use the shop screens -- it only sees
// the platform panel. Refuses to touch an existing user that belongs to a firm.

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
require("dotenv").config();
const connectDB = require("../Config/DbConnection");
const UserModel = require("../Models/UserModel");

const MIN_PASSWORD_LENGTH = 8;

async function main() {
  const [name, email, contact, password] = process.argv.slice(2);
  if (!name || !email || !contact || !password) {
    console.error(
      'Usage: node seed/createSuperAdmin.js "Owner Name" owner@example.com 9999999999 strongPassword'
    );
    process.exit(1);
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    console.error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    process.exit(1);
  }

  await connectDB();

  const existing = await UserModel.findOne({ email });
  if (existing) {
    if (existing.role === "superadmin") {
      console.error(`${email} is already a platform admin.`);
    } else {
      console.error(
        `A user with email ${email} already exists (role: ${existing.role}). ` +
          "Use a different email for the platform owner account."
      );
    }
    await mongoose.disconnect();
    process.exit(1);
  }

  const owner = new UserModel({
    name,
    email,
    contact,
    password: await bcrypt.hash(password, 10),
    role: "superadmin",
    firm: null,
  });
  await owner.save();

  console.log(`Platform admin created: ${email}`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((error) => {
  console.error("Failed to create platform admin:", error);
  process.exit(1);
});
