// Form element types for the drag-and-drop form builder

export type FormElementType =
  | "text" // Static text content
  | "title" // Section title/header
  | "separator" // Horizontal line divider
  | "column" // Column layout container
  | "dropdown" // Dropdown select
  | "textInput" // Single-line text input
  | "largeTextInput" // Multi-line textarea
  | "singleSelect" // Radio button group
  | "multipleSelect" // Checkbox group
  | "date" // Date picker
  | "location" // Address/location input
  | "email" // Email input
  | "phone" // Phone number input
  | "number" // Number input
  | "checkbox" // Single checkbox
  | "signature" // Signature capture
  | "fileUpload"; // File upload

export interface FormElement {
  id: string;
  type: FormElementType;
  label?: string;
  placeholder?: string;
  content?: string; // For text/title elements
  required?: boolean;
  options?: string[]; // For dropdown/select fields
  width?: "full" | "half" | "third";
  order: number;

  // Column-specific fields
  columnCount?: number; // Number of columns (2, 3, 4)
  children?: string[]; // Child element IDs for columns
  parentId?: string; // Parent column ID
  columnIndex?: number; // Which column this element belongs to (0, 1, 2, etc.)

  // Validation
  minLength?: number;
  maxLength?: number;
  pattern?: string; // Regex pattern for validation

  // Styling
  size?: "sm" | "md" | "lg"; // For text sizes
  alignment?: "left" | "center" | "right";
}

export interface FormTemplate {
  _id?: string;
  title: string;
  description?: string;
  elements: FormElement[];
  isPublic: boolean;
  publicSlug?: string;
  submitButtonText?: string;
  confirmationMessage?: string;
  redirectUrl?: string;
  notifyOnSubmission?: boolean;
  notificationEmails?: string[];
  status: "draft" | "active" | "archived";
  submissionCount?: number;
  lastSubmissionAt?: number;
  createdByUserId?: string;
  createdByName?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ElementTypeConfig {
  type: FormElementType;
  label: string;
  icon: string; // Lucide icon name
  category: "layout" | "input" | "content";
  description: string;
  defaultProps?: Partial<FormElement>;
}

// Configuration for all available element types
export const ELEMENT_TYPES: ElementTypeConfig[] = [
  // Layout Elements
  {
    type: "column",
    label: "Columns",
    icon: "Columns",
    category: "layout",
    description: "Create multi-column layouts",
    defaultProps: { columnCount: 2, children: [] },
  },
  {
    type: "separator",
    label: "Separator",
    icon: "Minus",
    category: "layout",
    description: "Horizontal line divider",
  },

  // Content Elements
  {
    type: "title",
    label: "Title",
    icon: "Heading",
    category: "content",
    description: "Section heading",
    defaultProps: { content: "Section Title", size: "lg" },
  },
  {
    type: "text",
    label: "Text",
    icon: "Type",
    category: "content",
    description: "Static text content",
    defaultProps: { content: "Enter your text here..." },
  },

  // Input Elements
  {
    type: "textInput",
    label: "Text Input",
    icon: "TextCursor",
    category: "input",
    description: "Single-line text field",
    defaultProps: { label: "Text Input", placeholder: "Enter text..." },
  },
  {
    type: "largeTextInput",
    label: "Large Text",
    icon: "AlignLeft",
    category: "input",
    description: "Multi-line text area",
    defaultProps: { label: "Description", placeholder: "Enter details..." },
  },
  {
    type: "email",
    label: "Email",
    icon: "Mail",
    category: "input",
    description: "Email address input",
    defaultProps: { label: "Email", placeholder: "email@example.com" },
  },
  {
    type: "phone",
    label: "Phone",
    icon: "Phone",
    category: "input",
    description: "Phone number input",
    defaultProps: { label: "Phone", placeholder: "(555) 555-5555" },
  },
  {
    type: "number",
    label: "Number",
    icon: "Hash",
    category: "input",
    description: "Numeric input field",
    defaultProps: { label: "Number", placeholder: "0" },
  },
  {
    type: "date",
    label: "Date",
    icon: "Calendar",
    category: "input",
    description: "Date picker",
    defaultProps: { label: "Date" },
  },
  {
    type: "dropdown",
    label: "Dropdown",
    icon: "ChevronDown",
    category: "input",
    description: "Dropdown select menu",
    defaultProps: { label: "Select Option", options: ["Option 1", "Option 2", "Option 3"] },
  },
  {
    type: "singleSelect",
    label: "Single Select",
    icon: "Circle",
    category: "input",
    description: "Radio button group",
    defaultProps: { label: "Choose One", options: ["Option 1", "Option 2", "Option 3"] },
  },
  {
    type: "multipleSelect",
    label: "Multiple Select",
    icon: "CheckSquare",
    category: "input",
    description: "Checkbox group",
    defaultProps: { label: "Select All That Apply", options: ["Option 1", "Option 2", "Option 3"] },
  },
  {
    type: "checkbox",
    label: "Checkbox",
    icon: "Square",
    category: "input",
    description: "Single checkbox",
    defaultProps: { label: "I agree to the terms and conditions" },
  },
  {
    type: "location",
    label: "Location",
    icon: "MapPin",
    category: "input",
    description: "Address/location input",
    defaultProps: { label: "Address", placeholder: "Enter address..." },
  },
  {
    type: "fileUpload",
    label: "File Upload",
    icon: "Upload",
    category: "input",
    description: "File upload field",
    defaultProps: { label: "Upload File" },
  },
  {
    type: "signature",
    label: "Signature",
    icon: "PenTool",
    category: "input",
    description: "Signature capture",
    defaultProps: { label: "Signature" },
  },
];

// Helper to generate a unique ID
export function generateElementId(): string {
  return `el_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Helper to create a new element from type
export function createFormElement(type: FormElementType, order: number): FormElement {
  const config = ELEMENT_TYPES.find((t) => t.type === type);
  return {
    id: generateElementId(),
    type,
    order,
    ...config?.defaultProps,
  };
}
