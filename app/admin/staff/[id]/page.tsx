"use client";

import { useState, useEffect } from "react";
import React from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  CreditCard, 
  FileText, 
  Calendar,
  Save,
  Edit2,
  X,
  Upload,
  Camera,
  Shield,
  Award,
  DollarSign,
  Briefcase,
  FileCheck,
  RefreshCw,
  Trash2,
  Download,
  Eye,
  FileUp,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

// Add type definitions
interface PageProps {
  params: Promise<{ id: string }>;
}

interface StaffDocument {
  type: string;
  name: string;
  url: string;
  uploaded_at: string;
  file_name: string;
  file_size: number;
  mime_type: string;
}

interface StaffData {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  aadhaar: string;
  aadhaar_url: string;
  pan_url: string;
  profile_picture: string;
  department: string;
  designation: string;
  salary: number;
  joined_at: string;
  employee_id: string;
  status: string;
  hr_policy: string;
  documents: StaffDocument[];
  [key: string]: any;
}

// Component for editable fields
function EditableField({ 
  label, 
  value, 
  icon: Icon, 
  onSave, 
  type = "text",
  placeholder = "",
  required = false,
  prefix = "",
  saving = false
}: {
  label: string;
  value: string;
  icon: any;
  onSave: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  prefix?: string;
  saving?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value || "");

  useEffect(() => {
    setTempValue(value || "");
  }, [value]);

  const handleSave = () => {
    if (tempValue !== value) {
      onSave(tempValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempValue(value || "");
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') handleCancel();
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
        <Icon className="w-4 h-4" />
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      
      {isEditing ? (
        <div className="space-y-2">
          <div className="relative">
            {prefix && (
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">
                {prefix}
              </span>
            )}
            <Input
              type={type}
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              onKeyDown={handleKeyPress}
              className={prefix ? "pl-8" : ""}
              placeholder={placeholder}
              disabled={saving}
              autoFocus
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              size="sm"
              disabled={saving}
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
            >
              <Save className="w-4 h-4 mr-1" />
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button
              onClick={handleCancel}
              size="sm"
              variant="outline"
              className="border-slate-300"
              disabled={saving}
            >
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
          <div className="text-slate-900">
            {prefix && <span className="mr-1">{prefix}</span>}
            {value || <span className="text-slate-400 italic">{placeholder || "Not set"}</span>}
          </div>
          <Button
            onClick={() => setIsEditing(true)}
            size="sm"
            variant="ghost"
            className="text-slate-600 hover:text-slate-900"
            disabled={saving}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

// Component for editable textareas
function EditableTextarea({ 
  label, 
  value, 
  icon: Icon, 
  onSave, 
  rows = 4,
  placeholder = "",
  saving = false
}: {
  label: string;
  value: string;
  icon: any;
  onSave: (value: string) => void;
  rows?: number;
  placeholder?: string;
  saving?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value || "");

  useEffect(() => {
    setTempValue(value || "");
  }, [value]);

  const handleSave = () => {
    if (tempValue !== value) {
      onSave(tempValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempValue(value || "");
    setIsEditing(false);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
        <Icon className="w-4 h-4" />
        {label}
      </label>
      
      {isEditing ? (
        <div className="space-y-2">
          <Textarea
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            rows={rows}
            placeholder={placeholder}
            className="min-h-[150px]"
            disabled={saving}
            autoFocus
          />
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              size="sm"
              disabled={saving}
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
            >
              <Save className="w-4 h-4 mr-1" />
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button
              onClick={handleCancel}
              size="sm"
              variant="outline"
              className="border-slate-300"
              disabled={saving}
            >
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="relative group">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 min-h-[150px] whitespace-pre-wrap hover:border-slate-300 transition-colors">
            {value || <span className="text-slate-400 italic">{placeholder || "No content"}</span>}
          </div>
          <Button
            onClick={() => setIsEditing(true)}
            size="sm"
            variant="ghost"
            className="absolute top-2 right-2 text-slate-600 hover:text-slate-900 opacity-0 group-hover:opacity-100 transition-opacity"
            disabled={saving}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

// Enhanced File Upload Component
function FileUploadField({ 
  label, 
  value, 
  preview,
  onUpload, 
  onDelete,
  accept, 
  uploading = false 
}: {
  label: string;
  value: string | null;
  preview?: string | null;
  onUpload: (file: File) => void;
  onDelete: () => void;
  accept: string;
  uploading?: boolean;
}) {
  const [fileName, setFileName] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      onUpload(file);
      e.target.value = ''; // Reset input
    }
  };

  const isImage = accept.includes("image");

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <div className={`border-2 ${value ? 'border-green-200' : 'border-slate-300'} border-dashed rounded-lg p-4 transition-all duration-300 hover:border-blue-400`}>
        {value ? (
          <div className="space-y-3">
            {isImage && preview ? (
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded overflow-hidden border">
                  <img 
                    src={preview} 
                    alt={label}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error("Failed to load image in preview:", preview);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-slate-900">Uploaded</div>
                  <div className="flex gap-2 mt-2">
                    <a
                      href={value}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      View
                    </a>
                    <button
                      onClick={onDelete}
                      className="text-sm text-red-600 hover:underline inline-flex items-center gap-1"
                      disabled={uploading}
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-6 h-6 text-green-600" />
                  <div className="text-left">
                    <div className="font-medium text-slate-900">Document Uploaded</div>
                    <a
                      href={value}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      View Document
                    </a>
                  </div>
                </div>
                <button
                  onClick={onDelete}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Delete Document"
                  disabled={uploading}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <div>
              <p className="text-sm text-slate-600 mb-1">No file uploaded</p>
              <p className="text-xs text-slate-500">Click to upload {label.toLowerCase()}</p>
            </div>
          </div>
        )}
        
        <div className="mt-4">
          <label className={`inline-flex items-center gap-2 px-4 py-2 ${uploading ? 'bg-slate-100 cursor-not-allowed' : 'bg-slate-100 hover:bg-slate-200'} text-slate-700 rounded-lg ${uploading ? 'cursor-not-allowed' : 'cursor-pointer'} transition-colors`}>
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                {value ? "Replace File" : "Upload File"}
              </>
            )}
            <input
              type="file"
              className="hidden"
              accept={accept}
              onChange={handleFileChange}
              disabled={uploading}
            />
          </label>
          {fileName && !uploading && (
            <p className="text-xs text-slate-500 mt-2 truncate max-w-xs mx-auto">{fileName}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function StaffDetail({ params }: PageProps) {
  const unwrappedParams = React.use(params);
  const id = unwrappedParams.id;
  
  const [staff, setStaff] = useState<StaffData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [uploadField, setUploadField] = useState<string | null>(null);

  const load = async () => {
    console.log("Loading staff data for ID:", id);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/staff/get?id=${id}&t=${Date.now()}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Failed to fetch: ${res.status}`);
      }
      const data = await res.json();
      console.log("Received staff data:", data);
      
      // Fix Google Drive URLs to direct image URLs if needed
      const fixedData = fixGoogleDriveUrls(data);
      setStaff(fixedData);
    } catch (error: any) {
      console.error("Error loading staff:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to fix Google Drive URLs
  const fixGoogleDriveUrls = (data: any) => {
    if (!data) return data;
    
    const fixedData = { ...data };
    
    // Fix profile picture URL
    if (fixedData.profile_picture && fixedData.profile_picture.includes('drive.google.com')) {
      fixedData.profile_picture = convertGoogleDriveToDirectUrl(fixedData.profile_picture);
    }
    
    // Fix document URLs
    if (fixedData.documents) {
      fixedData.documents = fixedData.documents.map((doc: StaffDocument) => ({
        ...doc,
        url: doc.url.includes('drive.google.com') ? convertGoogleDriveToDirectUrl(doc.url) : doc.url
      }));
    }
    
    // Fix other URL fields
    const urlFields = ['aadhaar_url', 'pan_url', 'resume_url'];
    urlFields.forEach(field => {
      if (fixedData[field] && fixedData[field].includes('drive.google.com')) {
        fixedData[field] = convertGoogleDriveToDirectUrl(fixedData[field]);
      }
    });
    
    return fixedData;
  };

  // Convert Google Drive shareable link to direct download link
  const convertGoogleDriveToDirectUrl = (url: string): string => {
    try {
      // If it's already a direct URL, return as is
      if (url.includes('uc?id=') || url.includes('uc?export=download')) {
        return url;
      }
      
      // Extract file ID from Google Drive URL
      const fileIdMatch = url.match(/\/d\/([^\/]+)/) || url.match(/id=([^&]+)/);
      if (fileIdMatch && fileIdMatch[1]) {
        return `https://drive.google.com/uc?id=${fileIdMatch[1]}&export=download`;
      }
      
      return url;
    } catch (error) {
      console.error("Error converting Google Drive URL:", error);
      return url;
    }
  };

  useEffect(() => {
    if (id) {
      load();
    }
  }, [id]);

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  async function update(field: string, value: any) {
    setSaving(true);
    try {
      const res = await fetch("/api/staff/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, [field]: value }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Update failed");
      }
      
      // Optimistic update
      setStaff((prev: any) => ({ ...prev, [field]: value }));
      
      showSuccess(`${field.replace("_", " ")} updated successfully`);
      
    } catch (error: any) {
      console.error("Update failed:", error);
      setError(error.message);
      // Revert by reloading
      setTimeout(() => load(), 500);
    } finally {
      setSaving(false);
    }
  }

 const handleFileUpload = async (field: string, file: File) => {
  if (!file) return;
  
  setUploading(true);
  setUploadField(field);
  setUploadProgress(0);
  
  // Simulate upload progress
  const progressInterval = setInterval(() => {
    setUploadProgress(prev => {
      if (prev >= 90) {
        clearInterval(progressInterval);
        return 90;
      }
      return prev + 10;
    });
  }, 200);

  try {
    console.log(`Uploading ${field} directly...`, file.name, file.type, file.size);
    
    // 1. Upload directly to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${field}_${staff?.id}_${Date.now()}.${fileExt}`;
    const filePath = `staff/${staff?.id}/${field}/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('staff-documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }
    
    // 2. Get public URL
    const { data: urlData } = supabase.storage
      .from('staff-documents')
      .getPublicUrl(filePath);
    
    const publicUrl = urlData.publicUrl;
    console.log(`Uploaded to Supabase: ${publicUrl}`);
    
    clearInterval(progressInterval);
    setUploadProgress(100);
    
    // 3. Update the staff record in database
    const res = await fetch("/api/staff/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        id, 
        [field]: publicUrl,
        updated_at: new Date().toISOString()
      }),
    });
    
    const data = await res.json();
    console.log(`Database update response for ${field}:`, data);
    
    if (!res.ok) {
      throw new Error(data.error || "Database update failed");
    }
    
    // 4. Update local state
    setStaff((prev: any) => {
      if (!prev) return prev;
      
      const updatedStaff = { ...prev, [field]: publicUrl };
      
      // Update documents array if needed
      if (field.includes("_url") || field === "profile_picture") {
        const documentName = field === "profile_picture" 
          ? "Profile Picture" 
          : field.replace("_url", "").replace("_", " ").toUpperCase();
        
        const existingDocuments = prev.documents || [];
        
        // Remove existing document of same type
        const filteredDocuments = existingDocuments.filter(
          (doc: StaffDocument) => doc.type !== field
        );
        
        // Add new document
        const newDocument: StaffDocument = {
          type: field,
          name: documentName,
          url: publicUrl,
          uploaded_at: new Date().toISOString(),
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
        };
        
        updatedStaff.documents = [...filteredDocuments, newDocument];
      }
      
      return updatedStaff;
    });
    
    showSuccess(`${field.replace("_", " ")} uploaded successfully`);
    
    // Reset progress after success
    setTimeout(() => {
      setUploadProgress(0);
      setUploading(false);
      setUploadField(null);
    }, 500);
    
  } catch (error: any) {
    console.error("Upload failed:", error);
    setError(error.message);
    clearInterval(progressInterval);
    setUploadProgress(0);
    setUploading(false);
    setUploadField(null);
  }
};

  const handleDeleteDocument = async (field: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    
    try {
      const currentUrl = staff?.[field];
      
      // Call DELETE API (no auth required)
      const res = await fetch("/api/staff/upload", {
        method: "DELETE",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          staffId: id,
          field: field,
          url: currentUrl,
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Delete failed");
      }
      
      // Update staff data
      setStaff((prev: any) => {
        if (!prev) return prev;
        
        const updatedStaff = { ...prev, [field]: null };
        
        // Remove from documents array
        if (prev.documents) {
          updatedStaff.documents = prev.documents.filter(
            (doc: StaffDocument) => doc.type !== field
          );
        }
        
        return updatedStaff;
      });
      
      showSuccess("Document deleted successfully");
      
    } catch (error: any) {
      console.error("Delete failed:", error);
      setError(error.message);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "NA";
    return name
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Not set";
    try {
      return new Date(dateString).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Function to get a valid image URL
  const getProfileImageUrl = (url: string | null) => {
    if (!url) return null;
    
    // If it's already a full URL, return as is
    if (url.startsWith('http') || url.startsWith('https') || url.startsWith('/')) {
      return url;
    }
    
    // For Supabase URLs, they should already be complete
    return url;
  };

  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-600">Loading staff details...</p>
          <p className="text-sm text-slate-400">ID: {id}</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Error Loading Staff
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="flex gap-3">
              <Button onClick={load} className="flex-1">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.history.back()}
                className="flex-1"
              >
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render not found state
  if (!staff) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <User className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">Staff Not Found</h3>
            <p className="text-slate-500 mb-4">Staff member with ID {id} was not found.</p>
            <Button onClick={() => window.history.back()}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get valid profile picture URL
  const profilePictureUrl = getProfileImageUrl(staff.profile_picture);
  console.log("Profile picture URL:", profilePictureUrl);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Success Alert */}
        {successMessage && (
          <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right">
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle>Success!</AlertTitle>
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="fixed top-4 left-4 right-4 z-50 animate-in slide-in-from-top">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Staff Management</h1>
              <p className="text-slate-600 mt-2">Employee profile and details management</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={load}
                variant="outline"
                className="border-slate-300"
                disabled={loading || saving}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                {loading ? "Refreshing..." : "Refresh Data"}
              </Button>
            </div>
          </div>
        </div>

        {/* Saving Indicator */}
        {saving && (
          <div className="fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin" />
            Saving changes...
          </div>
        )}

        {/* Upload Progress Indicator */}
        {uploading && uploadField && (
          <div className="fixed top-20 right-4 bg-blue-500 text-white px-4 py-3 rounded-lg shadow-lg flex flex-col gap-2 z-50 animate-pulse max-w-xs">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Uploading {uploadField.replace("_", " ")}...</span>
            </div>
            <Progress value={uploadProgress} className="h-2 bg-white/30" />
            <span className="text-xs">{uploadProgress}%</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Profile Card */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-slate-200 shadow-lg">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  {/* Profile Picture Upload */}
                  <div className="relative">
                    <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                      <AvatarImage 
                        src={profilePictureUrl || undefined}
                        alt={staff.name || "Profile Picture"}
                        onError={(e) => {
                          console.error("Failed to load profile image:", profilePictureUrl);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <AvatarFallback className="bg-gradient-to-br from-blue-600 to-blue-400 text-white text-2xl font-bold">
                        {getInitials(staff.name || "NA")}
                      </AvatarFallback>
                    </Avatar>
                    <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors shadow-lg">
                      <Camera className="w-4 h-4" />
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileUpload("profile_picture", file);
                          }
                          e.target.value = ''; // Reset input
                        }}
                        disabled={uploading && uploadField === "profile_picture"}
                      />
                    </label>
                  </div>

                  {/* Upload Progress for Profile Picture */}
                  {uploading && uploadField === "profile_picture" && (
                    <div className="w-full">
                      <Progress value={uploadProgress} className="h-2" />
                      <p className="text-xs text-slate-500 mt-1">
                        Uploading profile picture... {uploadProgress}%
                      </p>
                    </div>
                  )}

                  {/* Staff Info */}
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{staff.name || "No Name"}</h2>
                    <div className="flex items-center justify-center gap-2 mt-1">
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                        <Briefcase className="w-3 h-3 mr-1" />
                        {staff.department || "Not assigned"}
                      </Badge>
                      <Badge className={
                        staff.status === "active" 
                          ? "bg-green-100 text-green-800 border-green-200"
                          : staff.status === "inactive"
                          ? "bg-red-100 text-red-800 border-red-200"
                          : "bg-yellow-100 text-yellow-800 border-yellow-200"
                      }>
                        {staff.status || "Unknown"}
                      </Badge>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-4 w-full">
                    <div className="bg-slate-50 rounded-lg p-3">
                      <div className="text-xs text-slate-500">Employee ID</div>
                      <div className="font-mono font-semibold text-slate-900">
                        {staff.employee_id || "EMP-" + id.substring(0, 6)}
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                      <div className="text-xs text-slate-500">Joined</div>
                      <div className="font-semibold text-slate-900">
                        {formatDate(staff.joined_at)}
                      </div>
                    </div>
                  </div>

                  {/* Document Completion */}
                  <div className="w-full">
                    <div className="flex justify-between text-sm text-slate-600 mb-1">
                      <span>Document Completion</span>
                      <span>
                        {(staff.documents?.length || 0)}/5
                      </span>
                    </div>
                    <Progress 
                      value={((staff.documents?.length || 0) / 5) * 100} 
                      className="h-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Info Card */}
            <Card className="border-slate-200 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Phone className="w-5 h-5 text-blue-600" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-700">{staff.email || "No email"}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-700">{staff.phone || "No phone"}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-700 line-clamp-2">{staff.address || "No address"}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card className="border-slate-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">Staff Information</CardTitle>
              </CardHeader>
              
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid grid-cols-4 mb-6">
                    <TabsTrigger value="personal" className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Personal
                    </TabsTrigger>
                    <TabsTrigger value="documents" className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Documents
                    </TabsTrigger>
                    <TabsTrigger value="employment" className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      Employment
                    </TabsTrigger>
                    <TabsTrigger value="hr" className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      HR & Policy
                    </TabsTrigger>
                  </TabsList>

                  {/* Personal Information Tab */}
                  <TabsContent value="personal" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <EditableField
                        label="Full Name"
                        value={staff.name}
                        icon={User}
                        onSave={(v: string) => update("name", v)}
                        required
                        saving={saving}
                      />
                      <EditableField
                        label="Email Address"
                        value={staff.email}
                        icon={Mail}
                        onSave={(v: string) => update("email", v)}
                        type="email"
                        saving={saving}
                      />
                      <EditableField
                        label="Phone Number"
                        value={staff.phone}
                        icon={Phone}
                        onSave={(v: string) => update("phone", v)}
                        type="tel"
                        saving={saving}
                      />
                      <EditableField
                        label="Aadhaar Number"
                        value={staff.aadhaar}
                        icon={CreditCard}
                        onSave={(v: string) => update("aadhaar", v)}
                        placeholder="Enter 12-digit Aadhaar"
                        saving={saving}
                      />
                    </div>
                    
                    <EditableTextarea
                      label="Address"
                      value={staff.address}
                      icon={MapPin}
                      onSave={(v: string) => update("address", v)}
                      rows={3}
                      saving={saving}
                    />
                  </TabsContent>

                  {/* Documents Tab */}
                  <TabsContent value="documents" className="space-y-6">
                    <Alert className="bg-blue-50 border-blue-200">
                      <FileUp className="h-4 w-4 text-blue-600" />
                      <AlertTitle>Upload Documents</AlertTitle>
                      <AlertDescription>
                        Upload all required documents. Files will be stored securely in Supabase.
                      </AlertDescription>
                    </Alert>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FileUploadField
                        label="Profile Picture"
                        value={staff.profile_picture}
                        onUpload={(file: File) => handleFileUpload("profile_picture", file)}
                        onDelete={() => handleDeleteDocument("profile_picture")}
                        accept="image/*"
                        uploading={uploading && uploadField === "profile_picture"}
                        preview={profilePictureUrl}
                      />
                      <FileUploadField
                        label="Aadhaar Card"
                        value={staff.aadhaar_url}
                        onUpload={(file: File) => handleFileUpload("aadhaar_url", file)}
                        onDelete={() => handleDeleteDocument("aadhaar_url")}
                        accept=".pdf,.jpg,.jpeg,.png"
                        uploading={uploading && uploadField === "aadhaar_url"}
                      />
                      <FileUploadField
                        label="PAN Card"
                        value={staff.pan_url}
                        onUpload={(file: File) => handleFileUpload("pan_url", file)}
                        onDelete={() => handleDeleteDocument("pan_url")}
                        accept=".pdf,.jpg,.jpeg,.png"
                        uploading={uploading && uploadField === "pan_url"}
                      />
                      <FileUploadField
                        label="Resume/CV"
                        value={staff.resume_url}
                        onUpload={(file: File) => handleFileUpload("resume_url", file)}
                        onDelete={() => handleDeleteDocument("resume_url")}
                        accept=".pdf,.doc,.docx"
                        uploading={uploading && uploadField === "resume_url"}
                      />
                    </div>
                    
                    {/* Additional Documents Section */}
                    <div className="mt-8">
                      <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        All Uploaded Documents
                      </h3>
                      
                      {staff.documents && staff.documents.length > 0 ? (
                        <div className="space-y-3">
                          {staff.documents.map((doc: StaffDocument, index: number) => (
                            <div 
                              key={index} 
                              className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded border">
                                  <FileText className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                  <div className="font-medium text-slate-900">{doc.name}</div>
                                  <div className="text-xs text-slate-500 flex items-center gap-2">
                                    <span>{formatFileSize(doc.file_size)}</span>
                                    <span>•</span>
                                    <span>{doc.mime_type}</span>
                                    <span>•</span>
                                    <span>{formatDate(doc.uploaded_at)}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <a
                                  href={doc.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                                  title="View Document"
                                >
                                  <Eye className="w-4 h-4" />
                                </a>
                                <a
                                  href={doc.url}
                                  download
                                  className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                                  title="Download Document"
                                >
                                  <Download className="w-4 h-4" />
                                </a>
                                <button
                                  onClick={() => handleDeleteDocument(doc.type)}
                                  className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                                  title="Delete Document"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 border-2 border-dashed border-slate-300 rounded-lg">
                          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                          <p className="text-slate-500">No documents uploaded yet</p>
                          <p className="text-sm text-slate-400 mt-1">
                            Upload documents using the fields above
                          </p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* Employment Tab */}
                  <TabsContent value="employment" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <EditableField
                        label="Department"
                        value={staff.department}
                        icon={Building}
                        onSave={(v: string) => update("department", v)}
                        saving={saving}
                      />
                      <EditableField
                        label="Designation"
                        value={staff.designation}
                        icon={Award}
                        onSave={(v: string) => update("designation", v)}
                        saving={saving}
                      />
                      <EditableField
                        label="Salary"
                        value={staff.salary}
                        icon={DollarSign}
                        onSave={(v: string) => update("salary", v)}
                        type="number"
                        prefix="₹"
                        saving={saving}
                      />
                      <EditableField
                        label="Joining Date"
                        value={staff.joined_at?.split('T')[0]}
                        icon={Calendar}
                        onSave={(v: string) => update("joined_at", v)}
                        type="date"
                        saving={saving}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <EditableField
                        label="Employee ID"
                        value={staff.employee_id}
                        icon={User}
                        onSave={(v: string) => update("employee_id", v)}
                        placeholder="EMP-XXXXXX"
                        saving={saving}
                      />
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          Employment Status
                        </label>
                        <select
                          value={staff.status || "active"}
                          onChange={(e) => update("status", e.target.value)}
                          className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={saving}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="probation">Probation</option>
                          <option value="notice_period">Notice Period</option>
                          <option value="terminated">Terminated</option>
                        </select>
                      </div>
                    </div>
                  </TabsContent>

                  {/* HR Tab */}
                  <TabsContent value="hr" className="space-y-6">
                    <EditableTextarea
                      label="HR Policy Agreement"
                      value={staff.hr_policy}
                      icon={Shield}
                      onSave={(v: string) => update("hr_policy", v)}
                      rows={8}
                      placeholder="Enter HR policy details, terms, and conditions..."
                      saving={saving}
                    />
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-2">Policy Information</h4>
                      <p className="text-sm text-blue-700">
                        This section contains the HR policy agreement details for the employee.
                        Make sure all terms and conditions are clearly stated and agreed upon.
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}