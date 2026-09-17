// Emergency bootstrap only. Ordinarily a new shop signs up via the public
// POST /register endpoint, which creates the Firm and its admin together.
// This script creates a bare admin with NO firm attached -- it must be
// followed by seed/migrateFirmIsolation.js (or a manual firm assignment)
// before the account is usable.
//
// Usage:
//   node seed/createAdmin.js "Admin Name" admin@example.com 9999999999 yourPassword
//
// Run from the Backend/ directory so it picks up the same .env as the server.

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
require("dotenv").config();
const connectDB = require("../Config/DbConnection");
const UserModel = require("../Models/UserModel");

async function main() {
  const [name, email, contact, password] = process.argv.slice(2);

  if (!name || !email || !contact || !password) {
    console.error(
      "Usage: node seed/createAdmin.js \"Admin Name\" admin@example.com 9999999999 yourPassword"
    );
    process.exit(1);
  }

  await connectDB();

  const existing = await UserModel.findOne({ email });
  if (existing) {
    console.error(`A user with email ${email} already exists (role: ${existing.role}).`);
    await mongoose.disconnect();
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const admin = new UserModel({
    name,
    email,
    contact,
    password: hashedPassword,
    role: "admin",
  });
  await admin.save();

  console.log(`Admin account created: ${email}`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((error) => {
  console.error("Failed to create admin:", error);
  process.exit(1);
});
