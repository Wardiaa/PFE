
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  url: string;
  width?: number;
  height?: number;
  format?: string;
  [key: string]: any;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  progress: number;
}

/**
 * Upload an image to Cloudinary using unsigned upload
 * This method doesn't require server-side credentials
 */
export async function uploadImageToCloudinary(
  file: File,
  onProgress?: (progress: UploadProgress) => void,
): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("cloud_name", CLOUDINARY_CLOUD_NAME);

  // Optional: Add tags for organization
  formData.append("tags", "pfe_questions");
  formData.append("folder", "pfe/questions");

  try {
    const xhr = new XMLHttpRequest();

    // Track upload progress
    if (onProgress) {
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          onProgress({
            loaded: event.loaded,
            total: event.total,
            progress,
          });
        }
      });
    }

    const response = await new Promise<CloudinaryUploadResponse>(
      (resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve(data);
            } catch (e) {
              reject(new Error("Invalid JSON response from Cloudinary"));
            }
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.onabort = () => reject(new Error("Upload was cancelled"));

        xhr.open(
          "POST",
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
          true,
        );
        xhr.send(formData);
      },
    );

    if (response.secure_url) {
      return response.secure_url;
    } else {
      console.error("Cloudinary response:", response);
      throw new Error("No URL returned from Cloudinary");
    }
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw error;
  }
}

/**
 * Delete an image from Cloudinary
 * Note: This requires server-side credentials and a backend endpoint
 * For now, we'll keep deleted images (just remove reference)
 */
export async function deleteImageFromCloudinary(
  _publicId: string,
): Promise<boolean> {
  // This would require a backend endpoint with secured Cloudinary API key
  // For MVP, we can skip this or implement via backend
  console.warn("Image deletion requires backend implementation");
  return true;
}

/**
 * Optimize image URL for web display
 * Apply transformations like resizing, quality optimization, etc.
 */
export function optimizeImageUrl(
  url: string,
  options?: {
    width?: number;
    height?: number;
    quality?: "auto" | number;
    format?: string;
  },
): string {
  if (!url.includes("cloudinary")) {
    return url; // Return unchanged if not a Cloudinary URL
  }

  const width = options?.width || 800;
  const height = options?.height || 600;
  const quality = options?.quality || "auto";
  const format = options?.format || "auto";

  // Extract public ID from URL and rebuild with transformations
  // Example: https://res.cloudinary.com/cloud/image/upload/v123/folder/file.jpg
  // To: https://res.cloudinary.com/cloud/image/upload/w_800,h_600,q_auto,f_auto/v123/folder/file.jpg

  const parts = url.split("/image/upload/");
  if (parts.length === 2) {
    const [base, rest] = parts;
    const transformations = `w_${width},h_${height},q_${quality},f_${format},c_fill`;
    return `${base}/image/upload/${transformations}/${rest}`;
  }

  return url;
}

/**
 * Validate image file before upload
 */
export function validateImageFile(file: File): {
  valid: boolean;
  error?: string;
} {
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `File type not supported. Allowed: JPEG, PNG, WebP, GIF`,
    };
  }

  if (file.size > MAX_SIZE) {
    return {
      valid: false,
      error: `File size exceeds 5MB limit. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
    };
  }

  return { valid: true };
}