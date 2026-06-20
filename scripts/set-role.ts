// scripts/set-role.ts
// Admin tool: set a user's role.
// Usage: node --import tsx scripts/set-role.ts <email> <OPS|EXEC>
import { prisma } from "@/lib/prisma";

async function main() {
  const [email, role] = process.argv.slice(2);
  if (!email || (role !== "OPS" && role !== "EXEC")) {
    console.error("Usage: node --import tsx scripts/set-role.ts <email> <OPS|EXEC>");
    process.exit(1);
  }
  const user = await prisma.user.update({ where: { email }, data: { role } });
  console.log(`Set ${user.email} -> ${user.role}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
