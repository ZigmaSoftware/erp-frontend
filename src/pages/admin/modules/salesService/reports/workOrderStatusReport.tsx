import { salesReportEndpoints } from "@/helpers/admin";
import { createReportPage } from "./reportFactory";

export default createReportPage({
  title: "Work Order Status Report",
  endpoint: salesReportEndpoints.workOrderStatus,
  filters: [
    { label: "From Date", key: "from_date", type: "date" },
    { label: "To Date", key: "to_date", type: "date" },
    { label: "Customer", key: "customer_name" },
    { label: "Site", key: "site_id" },
    { label: "Status", key: "status" },
  ],
  columns: [
    { field: "work_order_no", header: "WO No" },
    { field: "entry_date", header: "Date" },
    { field: "customer_name", header: "Customer" },
    { field: "site_id", header: "Site" },
    { field: "item_name", header: "Item" },
    { field: "qty", header: "Qty" },
    { field: "rate", header: "Rate" },
    { field: "total_amount", header: "Total" },
    { field: "status", header: "Status" },
    { field: "approval_status", header: "Approval" },
  ],
});
