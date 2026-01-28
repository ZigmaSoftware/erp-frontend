import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";

import { Input } from "@/components/ui/input";
import { getEncryptedRoute } from "@/utils/routeCache";
import { equipmentModelApi, equipmentTypeApi } from "@/helpers/admin";

const { encEmMasters, encEquipmentModel } = getEncryptedRoute();
const ENC_LIST_PATH = `/${encEmMasters}/${encEquipmentModel}`;

export default function EquipmentModelForm() {
  const [equipmentType, setEquipmentType] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [modelName, setModelName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [equipmentTypes, setEquipmentTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  useEffect(() => {
    equipmentTypeApi.list().then((res: any) => {
      setEquipmentTypes(res?.data ?? []);
      
    });

    if (!isEdit) return;

    equipmentModelApi.get(id as string).then((res: any) => {
      const data = res?.data ?? res;
      setEquipmentType(data.equipment_type);
      setManufacturer(data.manufacturer);
      setModelName(data.model_name);
      setDescription(data.description);
      setIsActive(Boolean(data.is_active));
    });
  }, [id, isEdit]);

  const handleSubmit = async (e: any) => {
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
        title: "Saved successfully!",
        timer: 1200,
        showConfirmButton: false,
      });

      navigate(ENC_LIST_PATH);
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Save failed",
        text: err?.response?.data?.detail || "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="bg-white rounded-xl border shadow-sm">
        <div className="px-6 py-4 border-b">
          <h2 className="font-semibold text-lg">
            {isEdit ? "Edit Equipment Model" : "Add Equipment Model"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block mb-2 text-sm font-medium">
                Equipment Type *
              </label>
              <select
                value={equipmentType}
                required
                onChange={(e) => setEquipmentType(e.target.value)}
                className="w-full border px-3 py-2 rounded"
              >
                <option value="">Select equipment type</option>
                {equipmentTypes.map((et) => (
                  <option key={et.unique_id} value={et.unique_id}>
                    {et.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium">
                Manufacturer *
              </label>
              <Input
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium">
                Model Name *
              </label>
              <Input
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium">
                Active Status
              </label>
              <select
                value={isActive ? "Active" : "Inactive"}
                onChange={(e) => setIsActive(e.target.value === "Active")}
                className="w-full border px-3 py-2 rounded"
              >
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block mb-2 text-sm font-medium">
                Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border px-3 py-2 rounded"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 text-white px-6 py-2 rounded"
            >
              {loading ? "Saving..." : "Save"}
            </button>

            <button
              type="button"
              onClick={() => navigate(ENC_LIST_PATH)}
              className="bg-red-500 text-white px-6 py-2 rounded"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
