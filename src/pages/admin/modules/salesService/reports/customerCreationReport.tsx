import { salesReportEndpoints } from "@/helpers/admin";
import { createReportPage } from "./reportFactory";

export default createReportPage({
  title: "Customer Creation Report",
  endpoint: salesReportEndpoints.customerCreation,
  filters: [
    { label: "Customer Name", key: "customer_name" },
    { label: "Site ID", key: "site_id" },
  ],
  columns: [
    { field: "customer_id", header: "Customer ID" },
    { field: "customer_name", header: "Name" },
    { field: "contact_person", header: "Contact Person" },
    { field: "mobile_no", header: "Mobile" },
    { field: "email_id", header: "Email" },
    { field: "site_id", header: "Site" },
    { field: "opening_balance", header: "Opening Balance" },
  ],
});
