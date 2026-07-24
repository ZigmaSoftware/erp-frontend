import { salesReportEndpoints } from "@/helpers/admin";
import { createReportPage } from "./reportFactory";

export default createReportPage({
  title: "Supply Chain Report",
  endpoint: salesReportEndpoints.supplyChain,
  columns: [
    { field: "entry_date", header: "Date" },
    { field: "invoice_no", header: "DC No" },
    { field: "invoice_number", header: "Invoice No" },
    { field: "customer_name", header: "Customer" },
    { field: "item_name", header: "Item" },
    { field: "site_id", header: "Site" },
    { field: "plant_name", header: "Plant" },
    { field: "qty_tons", header: "Qty (Tons)" },
    { field: "amount", header: "Amount" },
  ],
});
