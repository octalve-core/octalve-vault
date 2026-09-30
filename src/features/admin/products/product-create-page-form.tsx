"use client";
import { adminNotice } from "@/features/admin/shared/admin-notification-provider";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import {
  canAddProductCategory,
  filterProductCategories,
  normalizeProductCategory,
  slugifyProductTitle,
} from "./product-create-state";

export function ProductCreatePageForm({ categories }: { categories: string[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManual, setSlugManual] = useState(false);
  const [category, setCategory] = useState("");
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoryOptions = useMemo(
    () => filterProductCategories(categories, category),
    [categories, category],
  );
  const showAddCategory = canAddProductCategory(categories, category);

  function changeTitle(value: string) {
    setTitle(value);
    if (!slugManual) setSlug(slugifyProductTitle(value));
  }

  function changeSlug(value: string) {
    setSlug(value.toLowerCase().replace(/\s+/g, "-"));
    setSlugManual(true);
  }

  function regenerateSlug() {
    setSlug(slugifyProductTitle(title));
    setSlugManual(false);
  }

  async function submit(formData: FormData) {
    const noticeId = adminNotice.pending({
      title: "Creating product",
      message: "Validating and creating the new draft product...",
    });

    setBusy(true);
    setError(null);
    const normalizedCategory = normalizeProductCategory(category);
    const payload = {
      title: String(formData.get("title") || "").trim(),
      slug: String(formData.get("slug") || "").trim(),
      category: normalizedCategory,
    };

    try {
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as {
        product?: { id: string };
        error?: string;
      };
      if (!response.ok || !data.product) {
        throw new Error(data.error || "Unable to create product.");
      }
      adminNotice.success(noticeId, { title: "Product created", message: "The draft is ready for product setup." });
      router.push(`/admin/products/${data.product.id}`);
      router.refresh();
    } catch (caught) {
      const noticeMessage =
        caught instanceof Error ? caught.message : "Unable to create product.";
      adminNotice.error(noticeId, {
        title: "Product not created",
        message: noticeMessage,
      });
      setError(caught instanceof Error ? caught.message : "Unable to create product.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form action={submit} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="grid gap-6">
        <label className="text-sm font-medium text-slate-700">
          Product title
          <input
            name="title"
            required
            maxLength={180}
            value={title}
            onChange={(event) => changeTitle(event.target.value)}
            placeholder="e.g. Vault E-commerce"
            className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 font-normal outline-none transition focus:border-[#0064E0]"
          />
        </label>

        <div>
          <div className="flex items-end justify-between gap-4">
            <label htmlFor="product-slug" className="text-sm font-medium text-slate-700">
              Product slug
            </label>
            <button
              type="button"
              onClick={regenerateSlug}
              className="text-xs font-medium text-[#0064E0] hover:text-[#0057C2]"
            >
              Regenerate
            </button>
          </div>
          <input
            id="product-slug"
            name="slug"
            required
            maxLength={100}
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            value={slug}
            onChange={(event) => changeSlug(event.target.value)}
            placeholder="vault-e-commerce"
            className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 font-normal outline-none transition focus:border-[#0064E0]"
          />
          <p className="mt-2 text-xs leading-5 text-slate-500">
            {slugManual
              ? "Manual slug editing is active. Use Regenerate to follow the title again."
              : "Slug follows the title automatically until you edit it manually."}
          </p>
        </div>

        <div className="relative">
          <label htmlFor="product-category" className="text-sm font-medium text-slate-700">
            Category
          </label>
          <input
            id="product-category"
            name="category"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={categoryOpen}
            aria-controls="product-category-options"
            autoComplete="off"
            required
            maxLength={80}
            value={category}
            onFocus={() => setCategoryOpen(true)}
            onChange={(event) => {
              setCategory(event.target.value);
              setCategoryOpen(true);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") setCategoryOpen(false);
            }}
            placeholder="Search or add a category"
            className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 font-normal outline-none transition focus:border-[#0064E0]"
          />

          {categoryOpen && (categoryOptions.length > 0 || showAddCategory) ? (
            <div
              id="product-category-options"
              role="listbox"
              className="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-xl"
            >
              {categoryOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  role="option"
                  aria-selected={normalizeProductCategory(option) === normalizeProductCategory(category)}
                  onClick={() => {
                    setCategory(option);
                    setCategoryOpen(false);
                  }}
                  className="flex min-h-11 w-full items-center rounded-xl px-3 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  {option}
                </button>
              ))}
              {showAddCategory ? (
                <button
                  type="button"
                  role="option"
                  aria-selected="false"
                  onClick={() => {
                    setCategory(normalizeProductCategory(category));
                    setCategoryOpen(false);
                  }}
                  className="flex min-h-11 w-full items-center rounded-xl px-3 text-left text-sm font-medium text-[#0064E0] hover:bg-blue-50"
                >
                  + Add &quot;{normalizeProductCategory(category)}&quot;
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {error ? (
        <p role="alert" className="mt-5 text-sm font-medium text-red-600">
          {error}
        </p>
      ) : null}

      <div className="mt-7 flex flex-wrap items-center gap-3">
        <button
          disabled={busy || !title.trim() || !slug || !normalizeProductCategory(category)}
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#0064E0] px-6 text-sm font-medium text-white transition hover:bg-[#0057C2] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Creating…" : "Create product"}
        </button>
        <Link
          href="/admin/products"
          className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-200 px-6 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
