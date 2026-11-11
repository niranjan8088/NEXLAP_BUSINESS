import { NextResponse } from "next/server";
import { dbHelper } from "@/lib/dbHelper";
import { getServerSession } from "@/lib/auth";

export async function GET() {
  try {
    const authUser = await getServerSession();
    if (!authUser || authUser.role !== "user") {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const messages = await dbHelper.messages.getByUser(authUser.id, authUser.email);
    return NextResponse.json({ messages });
  } catch (err: any) {
    console.error("GET Customer Messages Error:", err);
    return NextResponse.json({ error: "Failed to fetch messages." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authUser = await getServerSession();
    if (!authUser || authUser.role !== "user") {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const { subject, message, recipient } = await request.json();
    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Message content is required." }, { status: 400 });
    }

    const newMessage = await dbHelper.messages.send({
      user_id: authUser.id,
      customer_email: authUser.email,
      customer_name: authUser.name || "Customer",
      subject: subject || "Customer Enquiry",
      message: message.trim(),
      sender: "customer",
      recipient: recipient || "seller",
    });

    return NextResponse.json({ success: true, message: newMessage });
  } catch (err: any) {
    console.error("POST Customer Message Error:", err);
    return NextResponse.json({ error: "Failed to send message." }, { status: 500 });
  }
}
