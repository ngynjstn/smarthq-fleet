import { prisma } from "@/lib/prisma";

async function main() {
    // upsert
    //using a fixe if makes the script idempotent
    // u still have exactly one fridge not ten dupes
    const fridge = await prisma.appliance.upsert({
        where: { id: "fridge-001" },
        update: {},
        create: {
            id: "fridge-001",
            name: "Kitchen Fridge",
            type: "REFRIGERATOR",
            model: "PFE28KYNFS",
        },
    });

    console.log("Seeded appliance: ", fridge);
}

main()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });