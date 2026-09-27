import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const products = [
  ["vp_001", "business-plan-templates", "Business Plan Templates", "Business & Startup", "Editable business plan templates for startups and SMEs.", 15000, true],
  ["vp_002", "pitch-deck-templates", "Pitch Deck Templates", "Business & Startup", "Investor-ready pitch deck templates for fundraising and presentations.", 12000, true],
  ["vp_003", "proposal-templates", "Proposal Templates", "Business & Startup", "Professional proposal templates for services, partnerships, and projects.", 10000, false],
  ["vp_004", "invoice-templates", "Invoice Templates", "Operations & Admin", "Branded invoice templates for businesses and freelancers.", 8000, false],
  ["vp_005", "wordpress-launchpad-kit", "Wordpress Launchpad Kit", "Website & Launch", "A quick-start kit for launching practical WordPress business websites.", 30000, true],
  ["vp_006", "wordpress-premium-kit", "Wordpress Premium Kit", "Website & Launch", "A more advanced WordPress kit for premium business websites.", 55000, true],
  ["vp_007", "startup-guides", "Startup Guides", "Business & Startup", "Practical startup guidance documents for founders and teams.", 9000, false],
  ["vp_008", "sales-scripts", "Sales Scripts", "Business & Startup", "Sales-ready scripts to improve outreach and conversion conversations.", 7500, false],
  ["vp_009", "hr-templates", "HR Templates", "Operations & Admin", "Useful HR documents for team management and internal operations.", 11000, false],
  ["vp_010", "finance-trackers", "Finance Trackers", "Operations & Admin", "Trackers for expenses, income, cash flow, and financial visibility.", 9500, false],
  ["vp_011", "resource-bundles", "Resource Bundles", "Bundles", "Curated bundles of business resources for speed and convenience.", 20000, true],
];

async function main() {
  for (const [id, slug, title, category, shortDescription, majorNgn, featured] of products) {
    const amountMinor = Number(majorNgn) * 100;
    const imagePath = `/products/${String(id).replace("_", "")}.png`;

    await prisma.product.upsert({
      where: { id: String(id) },
      update: {
        slug: String(slug),
        category: String(category),
        imagePath,
        featured: Boolean(featured),
      },
      create: {
        id: String(id),
        slug: String(slug),
        category: String(category),
        imagePath,
        featured: Boolean(featured),
        status: "COMING_SOON",
      },
    });

    await prisma.productTranslation.upsert({
      where: { productId_locale: { productId: String(id), locale: "en" } },
      update: { title: String(title), shortDescription: String(shortDescription) },
      create: {
        productId: String(id),
        locale: "en",
        title: String(title),
        shortDescription: String(shortDescription),
      },
    });

    await prisma.productPrice.upsert({
      where: { productId_currency: { productId: String(id), currency: "NGN" } },
      update: { amountMinor, isActive: true },
      create: { productId: String(id), currency: "NGN", amountMinor, isActive: true },
    });
  }

  await prisma.storeSetting.upsert({
    where: { key: "commerce" },
    update: {},
    create: {
      key: "commerce",
      value: {
        defaultCurrency: "NGN",
        enabledCurrencies: ["NGN", "USD", "GBP", "EUR"],
        defaultLocale: "en",
        enabledLocales: ["en", "fr", "ar"],
      },
    },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
