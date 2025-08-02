import React, { useState } from "react";
import { Button } from "./button.tsx";
import { Input } from "./input.tsx";
import { Label } from "./label.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select.tsx";
import { Textarea } from "./textarea.tsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./card.tsx";
import { Debt, User } from "../types/index.ts";

interface AddDebtFormProps {
  users: User[];
  currentUser: User;
  onAddDebt: (debt: Omit<Debt, "id">) => void;
}

export function AddDebtForm({
  users,
  currentUser,
  onAddDebt,
}: AddDebtFormProps) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [toUserId, setToUserId] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description || !toUserId) return;

    const newDebt: Omit<Debt, "id"> = {
      amount: parseFloat(amount),
      description,
      date: new Date().toISOString(),
      fromUserId: currentUser.id,
      toUserId,
      status: "pending",
      photo: photoPreview,
    };

    onAddDebt(newDebt);
    setAmount("");
    setDescription("");
    setToUserId("");
    setPhoto(null);
    setPhotoPreview("");
  };

  const otherUsers = users.filter((user) => user.id !== currentUser.id);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Debt</CardTitle>
        <CardDescription>
          Create a new debt entry that will be sent for confirmation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="toUser">To</Label>
              <Select value={toUserId} onValueChange={setToUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select person" />
                </SelectTrigger>
                <SelectContent>
                  {otherUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this debt for?"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="photo">Photo (optional)</Label>
            <Input
              id="photo"
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
            />
            {photoPreview && (
              <div className="mt-2">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded-md"
                />
              </div>
            )}
          </div>

          <Button type="submit" className="w-full">
            Create Debt
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
