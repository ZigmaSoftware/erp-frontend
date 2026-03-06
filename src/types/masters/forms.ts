import type { SiteFormValues } from "@/validations/masters/site.schema";

export type SiteFormFieldConfig = {
  label: string;
  name: keyof SiteFormValues | "verification_document" | "document_view";
  type?: string;
  placeholder?: string;
  as?: "textarea" | "select";
  options?: Array<{ value: string; label: string }>;
  step?: string;
};

export type SiteFormSectionConfig = {
  title: string;
  fields: SiteFormFieldConfig[];
};

export const SITE_FILE_FIELD_NAMES = ["verification_document", "document_view"] as const;

export type SiteFileFieldName = (typeof SITE_FILE_FIELD_NAMES)[number];

export type SiteFileValues = Record<SiteFileFieldName, File | null>;

export type SiteMutationVariables = {
  payload: Record<string, unknown>;
  formData?: FormData;
};
