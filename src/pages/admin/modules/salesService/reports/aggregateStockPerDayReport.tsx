import { salesReportEndpoints } from "@/helpers/admin";
import { createReportPage } from "./reportFactory";

export default createReportPage({
  title: "Aggregate Stock Report Per Day",
  endpoint: salesReportEndpoints.aggregateStockPerDay,
  columns: [
    { field: "date", header: "Date" },
    { field: "site_id", header: "Site" },
    { field: "item_name", header: "Item" },
    { field: "total_qty_tons", header: "Qty (Tons)" },
    { field: "dc_count", header: "DC Count" },
  ],
});
