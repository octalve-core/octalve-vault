import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const root = process.cwd();
const source = (relative: string) => readFileSync(resolve(root, relative), "utf8");

test("Checkout copy explains secure purchase flow in customer language across EN FR and AR", () => {
  const messages = source("src/i18n/messages.ts");
  assert.match(messages, /Complete your purchase securely\./);
  assert.match(messages, /Review your order, enter the email you'll use to access your purchases, then continue to secure payment\. Your products become available after payment is confirmed\./);
  assert.match(messages, /Your final price, discounts and total are verified securely before payment begins\./);
  assert.match(messages, /Finalisez votre achat en toute sécurité\./);
  assert.match(messages, /Votre prix final, vos remises et le total sont vérifiés de façon sécurisée avant le début du paiement\./);
  assert.match(messages, /أكمل شراءك بأمان\./);
  assert.match(messages, /يتم التحقق بأمان من السعر النهائي والخصومات والإجمالي قبل بدء الدفع\./);
});

test("Checkout copy removes implementation language while preserving the existing rendering keys", () => {
  const messages = source("src/i18n/messages.ts");
  const view = source("src/features/store/checkout/checkout-view.tsx");
  const route = source("src/app/[locale]/checkout/page.tsx");

  for (const key of [
    "checkout.pageTitle",
    "checkout.pageBody",
    "checkout.emailHelp",
    "checkout.deliveryBody",
    "checkout.serverPricing",
  ]) {
    assert.match(messages, new RegExp(key.replace(".", "\\.")));
  }

  assert.match(route, /checkout\.pageTitle/);
  assert.match(route, /checkout\.pageBody/);
  assert.match(view, /checkout\.emailHelp/);
  assert.match(view, /checkout\.deliveryBody/);
  assert.match(view, /checkout\.serverPricing/);

  assert.doesNotMatch(messages, /server-side verification/);
  assert.doesNotMatch(messages, /Browser totals are display-only/);
  assert.doesNotMatch(messages, /vérification côté serveur/);
  assert.doesNotMatch(messages, /totaux affichés dans le navigateur/);
  assert.doesNotMatch(messages, /التحقق على الخادم/);
  assert.doesNotMatch(messages, /الإجماليات المعروضة في المتصفح/);
});
