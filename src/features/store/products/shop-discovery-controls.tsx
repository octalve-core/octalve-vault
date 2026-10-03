"use client";

import { useCallback, useEffect, useRef, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import type { CurrencyCode, Locale } from "@/domain/constants";
import type {
  PublicCatalogueAvailability,
  PublicCatalogueIndexInput,
  PublicCatalogueSort,
} from "@/features/store/catalogue/catalogue-index";
import { getMessages, translate } from "@/i18n/messages";
import { localeHref } from "@/i18n/routing";
import { useCurrency } from "../currency/use-currency";

const SEARCH_DEBOUNCE_MS = 350;

const ALL_LABEL: Record<Locale, string> = {
  en: "All",
  fr: "Tous",
  ar: "الكل",
};

const SORT_KEYS: Array<{ value: PublicCatalogueSort; key: string }> = [
  { value: "featured", key: "shop.sortFeatured" },
  { value: "newest", key: "shop.sortNewest" },
  { value: "oldest", key: "shop.sortOldest" },
  { value: "title", key: "shop.sortTitle" },
];

type ShopDiscoveryChanges = {
  query?: string;
  category?: string;
  availability?: PublicCatalogueAvailability;
  currency?: CurrencyCode;
  sort?: PublicCatalogueSort;
};

type NavigationMode = "replace" | "push";

function normalizeSearch(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function applyChanges(
  current: URLSearchParams,
  changes: ShopDiscoveryChanges,
): URLSearchParams {
  const next = new URLSearchParams(current.toString());

  if ("query" in changes) {
    const query = normalizeSearch(changes.query ?? "");
    if (query) next.set("q", query);
    else next.delete("q");
  }

  if ("category" in changes) {
    const category = (changes.category ?? "").trim();
    if (category) next.set("category", category);
    else next.delete("category");
  }

  if ("availability" in changes) {
    if (changes.availability) next.set("availability", changes.availability);
    else next.delete("availability");
  }

  if ("currency" in changes) {
    if (changes.currency) next.set("currency", changes.currency);
    else next.delete("currency");
  }

  if (next.get("availability") !== "on-sale") {
    next.delete("currency");
  }

  if ("sort" in changes) {
    if (changes.sort && changes.sort !== "featured") next.set("sort", changes.sort);
    else next.delete("sort");
  }

  return next;
}

function discoveryHref(locale: Locale, params: URLSearchParams): string {
  const queryString = params.toString();
  const base = localeHref(locale, "/products");
  return queryString ? `${base}?${queryString}` : base;
}

export function ShopDiscoveryControls({
  categories,
  input,
  locale,
}: {
  categories: string[];
  input: PublicCatalogueIndexInput;
  locale: Locale;
}) {
  const messages = getMessages(locale);
  const router = useRouter();
  const { currency } = useCurrency();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimerRef = useRef<number | null>(null);
  const draftQueryRef = useRef(input.query);
  const lastNavigatedQueryRef = useRef(input.query);
  const latestParamsRef = useRef(searchParams.toString());
  const [isPending, startTransition] = useTransition();

  const clearPendingSearch = useCallback(() => {
    if (searchTimerRef.current !== null) {
      window.clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    latestParamsRef.current = searchParams.toString();
  }, [searchParams]);

  useEffect(() => {
    if (input.query === lastNavigatedQueryRef.current) return;

    clearPendingSearch();
    lastNavigatedQueryRef.current = input.query;
    draftQueryRef.current = input.query;

    if (inputRef.current && inputRef.current.value !== input.query) {
      inputRef.current.value = input.query;
    }
  }, [clearPendingSearch, input.query]);

  useEffect(() => clearPendingSearch, [clearPendingSearch]);

  const navigate = useCallback(
    (
      changes: ShopDiscoveryChanges,
      mode: NavigationMode = "replace",
    ) => {
      clearPendingSearch();

      const current = new URLSearchParams(latestParamsRef.current);
      const next = applyChanges(current, changes);
      const nextQueryString = next.toString();

      if ("query" in changes) {
        const query = normalizeSearch(changes.query ?? "");
        draftQueryRef.current = query;
        lastNavigatedQueryRef.current = query;
      }

      latestParamsRef.current = nextQueryString;
      const href = discoveryHref(locale, next);

      startTransition(() => {
        if (mode === "push") {
          router.push(href, { scroll: false });
        } else {
          router.replace(href, { scroll: false });
        }
      });
    },
    [clearPendingSearch, locale, router],
  );

  useEffect(() => {
    if (
      input.availability !== "on-sale" ||
      input.currency === currency
    ) {
      return;
    }

    navigate({
      query: draftQueryRef.current,
      currency,
    });
  }, [
    currency,
    input.availability,
    input.currency,
    navigate,
  ]);

  function handleSearchChange(value: string) {
    draftQueryRef.current = value;
    clearPendingSearch();

    searchTimerRef.current = window.setTimeout(() => {
      searchTimerRef.current = null;
      navigate({ query: draftQueryRef.current });
    }, SEARCH_DEBOUNCE_MS);
  }

  function changeAvailability(value: string) {
    navigate({
      query: draftQueryRef.current,
      availability:
        value === "available" ||
        value === "coming-soon" ||
        value === "on-sale"
          ? value
          : undefined,
      currency:
        value === "on-sale"
          ? currency
          : undefined,
    });
  }

  function changeSort(value: string) {
    const sort: PublicCatalogueSort =
      value === "newest" || value === "oldest" || value === "title"
        ? value
        : "featured";

    navigate({
      query: draftQueryRef.current,
      sort,
    });
  }

  function changeCategory(category?: string) {
    navigate(
      {
        query: draftQueryRef.current,
        category,
      },
      "push",
    );
  }

  function clearDiscovery() {
    clearPendingSearch();
    draftQueryRef.current = "";
    lastNavigatedQueryRef.current = "";

    if (inputRef.current) {
      inputRef.current.value = "";
    }

    navigate({
      query: "",
      category: undefined,
      availability: undefined,
      sort: "featured",
    });
  }

  return (
    <>
      <div
        aria-busy={isPending}
        className="mt-9 grid gap-3 rounded-[24px] border border-slate-200 bg-white p-4 md:grid-cols-[minmax(0,1fr)_190px_190px_auto]"
      >
        <label className="text-sm font-medium text-slate-700">
          {translate(messages, "shop.search")}
          <input
            ref={inputRef}
            name="q"
            defaultValue={input.query}
            onChange={(event) => handleSearchChange(event.currentTarget.value)}
            placeholder={translate(messages, "shop.searchPlaceholder")}
            className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal outline-none focus:border-[#0064E0]"
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          {translate(messages, "shop.availability")}
          <select
            name="availability"
            value={input.availability ?? ""}
            onChange={(event) => changeAvailability(event.currentTarget.value)}
            className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 font-normal outline-none focus:border-[#0064E0]"
          >
            <option value="">{translate(messages, "shop.allAvailability")}</option>
            <option value="available">{translate(messages, "shop.availableNow")}</option>
            <option value="coming-soon">{translate(messages, "shop.comingSoon")}</option>
            <option value="on-sale">{translate(messages, "shop.onSale")}</option>
          </select>
        </label>

        <label className="text-sm font-medium text-slate-700">
          {translate(messages, "shop.sort")}
          <select
            name="sort"
            value={input.sort}
            onChange={(event) => changeSort(event.currentTarget.value)}
            className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 font-normal outline-none focus:border-[#0064E0]"
          >
            {SORT_KEYS.map((option) => (
              <option key={option.value} value={option.value}>
                {translate(messages, option.key)}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-end gap-2">
          {isPending ? (
            <span
              aria-hidden="true"
              className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-[#0064E0]"
            />
          ) : null}
          <button
            type="button"
            onClick={clearDiscovery}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {translate(messages, "shop.clear")}
          </button>
        </div>
      </div>

      {categories.length > 1 ? (
        <div
          className="mt-5 flex max-w-full gap-2 overflow-x-auto pb-2"
          aria-label={translate(messages, "shop.categories")}
        >
          <button
            type="button"
            onClick={() => changeCategory(undefined)}
            aria-pressed={!input.category}
            className={`inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 text-sm font-medium transition ${
              !input.category
                ? "border-[#0A84FF] bg-[#0A84FF] text-white"
                : "border-slate-200 bg-white text-slate-700 hover:border-[#0A84FF]/40"
            }`}
          >
            {ALL_LABEL[locale]}
          </button>

          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => changeCategory(category)}
              aria-pressed={input.category === category}
              className={`inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 text-sm font-medium transition ${
                input.category === category
                  ? "border-[#0A84FF] bg-[#0A84FF] text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:border-[#0A84FF]/40"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      ) : null}
    </>
  );
}
