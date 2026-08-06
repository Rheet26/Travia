import { useState } from "react";
import { motion } from "motion/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BerthPreference, Gender, Train } from "@/lib/railverse/types";

export interface BookingFormValues {
  passengerName: string;
  age: number;
  gender: Gender;
  preference: BerthPreference;
}

export function BookingModal({
  train,
  open,
  onOpenChange,
  onConfirm,
}: {
  train: Train | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (values: BookingFormValues) => void;
}) {
  const [name, setName] = useState("");
  const [age, setAge] = useState("30");
  const [gender, setGender] = useState<Gender>("Male");
  const [preference, setPreference] = useState<BerthPreference>("No Preference");
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const parsedAge = Number(age);
    if (!name.trim()) return setError("Passenger name is required.");
    if (!Number.isFinite(parsedAge) || parsedAge < 1 || parsedAge > 120)
      return setError("Enter a valid age between 1 and 120.");
    setError(null);
    onConfirm({ passengerName: name.trim(), age: parsedAge, gender, preference });
    setName("");
    setAge("30");
    setGender("Male");
    setPreference("No Preference");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Passenger details</DialogTitle>
          <DialogDescription>
            {train
              ? `${train.name} · ${train.from} → ${train.to} · ₹${train.fare}`
              : "Select a train to continue."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-1">
          <div className="grid gap-2">
            <Label htmlFor="pname">Passenger name</Label>
            <Input
              id="pname"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ananya Sharma"
              autoComplete="off"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="page">Age</Label>
              <Input
                id="page"
                inputMode="numeric"
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Gender</Label>
              <Select value={gender} onValueChange={(v) => setGender(v as Gender)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Berth preference</Label>
            <Select
              value={preference}
              onValueChange={(v) => setPreference(v as BerthPreference)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Lower">Lower</SelectItem>
                <SelectItem value="Middle">Middle</SelectItem>
                <SelectItem value="Upper">Upper</SelectItem>
                <SelectItem value="No Preference">No Preference</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-destructive"
            >
              {error}
            </motion.p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit}>Confirm booking</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
