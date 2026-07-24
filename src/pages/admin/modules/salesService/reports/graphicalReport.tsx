import { salesReportEndpoints } from "@/helpers/admin";
import { createReportPage } from "./reportFactory";

export default createReportPage({
  title: "Graphical Representation Report",
  endpoint: salesReportEndpoints.graphical,
  columns: [
    { field: "month", header: "Month" },
    { field: "item_name", header: "Item" },
    { field: "total_qty_tons", header: "Qty (Tons)" },
  ],
});
