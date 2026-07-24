import { salesReportEndpoints } from "@/helpers/admin";
import { createReportPage } from "./reportFactory";

export default createReportPage({
  title: "MBS (Material Balance Sheet) Report",
  endpoint: salesReportEndpoints.mbs,
  columns: [
    { field: "site_id", header: "Site" },
    { field: "total_qty_tons", header: "Total Qty (Tons)" },
    { field: "dc_count", header: "DC Count" },
  ],
});
