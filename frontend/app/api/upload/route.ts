import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const JSON_HEADERS = { "Content-Type": "application/json" };

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = supabaseUrl && (supabaseServiceKey || supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey!)
  : null;

// Validate Magic Bytes File Signatures (PNG, JPEG, WEBP)
function validateMagicBytes(buffer: Buffer): { valid: boolean; format: string } {
  if (!buffer || buffer.length < 12) return { valid: false, format: "unknown" };

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, format: "image/jpeg" };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return { valid: true, format: "image/png" };
  }

  // WEBP: RIFF .... WEBP
  const riffHeader = buffer.subarray(0, 4).toString("ascii");
  const webpHeader = buffer.subarray(8, 12).toString("ascii");
  if (riffHeader === "RIFF" && webpHeader === "WEBP") {
    return { valid: true, format: "image/webp" };
  }

  return { valid: false, format: "unsupported" };
}

// Basic dimension check from image headers (protects against decompression bombs > 8000x8000)
function validateDimensions(buffer: Buffer, format: string): boolean {
  try {
    if (format === "image/png" && buffer.length >= 24) {
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      if (width > 8000 || height > 8000) return false;
    } else if (format === "image/jpeg") {
      let offset = 2;
      while (offset < buffer.length) {
        const marker = buffer.readUInt16BE(offset);
        if (marker >= 0xffc0 && marker <= 0xffc3) {
          const height = buffer.readUInt16BE(offset + 5);
          const width = buffer.readUInt16BE(offset + 7);
          if (width > 8000 || height > 8000) return false;
          break;
        }
        offset += 2 + buffer.readUInt16BE(offset + 2);
      }
    }
  } catch {
    // If parsing fails, allow standard file size check
  }
  return true;
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let fileName = "";
    let fileBuffer: Buffer | null = null;
    let mimeType = "image/webp";
    let bucketName = "nexbyte-assets";
    let productId = "general";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ success: false, message: "No file provided in form data." }, { status: 400, headers: JSON_HEADERS });
      }
      fileName = file.name;
      mimeType = file.type;
      const arrayBuffer = await file.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
      productId = (formData.get("productId") as string) || "general";
    } else {
      const body = await req.json();
      fileName = body.fileName;
      mimeType = body.mimeType || body.contentType || "image/webp";
      productId = body.productId || "general";
      if (!fileName || !body.fileData) {
        return NextResponse.json({ success: false, message: "fileName and fileData (base64) are required." }, { status: 400, headers: JSON_HEADERS });
      }
      const base64Clean = body.fileData.replace(/^data:.+;base64,/, "");
      fileBuffer = Buffer.from(base64Clean, "base64");
    }

    // 2. Validate file size (max 5MB)
    if (fileBuffer.length > 5 * 1024 * 1024) {
      return NextResponse.json({ success: false, message: "File size exceeds maximum limit of 5 MB." }, { status: 400, headers: JSON_HEADERS });
    }

    // 3. Validate Magic Bytes (File Signature Audit)
    const magicCheck = validateMagicBytes(fileBuffer);
    if (!magicCheck.valid) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid file signature. File is not a valid JPEG, PNG, or WebP image.",
          code: "INVALID_FILE_SIGNATURE",
        },
        { status: 400, headers: JSON_HEADERS }
      );
    }

    // 4. Validate Dimensions (Image Bomb Protection)
    if (!validateDimensions(fileBuffer, magicCheck.format)) {
      return NextResponse.json(
        {
          success: false,
          message: "Image dimensions exceed maximum safe limit of 8000x8000 pixels.",
          code: "IMAGE_DIMENSIONS_EXCEEDED",
        },
        { status: 400, headers: JSON_HEADERS }
      );
    }

    // 5. Collision-Safe Unique Storage Path
    const ext = path.extname(fileName) || `.${magicCheck.format.split("/")[1] || "webp"}`;
    const safeBaseName = path.basename(fileName, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
    const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${safeBaseName}${ext}`;
    const filePathInBucket = `products/${productId}/${uniqueFileName}`;

    // 6. Supabase Storage Upload (if configured and reachable)
    if (supabase) {
      try {
        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(filePathInBucket, fileBuffer, {
            contentType: magicCheck.format || mimeType,
            cacheControl: "31536000",
            upsert: true,
          });

        if (!error && data) {
          const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(filePathInBucket);
          return NextResponse.json(
            {
              success: true,
              fileUrl: publicUrlData.publicUrl,
              filePath: data.path,
              bucket: bucketName,
              message: "Uploaded successfully to Supabase Storage",
            },
            {
              status: 200,
              headers: {
                ...JSON_HEADERS,
                "Cache-Control": "public, max-age=31536000, immutable",
              },
            }
          );
        }
        console.warn("[Supabase Storage Upload Warning]", error?.message);
      } catch (sbErr: any) {
        console.warn("[Supabase Storage Upload Exception]", sbErr?.message);
      }
    }

    // 7. Local Filesystem Storage Fallback (Node.js runtime / VPS / Localhost)
    try {
      const uploadsDir = path.join(process.cwd(), "public", "uploads", "products", productId);
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const localFilePath = path.join(uploadsDir, uniqueFileName);
      fs.writeFileSync(localFilePath, fileBuffer);
      const publicUrl = `/uploads/products/${productId}/${uniqueFileName}`;

      return NextResponse.json(
        {
          success: true,
          fileUrl: publicUrl,
          filePath: `uploads/products/${productId}/${uniqueFileName}`,
          message: "File stored in uploads directory",
        },
        { status: 200, headers: JSON_HEADERS }
      );
    } catch (fsErr: any) {
      console.warn("[Local File Storage Not Available (Read-Only/Serverless)]", fsErr?.message);
    }

    // 8. Base64 Data URL Fallback (Guaranteed to work on Cloudflare Workers & Serverless)
    const effectiveMime = magicCheck.format || mimeType || "image/webp";
    const dataUrl = `data:${effectiveMime};base64,${fileBuffer.toString("base64")}`;

    return NextResponse.json(
      {
        success: true,
        fileUrl: dataUrl,
        filePath: filePathInBucket,
        message: "File converted to optimized Data URL fallback",
      },
      { status: 200, headers: JSON_HEADERS }
    );

  } catch (error: any) {
    console.error("[Upload API Error]:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to upload image." },
      { status: 500, headers: JSON_HEADERS }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const filePath = searchParams.get("filePath");
    const bucketName = searchParams.get("bucket") || "nexbyte-assets";

    if (!filePath) {
      return NextResponse.json(
        { success: false, message: "filePath parameter is required." },
        { status: 400, headers: JSON_HEADERS }
      );
    }

    // 1. Delete from Supabase Storage if configured
    if (supabase) {
      const { error } = await supabase.storage.from(bucketName).remove([filePath]);
      if (error) {
        console.warn("[Supabase Storage Remove Warning]", error);
      }
    }

    // 2. Delete local file if it exists
    try {
      const localPath = path.join(process.cwd(), "public", filePath.startsWith("/") ? filePath.substring(1) : filePath);
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }
    } catch {
      // Ignore local cleanup error
    }

    return NextResponse.json(
      { success: true, message: `Storage object ${filePath} deleted successfully.` },
      { status: 200, headers: JSON_HEADERS }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete storage object." },
      { status: 500, headers: JSON_HEADERS }
    );
  }
}
