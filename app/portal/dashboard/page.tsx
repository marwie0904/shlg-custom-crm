"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePortalAuth } from "../layout";
import {
  User,
  Briefcase,
  AlertCircle,
  FileText,
  Download,
  Trash2,
  RefreshCw,
  Upload,
  LogOut,
  CheckCircle,
  Clock,
  X,
} from "lucide-react";

interface Document {
  id: string;
  title: string;
  dateUploaded: string;
  size: string;
  status: "uploaded" | "pending";
}

interface RequiredDocument {
  id: string;
  title: string;
  description: string;
  uploaded: boolean;
}

export default function PortalDashboardPage() {
  const router = useRouter();
  const { authState, logout } = usePortalAuth();
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: "1",
      title: "Driver's License",
      dateUploaded: "January 10, 2025",
      size: "1.2 MB",
      status: "uploaded",
    },
    {
      id: "2",
      title: "Proof of Income - Pay Stub",
      dateUploaded: "January 8, 2025",
      size: "856 KB",
      status: "uploaded",
    },
    {
      id: "3",
      title: "Bank Statement - December 2024",
      dateUploaded: "January 5, 2025",
      size: "2.1 MB",
      status: "uploaded",
    },
    {
      id: "4",
      title: "Employment Verification Letter",
      dateUploaded: "December 28, 2024",
      size: "524 KB",
      status: "uploaded",
    },
  ]);

  const [requiredDocuments] = useState<RequiredDocument[]>([
    {
      id: "r1",
      title: "Tax Returns (2023)",
      description: "Complete federal tax return for the year 2023",
      uploaded: false,
    },
    {
      id: "r2",
      title: "Utility Bill",
      description: "Recent utility bill showing current address",
      uploaded: false,
    },
  ]);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (!authState.isAuthenticated || !authState.is2FAVerified) {
      router.push("/portal/login");
    }
  }, [authState, router]);

  const handleLogout = () => {
    logout();
    router.push("/portal/login");
  };

  const handleDelete = (id: string) => {
    setDocuments(documents.filter((doc) => doc.id !== id));
    setDeleteConfirm(null);
  };

  const handleUpload = (forRequired?: string) => {
    setUploadingFor(forRequired || null);
    setShowUploadModal(true);
  };

  const handleFileSelect = () => {
    // Mock file upload
    const newDoc: Document = {
      id: Date.now().toString(),
      title: uploadingFor || "New Document",
      dateUploaded: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      size: "1.5 MB",
      status: "uploaded",
    };
    setDocuments([newDoc, ...documents]);
    setShowUploadModal(false);
    setUploadingFor(null);
  };

  if (!authState.clientData) {
    return null;
  }

  const pendingRequirements = requiredDocuments.filter((r) => !r.uploaded);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Client Portal</h1>
            <p className="text-sm text-gray-500">Safe Harbor Law Firm</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Client Info Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Client Name</p>
                <p className="text-lg font-semibold text-gray-900">
                  {authState.clientData.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <Briefcase className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Responsible Attorney</p>
                <p className="text-lg font-semibold text-gray-900">
                  {authState.clientData.responsibleAttorney}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Required Documents Banner */}
        {pendingRequirements.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-amber-800 mb-2">
                  Required Documents
                </h2>
                <p className="text-amber-700 mb-4">
                  Please upload the following documents to proceed with your case:
                </p>
                <div className="space-y-3">
                  {pendingRequirements.map((req) => (
                    <div
                      key={req.id}
                      className="flex items-center justify-between bg-white rounded-lg p-4 border border-amber-200"
                    >
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-amber-500" />
                        <div>
                          <p className="font-medium text-gray-900">{req.title}</p>
                          <p className="text-sm text-gray-500">{req.description}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleUpload(req.title)}
                        className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium"
                      >
                        <Upload className="h-4 w-4" />
                        Upload
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Documents List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Your Documents</h2>
              <p className="text-sm text-gray-500 mt-1">
                {documents.length} document{documents.length !== 1 ? "s" : ""} uploaded
              </p>
            </div>
            <button
              onClick={() => handleUpload()}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Upload className="h-4 w-4" />
              Upload Document
            </button>
          </div>

          {documents.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No documents uploaded yet</p>
              <button
                onClick={() => handleUpload()}
                className="mt-4 text-blue-600 hover:underline text-sm"
              >
                Upload your first document
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{doc.title}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-sm text-gray-500">
                            {doc.dateUploaded}
                          </span>
                          <span className="text-gray-300">•</span>
                          <span className="text-sm text-gray-500">{doc.size}</span>
                          <span className="text-gray-300">•</span>
                          <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                            <CheckCircle className="h-3 w-3" />
                            Uploaded
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Download"
                      >
                        <Download className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleUpload(doc.title)}
                        className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Replace"
                      >
                        <RefreshCw className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(doc.id)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* Delete Confirmation */}
                  {deleteConfirm === doc.id && (
                    <div className="mt-3 p-3 bg-red-50 rounded-lg flex items-center justify-between">
                      <p className="text-sm text-red-700">
                        Are you sure you want to delete this document?
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="px-3 py-1.5 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="px-3 py-1.5 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {uploadingFor ? `Upload ${uploadingFor}` : "Upload Document"}
              </h3>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadingFor(null);
                }}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors cursor-pointer">
              <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-2">
                Drag and drop your file here, or click to browse
              </p>
              <p className="text-sm text-gray-400">
                PDF, DOC, DOCX, JPG, PNG up to 10MB
              </p>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadingFor(null);
                }}
                className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleFileSelect}
                className="flex-1 px-4 py-2.5 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Upload File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
