import { useEffect, useState, type FormEvent } from "react";
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

import { mailDetailsCreationServiceApi, siteApi } from "@/helpers/admin";
import { getEncryptedRoute } from "@/utils/routeCache";
import { extractErrorMessage } from "@/utils/errorUtils";
import { normalizeRelationId } from "@/utils/formHelpers";
import type { MailDetailsCreation } from "../types/salesService.types";

const MAIL_TYPE_OPTIONS = ["FROM", "AFR_FROM"] as const;

type SiteOption = {
  unique_id: string;
  site_name: string;
  is_active?: boolean;
};

export default function MailDetailsCreationForm() {
  const [mailType, setMailType] = useState("");
  const [mailIds, setMailIds] = useState("");
  const [site, setSite] = useState("");
  const [sites, setSites] = useState<SiteOption[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const { encSalesService, encMailDetailsCreation } = getEncryptedRoute();
  const ENC_LIST_PATH = `/${encSalesService}/${encMailDetailsCreation}`;

  useEffect(() => {
    const loadSites = async () => {
      try {
        const res = (await siteApi.list()) as SiteOption[];
        setSites(res.filter((item) => item.is_active !== false));
      } catch {
        Swal.fire({
          icon: "error",
          title: "Failed to load sites",
          text: "Something went wrong!",
        });
      }
    };

    loadSites();
  }, []);

  useEffect(() => {
    if (!isEdit) return;

    const loadData = async () => {
      setFetching(true);
      try {
        const res = await mailDetailsCreationServiceApi.get(id as string);
        const data = (res?.data || res) as MailDetailsCreation;

        setMailType(data.mail_type ?? "");
        setMailIds(data.mail_ids ?? "");
        setSite(normalizeRelationId(data.site));
        setIsActive(data.is_active ?? true);
      } catch {
        Swal.fire({
          icon: "error",
          title: "Failed to load mail details",
          text: "Something went wrong!",
        });
      } finally {
        setFetching(false);
      }
    };

    loadData();
  }, [isEdit, id]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      mail_type: mailType,
      mail_ids: mailIds.trim(),
      site,
      is_active: isActive,
    };

    try {
      if (isEdit) {
        await mailDetailsCreationServiceApi.update(id as string, payload);
        Swal.fire({
          icon: "success",
          title: "Updated successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await mailDetailsCreationServiceApi.create(payload);
        Swal.fire({
          icon: "success",
          title: "Added successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
      }

      navigate(ENC_LIST_PATH);
    } catch (error: unknown) {
      Swal.fire({
        icon: "error",
        title: "Save failed",
        text: extractErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const isFormDisabled = loading || fetching;

  return (
    <div className="p-8">
      <ComponentCard title={isEdit ? "Edit Mail Details" : "Add Mail Details"}>
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Type *</Label>
              <Select
                value={mailType || undefined}
                onValueChange={(value) => setMailType(value)}
                disabled={isFormDisabled}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="SELECT" />
                </SelectTrigger>
                <SelectContent>
                  {MAIL_TYPE_OPTIONS.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Mail Id *</Label>
              <Input
                value={mailIds}
                onChange={(e) => setMailIds(e.target.value)}
                placeholder="Mail Id"
                required
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>Site Name *</Label>
              <Select
                value={site || undefined}
                onValueChange={(value) => setSite(value)}
                disabled={isFormDisabled}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select site" />
                </SelectTrigger>
                <SelectContent>
                  {sites.map((item) => (
                    <SelectItem key={item.unique_id} value={item.unique_id}>
                      {item.site_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
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
          </div>

          <div className="flex justify-end gap-3">
            <Button type="submit" disabled={isFormDisabled}>
              {loading ? "Saving..." : isEdit ? "Update" : "Submit"}
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
