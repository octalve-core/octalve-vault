import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";
import { PrismaClient } from "@prisma/client";

const scrypt = promisify(scryptCallback);
const prisma = new PrismaClient();
const KEY_LENGTH = 64;
const FORMAT = "scrypt-v1";

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}.`);
  return value;
}

async function hashPassword(password) {
  if (password.length < 14 || password.length > 256) {
    throw new Error("Bootstrap password must be between 14 and 256 characters.");
  }
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, KEY_LENGTH);
  return [FORMAT, salt.toString("base64url"), Buffer.from(derived).toString("base64url")].join("$");
}

async function main() {
  const email = required("ADMIN_BOOTSTRAP_EMAIL").toLowerCase();
  const displayName = required("ADMIN_BOOTSTRAP_NAME");
  const password = required("ADMIN_BOOTSTRAP_PASSWORD");
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("ADMIN_BOOTSTRAP_EMAIL is invalid.");

  const count = await prisma.adminUser.count();
  if (count !== 0) {
    throw new Error("Bootstrap refused: an admin already exists. Create additional admins from Octalve Admin.");
  }

  const passwordHash = await hashPassword(password);
  const admin = await prisma.adminUser.create({
    data: { email, displayName, passwordHash, role: "SUPER_ADMIN", active: true },
    select: { id: true, email: true, displayName: true, role: true },
  });
  console.log(`Created first ${admin.role}: ${admin.email} (${admin.id}).`);
  console.log("Remove ADMIN_BOOTSTRAP_* values from your environment now.");
}

main()
  .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); });
