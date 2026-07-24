import { salesReportEndpoints } from "@/helpers/admin";
import { createReportPage } from "./reportFactory";

export default createReportPage({
  title: "Site-Wise Disposal Report",
  endpoint: salesReportEndpoints.siteWiseDisposal,
  columns: [
    { field: "entry_date", header: "Date" },
    { field: "invoice_no", header: "DC No" },
    { field: "site_id", header: "Site" },
    { field: "customer_name", header: "Customer" },
    { field: "item_name", header: "Item" },
    { field: "qty_tons", header: "Qty (Tons)" },
    { field: "payable_amount", header: "Payable" },
    { field: "receivable_amount", header: "Receivable" },
    { field: "freight_amount", header: "Freight" },
  ],
});
