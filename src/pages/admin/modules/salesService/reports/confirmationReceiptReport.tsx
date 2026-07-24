import { salesReportEndpoints } from "@/helpers/admin";
import { createReportPage } from "./reportFactory";

export default createReportPage({
  title: "Confirmation of Receipt Report",
  endpoint: salesReportEndpoints.confirmationReceipt,
  columns: [
    { field: "entry_date", header: "Date" },
    { field: "dc_no", header: "DC No" },
    { field: "customer_name", header: "Customer" },
    { field: "site_id", header: "Site" },
    { field: "item_name", header: "Item" },
    { field: "total_qty", header: "Total Qty" },
    { field: "received_qty", header: "Received Qty" },
    { field: "status", header: "Status" },
  ],
});
