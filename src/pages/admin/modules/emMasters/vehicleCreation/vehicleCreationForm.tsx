import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  contractorApi,
  equipmentModelApi,
  equipmentTypeApi,
  siteApi,
  vehicleCreationApi,
  vehicleRequestApi,
  vehicleSupplierApi,
} from "@/helpers/admin";
import { getEncryptedRoute } from "@/utils/routeCache";

type SelectOption = {
  value: string;
  label: string;
};

type EquipmentModelOption = SelectOption & {
  equipmentTypeId: string;
};

type LookupState = {
  contractors: SelectOption[];
  suppliers: SelectOption[];
  requests: SelectOption[];
  sites: SelectOption[];
  equipmentTypes: SelectOption[];
  equipmentModels: EquipmentModelOption[];
};

type RelationMaps = {
  typeAliasToCanonical: Record<string, string>;
  modelAliasToCanonical: Record<string, string>;
  modelToTypeCanonical: Record<string, string>;
};

const HIRE_TYPE_OPTIONS: SelectOption[] = [
  { value: "OWN", label: "Own" },
  { value: "HIRE", label: "Hire" },
];

const RENTAL_BASIS_OPTIONS: SelectOption[] = [
  { value: "HOUR", label: "Hour" },
  { value: "DAY", label: "Day" },
  { value: "KM", label: "KM" },
];

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

const toOptionList = (
  list: unknown[],
  getId: (item: Record<string, unknown>) => string,
  getLabel: (item: Record<string, unknown>) => string,
): SelectOption[] => {
  return list
    .map(asRecord)
    .filter((item): item is Record<string, unknown> => Boolean(item))
    .map((item) => {
      const value = getId(item);
      const label = getLabel(item);
      if (!value || !label) return null;
      return { value, label };
    })
    .filter((item): item is SelectOption => Boolean(item));
};

const normalizeAliasKey = (value: unknown): string => pickFirstString(value).trim().toLowerCase();

const addAlias = (map: Record<string, string>, alias: unknown, canonical: string) => {
  const normalizedAlias = normalizeAliasKey(alias);
  if (!normalizedAlias || !canonical) return;
  map[normalizedAlias] = canonical;
};

const resolveCanonicalFromAliases = (
  aliasMap: Record<string, string>,
  ...candidates: unknown[]
): string => {
  for (const candidate of candidates) {
    const normalized = normalizeAliasKey(candidate);
    if (!normalized) continue;
    if (aliasMap[normalized]) return aliasMap[normalized];
  }
  return "";
};

const resolveCanonicalOrSelf = (
  aliasMap: Record<string, string>,
  ...candidates: unknown[]
): string => {
  const resolved = resolveCanonicalFromAliases(aliasMap, ...candidates);
  if (resolved) return resolved;

  for (const candidate of candidates) {
    const value = pickFirstString(candidate).trim();
    if (value) return value;
  }
  return "";
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  const errorRecord = asRecord(error);
  const response = asRecord(errorRecord?.["response"]);
  const data = asRecord(response?.["data"]);
  const detail = pickFirstString(data?.["detail"], data?.["message"]);
  if (detail) return detail;

  if (data) {
    const fieldMessage = Object.values(data)
      .flatMap((value) => (Array.isArray(value) ? value : [value]))
      .map((value) => (typeof value === "string" ? value : ""))
      .find((value) => value);
    if (fieldMessage) return fieldMessage;
  }

  return fallback;
};

export default function VehicleCreationForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const { encEmMasters, encVehicleCreation } = getEncryptedRoute();
  const ENC_LIST_PATH = `/${encEmMasters}/${encVehicleCreation}`;

  const [vehicleCode, setVehicleCode] = useState("");
  const [vehicleRegNo, setVehicleRegNo] = useState("");
  const [hireType, setHireType] = useState("OWN");
  const [contractorId, setContractorId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [requestId, setRequestId] = useState("");
  const [siteId, setSiteId] = useState("");
  const [equipmentTypeId, setEquipmentTypeId] = useState("");
  const [equipmentModelId, setEquipmentModelId] = useState("");
  const [permitExpiry, setPermitExpiry] = useState("");
  const [fcExpiry, setFcExpiry] = useState("");
  const [insuranceExpiry, setInsuranceExpiry] = useState("");
  const [roadTaxExpiry, setRoadTaxExpiry] = useState("");
  const [rentalBasis, setRentalBasis] = useState("HOUR");
  const [targetHours, setTargetHours] = useState("");
  const [plantEntryDate, setPlantEntryDate] = useState("");
  const [rcInvoiceDate, setRcInvoiceDate] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [lookups, setLookups] = useState<LookupState>({
    contractors: [],
    suppliers: [],
    requests: [],
    sites: [],
    equipmentTypes: [],
    equipmentModels: [],
  });

  const [lookupLoading, setLookupLoading] = useState(true);
  const [recordLoading, setRecordLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [relationMaps, setRelationMaps] = useState<RelationMaps>({
    typeAliasToCanonical: {},
    modelAliasToCanonical: {},
    modelToTypeCanonical: {},
  });
  const [recordTypeRef, setRecordTypeRef] = useState("");
  const [recordModelRef, setRecordModelRef] = useState("");
  const [recordTypeLabel, setRecordTypeLabel] = useState("");
  const [recordModelLabel, setRecordModelLabel] = useState("");
  const [recordContractorLabel, setRecordContractorLabel] = useState("");
  const [recordSupplierLabel, setRecordSupplierLabel] = useState("");
  const listFallbackTriedRef = useRef(false);

  const equipmentTypeOptions = useMemo(() => {
    if (!equipmentTypeId) return lookups.equipmentTypes;
    const hasSelected = lookups.equipmentTypes.some((option) => option.value === equipmentTypeId);
    if (hasSelected) return lookups.equipmentTypes;
    return [
      ...lookups.equipmentTypes,
      {
        value: equipmentTypeId,
        label: recordTypeLabel || recordTypeRef || equipmentTypeId,
      },
    ];
  }, [equipmentTypeId, lookups.equipmentTypes, recordTypeLabel, recordTypeRef]);

  const equipmentModelOptions = useMemo(() => {
    if (!equipmentModelId) return lookups.equipmentModels;
    const hasSelected = lookups.equipmentModels.some((option) => option.value === equipmentModelId);
    if (hasSelected) return lookups.equipmentModels;
    return [
      ...lookups.equipmentModels,
      {
        value: equipmentModelId,
        label: recordModelLabel || recordModelRef || equipmentModelId,
        equipmentTypeId: equipmentTypeId || "",
      },
    ];
  }, [equipmentModelId, equipmentTypeId, lookups.equipmentModels, recordModelLabel, recordModelRef]);

  const contractorOptions = useMemo(() => {
    if (!contractorId) return lookups.contractors;
    const hasSelected = lookups.contractors.some((option) => option.value === contractorId);
    if (hasSelected) return lookups.contractors;
    return [
      ...lookups.contractors,
      {
        value: contractorId,
        label: recordContractorLabel || contractorId,
      },
    ];
  }, [contractorId, lookups.contractors, recordContractorLabel]);

  const supplierOptions = useMemo(() => {
    if (!supplierId) return lookups.suppliers;
    const hasSelected = lookups.suppliers.some((option) => option.value === supplierId);
    if (hasSelected) return lookups.suppliers;
    return [
      ...lookups.suppliers,
      {
        value: supplierId,
        label: recordSupplierLabel || supplierId,
      },
    ];
  }, [lookups.suppliers, recordSupplierLabel, supplierId]);

  const filteredEquipmentModels = useMemo(() => {
    if (!equipmentTypeId) return equipmentModelOptions;
    return equipmentModelOptions.filter(
      (model) =>
        model.equipmentTypeId === equipmentTypeId || model.value === equipmentModelId,
    );
  }, [equipmentModelId, equipmentModelOptions, equipmentTypeId]);

  const loadLookups = useCallback(async () => {
    setLookupLoading(true);
    try {
      const [contractors, suppliers, requests, sites, equipmentTypes, equipmentModels] =
        (await Promise.all([
          contractorApi.list(),
          vehicleSupplierApi.list(),
          vehicleRequestApi.list(),
          siteApi.list(),
          equipmentTypeApi.list(),
          equipmentModelApi.list(),
        ])) as [unknown[], unknown[], unknown[], unknown[], unknown[], unknown[]];

      const typeAliasToCanonical: Record<string, string> = {};
      const modelAliasToCanonical: Record<string, string> = {};
      const modelToTypeCanonical: Record<string, string> = {};

      const normalizedEquipmentTypes = (Array.isArray(equipmentTypes) ? equipmentTypes : [])
        .map(asRecord)
        .filter((item): item is Record<string, unknown> => Boolean(item))
        .map((item) => {
          const canonical = pickFirstString(item["unique_id"], item["id"]);
          const label = pickFirstString(
            item["name"],
            item["equipment_type_name"],
            item["equipmenttype_name"],
          );
          if (!canonical || !label) return null;

          addAlias(typeAliasToCanonical, canonical, canonical);
          addAlias(typeAliasToCanonical, item["unique_id"], canonical);
          addAlias(typeAliasToCanonical, item["id"], canonical);
          addAlias(typeAliasToCanonical, item["name"], canonical);
          addAlias(typeAliasToCanonical, item["equipment_type_name"], canonical);
          addAlias(typeAliasToCanonical, item["equipmenttype_name"], canonical);
          addAlias(typeAliasToCanonical, label, canonical);
          addAlias(typeAliasToCanonical, item["equipment_type"], canonical);
          addAlias(typeAliasToCanonical, item["equipment_type_id"], canonical);
          return { value: canonical, label };
        })
        .filter((item): item is SelectOption => Boolean(item));

      const unresolvedModelTypeRefs: string[] = [];

      const normalizedModels: EquipmentModelOption[] = (Array.isArray(equipmentModels) ? equipmentModels : [])
        .map(asRecord)
        .filter((item): item is Record<string, unknown> => Boolean(item))
        .map((item) => {
          const modelCanonical = pickFirstString(item["unique_id"], item["id"]);
          const modelTypeRef = resolveCanonicalFromAliases(
            typeAliasToCanonical,
            asRecord(item["equipment_type"])?.["unique_id"],
            asRecord(item["equipment_type"])?.["id"],
            asRecord(item["equipment_type"])?.["name"],
            asRecord(item["equipment_type"])?.["equipment_type_name"],
            item["equipment_type"],
            asRecord(item["equipment_type_id"])?.["unique_id"],
            asRecord(item["equipment_type_id"])?.["id"],
            asRecord(item["equipment_type_id"])?.["name"],
            asRecord(item["equipment_type_id"])?.["equipment_type_name"],
            item["equipment_type_id"],
            item["equipment_type_name"],
            item["equipmenttype_name"],
          );
          if (!modelTypeRef) {
            const unresolvedRef = pickFirstString(
              asRecord(item["equipment_type"])?.["unique_id"],
              asRecord(item["equipment_type"])?.["id"],
              asRecord(item["equipment_type"])?.["name"],
              asRecord(item["equipment_type"])?.["equipment_type_name"],
              item["equipment_type"],
              asRecord(item["equipment_type_id"])?.["unique_id"],
              asRecord(item["equipment_type_id"])?.["id"],
              asRecord(item["equipment_type_id"])?.["name"],
              asRecord(item["equipment_type_id"])?.["equipment_type_name"],
              item["equipment_type_id"],
              item["equipment_type_name"],
              item["equipmenttype_name"],
            );
            if (unresolvedRef) unresolvedModelTypeRefs.push(unresolvedRef);
          }

          if (!modelCanonical) return null;
          if (modelTypeRef) {
            addAlias(modelAliasToCanonical, modelCanonical, modelCanonical);
            addAlias(modelAliasToCanonical, item["unique_id"], modelCanonical);
            addAlias(modelAliasToCanonical, item["id"], modelCanonical);
            addAlias(modelAliasToCanonical, item["model_name"], modelCanonical);
            addAlias(modelAliasToCanonical, item["name"], modelCanonical);
            addAlias(modelAliasToCanonical, pickFirstString(item["model_name"], item["name"]), modelCanonical);
            addAlias(modelAliasToCanonical, item["equipment_model"], modelCanonical);
            addAlias(modelAliasToCanonical, item["equipment_model_id"], modelCanonical);
            modelToTypeCanonical[modelCanonical] = modelTypeRef;
          }

          return {
            value: modelCanonical,
            label: pickFirstString(item["model_name"], item["name"]),
            equipmentTypeId: modelTypeRef,
          };
        })
        .filter((item): item is EquipmentModelOption => Boolean(item))
        .filter((item) => item.value && item.label && item.equipmentTypeId);

      if (import.meta.env.DEV && unresolvedModelTypeRefs.length > 0) {
        console.warn("Unresolved equipment model type refs:", unresolvedModelTypeRefs);
      }

      setLookups({
        contractors: toOptionList(
          Array.isArray(contractors) ? contractors : [],
          (item) => pickFirstString(item["unique_id"], item["id"]),
          (item) =>
            pickFirstString(item["contractor_name"], item["name"], item["contractor_code"]),
        ),
        suppliers: toOptionList(
          Array.isArray(suppliers) ? suppliers : [],
          (item) => pickFirstString(item["unique_id"], item["id"]),
          (item) =>
            pickFirstString(item["supplier_name"], item["name"], item["supplier_code"]),
        ),
        requests: toOptionList(
          Array.isArray(requests) ? requests : [],
          (item) => pickFirstString(item["unique_id"], item["id"]),
          (item) =>
            pickFirstString(item["request_no"], item["description"], item["request_status"]),
        ),
        sites: toOptionList(
          Array.isArray(sites) ? sites : [],
          (item) => pickFirstString(item["unique_id"], item["id"]),
          (item) => pickFirstString(item["site_name"], item["name"]),
        ),
        equipmentTypes: normalizedEquipmentTypes,
        equipmentModels: normalizedModels,
      });
      setRelationMaps({
        typeAliasToCanonical,
        modelAliasToCanonical,
        modelToTypeCanonical,
      });
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Unable to load dropdown data", "error");
    } finally {
      setLookupLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLookups();
  }, [loadLookups]);

  useEffect(() => {
    if (!isEdit || !id) return;

    const loadRecord = async () => {
      setRecordLoading(true);
      try {
        const response = await vehicleCreationApi.get(id);
        const payload = asRecord(response) ?? {};

        setVehicleCode(pickFirstString(payload["vehicle_code"]));
        setVehicleRegNo(pickFirstString(payload["vehicle_reg_no"]));
        setHireType(pickFirstString(payload["hire_type"]) || "OWN");
        setContractorId(
          pickFirstString(
            payload["contractor_id"],
            asRecord(payload["contractor_id"])?.["unique_id"],
            asRecord(payload["contractor_id"])?.["id"],
          ),
        );
        setRecordContractorLabel(
          pickFirstString(
            payload["contractor_name"],
            asRecord(payload["contractor_id"])?.["contractor_name"],
            asRecord(payload["contractor_id"])?.["name"],
          ),
        );
        setSupplierId(
          pickFirstString(
            payload["supplier_id"],
            asRecord(payload["supplier_id"])?.["unique_id"],
            asRecord(payload["supplier_id"])?.["id"],
          ),
        );
        setRecordSupplierLabel(
          pickFirstString(
            payload["supplier_name"],
            asRecord(payload["supplier_id"])?.["supplier_name"],
            asRecord(payload["supplier_id"])?.["name"],
          ),
        );
        setRequestId(
          pickFirstString(
            payload["request_id"],
            asRecord(payload["request_id"])?.["unique_id"],
            asRecord(payload["request_id"])?.["id"],
          ),
        );
        setSiteId(
          pickFirstString(
            payload["site_id"],
            asRecord(payload["site_id"])?.["unique_id"],
            asRecord(payload["site_id"])?.["id"],
          ),
        );
        setRecordTypeRef(
          pickFirstString(
            payload["equipment_type_name"],
            asRecord(payload["equipment_type_id"])?.["unique_id"],
            asRecord(payload["equipment_type_id"])?.["id"],
            payload["equipment_type_id"],
            payload["equipment_type"],
            asRecord(payload["equipment_type"])?.["unique_id"],
            asRecord(payload["equipment_type"])?.["id"],
            asRecord(payload["equipment_type"])?.["name"],
            asRecord(payload["equipment_type"])?.["equipment_type_name"],
          ),
        );
        setRecordTypeLabel(
          pickFirstString(
            payload["equipment_type_name"],
            asRecord(payload["equipment_type"])?.["name"],
            asRecord(payload["equipment_type"])?.["equipment_type_name"],
          ),
        );
        setRecordModelRef(
          pickFirstString(
            payload["equipment_model_name"],
            asRecord(payload["equipment_model_id"])?.["unique_id"],
            asRecord(payload["equipment_model_id"])?.["id"],
            payload["equipment_model_id"],
            payload["equipment_model"],
            asRecord(payload["equipment_model"])?.["unique_id"],
            asRecord(payload["equipment_model"])?.["id"],
            asRecord(payload["equipment_model"])?.["model_name"],
            asRecord(payload["equipment_model"])?.["name"],
            asRecord(payload["equipment_model"])?.["equipment_model_name"],
          ),
        );
        setRecordModelLabel(
          pickFirstString(
            payload["equipment_model_name"],
            asRecord(payload["equipment_model"])?.["model_name"],
            asRecord(payload["equipment_model"])?.["name"],
            asRecord(payload["equipment_model"])?.["equipment_model_name"],
          ),
        );
        setPermitExpiry(pickFirstString(payload["permit_expiry"]));
        setFcExpiry(pickFirstString(payload["fc_expiry"]));
        setInsuranceExpiry(pickFirstString(payload["insurance_expiry"]));
        setRoadTaxExpiry(pickFirstString(payload["road_tax_expiry"]));
        setRentalBasis(pickFirstString(payload["rental_basis"]) || "HOUR");
        setTargetHours(pickFirstString(payload["target_hours"]));
        setPlantEntryDate(pickFirstString(payload["plant_entry_date"]));
        setRcInvoiceDate(pickFirstString(payload["rc_invoice_date"]));

        const active = payload["is_active"];
        if (typeof active === "boolean") setIsActive(active);
      } catch (error) {
        console.error(error);
        Swal.fire("Error", "Unable to load vehicle creation record", "error");
      } finally {
        setRecordLoading(false);
      }
    };

    loadRecord();
  }, [id, isEdit]);

  useEffect(() => {
    if (!recordTypeRef && !recordModelRef) return;

    const resolvedTypeFromAlias = resolveCanonicalFromAliases(
      relationMaps.typeAliasToCanonical,
      recordTypeRef,
    );
    const resolvedModelFromAlias = resolveCanonicalFromAliases(
      relationMaps.modelAliasToCanonical,
      recordModelRef,
    );
    const resolvedTypeFromLabel = lookups.equipmentTypes.find(
      (option) => normalizeAliasKey(option.label) === normalizeAliasKey(recordTypeRef),
    )?.value;
    const resolvedType = resolvedTypeFromAlias || resolvedTypeFromLabel || "";

    const resolvedModelFromLabel = lookups.equipmentModels.find(
      (option) => normalizeAliasKey(option.label) === normalizeAliasKey(recordModelRef),
    )?.value;
    const resolvedModel = resolvedModelFromAlias || resolvedModelFromLabel || "";

    const modelTypeFromMap = resolvedModel
      ? relationMaps.modelToTypeCanonical[resolvedModel] ||
        lookups.equipmentModels.find((option) => option.value === resolvedModel)?.equipmentTypeId
      : "";

    if (resolvedType) setEquipmentTypeId(resolvedType);
    if (resolvedModel) setEquipmentModelId(resolvedModel);

    if (!resolvedType && modelTypeFromMap) {
      setEquipmentTypeId(modelTypeFromMap);
    }
  }, [lookups.equipmentModels, lookups.equipmentTypes, recordModelRef, recordTypeRef, relationMaps]);

  useEffect(() => {
    if (!isEdit || !id || lookupLoading) return;
    if (equipmentTypeId && equipmentModelId) return;
    if (listFallbackTriedRef.current) return;

    listFallbackTriedRef.current = true;

    const loadFromListFallback = async () => {
      try {
        const rows = await vehicleCreationApi.list();
        const row = (Array.isArray(rows) ? rows : [])
          .map(asRecord)
          .filter((item): item is Record<string, unknown> => Boolean(item))
          .find((item) => pickFirstString(item["unique_id"], item["id"]) === id);
        if (!row) return;

        const fallbackTypeRef = pickFirstString(
          row["equipment_type_name"],
          asRecord(row["equipment_type_id"])?.["unique_id"],
          asRecord(row["equipment_type_id"])?.["id"],
          asRecord(row["equipment_type_id"])?.["name"],
          asRecord(row["equipment_type_id"])?.["equipment_type_name"],
          row["equipment_type_id"],
          row["equipment_type"],
        );
        const fallbackTypeLabel = pickFirstString(
          row["equipment_type_name"],
          asRecord(row["equipment_type_id"])?.["name"],
          asRecord(row["equipment_type_id"])?.["equipment_type_name"],
        );
        const fallbackModelRef = pickFirstString(
          row["equipment_model_name"],
          asRecord(row["equipment_model_id"])?.["unique_id"],
          asRecord(row["equipment_model_id"])?.["id"],
          asRecord(row["equipment_model_id"])?.["model_name"],
          asRecord(row["equipment_model_id"])?.["name"],
          row["equipment_model_id"],
          row["equipment_model"],
        );
        const fallbackModelLabel = pickFirstString(
          row["equipment_model_name"],
          asRecord(row["equipment_model_id"])?.["model_name"],
          asRecord(row["equipment_model_id"])?.["name"],
        );
        const fallbackContractorId = pickFirstString(
          row["contractor_id"],
          asRecord(row["contractor_id"])?.["unique_id"],
          asRecord(row["contractor_id"])?.["id"],
        );
        const fallbackSupplierId = pickFirstString(
          row["supplier_id"],
          asRecord(row["supplier_id"])?.["unique_id"],
          asRecord(row["supplier_id"])?.["id"],
        );
        const fallbackContractorLabel = pickFirstString(
          row["contractor_name"],
          asRecord(row["contractor_id"])?.["contractor_name"],
          asRecord(row["contractor_id"])?.["name"],
        );
        const fallbackSupplierLabel = pickFirstString(
          row["supplier_name"],
          asRecord(row["supplier_id"])?.["supplier_name"],
          asRecord(row["supplier_id"])?.["name"],
        );

        if (fallbackTypeRef && !recordTypeRef) setRecordTypeRef(fallbackTypeRef);
        if (fallbackTypeLabel && !recordTypeLabel) setRecordTypeLabel(fallbackTypeLabel);
        if (fallbackModelRef && !recordModelRef) setRecordModelRef(fallbackModelRef);
        if (fallbackModelLabel && !recordModelLabel) setRecordModelLabel(fallbackModelLabel);
        if (fallbackContractorLabel && !recordContractorLabel) {
          setRecordContractorLabel(fallbackContractorLabel);
        }
        if (fallbackSupplierLabel && !recordSupplierLabel) {
          setRecordSupplierLabel(fallbackSupplierLabel);
        }
        if (fallbackContractorId && !contractorId) setContractorId(fallbackContractorId);
        if (fallbackSupplierId && !supplierId) setSupplierId(fallbackSupplierId);

        if (!equipmentTypeId) {
          const resolvedType = resolveCanonicalOrSelf(
            relationMaps.typeAliasToCanonical,
            fallbackTypeRef,
            fallbackTypeLabel,
          );
          if (resolvedType) setEquipmentTypeId(resolvedType);
        }

        if (!equipmentModelId) {
          const resolvedModel = resolveCanonicalOrSelf(
            relationMaps.modelAliasToCanonical,
            fallbackModelRef,
            fallbackModelLabel,
          );
          if (resolvedModel) setEquipmentModelId(resolvedModel);
        }
      } catch (error) {
        console.error("Vehicle creation list fallback failed", error);
      }
    };

    loadFromListFallback();
  }, [
    equipmentModelId,
    equipmentTypeId,
    id,
    isEdit,
    lookupLoading,
    contractorId,
    recordModelLabel,
    recordModelRef,
    recordContractorLabel,
    recordSupplierLabel,
    recordTypeLabel,
    recordTypeRef,
    relationMaps.modelAliasToCanonical,
    relationMaps.typeAliasToCanonical,
    supplierId,
  ]);

  useEffect(() => {
    if (!equipmentTypeId) return;
    const hasModel = filteredEquipmentModels.some((item) => item.value === equipmentModelId);
    if (!hasModel) setEquipmentModelId("");
  }, [equipmentModelId, equipmentTypeId, filteredEquipmentModels]);

  const validate = () => {
    if (!vehicleCode.trim()) return "Vehicle code is required.";
    if (!vehicleRegNo.trim()) return "Vehicle registration number is required.";
    if (!requestId) return "Request is required.";
    if (!siteId) return "Site is required.";
    const resolvedTypeId = resolveCanonicalFromAliases(
      relationMaps.typeAliasToCanonical,
      equipmentTypeId,
    );
    const resolvedModelId = resolveCanonicalOrSelf(
      relationMaps.modelAliasToCanonical,
      equipmentModelId,
    );
    const finalTypeId = resolvedTypeId || equipmentTypeId;
    if (!finalTypeId) return "Equipment type is required.";
    if (!resolvedModelId) return "Equipment model is required.";
    const resolvedModelTypeId = relationMaps.modelToTypeCanonical[resolvedModelId];
    if (resolvedModelTypeId && resolvedModelTypeId !== finalTypeId) {
      return "Selected equipment model does not belong to the chosen equipment type.";
    }
    if (!permitExpiry || !fcExpiry || !insuranceExpiry || !roadTaxExpiry) {
      return "All expiry dates are required.";
    }
    if (hireType === "HIRE" && !contractorId && !supplierId) {
      return "Select contractor or supplier for hire type HIRE.";
    }
    return "";
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationMessage = validate();
    if (validationMessage) {
      Swal.fire("Validation error", validationMessage, "error");
      return;
    }

    const resolvedTypeId = resolveCanonicalOrSelf(
      relationMaps.typeAliasToCanonical,
      equipmentTypeId,
    );
    const resolvedModelId = resolveCanonicalOrSelf(
      relationMaps.modelAliasToCanonical,
      equipmentModelId,
    );
    const resolvedModelTypeId = resolvedModelId
      ? relationMaps.modelToTypeCanonical[resolvedModelId]
      : "";
    if (!resolvedTypeId || !resolvedModelId) {
      Swal.fire("Validation error", "Equipment type and model are required.", "error");
      return;
    }
    if (resolvedModelTypeId && resolvedTypeId !== resolvedModelTypeId) {
      setEquipmentModelId("");
      Swal.fire(
        "Validation error",
        "Selected equipment model does not belong to the chosen equipment type.",
        "error",
      );
      return;
    }

    const payload = {
      vehicle_code: vehicleCode.trim(),
      vehicle_reg_no: vehicleRegNo.trim(),
      hire_type: hireType,
      contractor_id: contractorId || null,
      supplier_id: supplierId || null,
      request_id: requestId,
      site_id: siteId,
      equipment_type_id: resolvedTypeId,
      equipment_model_id: resolvedModelId,
      permit_expiry: permitExpiry,
      fc_expiry: fcExpiry,
      insurance_expiry: insuranceExpiry,
      road_tax_expiry: roadTaxExpiry,
      rental_basis: rentalBasis,
      target_hours: targetHours ? Number(targetHours) : null,
      plant_entry_date: plantEntryDate || null,
      rc_invoice_date: rcInvoiceDate || null,
      is_active: isActive,
    };

    setSubmitting(true);
    try {
      if (isEdit && id) {
        await vehicleCreationApi.update(id, payload);
      } else {
        await vehicleCreationApi.create(payload);
      }

      Swal.fire({
        icon: "success",
        title: isEdit ? "Vehicle updated" : "Vehicle created",
        timer: 1400,
        showConfirmButton: false,
      });

      navigate(ENC_LIST_PATH);
    } catch (error) {
      console.error(error);
      Swal.fire("Error", getErrorMessage(error, "Unable to save vehicle"), "error");
    } finally {
      setSubmitting(false);
    }
  }; 

  
  if (lookupLoading || (isEdit && recordLoading)) {
    return (
      <div className="p-3">
        <ComponentCard title={isEdit ? "Edit Vehicle Creation" : "New Vehicle Creation"}>
          <p className="text-sm text-gray-500">Loading vehicle data…</p>
        </ComponentCard>
      </div>
    );
  }

  return (
    <div className="p-3">
      <ComponentCard title={isEdit ? "Edit Vehicle Creation" : "New Vehicle Creation"}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Vehicle Code *</Label>
              <Input
                value={vehicleCode}
                onChange={(event) => setVehicleCode(event.target.value)}
                placeholder="Enter vehicle code"
              />
            </div>

            <div>
              <Label>Vehicle Reg No *</Label>
              <Input
                value={vehicleRegNo}
                onChange={(event) => setVehicleRegNo(event.target.value)}
                placeholder="Enter registration number"
              />
            </div>

            <div>
              <Label>Hire Type *</Label>
              <Select value={hireType} onValueChange={(value) => setHireType(value ?? "OWN")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select hire type" />
                </SelectTrigger>
                <SelectContent>
                  {HIRE_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Request *</Label>
              <Select value={requestId || undefined} onValueChange={(value) => setRequestId(value ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select request" />
                </SelectTrigger>
                <SelectContent>
                  {lookups.requests.map((option) => (
                    <SelectItem key={option.value} value={option.value}>  
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Site *</Label>
              <Select value={siteId || undefined} onValueChange={(value) => setSiteId(value ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select site" />
                </SelectTrigger>
                <SelectContent>
                  {lookups.sites.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Rental Basis *</Label>
              <Select
                value={rentalBasis}
                onValueChange={(value) => setRentalBasis(value ?? RENTAL_BASIS_OPTIONS[0].value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select basis" />
                </SelectTrigger>
                <SelectContent>
                  {RENTAL_BASIS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Equipment Type *</Label>
              <Select
                value={equipmentTypeId || undefined}
                onValueChange={(value) => setEquipmentTypeId(value ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select equipment type" />
                </SelectTrigger>
                <SelectContent>
                  {equipmentTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Equipment Model *</Label>
              <Select
                value={equipmentModelId || undefined}
                onValueChange={(value) => setEquipmentModelId(value ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select equipment model" />
                </SelectTrigger>
                <SelectContent>
                  {filteredEquipmentModels.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Contractor</Label>
              <Select
                value={contractorId || "none"}
                onValueChange={(value) => setContractorId(value === "none" ? "" : value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select contractor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {contractorOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Supplier</Label>
              <Select
                value={supplierId || "none"}
                onValueChange={(value) => setSupplierId(value === "none" ? "" : value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {supplierOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Target Hours</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={targetHours}
                onChange={(event) => setTargetHours(event.target.value)}
              />
            </div>

            <div>
              <Label>Permit Expiry *</Label>
              <Input
                type="date"
                value={permitExpiry}
                onChange={(event) => setPermitExpiry(event.target.value)}
              />
            </div>

            <div>
              <Label>FC Expiry *</Label>
              <Input
                type="date"
                value={fcExpiry}
                onChange={(event) => setFcExpiry(event.target.value)}
              />
            </div>

            <div>
              <Label>Insurance Expiry *</Label>
              <Input
                type="date"
                value={insuranceExpiry}
                onChange={(event) => setInsuranceExpiry(event.target.value)}
              />
            </div>

            <div>
              <Label>Road Tax Expiry *</Label>
              <Input
                type="date"
                value={roadTaxExpiry}
                onChange={(event) => setRoadTaxExpiry(event.target.value)}
              />
            </div>

            <div>
              <Label>Plant Entry Date</Label>
              <Input
                type="date"
                value={plantEntryDate}
                onChange={(event) => setPlantEntryDate(event.target.value)}
              />
            </div>

            <div>
              <Label>RC Invoice Date</Label>
              <Input
                type="date"
                value={rcInvoiceDate}
                onChange={(event) => setRcInvoiceDate(event.target.value)}
              />
            </div>

            <div>
              <Label>Status</Label>
              <Select
                value={isActive ? "true" : "false"}
                onValueChange={(value) => setIsActive(value === "true")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(ENC_LIST_PATH)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {isEdit ? "Update Vehicle" : "Save Vehicle"}
            </Button>
          </div>
        </form>
      </ComponentCard>
    </div>
  );
}
