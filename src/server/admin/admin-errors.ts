export type ProductAdminError = {
  status: 400 | 500;
  body:
    | {
        code: "PRODUCT_SLUG_INVALID";
        field: "slug";
        error: string;
      }
    | {
        code: "PRODUCT_MEDIA_INVALID";
        field: "primaryMediaAssetId";
        error: string;
      }
    | {
        code: "PRODUCT_CREATE_FAILED";
        error: string;
      };
};

export function mapProductAdminError(error: unknown): ProductAdminError {
  const message = error instanceof Error ? error.message : "";

  if (message === "Invalid product slug.") {
    return {
      status: 400,
      body: {
        code: "PRODUCT_SLUG_INVALID",
        field: "slug",
        error: "Use lowercase letters, numbers and hyphens only.",
      },
    };
  }

  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    error.code === "PRODUCT_MEDIA_INVALID"
  ) {
    return {
      status: 400,
      body: {
        code: "PRODUCT_MEDIA_INVALID",
        field: "primaryMediaAssetId",
        error: "Choose an available READY image or create the product without media.",
      },
    };
  }

  return {
    status: 500,
    body: {
      code: "PRODUCT_CREATE_FAILED",
      error: "We couldn't create the product. Review the details and try again.",
    },
  };
}
