import {
  Boxes,
  CircleCheckBig,
  Clock3,
  TriangleAlert,
} from "lucide-react";

import type { AdminProductSummary } from "@/server/admin/products-service";
import { AdminSummaryGrid } from "../shared/admin-summary-grid";

export function ProductSummary({
  summary,
}: {
  summary: AdminProductSummary;
}) {
  return (
    <AdminSummaryGrid
      items={[
        {
          label: "Total products",
          value: summary.total,
          helper: "All lifecycle states",
          context: "ALL",
          tone: "blue",
          icon: Boxes,
        },
        {
          label: "Ready to sell",
          value: summary.ready,
          helper: "Active, published and priced",
          context: "READY",
          tone: "emerald",
          icon: CircleCheckBig,
        },
        {
          label: "Coming Soon",
          value: summary.comingSoon,
          helper: "Public previews not yet purchasable",
          context: "PUBLIC",
          tone: "violet",
          icon: Clock3,
        },
        {
          label: "Needs attention",
          value: summary.needsAttention,
          helper: "Draft or active but not ready",
          context: "ACTION",
          tone: "amber",
          icon: TriangleAlert,
        },
      ]}
    />
  );
}
