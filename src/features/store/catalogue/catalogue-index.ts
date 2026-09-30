import type { Prisma } from "@prisma/client";

export const PUBLIC_CATALOGUE_SORTS = [
  "featured",
  "newest",
  "oldest",
  "title",
] as const;

export type PublicCatalogueSort = (typeof PUBLIC_CATALOGUE_SORTS)[number];
export type PublicCatalogueAvailability = "available" | "coming-soon";

export type PublicCatalogueIndexInput = {
  query: string;
  category?: string;
  availability?: PublicCatalogueAvailability;
  sort: PublicCatalogueSort;
};

function normalizeText(value: string | null): string {
  return (value ?? "").trim().replace(/\s+/g, " ");
}

export function parsePublicCatalogueParams(
  params: URLSearchParams,
): PublicCatalogueIndexInput {
  const availability = params.get("availability");
  const sort = params.get("sort");
  return {
    query: normalizeText(params.get("q")),
    category: normalizeText(params.get("category")) || undefined,
    availability:
      availability === "available" || availability === "coming-soon"
        ? availability
        : undefined,
    sort: (PUBLIC_CATALOGUE_SORTS as readonly string[]).includes(sort ?? "")
      ? (sort as PublicCatalogueSort)
      : "featured",
  };
}

export function publicCatalogueBoundaryWhere(): Prisma.ProductWhereInput {
  return {
    OR: [
      { status: "COMING_SOON" },
      { status: "ACTIVE", assets: { some: { status: "PUBLISHED" } } },
    ],
  };
}

export function buildPublicProductWhere(
  input: PublicCatalogueIndexInput,
): Prisma.ProductWhereInput {
  const clauses: Prisma.ProductWhereInput[] = [publicCatalogueBoundaryWhere()];

  if (input.query) {
    clauses.push({
      OR: [
        { slug: { contains: input.query, mode: "insensitive" } },
        { category: { contains: input.query, mode: "insensitive" } },
        {
          translations: {
            some: { title: { contains: input.query, mode: "insensitive" } },
          },
        },
      ],
    });
  }

  if (input.category) {
    clauses.push({ category: { equals: input.category, mode: "insensitive" } });
  }

  if (input.availability === "available") {
    clauses.push({
      status: "ACTIVE",
      assets: { some: { status: "PUBLISHED" } },
    });
  } else if (input.availability === "coming-soon") {
    clauses.push({ status: "COMING_SOON" });
  }

  return { AND: clauses };
}

export function buildPublicProductOrderBy(
  input: PublicCatalogueIndexInput,
): Prisma.ProductOrderByWithRelationInput[] {
  switch (input.sort) {
    case "newest":
      return [{ createdAt: "desc" }, { id: "asc" }];
    case "oldest":
      return [{ createdAt: "asc" }, { id: "asc" }];
    case "featured":
    default:
      return [{ featured: "desc" }, { createdAt: "asc" }, { id: "asc" }];
  }
}
