import { salesReportEndpoints } from "@/helpers/admin";
import { createReportPage } from "./reportFactory";

export default createReportPage({
  title: "ICW Details Report",
  endpoint: salesReportEndpoints.icwDetails,
  filters: [
    { label: "From Date", key: "from_date", type: "date" },
    { label: "To Date", key: "to_date", type: "date" },
    { label: "Site ID", key: "site_id" },
    { label: "Customer", key: "customer_name" },
  ],
  columns: [
    { field: "entry_date", header: "Date" },
    { field: "invoice_no", header: "DC No" },
    { field: "customer_name", header: "Customer" },
    { field: "item_name", header: "Item" },
    { field: "site_id", header: "Site" },
    { field: "qty_tons", header: "Qty (Tons)" },
  ],
});
