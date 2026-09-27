import test from "node:test";
import assert from "node:assert/strict";
import { assertSameOriginMutation } from "../../src/server/security/same-origin.ts";

test("safe methods do not require Origin", () => {
  const request = new Request("https://vault.octalve.com/api/example", { method: "GET" });
  assert.doesNotThrow(() => assertSameOriginMutation(request));
});

test("unsafe cookie-authenticated methods require matching Origin", () => {
  const same = new Request("https://vault.octalve.com/api/example", {
    method: "POST",
    headers: { origin: "https://vault.octalve.com" },
  });
  assert.doesNotThrow(() => assertSameOriginMutation(same));

  const missing = new Request("https://vault.octalve.com/api/example", { method: "POST" });
  assert.throws(() => assertSameOriginMutation(missing), /origin/i);

  const crossSite = new Request("https://vault.octalve.com/api/example", {
    method: "PUT",
    headers: { origin: "https://evil.example" },
  });
  assert.throws(() => assertSameOriginMutation(crossSite), /origin/i);
});
