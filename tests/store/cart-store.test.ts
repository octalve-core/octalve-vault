import test from "node:test";
import assert from "node:assert/strict";

function installFakeWindow(initial: string | null) {
  const values = new Map<string, string>();

  if (initial !== null) {
    values.set("octalve_vault_cart_v2", initial);
  }

  const localStorage: Storage = {
    get length() {
      return values.size;
    },
    clear() {
      values.clear();
    },
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(values.keys())[index] ?? null;
    },
    removeItem(key: string) {
      values.delete(key);
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
  };

  const fakeWindow = Object.assign(
    new EventTarget(),
    { localStorage },
  ) as unknown as Window;

  const original = Object.getOwnPropertyDescriptor(globalThis, "window");

  Object.defineProperty(globalThis, "window", {
    value: fakeWindow,
    configurable: true,
    writable: true,
  });

  return {
    localStorage,
    restore() {
      if (original) {
        Object.defineProperty(globalThis, "window", original);
      } else {
        Reflect.deleteProperty(globalThis, "window");
      }
    },
  };
}

test("cartSnapshot keeps referential identity until localStorage changes", async () => {
  const fake = installFakeWindow(JSON.stringify(["vp_alpha"]));

  try {
    const { cartSnapshot } = await import(
      "../../src/features/store/cart/cart-store.ts"
    );

    const first = cartSnapshot();
    const second = cartSnapshot();

    assert.strictEqual(second, first);
    assert.deepEqual(first, ["vp_alpha"]);

    fake.localStorage.setItem(
      "octalve_vault_cart_v2",
      JSON.stringify(["vp_alpha", "vp_beta"]),
    );

    const third = cartSnapshot();
    const fourth = cartSnapshot();

    assert.notStrictEqual(third, first);
    assert.strictEqual(fourth, third);
    assert.deepEqual(third, ["vp_alpha", "vp_beta"]);
  } finally {
    fake.restore();
  }
});
