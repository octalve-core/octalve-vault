export type CustomerGrant = {
  id: string;
  productTitle: string;
  orderReference: string;
  purchasedAt: string;
  version: number;
  downloadFilename: string;
  expiresAt: string | null;
  downloadCount: number;
};
