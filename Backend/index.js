import "dotenv/config";
import { PrismaClient } from "./generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";

console.log("DATABASE_URL =", process.env.DATABASE_URL);
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const main = async () => {
  const allUsers = await prisma.Users.findMany();
  console.log(allUsers);
};
main()
  .catch((err) => {
    console.log(err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
