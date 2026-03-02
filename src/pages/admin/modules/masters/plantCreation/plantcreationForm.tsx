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

import { encryptSegment } from "@/utils/routeCrypto";
import { plantApi, siteApi } from "@/helpers/admin";

const encMasters = encryptSegment("masters");
const encPlantCreation = encryptSegment("plant-creation");
const ENC_LIST_PATH = `/${encMasters}/${encPlantCreation}`;

type SelectOption = { value: string; label: string };

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

const toStringValue = (value: unknown): string | undefined => {
  if (typeof value === "string" && value.trim() !== "") return value;
  if (typeof value === "number" && !Number.isNaN(value)) return String(value);
  return undefined;
};

const pickFirstString = (...values: unknown[]): string => {
  for (const value of values) {
    const normalized = toStringValue(value);
    if (normalized !== undefined) return normalized;
  }
  return "";
};

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const isTruthyActive = (value: unknown): boolean =>
  value === true || value === 1 || value === "1" || value === "true";

const normalizeKey = (value: unknown): string => pickFirstString(value).trim().toLowerCase();

function PlantForm() {
  const [plantName, setPlantName] = useState("");
  const [siteId, setSiteId] = useState("");
  const [siteLabelFallback, setSiteLabelFallback] = useState("");
  const [siteOptions, setSiteOptions] = useState<SelectOption[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  useEffect(() => {
    const fetchSites = async () => {
      try {
        const res = await siteApi.list();
        const options = asArray(res)
          .map(asRecord)
          .filter((item): item is Record<string, unknown> => Boolean(item))
          .map((item) => ({
            value: pickFirstString(item["unique_id"], item["id"], item["site_id"]),
            label: pickFirstString(item["site_name"], item["name"], item["display_name"]),
          }))
          .filter((item) => Boolean(item.value && item.label));

        const deduped = options.filter(
          (item, index, list) => list.findIndex((x) => x.value === item.value) === index
        );

        setSiteOptions(deduped);
      } catch (err) {
        console.error("Failed to load sites:", err);
      }
    };

    fetchSites();
  }, []);

  useEffect(() => {
    if (!isEdit || !id) return;

    const fetchPlant = async () => {
      try {
        setLoading(true);

        const res = await plantApi.get(id);
        const payload = (asRecord(res)?.["data"] ?? res) as unknown;
        const plant = asRecord(payload) ?? {};
        const siteRecord = asRecord(plant["site_id"]);
        const normalizedSiteId = pickFirstString(
          plant["site_id"],
          siteRecord?.["unique_id"],
          siteRecord?.["id"]
        );
        const normalizedSiteLabel = pickFirstString(
          plant["site_name"],
          plant["site"],
          siteRecord?.["site_name"],
          siteRecord?.["name"],
          asRecord(plant["site"])?.["site_name"],
          asRecord(plant["site"])?.["name"]
        );

        setPlantName(pickFirstString(plant["plant_name"]));
        setSiteId(normalizedSiteId);
        setSiteLabelFallback(normalizedSiteLabel);
        setIsActive(isTruthyActive(plant["is_active"]));
      } catch (err) {
        console.error("Error fetching plant:", err);
        Swal.fire("Error", "Plant not found", "error");
        navigate(ENC_LIST_PATH);
      } finally {
        setLoading(false);
      }
    };

    fetchPlant();
  }, [id, isEdit, navigate]);

  useEffect(() => {
    const labelKey = normalizeKey(siteLabelFallback);

    if (!siteId && labelKey) {
      const matched = siteOptions.find((opt) => normalizeKey(opt.label) === labelKey);
      if (matched) {
        setSiteId(matched.value);
      }
      return;
    }

    if (!siteId || !siteLabelFallback) return;

    setSiteOptions((prev) =>
      prev.some((opt) => opt.value === siteId)
        ? prev
        : [...prev, { value: siteId, label: siteLabelFallback }]
    );
  }, [siteId, siteLabelFallback, siteOptions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!plantName || !siteId) {
      Swal.fire("Warning", "All fields are required", "warning");
      return;
    }

    const payload = {
      plant_name: plantName,
      site_id: siteId,
      is_active: isActive,
    };

    try {
      setLoading(true);

      if (isEdit && id) {
        await plantApi.update(id, payload);
        Swal.fire({
          icon: "success",
          title: "Updated successfully",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await plantApi.create(payload);
        Swal.fire({
          icon: "success",
          title: "Added successfully",
          timer: 1500,
          showConfirmButton: false,
        });
      }

      navigate(ENC_LIST_PATH);
    } catch (err) {
      console.error("Save failed:", err);
      Swal.fire("Error", "Save failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ComponentCard title={isEdit ? "Edit Plant" : "Add Plant"}>
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Plant Name */}
          <div>
            <Label htmlFor="plantName">
              Plant Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="plantName"
              value={plantName}
              onChange={(e) => setPlantName(e.target.value)}
              placeholder="Enter plant name"
              required
            />
          </div>

          {/* Site */}
          <div>
            <Label htmlFor="site">
              Site <span className="text-red-500">*</span>
            </Label>
            <Select
              value={siteId || undefined}
              onValueChange={(value) => setSiteId(value ?? "")}
            >
              <SelectTrigger id="site">
                <SelectValue placeholder="Select site" />
              </SelectTrigger>
              <SelectContent>
                {siteOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div>
            <Label>
              Active Status <span className="text-red-500">*</span>
            </Label>
            <Select
              value={isActive ? "true" : "false"}
              onValueChange={(val) => setIsActive(val === "true")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <Button type="submit" disabled={loading}>
            {loading
              ? isEdit
                ? "Updating..."
                : "Saving..."
              : isEdit
              ? "Update"
              : "Save"}
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
  );
}

export default PlantForm;
