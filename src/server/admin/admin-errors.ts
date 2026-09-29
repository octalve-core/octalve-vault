export type ProductAdminError = {
  status: 400 | 500;
  body:
    | {
        code: "PRODUCT_SLUG_INVALID";
        field: "slug";
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

  return {
    status: 500,
    body: {
      code: "PRODUCT_CREATE_FAILED",
      error: "We couldn't create the product. Review the details and try again.",
    },
  };
}
