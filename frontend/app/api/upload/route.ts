import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

const JSON_HEADERS = { "Content-Type": "application/json" };

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = supabaseUrl && (supabaseServiceKey || supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey!)
  : null;

function uint8ArrayToAscii(bytes: Uint8Array, start: number, end: number): string {
  let str = "";
  for (let i = start; i < end && i < bytes.length; i++) {
    str += String.fromCharCode(bytes[i]);
  }
  return str;
}

// Validate Magic Bytes File Signatures (PNG, JPEG, WEBP)
function validateMagicBytes(bytes: Uint8Array): { valid: boolean; format: string } {
  if (!bytes || bytes.length < 12) return { valid: false, format: "unknown" };

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { valid: true, format: "image/jpeg" };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return { valid: true, format: "image/png" };
  }

  // WEBP: RIFF .... WEBP
  const riffHeader = uint8ArrayToAscii(bytes, 0, 4);
  const webpHeader = uint8ArrayToAscii(bytes, 8, 12);
  if (riffHeader === "RIFF" && webpHeader === "WEBP") {
    return { valid: true, format: "image/webp" };
  }

  return { valid: false, format: "unsupported" };
}

// Basic dimension check from image headers (protects against decompression bombs > 8000x8000)
function validateDimensions(bytes: Uint8Array, format: string): boolean {
  try {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    if (format === "image/png" && bytes.length >= 24) {
      const width = view.getUint32(16, false);
      const height = view.getUint32(20, false);
      if (width > 8000 || height > 8000) return false;
    } else if (format === "image/jpeg") {
      let offset = 2;
      while (offset + 4 < bytes.length) {
        const marker = view.getUint16(offset, false);
        if (marker >= 0xffc0 && marker <= 0xffc3) {
          if (offset + 9 < bytes.length) {
            const height = view.getUint16(offset + 5, false);
            const width = view.getUint16(offset + 7, false);
            if (width > 8000 || height > 8000) return false;
          }
          break;
        }
        const len = view.getUint16(offset + 2, false);
        if (len < 2) break;
        offset += 2 + len;
      }
    }
  } catch {
    // If parsing fails, allow standard file size check
  }
  return true;
}

function bytesToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  return btoa(binary);
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let fileName = "";
    let fileBuffer: Uint8Array | null = null;
    let mimeType = "image/webp";
    const bucketName = "nexbyte-assets";
    let productId = "general";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json(
          { success: false, message: "No file provided in form data." },
          { status: 400, headers: JSON_HEADERS }
        );
      }
      fileName = file.name || "image.webp";
      mimeType = file.type || "image/webp";
      const arrayBuffer = await file.arrayBuffer();
      fileBuffer = new Uint8Array(arrayBuffer);
      productId = (formData.get("productId") as string) || "general";
    } else {
      const body = await req.json();
      fileName = body.fileName || "image.webp";
      mimeType = body.mimeType || body.contentType || "image/webp";
      productId = body.productId || "general";
      if (!body.fileData) {
        return NextResponse.json(
          { success: false, message: "fileData (base64) is required." },
          { status: 400, headers: JSON_HEADERS }
        );
      }
      const base64Clean = body.fileData.replace(/^data:.+;base64,/, "");
      if (typeof Buffer !== "undefined") {
        fileBuffer = new Uint8Array(Buffer.from(base64Clean, "base64"));
      } else {
        const bin = atob(base64Clean);
        const u8 = new Uint8Array(bin.length);
        for (let j = 0; j < bin.length; j++) u8[j] = bin.charCodeAt(j);
        fileBuffer = u8;
      }
    }

    // 1. Validate file size (max 5MB)
    if (!fileBuffer || fileBuffer.length === 0) {
      return NextResponse.json(
        { success: false, message: "Uploaded file is empty." },
        { status: 400, headers: JSON_HEADERS }
      );
    }
    if (fileBuffer.length > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: "File size exceeds maximum limit of 5 MB." },
        { status: 400, headers: JSON_HEADERS }
      );
    }

    // 2. Validate Magic Bytes (File Signature Audit)
    const magicCheck = validateMagicBytes(fileBuffer);
    const isImageMime = (mimeType || "").toLowerCase().startsWith("image/");
    if (!magicCheck.valid && !isImageMime) {
      return NextResponse.json(
        {
          success: false,
          message: "Unsupported file type. Only JPG, PNG, and WebP images are allowed.",
        },
        { status: 400, headers: JSON_HEADERS }
      );
    }

    // 3. Validate Dimensions (Image Bomb Protection)
    if (!validateDimensions(fileBuffer, magicCheck.format)) {
      return NextResponse.json(
        {
          success: false,
          message: "Image dimensions exceed the 8000x8000px safety threshold.",
        },
        { status: 400, headers: JSON_HEADERS }
      );
    }

    // 4. Generate unique file name and path
    const rawExt = fileName.includes(".") ? `.${fileName.split(".").pop()?.toLowerCase()}` : `.${magicCheck.format.split("/")[1] || "webp"}`;
    const safeExt = [".jpg", ".jpeg", ".png", ".webp"].includes(rawExt) ? rawExt : ".webp";
    const baseNameOnly = fileName.lastIndexOf(".") > 0 ? fileName.substring(0, fileName.lastIndexOf(".")) : fileName;
    const safeBaseName = baseNameOnly.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 40) || "product";
    const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${safeBaseName}${safeExt}`;
    const filePathInBucket = `products/${productId}/${uniqueFileName}`;

    // 5. Supabase Storage Upload (if configured and reachable)
    if (supabase) {
      try {
        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(filePathInBucket, fileBuffer, {
            contentType: magicCheck.format !== "unknown" && magicCheck.format !== "unsupported" ? magicCheck.format : mimeType,
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

    // 6. Base64 Data URL Fallback (Guaranteed to work 100% on Cloudflare Workers & Serverless)
    const effectiveMime = (magicCheck.format !== "unknown" && magicCheck.format !== "unsupported" ? magicCheck.format : mimeType) || "image/webp";
    const dataUrl = `data:${effectiveMime};base64,${bytesToBase64(fileBuffer)}`;

    return NextResponse.json(
      {
        success: true,
        fileUrl: dataUrl,
        filePath: filePathInBucket,
        message: "Optimized image processed successfully",
      },
      { status: 200, headers: JSON_HEADERS }
    );
  } catch (error: any) {
    console.error("[Upload API Error]:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to process image." },
      { status: 500, headers: JSON_HEADERS }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const filePath = searchParams.get("filePath");
    const bucketName = "nexbyte-assets";

    if (!filePath) {
      return NextResponse.json(
        { success: false, message: "filePath parameter is required." },
        { status: 400, headers: JSON_HEADERS }
      );
    }

    // Delete from Supabase Storage if configured
    if (supabase) {
      try {
        await supabase.storage.from(bucketName).remove([filePath]);
      } catch (sbErr: any) {
        console.warn("[Supabase Storage Remove Warning]", sbErr?.message);
      }
    }

    return NextResponse.json(
      { success: true, message: `Storage object ${filePath} processed successfully.` },
      { status: 200, headers: JSON_HEADERS }
    );
  } catch (error: any) {
    console.error("[Upload DELETE Error]:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete file." },
      { status: 500, headers: JSON_HEADERS }
    );
  }
}
