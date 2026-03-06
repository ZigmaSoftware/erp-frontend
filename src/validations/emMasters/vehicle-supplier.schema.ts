import { z } from "zod";

const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

const optionalString = z.string().trim().optional().or(z.literal(""));
const optionalEmail = optionalString.refine(
  (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  { message: "Enter a valid email" }
);

export const vehicleSupplierSchema = z
  .object({
    supplier_name: z.string().trim().min(2, "Supplier name is required"),
    proprietor_name: z.string().trim().min(2, "Proprietor name is required"),
    mobile_no: z
      .string()
      .trim()
      .min(10, "Mobile number is required")
      .regex(/^[0-9]+$/, "Mobile number must contain only digits"),
    email: optionalEmail,
    gst_type: z.enum(["yes", "no"]),
    gst_no: optionalString,
    pan_no: optionalString,
    transport_medium: optionalString,
    address: z.string().trim().min(1, "Address is required"),
    bank_details: optionalString,
    is_active: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (value.gst_type === "yes" && !value.gst_no) {
      ctx.addIssue({
        code: "custom",
        path: ["gst_no"],
        message: "GST number is required when GST type is Yes",
      });
    }

    if (value.gst_no && !GST_REGEX.test(value.gst_no.toUpperCase())) {
      ctx.addIssue({
        code: "custom",
        path: ["gst_no"],
        message: "GST number is invalid",
      });
    }

    if (value.pan_no && !PAN_REGEX.test(value.pan_no.toUpperCase())) {
      ctx.addIssue({
        code: "custom",
        path: ["pan_no"],
        message: "PAN number is invalid",
      });
    }
  });

export type VehicleSupplierFormValues = z.infer<typeof vehicleSupplierSchema>;
