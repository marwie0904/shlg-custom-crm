"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, X, FileIcon, ArrowLeft, Loader2 } from "lucide-react";

interface WorkshopFormData {
  // Page 1
  type: "seminar" | "webinar" | "";
  capacity: string;
  // Page 2
  name: string;
  description: string;
  // Page 3
  date: string;
  timeHours: string;
  timeMinutes: string;
  timePeriod: "AM" | "PM";
  // Page 4
  streetAddress: string;
  streetAddress2: string;
  city: string;
  state: string;
  postalCode: string;
  // Page 5
  notes: string;
  files: File[];
}

const initialFormData: WorkshopFormData = {
  type: "",
  capacity: "",
  name: "",
  description: "",
  date: "",
  timeHours: "",
  timeMinutes: "",
  timePeriod: "AM",
  streetAddress: "",
  streetAddress2: "",
  city: "",
  state: "",
  postalCode: "",
  notes: "",
  files: [],
};

export default function NewWorkshopPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<WorkshopFormData>(initialFormData);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const totalSteps = 5;

  // Convex mutations
  const createWorkshop = useMutation(api.workshops.create);
  const generateUploadUrl = useMutation(api.documents.generateUploadUrl);
  const createDocument = useMutation(api.documents.createForWorkshop);

  const updateFormData = (field: keyof WorkshopFormData, value: string | File[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const uploadFiles = async (workshopId: Id<"workshops">) => {
    const uploadedFileIds: Id<"documents">[] = [];

    for (const file of formData.files) {
      try {
        // Get upload URL
        const uploadUrl = await generateUploadUrl();

        // Upload file to storage
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!result.ok) {
          throw new Error(`Failed to upload file: ${file.name}`);
        }

        const { storageId } = await result.json();

        // Create document record
        const documentId = await createDocument({
          workshopId,
          name: file.name,
          type: file.name.split(".").pop() || "unknown",
          mimeType: file.type,
          size: file.size,
          storageId,
        });

        uploadedFileIds.push(documentId);
      } catch (err) {
        console.error(`Error uploading file ${file.name}:`, err);
      }
    }

    return uploadedFileIds;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Format time string
      const hours = formData.timeHours.padStart(2, "0");
      const minutes = formData.timeMinutes.padStart(2, "0");
      const time = `${hours}:${minutes} ${formData.timePeriod}`;

      // Parse date to timestamp
      const dateTimestamp = new Date(formData.date).getTime();

      // Create workshop
      const workshopId = await createWorkshop({
        title: formData.name,
        description: formData.description,
        notes: formData.notes || undefined,
        streetAddress: formData.streetAddress,
        streetAddress2: formData.streetAddress2 || undefined,
        city: formData.city,
        state: formData.state,
        postalCode: formData.postalCode,
        date: dateTimestamp,
        time,
        status: "Draft",
        maxCapacity: parseInt(formData.capacity, 10),
        type: formData.type || undefined,
      });

      // Upload files if any
      if (formData.files.length > 0) {
        await uploadFiles(workshopId);
      }

      // Redirect to workshops list
      router.push("/workshops");
    } catch (err) {
      console.error("Error creating workshop:", err);
      setError(err instanceof Error ? err.message : "Failed to create workshop");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    updateFormData("files", [...formData.files, ...droppedFiles]);
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      updateFormData("files", [...formData.files, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = formData.files.filter((_, i) => i !== index);
    updateFormData("files", newFiles);
  };

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1:
        return formData.type !== "" && formData.capacity !== "";
      case 2:
        return formData.name !== "" && formData.description !== "";
      case 3:
        return (
          formData.date !== "" &&
          formData.timeHours !== "" &&
          formData.timeMinutes !== ""
        );
      case 4:
        return (
          formData.streetAddress !== "" &&
          formData.city !== "" &&
          formData.state !== "" &&
          formData.postalCode !== ""
        );
      case 5:
        return true; // Notes and files are optional
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 py-8">
      <div className="mx-auto max-w-2xl px-4">
        {/* Back to Workshops */}
        <button
          onClick={() => router.push("/workshops")}
          className="mb-6 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Workshops
        </button>

        {/* Progress Indicator */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className={`h-2 w-8 rounded-full transition-colors ${
                  i + 1 <= currentStep ? "bg-blue-600" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-500">
            Page {currentStep} of {totalSteps}
          </span>
        </div>

        {/* Form Card */}
        <div className="rounded-lg border bg-white p-8 shadow-sm">
          {/* Error Message */}
          {error && (
            <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Page 1: Type and Capacity */}
          {currentStep === 1 && (
            <div className="space-y-8">
              <h1 className="text-2xl font-bold text-gray-900">
                WORKSHOP CREATION FORM
              </h1>
              <div className="h-px bg-gray-200" />

              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-base font-medium">Type of Workshop</Label>
                  <RadioGroup
                    value={formData.type}
                    onValueChange={(value) =>
                      updateFormData("type", value as "seminar" | "webinar")
                    }
                    className="flex gap-8"
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="seminar" id="seminar" />
                      <Label htmlFor="seminar" className="font-normal cursor-pointer">
                        Seminar
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="webinar" id="webinar" />
                      <Label htmlFor="webinar" className="font-normal cursor-pointer">
                        Webinar
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-medium">Capacity</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 23"
                    value={formData.capacity}
                    onChange={(e) => updateFormData("capacity", e.target.value)}
                    className="w-32"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Page 2: Name and Description */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-base font-medium">Workshop Name</Label>
                <Input
                  placeholder="Enter workshop name"
                  value={formData.name}
                  onChange={(e) => updateFormData("name", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-base font-medium">Workshop Description</Label>
                <Textarea
                  placeholder="Enter workshop description"
                  value={formData.description}
                  onChange={(e) => updateFormData("description", e.target.value)}
                  className="min-h-[150px]"
                />
              </div>
            </div>
          )}

          {/* Page 3: Date and Time */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-base font-medium">Workshop Date</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => updateFormData("date", e.target.value)}
                  className="w-48"
                />
                <p className="text-sm text-gray-500">Date</p>
              </div>

              <div className="space-y-2">
                <Label className="text-base font-medium">Workshop Time</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    placeholder="HH"
                    maxLength={2}
                    value={formData.timeHours}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "").slice(0, 2);
                      if (parseInt(value) <= 12 || value === "") {
                        updateFormData("timeHours", value);
                      }
                    }}
                    className="w-16 text-center"
                  />
                  <span className="text-gray-500">:</span>
                  <Input
                    type="text"
                    placeholder="MM"
                    maxLength={2}
                    value={formData.timeMinutes}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "").slice(0, 2);
                      if (parseInt(value) <= 59 || value === "") {
                        updateFormData("timeMinutes", value);
                      }
                    }}
                    className="w-16 text-center"
                  />
                  <Select
                    value={formData.timePeriod}
                    onValueChange={(value) =>
                      updateFormData("timePeriod", value as "AM" | "PM")
                    }
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AM">AM</SelectItem>
                      <SelectItem value="PM">PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-sm text-gray-500">Hour Minutes</p>
              </div>
            </div>
          )}

          {/* Page 4: Address */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <Label className="text-lg font-medium">Workshop Address</Label>

              <div className="space-y-1">
                <Input
                  placeholder=""
                  value={formData.streetAddress}
                  onChange={(e) => updateFormData("streetAddress", e.target.value)}
                />
                <p className="text-sm text-gray-500">Street Address</p>
              </div>

              <div className="space-y-1">
                <Input
                  placeholder=""
                  value={formData.streetAddress2}
                  onChange={(e) => updateFormData("streetAddress2", e.target.value)}
                />
                <p className="text-sm text-gray-500">Street Address Line 2</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Input
                    placeholder=""
                    value={formData.city}
                    onChange={(e) => updateFormData("city", e.target.value)}
                  />
                  <p className="text-sm text-gray-500">City</p>
                </div>
                <div className="space-y-1">
                  <Input
                    placeholder=""
                    value={formData.state}
                    onChange={(e) => updateFormData("state", e.target.value)}
                  />
                  <p className="text-sm text-gray-500">State / Province</p>
                </div>
              </div>

              <div className="space-y-1">
                <Input
                  placeholder=""
                  value={formData.postalCode}
                  onChange={(e) => updateFormData("postalCode", e.target.value)}
                />
                <p className="text-sm text-gray-500">Postal / Zip Code</p>
              </div>
            </div>
          )}

          {/* Page 5: Notes and Files */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-base font-medium">Workshop Notes</Label>
                <Textarea
                  placeholder="Enter any additional notes"
                  value={formData.notes}
                  onChange={(e) => updateFormData("notes", e.target.value)}
                  className="min-h-[150px]"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-base font-medium">Relevant Files</Label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
                    isDragging
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <Upload className="mb-2 h-8 w-8 text-gray-400" />
                  <p className="font-medium text-gray-700">Browse Files</p>
                  <p className="text-sm text-gray-500">Drag and drop files here</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </div>

                {/* File List */}
                {formData.files.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {formData.files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-md border bg-gray-50 px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <FileIcon className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-700">{file.name}</span>
                          <span className="text-xs text-gray-400">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 flex items-center justify-between border-t pt-6">
            <div>
              {currentStep > 1 && (
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={isSubmitting}
                  className="px-8"
                >
                  Back
                </Button>
              )}
            </div>
            <div>
              {currentStep < totalSteps ? (
                <Button
                  onClick={handleNext}
                  disabled={!isStepValid(currentStep)}
                  className="bg-blue-600 px-8 hover:bg-blue-700"
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-green-600 px-8 hover:bg-green-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit"
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
