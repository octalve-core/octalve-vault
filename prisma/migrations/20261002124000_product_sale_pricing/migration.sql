ALTER TABLE "ProductPrice"
ADD COLUMN "saleAmountMinor" INTEGER;

ALTER TABLE "ProductPrice"
ADD CONSTRAINT "ProductPrice_saleAmountMinor_check"
CHECK (
  "saleAmountMinor" IS NULL
  OR (
    "saleAmountMinor" > 0
    AND "saleAmountMinor" < "amountMinor"
  )
);