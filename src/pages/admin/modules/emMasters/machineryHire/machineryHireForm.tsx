import { useEffect, useState, type FormEvent } from "react";
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
import {
  machineryHireApi,
  siteApi,
  equipmentTypeApi,
  equipmentModelApi,
  vehicleCreationApi,
} from "@/helpers/admin";

const { encEmMasters, encMachineryHire } = getEncryptedRoute();
const ENC_LIST_PATH = `/${encEmMasters}/${encMachineryHire}`;

export default function MachineryHireForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  /* ---------------- STATE ---------------- */

  const [siteId, setSiteId] = useState("");
  const [equipmentTypeId, setEquipmentTypeId] = useState("");
  const [equipmentModelId, setEquipmentModelId] = useState("");
  const [vehicleId, setVehicleId] = useState("");

  const [date, setDate] = useState("");
  const [dieselStatus, setDieselStatus] = useState("WITH_DIESEL");
  const [hireRate, setHireRate] = useState("");
  const [unit, setUnit] = useState("HR");
  const [isActive, setIsActive] = useState(true);

  const [sites, setSites] = useState<any[]>([]);
  const [equipmentTypes, setEquipmentTypes] = useState<any[]>([]);
  const [equipmentModels, setEquipmentModels] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);

  /* ---------------- SAFE ARRAY EXTRACTOR ---------------- */

  const extractArray = (res: any): any[] => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.data?.results)) return res.data.results;
    return [];
  };

  /* ---------------- LOAD DROPDOWNS ---------------- */

  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        const [s, t, m, v] = await Promise.all([
          siteApi.list(),
          equipmentTypeApi.list(),
          equipmentModelApi.list(),
          vehicleCreationApi.list(),
        ]);

        setSites(extractArray(s));
        setEquipmentTypes(extractArray(t));
        setEquipmentModels(extractArray(m));
        setVehicles(extractArray(v));
      } catch {
        Swal.fire("Error", "Failed to load dropdown data", "error");
      }
    };

    loadDropdowns();
  }, []);

  /* ---------------- EDIT MODE ---------------- */

  useEffect(() => {
    if (!isEdit || !id) return;

    const fetchData = async () => {
      try {
        const res: any = await machineryHireApi.get(id);
        const data = res?.data ?? res;

        // IMPORTANT: convert to string (Select expects string)
        setSiteId(String(data.site_id ?? ""));
        setEquipmentTypeId(String(data.equipment_type_id ?? ""));
        setEquipmentModelId(String(data.equipment_model_id ?? ""));
        setVehicleId(String(data.vehicle_id ?? ""));

        setDate(data.date ?? "");
        setDieselStatus(data.diesel_status ?? "WITH_DIESEL");
        setHireRate(String(data.hire_rate ?? ""));
        setUnit(data.unit ?? "HR");
        setIsActive(Boolean(data.is_active));
      } catch {
        Swal.fire("Error", "Failed to load machinery hire", "error");
      }
    };

    fetchData();
  }, [id, isEdit]);

  /* ---------------- SUBMIT ---------------- */

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!siteId || !equipmentTypeId || !equipmentModelId || !vehicleId) {
      Swal.fire("Warning", "Please fill all required fields", "warning");
      return;
    }

    setLoading(true);

    const payload = {
      site_id: siteId,
      equipment_type_id: equipmentTypeId,
      equipment_model_id: equipmentModelId,
      vehicle_id: vehicleId,
      date,
      diesel_status: dieselStatus,
      hire_rate: hireRate,
      unit,
      is_active: isActive,
      is_deleted: false,
    };

    try {
      if (isEdit && id) {
        await machineryHireApi.update(id, payload);
      } else {
        await machineryHireApi.create(payload);
      }

      Swal.fire({
        icon: "success",
        title: isEdit ? "Updated successfully!" : "Added successfully!",
        timer: 1500,
        showConfirmButton: false,
      });

      navigate(ENC_LIST_PATH);
    } catch (error: any) {
      Swal.fire(
        "Error",
        error?.response?.data?.detail ?? "Failed to save machinery hire",
        "error"
      );
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
            {isEdit ? "Edit Machinery Hire" : "Add Machinery Hire"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* SITE */}
            <div>
              <Label>Site *</Label>
              <Select value={siteId} onValueChange={setSiteId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Site" />
                </SelectTrigger>
                <SelectContent>
                  {sites.map((s) => (
                    <SelectItem
                      key={s.unique_id}
                      value={String(s.unique_id)}
                    >
                      {s.site_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* EQUIPMENT TYPE */}
            <div>
              <Label>Equipment Type *</Label>
              <Select
                value={equipmentTypeId}
                onValueChange={setEquipmentTypeId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  {equipmentTypes.map((t) => (
                    <SelectItem
                      key={t.unique_id}
                      value={String(t.unique_id)}
                    >
                      {t.equipment_type_name ?? t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* EQUIPMENT MODEL */}
            <div>
              <Label>Equipment Model *</Label>
              <Select
                value={equipmentModelId}
                onValueChange={setEquipmentModelId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Model" />
                </SelectTrigger>
                <SelectContent>
                  {equipmentModels.map((m) => (
                    <SelectItem
                      key={m.unique_id}
                      value={String(m.unique_id)}
                    >
                      {m.model_name ?? m.equipment_model_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* VEHICLE */}
            <div>
              <Label>Vehicle *</Label>
              <Select value={vehicleId} onValueChange={setVehicleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem
                      key={v.unique_id}
                      value={String(v.unique_id)}
                    >
                      {v.vehicle_code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* DATE */}
            <div>
              <Label>Date *</Label>
              <Input
                type="date"
                value={date}
                required
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            {/* DIESEL STATUS */}
            <div>
              <Label>Diesel Status</Label>
              <Select value={dieselStatus} onValueChange={setDieselStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WITH_DIESEL">With Diesel</SelectItem>
                  <SelectItem value="WITHOUT_DIESEL">
                    Without Diesel
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* HIRE RATE */}
            <div>
              <Label>Hire Rate *</Label>
              <Input
                type="number"
                value={hireRate}
                required
                onChange={(e) => setHireRate(e.target.value)}
              />
            </div>

            {/* UNIT */}
            <div>
              <Label>Unit</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HR">Per Hour</SelectItem>
                  <SelectItem value="DAY">Per Day</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* STATUS */}
            <div>
              <Label>Status</Label>
              <Select
                value={isActive ? "true" : "false"}
                onValueChange={(v) => setIsActive(v === "true")}
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

          <div className="flex justify-end gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : isEdit ? "Update" : "Save"}
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