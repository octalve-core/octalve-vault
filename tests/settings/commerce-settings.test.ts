import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_COMMERCE_SETTINGS, resolveCommerceSettings } from "../../src/domain/commerce-settings.ts";

test("commerce settings default safely when no database value exists", () => {
  assert.deepEqual(resolveCommerceSettings(null), DEFAULT_COMMERCE_SETTINGS);
});

test("commerce settings accept only supported enabled values and keep defaults enabled", () => {
  assert.deepEqual(resolveCommerceSettings({
    defaultCurrency: "USD",
    defaultLocale: "fr",
    enabledCurrencies: ["USD", "EUR", "BTC", "USD"],
    enabledLocales: ["fr", "ar", "zz", "fr"],
  }), {
    defaultCurrency: "USD",
    defaultLocale: "fr",
    enabledCurrencies: ["USD", "EUR"],
    enabledLocales: ["fr", "ar"],
  });
});

test("invalid configured defaults fall back to application defaults", () => {
  assert.deepEqual(resolveCommerceSettings({
    defaultCurrency: "BTC",
    defaultLocale: "zz",
    enabledCurrencies: ["USD"],
    enabledLocales: ["fr"],
  }), DEFAULT_COMMERCE_SETTINGS);
});

import { readFileSync } from "node:fs";

test("public locale shell and checkout enforce database commerce settings", () => {
  const layout = readFileSync("src/app/[locale]/layout.tsx", "utf8");
  const checkout = readFileSync("src/server/payments/checkout-service.ts", "utf8");
  const root = readFileSync("src/app/page.tsx", "utf8");
  assert.match(layout, /getCommerceSettings/);
  assert.match(layout, /enabledLocales/);
  assert.match(checkout, /enabledCurrencies\.includes\(input\.currency\)/);
  assert.match(root, /settings\.defaultLocale/);
});
