import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";

import ComponentCard from "@/components/common/ComponentCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { documentTypeServiceApi } from "@/helpers/admin";
import { getEncryptedRoute } from "@/utils/routeCache";
import { DISPOSAL_TYPE_OPTIONS } from "@/utils/disposalTypes";
import type { DocumentType } from "../types/salesService.types";

export default function DocumentTypeForm() {
  const [disposalType, setDisposalType] = useState("");
  const [docType, setDocType] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const { encSalesService, encDocumentType } = getEncryptedRoute();
  const ENC_LIST_PATH = `/${encSalesService}/${encDocumentType}`;

  /* -----------------------------------------------------------
     LOAD RECORD FOR EDIT
  ----------------------------------------------------------- */
  useEffect(() => {
    if (!isEdit) return;

    const loadData = async () => {
      setFetching(true);
      try {
        const res = await documentTypeServiceApi.get(id as string);
        const data = (res?.data || res) as DocumentType;

        setDisposalType(data.disposal_type ?? "");
        setDocType(data.doc_type ?? "");
        setDescription(data.description ?? "");
        setIsActive(data.is_active ?? true);
      } catch {
        Swal.fire({
          icon: "error",
          title: "Failed to load document type",
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
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      disposal_type: disposalType,
      doc_type: docType.trim(),
      description: description.trim() || null,
      is_active: isActive,
    };

    try {
      if (!disposalType) {
        throw new Error("Please select a disposal type.");
      }
      if (!docType.trim()) {
        throw new Error("Document type is required.");
      }
      if (isEdit) {
        await documentTypeServiceApi.update(id as string, payload);
        Swal.fire({
          icon: "success",
          title: "Updated successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await documentTypeServiceApi.create(payload);
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
        error?.message ||
        error?.response?.data?.doc_type?.[0] ||
        error?.response?.data?.disposal_type?.[0] ||
        error?.response?.data?.detail ||
        "Unable to save document type.";

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
      <ComponentCard title={isEdit ? "Edit Document Type" : "Add New"}>
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Disposal Type *</Label>
              <Select
                value={disposalType}
                onValueChange={setDisposalType}
                disabled={isFormDisabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select disposal type" />
                </SelectTrigger>
                <SelectContent>
                  {DISPOSAL_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Document Type *</Label>
              <Input
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                placeholder="Document Type"
                required
                disabled={isFormDisabled}
              />
            </div>

            <div className="md:col-span-2">
              <Label>Active Status *</Label>
              <Select
                value={isActive ? "true" : "false"}
                onValueChange={(value) => setIsActive(value === "true")}
                disabled={isFormDisabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description"
                rows={3}
                disabled={isFormDisabled}
              />
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
