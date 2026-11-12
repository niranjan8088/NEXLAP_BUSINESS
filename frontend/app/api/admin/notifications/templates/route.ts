import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbHelper } from "@/lib/dbHelper";
import { getServerSession } from "@/lib/auth";

async function verifyAdmin() {
  const session = await getServerSession();
  if (session && session.role === "admin") return true;

  const cookieStore = await cookies();
  const adminSession = cookieStore.get("nexbyte_admin_session")?.value;
  if (adminSession) return true;

  if (process.env.NODE_ENV !== "production") return true;

  return false;
}

export async function GET() {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const templates = await dbHelper.notifications.listTemplates();
    return NextResponse.json({ success: true, templates });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to load notification templates." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const body = await request.json();
    const { name, category, title, message, channels = ["in_app"], variables = [], id, is_active } = body;

    if (!name || !title || !message) {
      return NextResponse.json(
        { error: "Template name, title, and message are required." },
        { status: 400 }
      );
    }

    const templates = await dbHelper.notifications.saveTemplate({
      id,
      name,
      category,
      title,
      message,
      channels,
      variables,
      is_active,
    });

    return NextResponse.json({
      success: true,
      message: "Template saved successfully.",
      templates,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to save template." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Template ID is required." }, { status: 400 });
    }

    await dbHelper.notifications.deleteTemplate(id);

    return NextResponse.json({
      success: true,
      message: "Template deleted successfully.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to delete template." },
      { status: 500 }
    );
  }
}

