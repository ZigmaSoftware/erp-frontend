import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";

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

import { getEncryptedRoute } from "@/utils/routeCache";
import { equipmentModelApi, equipmentTypeApi } from "@/helpers/admin";

const { encEmMasters, encEquipmentModel } = getEncryptedRoute();
const ENC_LIST_PATH = `/${encEmMasters}/${encEquipmentModel}`;

type EquipmentType = {
  unique_id: string;
  name: string;
};

export default function EquipmentModelForm() {
  const [equipmentType, setEquipmentType] = useState<string>("");
  const [manufacturer, setManufacturer] = useState<string>("");
  const [modelName, setModelName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [isActive, setIsActive] = useState<boolean>(true);
  const [equipmentTypes, setEquipmentTypes] = useState<EquipmentType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  /* ---------------- FETCH EQUIPMENT TYPES ---------------- */
  useEffect(() => {
    const fetchEquipmentTypes = async () => {
      try {
        const res: any = await equipmentTypeApi.list();

        const raw: EquipmentType[] =
          Array.isArray(res)
            ? res
            : Array.isArray(res?.data)
            ? res.data
            : res?.data?.results ?? [];

        setEquipmentTypes(raw);
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Failed to load equipment types",
        });
      }
    };

    fetchEquipmentTypes();
  }, []);

  /* ---------------- LOAD MODEL (EDIT MODE) ---------------- */
  useEffect(() => {
    if (!isEdit) return;

    const fetchModel = async () => {
      try {
        const res: any = await equipmentModelApi.get(id as string);
        const data = res?.data ?? res;

        setEquipmentType(
          typeof data.equipment_type === "string"
            ? data.equipment_type
            : data.equipment_type?.unique_id ?? ""
        );

        setManufacturer(data.manufacturer ?? "");
        setModelName(data.model_name ?? "");
        setDescription(data.description ?? "");
        setIsActive(Boolean(data.is_active));
      } catch {
        Swal.fire({
          icon: "error",
          title: "Failed to load equipment model",
        });
      }
    };

    fetchModel();
  }, [id, isEdit]);

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      equipment_type: equipmentType,
      manufacturer,
      model_name: modelName,
      description,
      is_active: isActive,
    };

    try {
      if (isEdit) {
        await equipmentModelApi.update(id as string, payload);
      } else {
        await equipmentModelApi.create(payload);
      }

      Swal.fire({
        icon: "success",
        title: isEdit ? "Updated successfully!" : "Added successfully!",
        timer: 1500,
        showConfirmButton: false,
      });

      navigate(ENC_LIST_PATH);
    } catch (error: any) {
      const message =
        error?.response?.data?.model_name?.[0] ||
        error?.response?.data?.equipment_type?.[0] ||
        error?.response?.data?.detail ||
        "Unable to save equipment model";

      Swal.fire({
        icon: "error",
        title: "Save failed",
        text: message,
      });
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="p-8">
      <div className="mx-auto bg-white rounded-xl border shadow-sm">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">
            {isEdit ? "Edit Equipment Model" : "Add Equipment Model"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Equipment Type */}
            <div>
              <Label>
                Equipment Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={equipmentType || undefined}
                onValueChange={(val) => setEquipmentType(val)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select equipment type" />
                </SelectTrigger>
                <SelectContent>
                  {equipmentTypes.map((et) => (
                    <SelectItem key={et.unique_id} value={et.unique_id}>
                      {et.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Manufacturer */}
            <div>
              <Label>
                Manufacturer <span className="text-red-500">*</span>
              </Label>
              <Input
                value={manufacturer}
                required
                placeholder="Enter manufacturer"
                onChange={(e) => setManufacturer(e.target.value)}
              />
            </div>

            {/* Model Name */}
            <div>
              <Label>
                Model Name <span className="text-red-500">*</span>
              </Label>
              <Input
                value={modelName}
                required
                placeholder="Enter model name"
                onChange={(e) => setModelName(e.target.value)}
              />
            </div>

            {/* Active Status */}
            <div>
              <Label>Active Status</Label>
              <Select
                value={isActive ? "true" : "false"}
                onValueChange={(val) => setIsActive(val === "true")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <Label>Description</Label>
              <textarea
                rows={3}
                value={description}
                placeholder="Optional description"
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-200"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3">
            <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={loading}>
              {loading ? "Saving..." : "Save"}
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
      </div>
    </div>
  );
}
