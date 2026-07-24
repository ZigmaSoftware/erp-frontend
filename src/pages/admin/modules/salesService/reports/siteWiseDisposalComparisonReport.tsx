import { salesReportEndpoints } from "@/helpers/admin";
import { createReportPage } from "./reportFactory";

export default createReportPage({
  title: "Site-Wise Disposal Comparison",
  endpoint: salesReportEndpoints.siteWiseDisposalComparison,
  columns: [
    { field: "month", header: "Month" },
    { field: "site_id", header: "Site" },
    { field: "item_name", header: "Item" },
    { field: "total_qty_tons", header: "Qty (Tons)" },
    { field: "dc_count", header: "DC Count" },
  ],
});
