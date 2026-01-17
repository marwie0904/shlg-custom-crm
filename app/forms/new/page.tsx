"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormBuilder } from "@/components/forms/FormBuilder";
import { FormElement } from "@/lib/types/forms";
import { ArrowLeft, Save, Eye, Settings, Globe } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function NewFormTemplatePage() {
  const router = useRouter();
  const createTemplate = useMutation(api.formTemplates.create);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [elements, setElements] = useState<FormElement[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [submitButtonText, setSubmitButtonText] = useState("Submit");
  const [confirmationMessage, setConfirmationMessage] = useState(
    "Thank you for your submission!"
  );
  const [isSaving, setIsSaving] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleSave = async (status: "draft" | "active" = "draft") => {
    if (!title.trim()) {
      toast.error("Please enter a form title");
      return;
    }

    if (elements.length === 0) {
      toast.error("Please add at least one form element");
      return;
    }

    setIsSaving(true);
    try {
      await createTemplate({
        title: title.trim(),
        description: description.trim() || undefined,
        elements,
        isPublic,
        submitButtonText,
        confirmationMessage,
        status,
      });

      toast.success(
        status === "active" ? "Form published successfully!" : "Form saved as draft"
      );
      router.push("/forms");
    } catch (error) {
      console.error("Failed to save form:", error);
      toast.error("Failed to save form");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Top Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b bg-white">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/forms")}
            className="text-gray-600"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div className="h-6 w-px bg-gray-200" />
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled Form"
            className="text-lg font-semibold border-none shadow-none focus-visible:ring-0 px-0 w-64"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(true)}
          >
            <Settings className="h-4 w-4 mr-1" />
            Settings
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(true)}
          >
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSave("draft")}
            disabled={isSaving}
          >
            <Save className="h-4 w-4 mr-1" />
            Save Draft
          </Button>
          <Button
            size="sm"
            onClick={() => handleSave("active")}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Publish
          </Button>
        </div>
      </header>

      {/* Form Builder */}
      <div className="flex-1 overflow-hidden">
        <FormBuilder elements={elements} onChange={setElements} />
      </div>

      {/* Settings Modal */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Form Settings</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Form Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter form title..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter form description..."
                className="w-full px-3 py-2 border rounded-md text-sm resize-none h-20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="submitButtonText">Submit Button Text</Label>
              <Input
                id="submitButtonText"
                value={submitButtonText}
                onChange={(e) => setSubmitButtonText(e.target.value)}
                placeholder="Submit"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmationMessage">Confirmation Message</Label>
              <textarea
                id="confirmationMessage"
                value={confirmationMessage}
                onChange={(e) => setConfirmationMessage(e.target.value)}
                placeholder="Message shown after submission..."
                className="w-full px-3 py-2 border rounded-md text-sm resize-none h-20"
              />
            </div>

            <div className="flex items-center justify-between py-2 border-t pt-4">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-gray-500" />
                <div>
                  <Label htmlFor="isPublic" className="cursor-pointer">
                    Public Form
                  </Label>
                  <p className="text-xs text-gray-500">
                    Allow anyone with the link to submit this form
                  </p>
                </div>
              </div>
              <button
                id="isPublic"
                onClick={() => setIsPublic(!isPublic)}
                className={`relative w-10 h-6 rounded-full transition-colors ${
                  isPublic ? "bg-blue-600" : "bg-gray-200"
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    isPublic ? "translate-x-4" : ""
                  }`}
                />
              </button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{title || "Form Preview"}</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            {description && (
              <p className="text-gray-600 mb-6">{description}</p>
            )}

            {elements.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No elements to preview. Add elements to your form first.
              </div>
            ) : (
              <div className="space-y-6">
                {elements.map((element) => (
                  <FormElementPreviewFull key={element.id} element={element} />
                ))}

                <div className="pt-4 border-t">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    {submitButtonText || "Submit"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Full preview of form elements (interactive-looking)
function FormElementPreviewFull({ element }: { element: FormElement }) {
  switch (element.type) {
    case "title":
      return (
        <h2
          className={`font-semibold ${
            element.size === "lg"
              ? "text-2xl"
              : element.size === "sm"
              ? "text-lg"
              : "text-xl"
          }`}
        >
          {element.content || "Section Title"}
        </h2>
      );

    case "text":
      return (
        <p className="text-gray-600">{element.content || "Static text content..."}</p>
      );

    case "separator":
      return <hr className="border-gray-200" />;

    case "textInput":
    case "email":
    case "phone":
    case "number":
    case "location":
      return (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
            {element.label || "Label"}
            {element.required && <span className="text-red-500">*</span>}
          </label>
          <Input
            type={
              element.type === "email"
                ? "email"
                : element.type === "phone"
                ? "tel"
                : element.type === "number"
                ? "number"
                : "text"
            }
            placeholder={element.placeholder || "Enter value..."}
            disabled
          />
        </div>
      );

    case "largeTextInput":
      return (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
            {element.label || "Label"}
            {element.required && <span className="text-red-500">*</span>}
          </label>
          <textarea
            placeholder={element.placeholder || "Enter details..."}
            className="w-full px-3 py-2 border rounded-md text-sm resize-none h-24"
            disabled
          />
        </div>
      );

    case "date":
      return (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
            {element.label || "Date"}
            {element.required && <span className="text-red-500">*</span>}
          </label>
          <Input type="date" disabled />
        </div>
      );

    case "dropdown":
      return (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
            {element.label || "Select"}
            {element.required && <span className="text-red-500">*</span>}
          </label>
          <select className="w-full px-3 py-2 border rounded-md text-sm" disabled>
            <option>Select option...</option>
            {(element.options || []).map((opt, i) => (
              <option key={i}>{opt}</option>
            ))}
          </select>
        </div>
      );

    case "singleSelect":
      return (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
            {element.label || "Choose One"}
            {element.required && <span className="text-red-500">*</span>}
          </label>
          <div className="space-y-2">
            {(element.options || ["Option 1", "Option 2"]).map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={element.id}
                  disabled
                  className="h-4 w-4"
                />
                <span className="text-sm">{opt}</span>
              </div>
            ))}
          </div>
        </div>
      );

    case "multipleSelect":
      return (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
            {element.label || "Select All That Apply"}
            {element.required && <span className="text-red-500">*</span>}
          </label>
          <div className="space-y-2">
            {(element.options || ["Option 1", "Option 2"]).map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input type="checkbox" disabled className="h-4 w-4" />
                <span className="text-sm">{opt}</span>
              </div>
            ))}
          </div>
        </div>
      );

    case "checkbox":
      return (
        <div className="flex items-center gap-2">
          <input type="checkbox" disabled className="h-4 w-4" />
          <span className="text-sm">
            {element.label || "Checkbox label"}
            {element.required && <span className="text-red-500 ml-1">*</span>}
          </span>
        </div>
      );

    case "fileUpload":
      return (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
            {element.label || "Upload File"}
            {element.required && <span className="text-red-500">*</span>}
          </label>
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
            <span className="text-sm text-gray-500">
              Click or drag files to upload
            </span>
          </div>
        </div>
      );

    case "signature":
      return (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
            {element.label || "Signature"}
            {element.required && <span className="text-red-500">*</span>}
          </label>
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center bg-gray-50">
            <span className="text-sm text-gray-500">Sign here</span>
          </div>
        </div>
      );

    case "column":
      return (
        <div className="p-4 border border-dashed border-gray-300 rounded-lg bg-gray-50 text-center text-sm text-gray-500">
          {element.columnCount || 2} Column Layout
        </div>
      );

    default:
      return null;
  }
}
