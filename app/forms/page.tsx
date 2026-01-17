"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  Eye,
  Copy,
  Trash2,
  Globe,
  Link,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { PrepareFormModal } from "@/components/forms/PrepareFormModal";
import type { Id } from "@/convex/_generated/dataModel";

type TabType = "pending" | "submitted" | "templates";

// Mock data for pending forms
interface PendingForm {
  id: string;
  dueDate: number;
  formTitle: string;
  contactName: string;
  matterName: string;
}

// Mock data for submitted forms
interface SubmittedForm {
  id: string;
  submittedDate: number;
  formTitle: string;
  contactName: string;
  matterName: string;
}

// Mock data for form templates
interface FormTemplate {
  id: string;
  title: string;
  isPublic: boolean;
  publicLink?: string;
  createdAt: number;
  updatedAt: number;
}

// Sample data for demonstration
const mockPendingForms: PendingForm[] = [
  {
    id: "1",
    dueDate: Date.now() + 86400000 * 3,
    formTitle: "Client Intake Form",
    contactName: "John Smith",
    matterName: "Estate Planning",
  },
  {
    id: "2",
    dueDate: Date.now() + 86400000 * 7,
    formTitle: "Document Checklist",
    contactName: "Jane Doe",
    matterName: "Business Formation",
  },
  {
    id: "3",
    dueDate: Date.now() + 86400000,
    formTitle: "Financial Disclosure",
    contactName: "Robert Johnson",
    matterName: "Divorce Proceedings",
  },
];

const mockSubmittedForms: SubmittedForm[] = [
  {
    id: "1",
    submittedDate: Date.now() - 86400000 * 2,
    formTitle: "Client Intake Form",
    contactName: "Alice Williams",
    matterName: "Real Estate Purchase",
  },
  {
    id: "2",
    submittedDate: Date.now() - 86400000 * 5,
    formTitle: "Tax Information",
    contactName: "Michael Brown",
    matterName: "Tax Planning",
  },
];

const mockFormTemplates: FormTemplate[] = [
  {
    id: "1",
    title: "Client Intake Form",
    isPublic: true,
    publicLink: "https://forms.example.com/intake",
    createdAt: Date.now() - 86400000 * 30,
    updatedAt: Date.now() - 86400000 * 5,
  },
  {
    id: "2",
    title: "Document Checklist",
    isPublic: false,
    createdAt: Date.now() - 86400000 * 20,
    updatedAt: Date.now() - 86400000 * 10,
  },
  {
    id: "3",
    title: "Financial Disclosure",
    isPublic: true,
    publicLink: "https://forms.example.com/financial",
    createdAt: Date.now() - 86400000 * 15,
    updatedAt: Date.now() - 86400000 * 2,
  },
  {
    id: "4",
    title: "Witness Statement",
    isPublic: false,
    createdAt: Date.now() - 86400000 * 10,
    updatedAt: Date.now() - 86400000 * 1,
  },
];

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function PendingFormsTable({ forms }: { forms: PendingForm[] }) {
  return (
    <div className="rounded-lg border bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50/50">
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                Due
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                Form
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                Contact
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                Matter
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {forms.map((form) => (
              <tr
                key={form.id}
                className="hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <td className="px-4 py-3 text-sm text-gray-600">
                  {formatDate(form.dueDate)}
                </td>
                <td className="px-4 py-3">
                  <span className="font-medium text-gray-900">
                    {form.formTitle}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {form.contactName}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {form.matterName}
                </td>
                <td className="px-4 py-3">
                  <Button variant="ghost" size="icon-sm">
                    <MoreHorizontal className="h-4 w-4 text-gray-400" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {forms.length === 0 && (
        <div className="px-4 py-12 text-center">
          <p className="text-sm text-gray-500">No pending forms</p>
        </div>
      )}
    </div>
  );
}

function SubmittedFormsTable({ forms }: { forms: SubmittedForm[] }) {
  return (
    <div className="rounded-lg border bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50/50">
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                Submitted
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                Form
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                Contact
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                Matter
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {forms.map((form) => (
              <tr
                key={form.id}
                className="hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <td className="px-4 py-3 text-sm text-gray-600">
                  {formatDate(form.submittedDate)}
                </td>
                <td className="px-4 py-3">
                  <span className="font-medium text-gray-900">
                    {form.formTitle}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {form.contactName}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {form.matterName}
                </td>
                <td className="px-4 py-3">
                  <Button variant="ghost" size="icon-sm">
                    <MoreHorizontal className="h-4 w-4 text-gray-400" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {forms.length === 0 && (
        <div className="px-4 py-12 text-center">
          <p className="text-sm text-gray-500">No submitted forms</p>
        </div>
      )}
    </div>
  );
}

function TemplatesTable({
  templates,
  searchQuery,
  onSearchChange,
}: {
  templates: FormTemplate[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
}) {
  const handleViewPreview = (template: FormTemplate) => {
    toast.info(`Previewing "${template.title}"`);
  };

  const handleDuplicate = (template: FormTemplate) => {
    toast.success(`Duplicated "${template.title}"`);
  };

  const handleDelete = (template: FormTemplate) => {
    toast.success(`Deleted "${template.title}"`);
  };

  const handleTogglePublic = (template: FormTemplate) => {
    const newStatus = !template.isPublic;
    toast.success(
      `Form "${template.title}" is now ${newStatus ? "public" : "private"}`
    );
  };

  const handleCopyLink = (template: FormTemplate) => {
    if (template.publicLink) {
      navigator.clipboard.writeText(template.publicLink);
      toast.success("Link copied to clipboard");
    } else {
      toast.error("No public link available");
    }
  };

  const handleOpenPublicForm = (template: FormTemplate) => {
    if (template.publicLink) {
      window.open(template.publicLink, "_blank");
    } else {
      toast.error("No public link available");
    }
  };

  const handleEdit = (template: FormTemplate) => {
    toast.info(`Editing "${template.title}"`);
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative w-80">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search form templates..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Templates Table */}
      <div className="rounded-lg border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50/50">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                  Title
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                  Edit
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {templates.map((template) => (
                <tr
                  key={template.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900">
                      {template.title}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleEdit(template)}
                    >
                      <Pencil className="h-4 w-4 text-gray-500" />
                    </Button>
                  </td>
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <MoreHorizontal className="h-4 w-4 text-gray-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleViewPreview(template)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDuplicate(template)}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(template)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleTogglePublic(template)}
                        >
                          <Globe className="mr-2 h-4 w-4" />
                          Form is Public: {template.isPublic ? "Yes" : "No"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleCopyLink(template)}
                          disabled={!template.isPublic}
                        >
                          <Link className="mr-2 h-4 w-4" />
                          Copy Link to Public Form
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleOpenPublicForm(template)}
                          disabled={!template.isPublic}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Open Public Form in New Window
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {templates.length === 0 && (
          <div className="px-4 py-12 text-center">
            <p className="text-sm text-gray-500">
              {searchQuery
                ? "No templates found matching your search"
                : "No form templates yet"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function FormsPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="rounded-lg border bg-white shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50/50">
              <th className="px-4 py-3">
                <Skeleton className="h-4 w-16" />
              </th>
              <th className="px-4 py-3">
                <Skeleton className="h-4 w-20" />
              </th>
              <th className="px-4 py-3">
                <Skeleton className="h-4 w-20" />
              </th>
              <th className="px-4 py-3">
                <Skeleton className="h-4 w-20" />
              </th>
              <th className="px-4 py-3">
                <Skeleton className="h-4 w-4" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {[...Array(5)].map((_, i) => (
              <tr key={i}>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-24" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-32" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-28" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-28" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-4" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function FormsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("pending");
  const [templateSearchQuery, setTemplateSearchQuery] = useState("");
  const [isPrepareFormOpen, setIsPrepareFormOpen] = useState(false);

  // Fetch templates from Convex
  const templatesData = useQuery(api.formTemplates.list, { limit: 100 });
  const pendingAssignments = useQuery(api.formAssignments.getPendingWithRelated, { limit: 100 });
  const submittedData = useQuery(api.formSubmissions.listWithRelated, { status: "pending", limit: 100 });

  // Mutations
  const duplicateTemplate = useMutation(api.formTemplates.duplicate);
  const deleteTemplate = useMutation(api.formTemplates.remove);
  const togglePublic = useMutation(api.formTemplates.togglePublic);

  // Convert Convex templates to display format
  const templates: FormTemplate[] = useMemo(() => {
    if (!templatesData) return mockFormTemplates;
    return templatesData.map((t) => ({
      id: t._id,
      title: t.title,
      isPublic: t.isPublic,
      publicLink: t.publicSlug ? `${window.location.origin}/f/${t.publicSlug}` : undefined,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));
  }, [templatesData]);

  // Convert pending assignments to pending forms
  const pendingForms: PendingForm[] = useMemo(() => {
    if (!pendingAssignments) return mockPendingForms;
    return pendingAssignments.map((a) => ({
      id: a._id,
      dueDate: a.dueDate || a.createdAt,
      formTitle: a.templateTitle,
      contactName: a.contactName,
      matterName: a.opportunityTitle || "No matter",
    }));
  }, [pendingAssignments]);

  // Convert submitted data
  const submittedForms: SubmittedForm[] = useMemo(() => {
    if (!submittedData) return mockSubmittedForms;
    return submittedData.map((s) => ({
      id: s._id,
      submittedDate: s.submittedAt,
      formTitle: s.templateTitle,
      contactName: s.contactName || s.submitterName || "Unknown",
      matterName: s.opportunityTitle || "No matter",
    }));
  }, [submittedData]);

  // Filter templates based on search query
  const filteredTemplates = useMemo(() => {
    if (!templateSearchQuery) return templates;
    const query = templateSearchQuery.toLowerCase();
    return templates.filter((template) =>
      template.title.toLowerCase().includes(query)
    );
  }, [templates, templateSearchQuery]);

  const isLoading = templatesData === undefined;

  // Template action handlers
  const handleDuplicateTemplate = async (template: FormTemplate) => {
    try {
      await duplicateTemplate({ id: template.id as Id<"formTemplates"> });
      toast.success(`Duplicated "${template.title}"`);
    } catch {
      toast.error("Failed to duplicate template");
    }
  };

  const handleDeleteTemplate = async (template: FormTemplate) => {
    try {
      await deleteTemplate({ id: template.id as Id<"formTemplates"> });
      toast.success(`Deleted "${template.title}"`);
    } catch {
      toast.error("Failed to delete template. It may have submissions.");
    }
  };

  const handleTogglePublic = async (template: FormTemplate) => {
    try {
      const result = await togglePublic({ id: template.id as Id<"formTemplates"> });
      toast.success(
        `Form "${template.title}" is now ${result.isPublic ? "public" : "private"}`
      );
    } catch {
      toast.error("Failed to update form visibility");
    }
  };

  const handleCopyLink = (template: FormTemplate) => {
    if (template.publicLink) {
      navigator.clipboard.writeText(template.publicLink);
      toast.success("Link copied to clipboard");
    } else {
      toast.error("No public link available");
    }
  };

  const handleEditTemplate = (template: FormTemplate) => {
    router.push(`/forms/${template.id}/edit`);
  };

  if (isLoading) {
    return <FormsPageSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Forms</h1>
      </div>

      {/* Tabs and Prepare Form Button */}
      <div className="flex items-center justify-between">
        {/* Tabs */}
        <div className="flex items-center gap-1 border-b">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-2 text-sm font-medium transition-colors relative ${
              activeTab === "pending"
                ? "text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Pending
            {activeTab === "pending" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("submitted")}
            className={`px-4 py-2 text-sm font-medium transition-colors relative ${
              activeTab === "submitted"
                ? "text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Submitted
            {activeTab === "submitted" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("templates")}
            className={`px-4 py-2 text-sm font-medium transition-colors relative ${
              activeTab === "templates"
                ? "text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Templates
            {activeTab === "templates" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />
            )}
          </button>
        </div>

        {/* Action Button - changes based on active tab */}
        {activeTab === "templates" ? (
          <Button onClick={() => router.push("/forms/new")}>
            <Plus className="h-4 w-4" />
            New Template
          </Button>
        ) : (
          <Button onClick={() => setIsPrepareFormOpen(true)}>
            <Plus className="h-4 w-4" />
            Prepare Form
          </Button>
        )}
      </div>

      {/* Prepare Form Modal */}
      <PrepareFormModal
        open={isPrepareFormOpen}
        onOpenChange={setIsPrepareFormOpen}
      />

      {/* Tab Content */}
      {activeTab === "pending" && (
        <>
          <PendingFormsTable forms={pendingForms} />
          <div className="text-sm text-gray-500">
            Showing {pendingForms.length} pending forms
          </div>
        </>
      )}

      {activeTab === "submitted" && (
        <>
          <SubmittedFormsTable forms={submittedForms} />
          <div className="text-sm text-gray-500">
            Showing {submittedForms.length} submitted forms
          </div>
        </>
      )}

      {activeTab === "templates" && (
        <>
          <TemplatesTableConvex
            templates={filteredTemplates}
            searchQuery={templateSearchQuery}
            onSearchChange={setTemplateSearchQuery}
            onEdit={handleEditTemplate}
            onDuplicate={handleDuplicateTemplate}
            onDelete={handleDeleteTemplate}
            onTogglePublic={handleTogglePublic}
            onCopyLink={handleCopyLink}
          />
          <div className="text-sm text-gray-500">
            Showing {filteredTemplates.length} of {templates.length}{" "}
            templates
          </div>
        </>
      )}
    </div>
  );
}

// Updated Templates Table with Convex handlers
function TemplatesTableConvex({
  templates,
  searchQuery,
  onSearchChange,
  onEdit,
  onDuplicate,
  onDelete,
  onTogglePublic,
  onCopyLink,
}: {
  templates: FormTemplate[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onEdit: (template: FormTemplate) => void;
  onDuplicate: (template: FormTemplate) => void;
  onDelete: (template: FormTemplate) => void;
  onTogglePublic: (template: FormTemplate) => void;
  onCopyLink: (template: FormTemplate) => void;
}) {
  const handleViewPreview = (template: FormTemplate) => {
    toast.info(`Previewing "${template.title}"`);
  };

  const handleOpenPublicForm = (template: FormTemplate) => {
    if (template.publicLink) {
      window.open(template.publicLink, "_blank");
    } else {
      toast.error("No public link available");
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative w-80">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search form templates..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Templates Table */}
      <div className="rounded-lg border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50/50">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                  Title
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                  Edit
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {templates.map((template) => (
                <tr
                  key={template.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {template.title}
                      </span>
                      {template.isPublic && (
                        <Globe className="h-3.5 w-3.5 text-green-500" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onEdit(template)}
                    >
                      <Pencil className="h-4 w-4 text-gray-500" />
                    </Button>
                  </td>
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <MoreHorizontal className="h-4 w-4 text-gray-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleViewPreview(template)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDuplicate(template)}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDelete(template)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onTogglePublic(template)}
                        >
                          <Globe className="mr-2 h-4 w-4" />
                          Form is Public: {template.isPublic ? "Yes" : "No"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onCopyLink(template)}
                          disabled={!template.isPublic}
                        >
                          <Link className="mr-2 h-4 w-4" />
                          Copy Link to Public Form
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleOpenPublicForm(template)}
                          disabled={!template.isPublic}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Open Public Form in New Window
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {templates.length === 0 && (
          <div className="px-4 py-12 text-center">
            <p className="text-sm text-gray-500">
              {searchQuery
                ? "No templates found matching your search"
                : "No form templates yet"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
