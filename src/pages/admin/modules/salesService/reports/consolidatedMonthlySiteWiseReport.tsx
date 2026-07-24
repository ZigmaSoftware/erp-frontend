import { salesReportEndpoints } from "@/helpers/admin";
import { createReportPage } from "./reportFactory";

export default createReportPage({
  title: "Consolidated Monthly Site-Wise Report",
  endpoint: salesReportEndpoints.consolidatedMonthly,
  columns: [
    { field: "month", header: "Month" },
    { field: "site_id", header: "Site" },
    { field: "total_qty_tons", header: "Qty (Tons)" },
    { field: "dc_count", header: "DC Count" },
  ],
});
