/**
 * Image Upload Widget Component
 * Reusable component for uploading images to Cloudinary
 */

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
} from "lucide-react";
import {
  uploadImageToCloudinary,
  validateImageFile,
  optimizeImageUrl,
  type UploadProgress,
} from "../../lib/cloudinary.ts";
import { cn } from "../../lib/utils";

interface ImageUploadWidgetProps {
  currentImageUrl?: string;
  onImageSelect: (imageUrl: string) => void;
  onImageRemove?: () => void;
  className?: string;
}

export function ImageUploadWidget({
  currentImageUrl,
  onImageSelect,
  onImageRemove,
  className,
}: ImageUploadWidgetProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragOverRef = useRef(false);

  const handleFileSelect = async (file: File) => {
    setError(null);
    setSuccessMessage(null);

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      if (validation.error) {
        setError(validation.error);
      }
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const imageUrl = await uploadImageToCloudinary(
        file,
        (progress: UploadProgress) => {
          setUploadProgress(Math.round(progress.progress));
        },
      );

      // Optimize the URL for web display
      const optimizedUrl = optimizeImageUrl(imageUrl, {
        width: 800,
        height: 600,
        quality: "auto",
        format: "auto",
      });

      onImageSelect(optimizedUrl);
      setSuccessMessage("Image uploaded successfully!");

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to upload image";
      setError(errorMessage);
      console.error("Upload error:", err);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragOverRef.current = true;
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragOverRef.current = false;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragOverRef.current = false;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  return (
    <div className={cn("w-full space-y-3", className)}>
      {/* Image Preview */}
      {currentImageUrl && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative rounded-lg overflow-hidden border-2 border-emerald-200 bg-emerald-50"
        >
          <img
            src={currentImageUrl}
            alt="Question preview"
            className="w-full h-auto object-cover max-h-48"
          />
          {/* Remove button */}
          {onImageRemove && (
            <button
              onClick={() => {
                onImageRemove();
                setError(null);
                setSuccessMessage(null);
              }}
              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              title="Remove image"
            >
              <X size={16} />
            </button>
          )}
        </motion.div>
      )}

      {/* Upload Area */}
      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 transition-all cursor-pointer",
          "hover:border-blue-500 hover:bg-blue-50",
          dragOverRef.current && "border-blue-500 bg-blue-50",
          currentImageUrl && "hidden",
          isUploading && "opacity-60 cursor-not-allowed",
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          disabled={isUploading}
          className="hidden"
        />

        {isUploading ? (
          <div className="text-center">
            <Loader2
              className="mx-auto mb-2 animate-spin text-blue-500"
              size={32}
            />
            <p className="text-sm font-medium text-gray-700">Uploading...</p>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">{uploadProgress}%</p>
          </div>
        ) : (
          <div className="text-center">
            <ImageIcon className="mx-auto mb-2 text-gray-400" size={32} />
            <p className="text-sm font-medium text-gray-700">
              Drag & drop your image here
            </p>
            <p className="text-xs text-gray-500 mt-1">or click to browse</p>
            <p className="text-xs text-gray-400 mt-2">
              PNG, JPEG, WebP up to 5MB
            </p>
          </div>
        )}
      </motion.div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg"
        >
          <AlertCircle
            size={16}
            className="flex-shrink-0 text-red-500 mt-0.5"
          />
          <p className="text-sm text-red-700">{error}</p>
        </motion.div>
      )}

      {/* Success Message */}
      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg"
        >
          <CheckCircle2
            size={16}
            className="flex-shrink-0 text-emerald-600 mt-0.5"
          />
          <p className="text-sm text-emerald-700">{successMessage}</p>
        </motion.div>
      )}
    </div>
  );
}