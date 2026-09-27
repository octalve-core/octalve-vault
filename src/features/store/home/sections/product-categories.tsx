import type { Locale } from "@/domain/constants";
import type { PublicProduct } from "../../catalogue/types";

type CategorySummary = {
  name: string;
  count: number;
};

const CATEGORY_COPY: Record<Locale, { eyebrow: string; title: string; products: string }> = {
  en: { eyebrow: "Browse the Vault", title: "Resources grouped around what you need to execute.", products: "products" },
  fr: { eyebrow: "Parcourir le Vault", title: "Des ressources regroupées selon ce dont vous avez besoin pour avancer.", products: "produits" },
  ar: { eyebrow: "تصفح الخزنة", title: "موارد مصنّفة بحسب ما تحتاج إليه للتنفيذ.", products: "منتجات" },
};

function summarizeCategories(products: PublicProduct[]): CategorySummary[] {
  const counts = new Map<string, number>();

  for (const product of products) {
    const category = product.category.trim();
    if (!category) continue;
    counts.set(category, (counts.get(category) ?? 0) + 1);
  }

  return [...counts.entries()].map(([name, count]) => ({ name, count }));
}

export function ProductCategoriesSection({
  locale,
  products,
}: {
  locale: Locale;
  products: PublicProduct[];
}) {
  const categories = summarizeCategories(products);
  if (categories.length === 0) return null;

  const copy = CATEGORY_COPY[locale];

  return (
    <section className="bg-[#040506] px-4 pb-20 text-white sm:px-6 sm:pb-24 lg:px-8">
      <div className="mx-auto max-w-[1280px] border-t border-white/8 pt-12 sm:pt-14">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-[#6DA9FF]">
          {copy.eyebrow}
        </p>
        <h2 className="mt-3 max-w-3xl text-3xl font-medium tracking-[-0.04em] sm:text-4xl">
          {copy.title}
        </h2>

        <div className="mt-8 grid gap-px overflow-hidden border border-white/8 bg-white/8 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <div
              key={category.name}
              className="flex min-h-28 items-end justify-between gap-6 bg-[#07090C] px-5 py-5 transition hover:bg-[#0B0E13] sm:px-6"
            >
              <span className="text-lg font-medium tracking-[-0.025em] text-white">
                {category.name}
              </span>
              <span className="shrink-0 text-xs font-medium uppercase tracking-[0.12em] text-white/45">
                {category.count} {copy.products}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
