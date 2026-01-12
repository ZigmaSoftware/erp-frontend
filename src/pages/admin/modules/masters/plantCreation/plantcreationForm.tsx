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

function PlantForm() {
  const [plantName, setPlantName] = useState("");
  const [site, setSite] = useState("");
  const [siteOptions, setSiteOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  // ---------------------------
  // Load sites
  // ---------------------------
  useEffect(() => {
    const fetchSites = async () => {
      try {
        const res = await siteApi.list();
        const options = (res as any[])
          .filter((item) => item?.site_name)
          .map((item) => ({
            value: String(item.unique_id ?? item.id ?? item.site_name),
            label: item.site_name,
          }));
        setSiteOptions(options);
      } catch (err) {
        console.error("Failed to load sites", err);
      }
    };

    fetchSites();
  }, []);

  useEffect(() => {
    if (!site || siteOptions.length === 0) return;
    const directMatch = siteOptions.some((opt) => opt.value === site);
    if (directMatch) return;
    const labelMatch = siteOptions.find((opt) => opt.label === site);
    if (labelMatch) {
      setSite(labelMatch.value);
    }
  }, [site, siteOptions]);

  // ---------------------------
  // Load plant (EDIT)
  // ---------------------------
  useEffect(() => {
    if (!isEdit || !id) return;

    const fetchPlant = async () => {
      try {
        setLoading(true);

        const res = await plantApi.get(id);
        const plant = res?.data ?? res;

        setPlantName(plant.plant_name);
        setSite(String(plant.site ?? ""));
        setIsActive(plant.is_active);
      } catch (err) {
        Swal.fire("Error", "Plant not found", "error");
        navigate(ENC_LIST_PATH);
      } finally {
        setLoading(false);
      }
    };

    fetchPlant();
  }, [id, isEdit, navigate]);

  // ---------------------------
  // Submit (CREATE / UPDATE)
  // ---------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!plantName || !site) {
      Swal.fire("Warning", "All fields are required", "warning");
      return;
    }

    const payload = {
      plant_name: plantName,
      site,
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
            <Select value={site} onValueChange={setSite}>
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
