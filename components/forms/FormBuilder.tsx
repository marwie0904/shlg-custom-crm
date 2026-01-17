"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  GripVertical,
  Trash2,
  Settings,
  Plus,
  Columns,
  Minus,
  Heading,
  Type,
  TextCursor,
  AlignLeft,
  Mail,
  Phone,
  Hash,
  Calendar,
  ChevronDown,
  Circle,
  CheckSquare,
  Square,
  MapPin,
  Upload,
  PenTool,
  X,
} from "lucide-react";
import {
  FormElement,
  FormElementType,
  ELEMENT_TYPES,
  createFormElement,
} from "@/lib/types/forms";

// Icon mapping
const iconMap: Record<string, React.ElementType> = {
  Columns,
  Minus,
  Heading,
  Type,
  TextCursor,
  AlignLeft,
  Mail,
  Phone,
  Hash,
  Calendar,
  ChevronDown,
  Circle,
  CheckSquare,
  Square,
  MapPin,
  Upload,
  PenTool,
};

interface FormBuilderProps {
  elements: FormElement[];
  onChange: (elements: FormElement[]) => void;
}

// Draggable Element in Palette
function DraggableElementType({
  type,
  label,
  icon,
  onClick,
}: {
  type: FormElementType;
  label: string;
  icon: string;
  onClick: () => void;
}) {
  const IconComponent = iconMap[icon] || Type;

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm rounded-md hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200"
    >
      <IconComponent className="h-4 w-4 text-gray-500" />
      <span className="text-gray-700">{label}</span>
    </button>
  );
}

// Sortable Element in Canvas
function SortableFormElement({
  element,
  isSelected,
  onSelect,
  onDelete,
}: {
  element: FormElement;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: element.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-lg border p-4 transition-all ${
        isSelected
          ? "border-blue-500 ring-2 ring-blue-200 bg-blue-50/50"
          : "border-gray-200 hover:border-gray-300 bg-white"
      } ${isDragging ? "shadow-lg" : ""}`}
      onClick={onSelect}
    >
      <div className="flex items-start gap-3">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="mt-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
        >
          <GripVertical className="h-5 w-5" />
        </button>

        {/* Element Preview */}
        <div className="flex-1 min-w-0">
          <FormElementPreview element={element} />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Element Preview (how it looks in the builder)
function FormElementPreview({ element }: { element: FormElement }) {
  const IconComponent = iconMap[ELEMENT_TYPES.find((t) => t.type === element.type)?.icon || "Type"] || Type;

  switch (element.type) {
    case "title":
      return (
        <div className={`font-semibold ${element.size === "lg" ? "text-xl" : element.size === "sm" ? "text-base" : "text-lg"}`}>
          {element.content || "Section Title"}
        </div>
      );

    case "text":
      return (
        <div className="text-gray-600">{element.content || "Static text content..."}</div>
      );

    case "separator":
      return <hr className="border-gray-200 my-2" />;

    case "column":
      return (
        <div className="flex items-center gap-2 text-gray-500">
          <Columns className="h-4 w-4" />
          <span>{element.columnCount || 2} Column Layout</span>
        </div>
      );

    case "textInput":
    case "email":
    case "phone":
    case "number":
    case "location":
      return (
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
            {element.label || "Label"}
            {element.required && <span className="text-red-500">*</span>}
          </label>
          <div className="flex items-center gap-2 px-3 py-2 border rounded-md bg-gray-50 text-gray-400 text-sm">
            <IconComponent className="h-4 w-4" />
            {element.placeholder || "Enter value..."}
          </div>
        </div>
      );

    case "largeTextInput":
      return (
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
            {element.label || "Label"}
            {element.required && <span className="text-red-500">*</span>}
          </label>
          <div className="px-3 py-2 border rounded-md bg-gray-50 text-gray-400 text-sm h-20">
            {element.placeholder || "Enter details..."}
          </div>
        </div>
      );

    case "date":
      return (
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
            {element.label || "Date"}
            {element.required && <span className="text-red-500">*</span>}
          </label>
          <div className="flex items-center gap-2 px-3 py-2 border rounded-md bg-gray-50 text-gray-400 text-sm">
            <Calendar className="h-4 w-4" />
            Select date...
          </div>
        </div>
      );

    case "dropdown":
      return (
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
            {element.label || "Select"}
            {element.required && <span className="text-red-500">*</span>}
          </label>
          <div className="flex items-center justify-between px-3 py-2 border rounded-md bg-gray-50 text-gray-400 text-sm">
            <span>Select option...</span>
            <ChevronDown className="h-4 w-4" />
          </div>
          {element.options && element.options.length > 0 && (
            <div className="text-xs text-gray-400 mt-1">
              Options: {element.options.join(", ")}
            </div>
          )}
        </div>
      );

    case "singleSelect":
      return (
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
            {element.label || "Choose One"}
            {element.required && <span className="text-red-500">*</span>}
          </label>
          <div className="space-y-1">
            {(element.options || ["Option 1", "Option 2"]).slice(0, 3).map((opt, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-500">
                <Circle className="h-4 w-4" />
                {opt}
              </div>
            ))}
          </div>
        </div>
      );

    case "multipleSelect":
      return (
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
            {element.label || "Select All That Apply"}
            {element.required && <span className="text-red-500">*</span>}
          </label>
          <div className="space-y-1">
            {(element.options || ["Option 1", "Option 2"]).slice(0, 3).map((opt, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-500">
                <Square className="h-4 w-4" />
                {opt}
              </div>
            ))}
          </div>
        </div>
      );

    case "checkbox":
      return (
        <div className="flex items-center gap-2">
          <Square className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-700">
            {element.label || "Checkbox label"}
          </span>
          {element.required && <span className="text-red-500">*</span>}
        </div>
      );

    case "fileUpload":
      return (
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
            {element.label || "Upload File"}
            {element.required && <span className="text-red-500">*</span>}
          </label>
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center">
            <Upload className="h-6 w-6 mx-auto text-gray-400 mb-1" />
            <span className="text-sm text-gray-500">Click or drag to upload</span>
          </div>
        </div>
      );

    case "signature":
      return (
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
            {element.label || "Signature"}
            {element.required && <span className="text-red-500">*</span>}
          </label>
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center bg-gray-50">
            <PenTool className="h-6 w-6 mx-auto text-gray-400 mb-1" />
            <span className="text-sm text-gray-500">Sign here</span>
          </div>
        </div>
      );

    default:
      return (
        <div className="text-gray-500 text-sm">Unknown element type</div>
      );
  }
}

// Element Properties Panel
function ElementPropertiesPanel({
  element,
  onChange,
  onClose,
}: {
  element: FormElement;
  onChange: (updated: FormElement) => void;
  onClose: () => void;
}) {
  const config = ELEMENT_TYPES.find((t) => t.type === element.type);

  const updateElement = (updates: Partial<FormElement>) => {
    onChange({ ...element, ...updates });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-gray-500" />
          <h3 className="font-medium text-gray-900">Element Properties</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Element Type Badge */}
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-md">
            <span className="text-sm font-medium text-gray-500">Type:</span>
            <span className="text-sm text-gray-900">{config?.label}</span>
          </div>

          {/* Label (for input elements) */}
          {config?.category === "input" && (
            <div className="space-y-2">
              <Label htmlFor="label">Label</Label>
              <Input
                id="label"
                value={element.label || ""}
                onChange={(e) => updateElement({ label: e.target.value })}
                placeholder="Enter label..."
              />
            </div>
          )}

          {/* Content (for text/title elements) */}
          {(element.type === "text" || element.type === "title") && (
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <textarea
                id="content"
                value={element.content || ""}
                onChange={(e) => updateElement({ content: e.target.value })}
                placeholder="Enter content..."
                className="w-full px-3 py-2 border rounded-md text-sm resize-none h-24"
              />
            </div>
          )}

          {/* Placeholder */}
          {["textInput", "largeTextInput", "email", "phone", "number", "location"].includes(element.type) && (
            <div className="space-y-2">
              <Label htmlFor="placeholder">Placeholder</Label>
              <Input
                id="placeholder"
                value={element.placeholder || ""}
                onChange={(e) => updateElement({ placeholder: e.target.value })}
                placeholder="Enter placeholder..."
              />
            </div>
          )}

          {/* Options (for select elements) */}
          {["dropdown", "singleSelect", "multipleSelect"].includes(element.type) && (
            <div className="space-y-2">
              <Label>Options</Label>
              <div className="space-y-2">
                {(element.options || []).map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      value={opt}
                      onChange={(e) => {
                        const newOptions = [...(element.options || [])];
                        newOptions[i] = e.target.value;
                        updateElement({ options: newOptions });
                      }}
                      placeholder={`Option ${i + 1}`}
                    />
                    <button
                      onClick={() => {
                        const newOptions = (element.options || []).filter((_, j) => j !== i);
                        updateElement({ options: newOptions });
                      }}
                      className="p-2 text-gray-400 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newOptions = [...(element.options || []), `Option ${(element.options?.length || 0) + 1}`];
                    updateElement({ options: newOptions });
                  }}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Option
                </Button>
              </div>
            </div>
          )}

          {/* Column Count */}
          {element.type === "column" && (
            <div className="space-y-2">
              <Label htmlFor="columnCount">Number of Columns</Label>
              <select
                id="columnCount"
                value={element.columnCount || 2}
                onChange={(e) => updateElement({ columnCount: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value={2}>2 Columns</option>
                <option value={3}>3 Columns</option>
                <option value={4}>4 Columns</option>
              </select>
            </div>
          )}

          {/* Text Size (for title) */}
          {element.type === "title" && (
            <div className="space-y-2">
              <Label htmlFor="size">Size</Label>
              <select
                id="size"
                value={element.size || "lg"}
                onChange={(e) => updateElement({ size: e.target.value as "sm" | "md" | "lg" })}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="sm">Small</option>
                <option value="md">Medium</option>
                <option value="lg">Large</option>
              </select>
            </div>
          )}

          {/* Required Toggle */}
          {config?.category === "input" && (
            <div className="flex items-center justify-between py-2">
              <Label htmlFor="required" className="cursor-pointer">Required</Label>
              <button
                id="required"
                onClick={() => updateElement({ required: !element.required })}
                className={`relative w-10 h-6 rounded-full transition-colors ${
                  element.required ? "bg-blue-600" : "bg-gray-200"
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    element.required ? "translate-x-4" : ""
                  }`}
                />
              </button>
            </div>
          )}

          {/* Width */}
          <div className="space-y-2">
            <Label htmlFor="width">Width</Label>
            <select
              id="width"
              value={element.width || "full"}
              onChange={(e) => updateElement({ width: e.target.value as "full" | "half" | "third" })}
              className="w-full px-3 py-2 border rounded-md text-sm"
            >
              <option value="full">Full Width</option>
              <option value="half">Half Width</option>
              <option value="third">One Third</option>
            </select>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

// Main Form Builder Component
export function FormBuilder({ elements, onChange }: FormBuilderProps) {
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const selectedElement = elements.find((el) => el.id === selectedElementId);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = elements.findIndex((el) => el.id === active.id);
      const newIndex = elements.findIndex((el) => el.id === over.id);

      const newElements = arrayMove(elements, oldIndex, newIndex).map((el, i) => ({
        ...el,
        order: i,
      }));

      onChange(newElements);
    }
  };

  const addElement = useCallback(
    (type: FormElementType) => {
      const newElement = createFormElement(type, elements.length);
      onChange([...elements, newElement]);
      setSelectedElementId(newElement.id);
    },
    [elements, onChange]
  );

  const deleteElement = useCallback(
    (id: string) => {
      onChange(elements.filter((el) => el.id !== id).map((el, i) => ({ ...el, order: i })));
      if (selectedElementId === id) {
        setSelectedElementId(null);
      }
    },
    [elements, onChange, selectedElementId]
  );

  const updateElement = useCallback(
    (updated: FormElement) => {
      onChange(elements.map((el) => (el.id === updated.id ? updated : el)));
    },
    [elements, onChange]
  );

  // Group element types by category
  const layoutElements = ELEMENT_TYPES.filter((t) => t.category === "layout");
  const contentElements = ELEMENT_TYPES.filter((t) => t.category === "content");
  const inputElements = ELEMENT_TYPES.filter((t) => t.category === "input");

  return (
    <div className="flex h-full">
      {/* Left Sidebar - Element Palette */}
      <div className="w-64 border-r bg-gray-50 flex flex-col">
        <div className="p-4 border-b bg-white">
          <h3 className="font-medium text-gray-900">Form Elements</h3>
          <p className="text-sm text-gray-500 mt-1">Click to add elements</p>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-4">
            {/* Layout */}
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
                Layout
              </h4>
              <div className="space-y-1">
                {layoutElements.map((type) => (
                  <DraggableElementType
                    key={type.type}
                    type={type.type}
                    label={type.label}
                    icon={type.icon}
                    onClick={() => addElement(type.type)}
                  />
                ))}
              </div>
            </div>

            {/* Content */}
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
                Content
              </h4>
              <div className="space-y-1">
                {contentElements.map((type) => (
                  <DraggableElementType
                    key={type.type}
                    type={type.type}
                    label={type.label}
                    icon={type.icon}
                    onClick={() => addElement(type.type)}
                  />
                ))}
              </div>
            </div>

            {/* Input Fields */}
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
                Input Fields
              </h4>
              <div className="space-y-1">
                {inputElements.map((type) => (
                  <DraggableElementType
                    key={type.type}
                    type={type.type}
                    label={type.label}
                    icon={type.icon}
                    onClick={() => addElement(type.type)}
                  />
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Center - Form Canvas */}
      <div className="flex-1 bg-gray-100 overflow-hidden flex flex-col">
        <div className="p-4 bg-white border-b">
          <h3 className="font-medium text-gray-900">Form Canvas</h3>
          <p className="text-sm text-gray-500 mt-1">
            Drag to reorder elements, click to edit
          </p>
        </div>
        <ScrollArea className="flex-1 p-6">
          <div className="max-w-2xl mx-auto">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={elements.map((el) => el.id)}
                strategy={verticalListSortingStrategy}
              >
                {elements.length === 0 ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center bg-white">
                    <Plus className="h-8 w-8 mx-auto text-gray-400 mb-3" />
                    <h4 className="font-medium text-gray-700 mb-1">No elements yet</h4>
                    <p className="text-sm text-gray-500">
                      Click elements from the left sidebar to add them to your form
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {elements.map((element) => (
                      <SortableFormElement
                        key={element.id}
                        element={element}
                        isSelected={selectedElementId === element.id}
                        onSelect={() => setSelectedElementId(element.id)}
                        onDelete={() => deleteElement(element.id)}
                      />
                    ))}
                  </div>
                )}
              </SortableContext>
              <DragOverlay>
                {activeId ? (
                  <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-lg opacity-80">
                    <FormElementPreview
                      element={elements.find((el) => el.id === activeId)!}
                    />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        </ScrollArea>
      </div>

      {/* Right Sidebar - Properties Panel */}
      <div className="w-72 border-l bg-white">
        {selectedElement ? (
          <ElementPropertiesPanel
            element={selectedElement}
            onChange={updateElement}
            onClose={() => setSelectedElementId(null)}
          />
        ) : (
          <div className="h-full flex items-center justify-center p-4">
            <div className="text-center">
              <Settings className="h-8 w-8 mx-auto text-gray-300 mb-3" />
              <h4 className="font-medium text-gray-500">No element selected</h4>
              <p className="text-sm text-gray-400 mt-1">
                Click an element to edit its properties
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
