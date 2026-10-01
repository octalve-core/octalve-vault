import { getImageKitPublicEndpoint } from "./imagekit-config.ts";

export type PublicMediaPreset = "thumbnail" | "card" | "detail";

const widths: Record<PublicMediaPreset, number> = {
  thumbnail: 300,
  card: 800,
  detail: 1400,
};

function encodedPath(filePath: string): string {
  if (!filePath.startsWith("/octalve-vault/products/")) {
    throw new Error("Invalid public media path.");
  }
  return filePath.split("/").map((part) => encodeURIComponent(part)).join("/");
}

export function publicMediaUrl(
  filePath: string,
  preset: PublicMediaPreset,
): string | null {
  const endpoint = getImageKitPublicEndpoint();
  if (!endpoint) return null;
  return `${endpoint}/tr:w-${widths[preset]},f-auto,q-80${encodedPath(filePath)}`;
}

export type ResolvedProductMediaInput = {
  title: string;
  legacyImagePath: string | null;
  primary:
    | {
        id: string;
        altText: string | null;
        position: number;
        mediaAsset: { providerFilePath: string; status: string };
      }
    | null;
  gallery: Array<{
    id: string;
    altText: string | null;
    position: number;
    mediaAsset: { providerFilePath: string; status: string };
  }>;
};

export function resolvePublicProductMedia(input: ResolvedProductMediaInput) {
  const gallery = input.gallery
    .filter((item) => item.mediaAsset.status === "READY")
    .sort((left, right) => left.position - right.position)
    .flatMap((item) => {
      const imagePath = publicMediaUrl(item.mediaAsset.providerFilePath, "detail");
      const thumbnailPath = publicMediaUrl(item.mediaAsset.providerFilePath, "thumbnail");
      if (!imagePath || !thumbnailPath) return [];
      return [{
        id: item.id,
        imagePath,
        thumbnailPath,
        altText: item.altText?.trim() || input.title,
        position: item.position,
      }];
    });

  if (input.primary?.mediaAsset.status === "READY") {
    const imagePath = publicMediaUrl(input.primary.mediaAsset.providerFilePath, "detail");
    const cardImagePath = publicMediaUrl(input.primary.mediaAsset.providerFilePath, "card");
    if (imagePath && cardImagePath) {
      return {
        imagePath,
        cardImagePath,
        imageAlt: input.primary.altText?.trim() || input.title,
        gallery,
      };
    }
  }

  if (input.legacyImagePath) {
    return {
      imagePath: input.legacyImagePath,
      cardImagePath: input.legacyImagePath,
      imageAlt: input.title,
      gallery,
    };
  }

  return {
    imagePath: "/brand/vault-logo.png",
    cardImagePath: "/brand/vault-logo.png",
    imageAlt: input.title,
    gallery,
  };
}
