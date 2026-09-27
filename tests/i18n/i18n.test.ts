import test from "node:test";
import assert from "node:assert/strict";
import { resolveLocale, isRtlLocale } from "../../src/config/locales.ts";
import { resolveCurrency } from "../../src/config/currencies.ts";
import { getMessages, translate } from "../../src/i18n/messages.ts";
import { localeHref } from "../../src/i18n/routing.ts";

test("unknown locales fall back to English and Arabic is RTL", () => {
  assert.equal(resolveLocale("fr"), "fr");
  assert.equal(resolveLocale("sw"), "en");
  assert.equal(isRtlLocale("ar"), true);
  assert.equal(isRtlLocale("fr"), false);
});

test("unknown currencies fall back to NGN", () => {
  assert.equal(resolveCurrency("USD"), "USD");
  assert.equal(resolveCurrency("CAD"), "NGN");
});

test("UI dictionaries contain localized navigation and safely fall back to English keys", () => {
  assert.equal(translate(getMessages("fr"), "nav.shop"), "Boutique");
  assert.equal(translate(getMessages("ar"), "nav.downloads"), "مشترياتي");
  assert.equal(translate(getMessages("fr"), "missing.key", getMessages("en")), "missing.key");
});

test("localeHref keeps internal public routes under the selected locale", () => {
  assert.equal(localeHref("fr", "/products"), "/fr/products");
  assert.equal(localeHref("ar", "/"), "/ar");
});

test("customer checkout, payment result and private Vault copy is localized in every supported locale", () => {
  const required = [
    "checkout.eyebrow", "checkout.title", "checkout.email", "checkout.payment", "checkout.accept", "checkout.submit", "checkout.summary", "checkout.total",
    "vault.accessTitle", "vault.accessBody", "vault.email", "vault.continue", "vault.otpTitle", "vault.verify", "vault.title", "vault.download", "vault.logout",
    "payment.successTitle", "payment.failedTitle", "payment.pendingTitle", "payment.verifyingTitle",
  ];
  for (const locale of ["en", "fr", "ar"] as const) {
    const messages = getMessages(locale);
    for (const key of required) assert.notEqual(messages[key], undefined, `${locale} should translate ${key}`);
  }
});
