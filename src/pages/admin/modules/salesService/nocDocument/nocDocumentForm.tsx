import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";

import ComponentCard from "@/components/common/ComponentCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  nocDocumentApi,
  siteApi,
  customerCreationApi,
  documentTypeApi,
} from "@/helpers/admin";
import { getEncryptedRoute } from "@/utils/routeCache";
import { extractErrorMessage } from "@/utils/errorUtils";
import type { NocDocument } from "../types/salesService.types";

type Option = { value: string; label: string };

const toOptions = (
  list: unknown[],
  getId: (item: any) => string | undefined,
  getLabel: (item: any) => string | undefined,
): Option[] =>
  list
    .map((item) => ({ value: getId(item), label: getLabel(item) }))
    .filter((option): option is Option => Boolean(option.value && option.label));

export default function NocDocumentForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const { encSalesService, encNocDocument } = getEncryptedRoute();
  const ENC_LIST_PATH = `/${encSalesService}/${encNocDocument}`;

  /* ---------------- State ---------------- */
  const [customerId, setCustomerId] = useState("");
  const [siteId, setSiteId] = useState("");
  const [docTypeId, setDocTypeId] = useState("");
  const [disposeType, setDisposeType] = useState("");
  const [destination, setDestination] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [existingFile, setExistingFile] = useState<string | null>(null);

  /* ---------------- Dropdown data ---------------- */
  const [sites, setSites] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [docTypes, setDocTypes] = useState<any[]>([]);

  const [fetching, setFetching] = useState(false);
  const [loading, setLoading] = useState(false);

  /* -----------------------------------------------------------
     LOAD DROPDOWN OPTIONS
  ----------------------------------------------------------- */
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [siteList, customerList, docTypeList] = await Promise.all([
          siteApi.list(),
          customerCreationApi.list(),
          documentTypeApi.list(),
        ]);
        setSites(siteList as unknown[]);
        setCustomers(customerList as unknown[]);
        setDocTypes(docTypeList as unknown[]);
      } catch {
        Swal.fire({
          icon: "error",
          title: "Failed to load dropdown options",
          text: "Something went wrong!",
        });
      }
    };

    loadOptions();
  }, []);

  const siteOptions = toOptions(sites, (s) => s.unique_id, (s) => s.site_name);
  const customerOptions = toOptions(
    customers,
    (c) => c.unique_id,
    (c) => c.customer_name,
  );
  const docTypeOptions = toOptions(
    docTypes,
    (d) => d.unique_id,
    (d) => d.doc_type,
  );

  /* -----------------------------------------------------------
     LOAD RECORD FOR EDIT
  ----------------------------------------------------------- */
  useEffect(() => {
    if (!isEdit) return;

    const loadData = async () => {
      setFetching(true);
      try {
        const res = await nocDocumentApi.get(id as string);
        const data = (res?.data || res) as NocDocument;

        setCustomerId(data.scrap_customer_id ?? "");
        setSiteId(data.site_id ?? "");
        setDocTypeId(data.noc_doc_type_id ?? "");
        setDisposeType(data.dispose_type ?? "");
        setDestination(data.customer_destination ?? "");
        setDocumentName(data.document_name ?? "");
        setExistingFile(data.document_file ?? null);
      } catch {
        Swal.fire({
          icon: "error",
          title: "Failed to load NOC document",
          text: "Something went wrong!",
        });
      } finally {
        setFetching(false);
      }
    };

    loadData();
  }, [isEdit, id]);

  /* -----------------------------------------------------------
     SUBMIT HANDLER
  ----------------------------------------------------------- */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!customerId) {
      Swal.fire({ icon: "error", title: "Customer is required" });
      return;
    }
    if (!siteId) {
      Swal.fire({ icon: "error", title: "Site is required" });
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("scrap_customer_id", customerId);
    formData.append("site_id", siteId);
    formData.append("noc_doc_type_id", docTypeId);
    formData.append("dispose_type", disposeType);
    formData.append("customer_destination", destination);
    formData.append("document_name", documentName);
    if (documentFile) {
      formData.append("document_file", documentFile);
    }

    try {
      if (isEdit) {
        await nocDocumentApi.update(id as string, formData);
        Swal.fire({
          icon: "success",
          title: "Updated successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await nocDocumentApi.create(formData);
        Swal.fire({
          icon: "success",
          title: "Added successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
      }

      navigate(ENC_LIST_PATH);
    } catch (error: any) {
      const message =
        error?.response?.data?.detail ||
        extractErrorMessage(error) ||
        "Unable to save NOC document.";

      Swal.fire({
        icon: "error",
        title: "Save failed",
        text: message,
      });
    } finally {
      setLoading(false);
    }
  };

  const isFormDisabled = loading || fetching;

  return (
    <div className="p-8">
      <ComponentCard title={isEdit ? "Edit NOC Document" : "Add New NOC Document"}>
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Customer *</Label>
              <Select
                value={customerId}
                onValueChange={setCustomerId}
                disabled={isFormDisabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {customerOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Site *</Label>
              <Select
                value={siteId}
                onValueChange={setSiteId}
                disabled={isFormDisabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {siteOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Document Type</Label>
              <Select
                value={docTypeId}
                onValueChange={setDocTypeId}
                disabled={isFormDisabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {docTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Dispose Type</Label>
              <Input
                value={disposeType}
                onChange={(e) => setDisposeType(e.target.value)}
                placeholder="Dispose Type"
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>Destination</Label>
              <Input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Destination"
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>Document Name</Label>
              <Input
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                placeholder="Document Name"
                disabled={isFormDisabled}
              />
            </div>

            <div className="md:col-span-2">
              <Label>Document File</Label>
              <Input
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setDocumentFile(file);
                }}
                disabled={isFormDisabled}
              />
              {existingFile && !documentFile && (
                <p className="text-sm text-gray-500 mt-1">
                  Current file: {existingFile.split("/").pop()}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="submit" disabled={isFormDisabled}>
              {loading ? "Saving..." : isEdit ? "Update" : "Add"}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => navigate(ENC_LIST_PATH)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </ComponentCard>
    </div>
  );
}
