import { useCallback, useEffect, useState, type FormEvent } from "react";
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
  const { id } = useParams<{ id: string }>();
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

  const [lookupLoading, setLookupLoading] = useState(true);
  const [recordLoading, setRecordLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isBusy = lookupLoading || (isEdit && recordLoading);

  /* ---------------- SAFE ARRAY ---------------- */

  const extractArray = (res: any): any[] => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.data?.results)) return res.data.results;
    return [];
  };

  /* ---------------- LOAD LOOKUPS ---------------- */

  const loadLookups = useCallback(async () => {
    setLookupLoading(true);
    try {
      const [s, t, m, v] = await Promise.all([
        siteApi.list(),
        equipmentTypeApi.list(),
        equipmentModelApi.list(),
        vehicleCreationApi.list(),
      ]);

      setSites(extractArray(s));
      console.log("s",s);
     
      setEquipmentTypes(extractArray(t));
      setEquipmentModels(extractArray(m));
      setVehicles(extractArray(v));
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Failed to load dropdown data", "error");
    } finally {
      setLookupLoading(false);
    }
  }, []);
   console.log("sites",sites);

  useEffect(() => {
    loadLookups();
  }, [loadLookups]);

  /* ---------------- EDIT MODE ---------------- */

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setRecordLoading(true);

      // reset before loading new record
      setSiteId("");
      setEquipmentTypeId("");
      setEquipmentModelId("");
      setVehicleId("");
      setDate("");
      setHireRate("");

      try {
        const res: any = await machineryHireApi.get(id);
        const data = res?.data ?? res;

        setSiteId(String(data.site_id ?? ""));
        setEquipmentTypeId(String(data.equipment_type_id ?? ""));
        setEquipmentModelId(String(data.equipment_model_id ?? ""));
        setVehicleId(String(data.vehicle_id ?? ""));
        setDate(data.date ?? "");
        setDieselStatus(data.diesel_status ?? "WITH_DIESEL");
        setHireRate(String(data.hire_rate ?? ""));
        setUnit(data.unit ?? "HR");
        setIsActive(Boolean(data.is_active));
      } catch (error) {
        console.error(error);
        Swal.fire("Error", "Failed to load machinery hire", "error");
      } finally {
        setRecordLoading(false);
      }
    };

    fetchData();
  }, [id]);

  /* ---------------- SUBMIT ---------------- */

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!siteId || !equipmentTypeId || !equipmentModelId || !vehicleId) {
      Swal.fire("Warning", "Please fill all required fields", "warning");
      return;
    }

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

    setSubmitting(true);
    try {
      if (isEdit && id) {
        await machineryHireApi.update(id, payload);
        Swal.fire({
          icon: "success",
          title: "Updated successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await machineryHireApi.create(payload);
        Swal.fire({
          icon: "success",
          title: "Added successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
      }

      navigate(ENC_LIST_PATH);
    } catch (error: any) {
      Swal.fire(
        "Error",
        error?.response?.data?.detail ?? "Failed to save machinery hire",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------- LOADING UI ---------------- */

  if (isBusy) {
    return (
      <div className="p-3">
        <ComponentCard title={isEdit ? "Edit Machinery Hire" : "New Machinery Hire"}>
          <p className="text-sm text-gray-500">Loading data…</p>
        </ComponentCard>
      </div>
    );
  }

  /* ---------------- UI ---------------- */

  return (
    <div className="p-3">
      <ComponentCard title={isEdit ? "Edit Machinery Hire" : "New Machinery Hire"}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* SITE */}
            <div>
              <Label>Site *</Label>
              <Select value={siteId || undefined} onValueChange={(v) => setSiteId(v ?? "")}>
                <SelectTrigger><SelectValue placeholder="Select Site" /></SelectTrigger>
                <SelectContent>
                  {sites.map((s) => (
                    <SelectItem key={s.unique_id} value={String(s.unique_id)}>
                      {s.site_name ?? s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* EQUIPMENT TYPE */}
            <div>
              <Label>Equipment Type *</Label>
              <Select value={equipmentTypeId || undefined} onValueChange={(v) => setEquipmentTypeId(v ?? "")}>
                <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
                <SelectContent>
                  {equipmentTypes.map((t) => (
                    <SelectItem key={t.unique_id} value={String(t.unique_id)}>
                      {t.equipment_type_name ?? t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* EQUIPMENT MODEL */}
            <div>
              <Label>Equipment Model *</Label>
              <Select value={equipmentModelId || undefined} onValueChange={(v) => setEquipmentModelId(v ?? "")}>
                <SelectTrigger><SelectValue placeholder="Select Model" /></SelectTrigger>
                <SelectContent>
                  {equipmentModels.map((m) => (
                    <SelectItem key={m.unique_id} value={String(m.unique_id)}>
                      {m.model_name ?? m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* VEHICLE */}
            <div>
              <Label>Vehicle *</Label>
              <Select value={vehicleId || undefined} onValueChange={(v) => setVehicleId(v ?? "")}>
                <SelectTrigger><SelectValue placeholder="Select Vehicle" /></SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.unique_id} value={String(v.unique_id)}>
                      {v.vehicle_code ?? v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Date *</Label>
              <Input type="date" value={date} required onChange={(e) => setDate(e.target.value)} />
            </div>

            <div>
              <Label>Diesel Status</Label>
              <Select value={dieselStatus} onValueChange={setDieselStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="WITH_DIESEL">With Diesel</SelectItem>
                  <SelectItem value="WITHOUT_DIESEL">Without Diesel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Hire Rate *</Label>
              <Input type="number" value={hireRate} required onChange={(e) => setHireRate(e.target.value)} />
            </div>

            <div>
              <Label>Unit</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="HR">Per Hour</SelectItem>
                  <SelectItem value="DAY">Per Day</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Status</Label>
              <Select value={isActive ? "true" : "false"} onValueChange={(v) => setIsActive(v === "true")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate(ENC_LIST_PATH)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : isEdit ? "Update" : "Save"}
            </Button>
          </div>
        </form>
      </ComponentCard>
    </div>
  );
}