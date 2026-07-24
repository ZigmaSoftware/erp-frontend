import { useEffect, useMemo, useState } from "react";
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

import { icwWorkOrderApi, siteApi, customerCreationApi } from "@/helpers/admin";
import { getEncryptedRoute } from "@/utils/routeCache";
import { extractErrorMessage } from "@/utils/errorUtils";
import type {
  IcwWorkOrder,
  IcwWorkOrderTransport,
} from "../types/salesService.types";

type Option = { value: string; label: string };

const toOptions = (
  list: unknown[],
  getId: (item: any) => string | undefined,
  getLabel: (item: any) => string | undefined,
): Option[] =>
  list
    .map((item) => ({ value: getId(item), label: getLabel(item) }))
    .filter((option): option is Option => Boolean(option.value && option.label));

export default function IcwWorkOrderForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const { encSalesService, encIcwWorkOrder } = getEncryptedRoute();
  const ENC_LIST_PATH = `/${encSalesService}/${encIcwWorkOrder}`;

  /* ---------------- Header state ---------------- */
  const [entryDate, setEntryDate] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [itemName, setItemName] = useState("");
  const [target, setTarget] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [perTonCost, setPerTonCost] = useState("");
  const [gstType, setGstType] = useState("IGST");
  const [siteId, setSiteId] = useState("");
  const [description, setDescription] = useState("");

  /* ---------------- Transport sublist state ---------------- */
  const [transports, setTransports] = useState<IcwWorkOrderTransport[]>([]);
  const [editingTransportId, setEditingTransportId] = useState<string>("");

  const [transportName, setTransportName] = useState("");
  const [transportOrderNo, setTransportOrderNo] = useState("");
  const [transportQty, setTransportQty] = useState("");

  /* ---------------- Dropdown data ---------------- */
  const [sites, setSites] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  const [fetching, setFetching] = useState(false);
  const [savingHeader, setSavingHeader] = useState(false);
  const [savingRow, setSavingRow] = useState(false);

  /* -----------------------------------------------------------
     LOAD DROPDOWN OPTIONS
  ----------------------------------------------------------- */
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [siteList, customerList] = await Promise.all([
          siteApi.list(),
          customerCreationApi.list(),
        ]);
        setSites(siteList as unknown[]);
        setCustomers(customerList as unknown[]);
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

  const siteOptions = useMemo(
    () => toOptions(sites, (s) => s.unique_id, (s) => s.site_name),
    [sites],
  );

  const customerOptions = useMemo(
    () => toOptions(customers, (c) => c.unique_id, (c) => c.customer_name),
    [customers],
  );

  /* -----------------------------------------------------------
     LOAD RECORD FOR EDIT
  ----------------------------------------------------------- */
  useEffect(() => {
    if (!isEdit) return;

    const loadData = async () => {
      setFetching(true);
      try {
        const res = await icwWorkOrderApi.get(id as string);
        const data = (res?.data || res) as IcwWorkOrder;

        setEntryDate(data.entry_date ?? "");
        setCustomerName(data.customer_name ?? "");
        setItemName(data.item_name ?? "");
        setTarget(String(data.target ?? ""));
        setStartDate(data.start_date ?? "");
        setEndDate(data.end_date ?? "");
        setPerTonCost(String(data.per_ton_cost ?? ""));
        setGstType(data.gst_type ?? "IGST");
        setSiteId(data.site_id ?? "");
        setDescription(data.description ?? "");
        setTransports(data.transports ?? []);
      } catch {
        Swal.fire({
          icon: "error",
          title: "Failed to load ICW work order",
          text: "Something went wrong!",
        });
      } finally {
        setFetching(false);
      }
    };

    loadData();
  }, [isEdit, id]);

  /* -----------------------------------------------------------
     HEADER FIELD CHANGES (auto-save once header exists)
  ----------------------------------------------------------- */
  const persistHeaderField = async (field: string, value: string) => {
    if (!id) return;
    try {
      setSavingHeader(true);
      await icwWorkOrderApi.update(id, { [field]: value });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Failed to update work order",
        text: extractErrorMessage(error),
      });
    } finally {
      setSavingHeader(false);
    }
  };

  const handleCustomerChange = (value: string) => {
    setCustomerName(value);
    if (isEdit) persistHeaderField("customer_name", value);
  };

  const handleSiteChange = (value: string) => {
    setSiteId(value);
    if (isEdit) persistHeaderField("site_id", value);
  };

  const handleEntryDateChange = (value: string) => {
    setEntryDate(value);
    if (isEdit) persistHeaderField("entry_date", value);
  };

  /* -----------------------------------------------------------
     ADD / UPDATE A TRANSPORT ROW
  ----------------------------------------------------------- */
  const handleAddTransport = async () => {
    if (!customerName.trim()) {
      Swal.fire({ icon: "error", title: "Customer is required" });
      return;
    }
    if (!siteId) {
      Swal.fire({ icon: "error", title: "Site is required" });
      return;
    }

    setSavingRow(true);
    try {
      let headerId = id;

      if (!headerId) {
        const headerRes = await icwWorkOrderApi.create({
          entry_date: entryDate,
          customer_name: customerName.trim(),
          item_name: itemName.trim(),
          target: target || "0",
          start_date: startDate,
          end_date: endDate,
          per_ton_cost: perTonCost || "0",
          gst_type: gstType,
          site_id: siteId,
          description: description.trim() || null,
        });
        const headerData = (headerRes?.data || headerRes) as IcwWorkOrder;
        headerId = headerData.unique_id;
        navigate(`/${encSalesService}/${encIcwWorkOrder}/${headerId}/edit`, { replace: true });
      }

      const payload = {
        work_order: headerId,
        transport_name: transportName.trim(),
        transport_order_no: transportOrderNo.trim(),
        transport_qty: transportQty || "0",
      };

      if (editingTransportId) {
        await icwWorkOrderApi.update(editingTransportId, payload);
      } else {
        await icwWorkOrderApi.create(payload);
      }

      if (headerId) {
        const res = await icwWorkOrderApi.get(headerId);
        const data = (res?.data || res) as IcwWorkOrder;
        setTransports(data.transports ?? []);
      }

      resetRow();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: editingTransportId ? "Update failed" : "Add failed",
        text: extractErrorMessage(error),
      });
    } finally {
      setSavingRow(false);
    }
  };

  const handleEditTransport = (item: IcwWorkOrderTransport) => {
    setEditingTransportId(item.unique_id);
    setTransportName(item.transport_name);
    setTransportOrderNo(item.transport_order_no);
    setTransportQty(String(item.transport_qty ?? ""));
  };

  const handleDeleteTransport = async (item: IcwWorkOrderTransport) => {
    const confirmDelete = await Swal.fire({
      title: "Are you sure?",
      text: "This transport row will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!confirmDelete.isConfirmed) return;

    try {
      await icwWorkOrderApi.remove(item.unique_id);
      if (id) {
        const res = await icwWorkOrderApi.get(id);
        const data = (res?.data || res) as IcwWorkOrder;
        setTransports(data.transports ?? []);
      }
      if (editingTransportId === item.unique_id) resetRow();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Delete failed",
        text: extractErrorMessage(error),
      });
    }
  };

  const resetRow = () => {
    setTransportName("");
    setTransportOrderNo("");
    setTransportQty("");
    setEditingTransportId("");
  };

  const isFormDisabled = fetching || savingHeader;
  const isRowDisabled = isFormDisabled || savingRow;

  return (
    <div className="p-8">
      <ComponentCard title={isEdit ? "Edit ICW Work Order" : "Add New ICW Work Order"}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label>Entry Date *</Label>
            <Input
              type="date"
              value={entryDate}
              onChange={(e) => handleEntryDateChange(e.target.value)}
              disabled={isFormDisabled}
              required
            />
          </div>

          <div>
            <Label>Customer Name *</Label>
            <Select
              value={customerName}
              onValueChange={handleCustomerChange}
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
            <Label>Item Name *</Label>
            <Input
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="Item Name"
              disabled={isFormDisabled}
              required
            />
          </div>

          <div>
            <Label>Target *</Label>
            <Input
              type="number"
              step="0.01"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="Target"
              disabled={isFormDisabled}
              required
            />
          </div>

          <div>
            <Label>Start Date</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={isFormDisabled}
            />
          </div>

          <div>
            <Label>End Date</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={isFormDisabled}
            />
          </div>

          <div>
            <Label>Per Ton Cost</Label>
            <Input
              type="number"
              step="0.01"
              value={perTonCost}
              onChange={(e) => setPerTonCost(e.target.value)}
              placeholder="Per Ton Cost"
              disabled={isFormDisabled}
            />
          </div>

          <div>
            <Label>GST Type</Label>
            <Select
              value={gstType}
              onValueChange={(value) => {
                setGstType(value);
                if (isEdit) persistHeaderField("gst_type", value);
              }}
              disabled={isFormDisabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IGST">IGST</SelectItem>
                <SelectItem value="SGST">SGST</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Site *</Label>
            <Select
              value={siteId}
              onValueChange={handleSiteChange}
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

        <div className="mt-6 overflow-x-auto">
          <table className="w-full border border-gray-200 text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="border px-3 py-2 text-left w-12">S.No</th>
                <th className="border px-3 py-2 text-left">Transport Name *</th>
                <th className="border px-3 py-2 text-left">Transport Order No</th>
                <th className="border px-3 py-2 text-right">Transport Qty</th>
                <th className="border px-3 py-2 text-center w-32">Action</th>
              </tr>
            </thead>
            <tbody>
              {transports.map((item, index) => (
                <tr key={item.unique_id}>
                  <td className="border px-3 py-2">{index + 1}</td>
                  <td className="border px-3 py-2">{item.transport_name}</td>
                  <td className="border px-3 py-2">{item.transport_order_no}</td>
                  <td className="border px-3 py-2 text-right">{item.transport_qty}</td>
                  <td className="border px-3 py-2">
                    <div className="flex gap-2 justify-center">
                      <button
                        type="button"
                        title="Edit"
                        className="text-blue-600 hover:text-blue-800"
                        onClick={() => handleEditTransport(item)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        title="Delete"
                        className="text-red-600 hover:text-red-800"
                        onClick={() => handleDeleteTransport(item)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              <tr>
                <td className="border px-3 py-2">#</td>
                <td className="border px-3 py-2">
                  <Input
                    value={transportName}
                    onChange={(e) => setTransportName(e.target.value)}
                    placeholder="Transport Name"
                    disabled={isRowDisabled}
                  />
                </td>
                <td className="border px-3 py-2">
                  <Input
                    value={transportOrderNo}
                    onChange={(e) => setTransportOrderNo(e.target.value)}
                    placeholder="Transport Order No"
                    disabled={isRowDisabled}
                  />
                </td>
                <td className="border px-3 py-2">
                  <Input
                    type="number"
                    step="0.01"
                    value={transportQty}
                    onChange={(e) => setTransportQty(e.target.value)}
                    disabled={isRowDisabled}
                    className="text-right"
                  />
                </td>
                <td className="border px-3 py-2 text-center">
                  <div className="flex gap-2 justify-center">
                    <Button
                      type="button"
                      onClick={handleAddTransport}
                      disabled={isRowDisabled}
                      className="h-8 px-3"
                    >
                      {savingRow ? "..." : editingTransportId ? "UPDATE" : "ADD"}
                    </Button>
                    {editingTransportId && (
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={resetRow}
                        disabled={isRowDisabled}
                        className="h-8 px-3"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex justify-center gap-3 mt-6">
          <Button onClick={() => navigate(ENC_LIST_PATH)}>SUBMIT</Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => navigate(ENC_LIST_PATH)}
          >
            Cancel
          </Button>
        </div>
      </ComponentCard>
    </div>
  );
}
