import assert from "node:assert/strict";
import test from "node:test";

test("public catalogue query parser supports search category availability and safe sorts", async () => {
  const catalogue = await import("../../src/features/store/catalogue/catalogue-index.ts");
  const input = catalogue.parsePublicCatalogueParams(
    new URLSearchParams({
      q: "  Launch   Kit ",
      category: " Website & Launch ",
      availability: "coming-soon",
      sort: "newest",
    }),
  );
  assert.equal(input.query, "Launch Kit");
  assert.equal(input.category, "Website & Launch");
  assert.equal(input.availability, "coming-soon");
  assert.equal(input.sort, "newest");
  assert.equal(
    catalogue.parsePublicCatalogueParams(new URLSearchParams({ sort: "price-low" })).sort,
    "featured",
  );
  assert.equal(
    catalogue.parsePublicCatalogueParams(new URLSearchParams({ availability: "draft" })).availability,
    undefined,
  );
});

test("public catalogue search and availability are translated into the database where boundary", async () => {
  const catalogue = await import("../../src/features/store/catalogue/catalogue-index.ts");
  const input = catalogue.parsePublicCatalogueParams(
    new URLSearchParams({
      q: "launch",
      category: "Website & Launch",
      availability: "available",
    }),
  );
  const serialized = JSON.stringify(catalogue.buildPublicProductWhere(input));
  assert.match(serialized, /"COMING_SOON"/);
  assert.match(serialized, /"ACTIVE"/);
  assert.match(serialized, /"PUBLISHED"/);
  assert.match(serialized, /"slug"/);
  assert.match(serialized, /"category"/);
  assert.match(serialized, /"translations"/);
  assert.match(serialized, /"title"/);
  assert.match(serialized, /"mode":"insensitive"/);
  assert.deepEqual(catalogue.buildPublicProductOrderBy({ ...input, sort: "newest" }), [
    { createdAt: "desc" },
    { id: "asc" },
  ]);
});
