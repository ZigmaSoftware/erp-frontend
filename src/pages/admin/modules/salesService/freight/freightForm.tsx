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

import { freightApi } from "@/helpers/admin";
import { getEncryptedRoute } from "@/utils/routeCache";
import type { Freight } from "../types/salesService.types";

export default function FreightForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const { encSalesService, encFreight } = getEncryptedRoute();
  const ENC_LIST_PATH = `/${encSalesService}/${encFreight}`;

  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [loadType, setLoadType] = useState("");
  const [itemType, setItemType] = useState("");
  const [qty, setQty] = useState("");
  const [rate, setRate] = useState("");
  const [amount, setAmount] = useState("");
  const [transportName, setTransportName] = useState("");
  const [transportOrderNo, setTransportOrderNo] = useState("");
  const [dueDate, setDueDate] = useState("");

  const [fetching, setFetching] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isEdit) return;

    const loadData = async () => {
      setFetching(true);
      try {
        const res = await freightApi.get(id as string);
        const data = (res?.data || res) as Freight;

        setSource(data.source ?? "");
        setDestination(data.destination ?? "");
        setDate(data.date ?? "");
        setLoadType(data.load_type ?? "");
        setItemType(data.item_type ?? "");
        setQty(String(data.qty ?? ""));
        setRate(String(data.rate ?? ""));
        setAmount(String(data.amount ?? ""));
        setTransportName(data.transport_name ?? "");
        setTransportOrderNo(data.transport_order_no ?? "");
        setDueDate(data.due_date ?? "");
      } catch {
        Swal.fire({
          icon: "error",
          title: "Failed to load freight",
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
      source: source.trim(),
      destination: destination.trim(),
      date,
      load_type: loadType,
      item_type: itemType.trim(),
      qty: qty || "0",
      rate: rate || "0",
      amount: amount || "0",
      transport_name: transportName.trim(),
      transport_order_no: transportOrderNo.trim(),
      due_date: dueDate || null,
    };

    try {
      if (isEdit) {
        await freightApi.update(id as string, payload);
        Swal.fire({
          icon: "success",
          title: "Updated successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await freightApi.create(payload);
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
        error?.response?.data?.source?.[0] ||
        error?.response?.data?.destination?.[0] ||
        error?.response?.data?.detail ||
        "Unable to save freight.";

      Swal.fire({
        icon: "error",
        title: "Save failed",
        text: message,
      });
    } finally {
      setLoading(false);
    }
  };

  const isFormDisabled = fetching || loading;

  return (
    <div className="p-8">
      <ComponentCard title={isEdit ? "Edit Freight" : "Add New Freight"}>
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Source *</Label>
              <Input
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="Source"
                required
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>Destination *</Label>
              <Input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Destination"
                required
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>Date *</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>Load Type *</Label>
              <Select
                value={loadType}
                onValueChange={setLoadType}
                disabled={isFormDisabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="per_ton">Per Ton</SelectItem>
                  <SelectItem value="per_trip">Per Trip</SelectItem>
                  <SelectItem value="fixed">Fixed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Item Type</Label>
              <Input
                value={itemType}
                onChange={(e) => setItemType(e.target.value)}
                placeholder="Item Type"
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>Qty</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                placeholder="Qty"
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>Rate</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="Rate"
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>Amount</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Amount"
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>Transport Name</Label>
              <Input
                value={transportName}
                onChange={(e) => setTransportName(e.target.value)}
                placeholder="Transport Name"
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>Transport Order No</Label>
              <Input
                value={transportOrderNo}
                onChange={(e) => setTransportOrderNo(e.target.value)}
                placeholder="Transport Order No"
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>Due Date</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
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
