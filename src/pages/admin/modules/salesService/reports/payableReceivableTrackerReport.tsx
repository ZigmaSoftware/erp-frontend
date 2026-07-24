import { salesReportEndpoints } from "@/helpers/admin";
import { createReportPage } from "./reportFactory";

export default createReportPage({
  title: "Payable & Receivable Tracker",
  endpoint: salesReportEndpoints.payableReceivableTracker,
  filters: [
    { label: "Customer Name", key: "customer_name" },
    { label: "Site ID", key: "site_id" },
  ],
  columns: [
    { field: "entry_date", header: "Date" },
    { field: "invoice_no", header: "DC No" },
    { field: "customer_name", header: "Customer" },
    { field: "site_id", header: "Site" },
    { field: "item_name", header: "Item" },
    { field: "qty_tons", header: "Qty (Tons)" },
    { field: "payable_amount", header: "Payable" },
    { field: "receivable_amount", header: "Receivable" },
    { field: "balance", header: "Balance" },
  ],
});
