"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Mail,
  Phone,
  MessageCircle,
  MessageSquare,
  Trash2,
  Edit,
  X,
  Send,
  Filter,
  FileSpreadsheet,
  CheckCircle,
  Eye,
  User,
  Clock,
  CheckCheck,
  RefreshCw,
} from "lucide-react";
import { dbHelper } from "@/lib/dbHelper";
import { dispatchPipelineEvent } from "@/lib/pipelineEvents";

function AdminContactsContent() {
  const searchParams = useSearchParams();
  const targetId = searchParams ? searchParams.get("id") : null;

  // Active Tab: "portal_chats" | "contacts"
  const [activeTab, setActiveTab] = useState<"portal_chats" | "contacts">("portal_chats");

  // Contacts Form Inquiries state
  const [contacts, setContacts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [replyModal, setReplyModal] = useState<any | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  // Customer Portal Chats state
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<any | null>(null);
  const [threadMessages, setThreadMessages] = useState<any[]>([]);
  const [chatReplyText, setChatReplyText] = useState("");
  const [loadingChats, setLoadingChats] = useState(false);
  const [sendingChat, setSendingChat] = useState(false);

  // Load Contacts
  const loadContacts = async () => {
    try {
      const list = await dbHelper.contacts.list();
      setContacts(list || []);

      if (targetId) {
        const match = list.find((c: any) => c.id === targetId);
        if (match) {
          setActiveTab("contacts");
          setReplyModal(match);
          setReplyText(match.admin_reply || "");
        }
      }
    } catch (e) {
      console.error("Error loading contacts:", e);
    }
  };

  // Load Customer Portal Conversations
  const loadConversations = async () => {
    setLoadingChats(true);
    try {
      const res = await fetch("/api/admin/messages", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
        if (selectedConv) {
          const updated = (data.conversations || []).find(
            (c: any) => c.customer_email === selectedConv.customer_email
          );
          if (updated) setSelectedConv(updated);
        }
      }
    } catch (e) {
      console.error("Error loading conversations:", e);
    } finally {
      setLoadingChats(false);
    }
  };

  // Load Thread Messages for selected conversation
  const loadThread = async (conv: any) => {
    setSelectedConv(conv);
    try {
      const emailParam = encodeURIComponent(conv.customer_email || "");
      const res = await fetch(`/api/admin/messages?customerEmail=${emailParam}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setThreadMessages(data.messages || []);
      }
    } catch (e) {
      console.error("Error loading thread:", e);
    }
  };

  useEffect(() => {
    loadContacts();
    loadConversations();

    const handler = () => {
      loadContacts();
      loadConversations();
    };
    window.addEventListener("nexbyte-realtime", handler);
    return () => window.removeEventListener("nexbyte-realtime", handler);
  }, [targetId]);

  // Reply to Contact Form Submission
  const handleReplyContact = async () => {
    if (!replyModal || !replyText.trim()) return;
    setSending(true);
    await dbHelper.contacts.reply(replyModal.id, replyText);

    // Dispatch real-time Customer notification
    await dispatchPipelineEvent({
      eventType: "MESSAGE_RECEIVED",
      title: "💬 New reply from NEXLAPTECH Support",
      message: replyText.trim().substring(0, 100),
      recipientUserId: replyModal.user_id || replyModal.customer_id,
      referenceType: "message",
      referenceId: replyModal.id,
      metadata: { contactId: replyModal.id, reply: replyText },
    });

    setReplyModal(null);
    setReplyText("");
    setSending(false);
    loadContacts();
  };

  // Send Direct Message to Customer in Portal Chat
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConv || !chatReplyText.trim()) return;

    setSendingChat(true);
    try {
      const res = await fetch("/api/admin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedConv.customer_id,
          customerEmail: selectedConv.customer_email,
          customerName: selectedConv.customer_name,
          message: chatReplyText.trim(),
        }),
      });

      if (res.ok) {
        setChatReplyText("");
        await loadThread(selectedConv);
        await loadConversations();
      }
    } catch (e) {
      console.error("Failed to send chat message:", e);
    } finally {
      setSendingChat(false);
    }
  };

  const handleMarkContactRead = async (id: string) => {
    await dbHelper.contacts.update(id, { status: "read" });
    loadContacts();
  };

  const handleDeleteContact = async (id: string) => {
    if (confirm("Delete this contact enquiry?")) {
      await dbHelper.contacts.delete(id);
      loadContacts();
    }
  };

  const handleExportCSV = () => {
    let csv = "data:text/csv;charset=utf-8,Name,Email,Phone,Subject,Message,Status,Date\n";
    contacts.forEach((c) => {
      csv += `"${c.name}","${c.email}","${c.phone || ""}","${c.subject || ""}","${(c.message || "").replace(/"/g, '""')}","${c.status}","${c.created_at}"\n`;
    });
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute("download", "NexLapTech_Contact_Enquiries.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredContacts = contacts.filter((c) => {
    const matchSearch =
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      (c.subject || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalUnreadChats = conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0);
  const totalUnreadContacts = contacts.filter((c) => c.status === "unread").length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white tracking-tight">Customer Communication Center</h1>
          <p className="text-xs text-nex-mist mt-0.5">
            Real-time customer portal messaging, technician support chats, and web contact inquiries.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === "contacts" && (
            <button
              onClick={handleExportCSV}
              className="btn-secondary !py-2.5 !px-4 text-xs flex items-center gap-1.5"
            >
              <FileSpreadsheet className="h-4 w-4" /> Export CSV
            </button>
          )}
          <button
            onClick={() => {
              loadContacts();
              loadConversations();
              if (selectedConv) loadThread(selectedConv);
            }}
            className="btn-secondary !py-2.5 !px-3 text-xs flex items-center gap-1.5"
            title="Refresh All"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        <button
          onClick={() => setActiveTab("portal_chats")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "portal_chats"
              ? "bg-nex-blue text-white shadow-glow-blue"
              : "text-nex-mist hover:text-white hover:bg-white/5"
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          Customer Portal Chats
          {totalUnreadChats > 0 ? (
            <span className="ml-1 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
              {totalUnreadChats}
            </span>
          ) : (
            <span className="ml-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-nex-mist">
              {conversations.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("contacts")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "contacts"
              ? "bg-nex-blue text-white shadow-glow-blue"
              : "text-nex-mist hover:text-white hover:bg-white/5"
          }`}
        >
          <Mail className="h-4 w-4" />
          Website Contact Forms
          {totalUnreadContacts > 0 ? (
            <span className="ml-1 rounded-full bg-yellow-500 px-2 py-0.5 text-[10px] font-bold text-black">
              {totalUnreadContacts}
            </span>
          ) : (
            <span className="ml-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-nex-mist">
              {contacts.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: CUSTOMER PORTAL CHATS */}
      {activeTab === "portal_chats" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[520px]">
          {/* Conversation List */}
          <div className="lg:col-span-4 glass-panel p-4 rounded-2xl bg-nex-ink border border-white/5 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider px-1">Customer Conversations</h3>
            {loadingChats ? (
              <div className="py-12 text-center text-xs text-nex-mist">Loading customer chats...</div>
            ) : conversations.length === 0 ? (
              <div className="py-16 text-center text-xs text-nex-mist space-y-2">
                <MessageSquare className="h-8 w-8 mx-auto text-nex-mist/40" />
                <p>No active customer conversations yet.</p>
                <p className="text-[10px] text-nex-mist/60">Registered customer messages will appear here in real-time.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {conversations.map((conv) => {
                  const isSelected = selectedConv?.customer_email === conv.customer_email;
                  return (
                    <button
                      key={conv.id || conv.customer_email}
                      onClick={() => loadThread(conv)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                        isSelected
                          ? "bg-nex-blue/15 border-nex-blue/40 text-white"
                          : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05] text-nex-mist hover:text-white"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-semibold text-xs text-white truncate">{conv.customer_name}</span>
                        {conv.unread_count > 0 && (
                          <span className="rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-[9px] font-bold px-2 py-0.5">
                            {conv.unread_count} new
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-nex-mist/80 truncate mb-1">{conv.customer_email}</p>
                      <p className="text-[11px] text-white/70 line-clamp-1">{conv.last_message}</p>
                      <p className="text-[9px] text-nex-mist/50 mt-1.5 flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {new Date(conv.last_message_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active Conversation Thread */}
          <div className="lg:col-span-8 glass-panel p-5 rounded-2xl bg-nex-ink border border-white/5 flex flex-col justify-between min-h-[520px]">
            {selectedConv ? (
              <>
                {/* Conversation Header */}
                <div className="pb-4 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-nex-blue/20 border border-nex-blue/30 flex items-center justify-center text-nex-blueLight font-bold text-sm">
                      {selectedConv.customer_name?.[0]?.toUpperCase() || "C"}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-xs">{selectedConv.customer_name}</h4>
                      <p className="text-[10px] text-nex-mist">{selectedConv.customer_email}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-nex-mist bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                    Live Portal Chat
                  </span>
                </div>

                {/* Message Feed */}
                <div className="flex-1 py-4 space-y-3 overflow-y-auto max-h-[380px] pr-2">
                  {threadMessages.length === 0 ? (
                    <div className="py-12 text-center text-xs text-nex-mist">No messages in this thread.</div>
                  ) : (
                    threadMessages.map((m: any, idx: number) => {
                      const isAdmin = m.sender === "admin" || Boolean(m.replyBy);
                      return (
                        <div
                          key={m.id || idx}
                          className={`flex flex-col ${isAdmin ? "items-end" : "items-start"}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-2xl p-3 text-xs ${
                              isAdmin
                                ? "bg-nex-blue text-white rounded-br-none"
                                : "bg-white/[0.05] border border-white/10 text-white rounded-bl-none"
                            }`}
                          >
                            <p className="text-[10px] font-bold opacity-75 mb-1">
                              {isAdmin ? "NexLapTech Support" : selectedConv.customer_name}
                            </p>
                            <p className="leading-relaxed">{m.message || m.admin_reply}</p>
                          </div>
                          <span className="text-[9px] text-nex-mist/60 mt-1 px-1">
                            {new Date(m.created_at || Date.now()).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Chat Reply Composer */}
                <form onSubmit={handleSendChatMessage} className="pt-3 border-t border-white/10 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={`Reply to ${selectedConv.customer_name}...`}
                    value={chatReplyText}
                    onChange={(e) => setChatReplyText(e.target.value)}
                    className="flex-1 rounded-xl bg-nex-black border border-white/10 px-4 py-2.5 text-xs text-white focus:outline-none focus:border-nex-blue"
                  />
                  <button
                    type="submit"
                    disabled={sendingChat || !chatReplyText.trim()}
                    className="btn-primary !py-2.5 !px-5 text-xs flex items-center gap-1.5 shrink-0"
                  >
                    <Send className="h-3.5 w-3.5" />
                    {sendingChat ? "Sending..." : "Reply"}
                  </button>
                </form>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-24 text-nex-mist space-y-2">
                <MessageSquare className="h-12 w-12 text-nex-mist/30" />
                <p className="text-xs font-semibold text-white">Select a customer conversation</p>
                <p className="text-[11px] text-nex-mist max-w-sm">
                  Click any conversation from the list to view the full dialogue and respond directly to the customer.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: WEBSITE CONTACT FORMS */}
      {activeTab === "contacts" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="glass-panel p-5 rounded-2xl border border-white/5 bg-nex-ink flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-nex-mist" />
              <input
                type="text"
                placeholder="Search name, email, or subject..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl bg-nex-black border border-white/[0.08] pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="h-4 w-4 text-nex-mist shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-44 rounded-xl bg-nex-black border border-white/10 px-3.5 py-2.5 text-xs text-white focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
                <option value="replied">Replied</option>
              </select>
            </div>
          </div>

          {/* List */}
          {filteredContacts.length === 0 ? (
            <div className="text-center py-20 glass-panel rounded-2xl bg-nex-ink border border-white/5">
              <Mail className="h-10 w-10 text-nex-mist mx-auto mb-3" />
              <p className="text-xs text-white">No contact enquiries found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredContacts.map((c) => (
                <div
                  key={c.id}
                  className={`glass-panel p-5 rounded-2xl bg-nex-ink border transition-all ${
                    c.status === "unread" ? "border-nex-blue/30 shadow-glow-blue/10" : "border-white/5"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white text-xs">{c.name}</h3>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[8px] font-bold uppercase border ${
                            c.status === "unread"
                              ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/20"
                              : c.status === "replied"
                              ? "text-green-400 bg-green-500/10 border-green-500/20"
                              : "text-white/50 bg-white/5 border-white/10"
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-nex-mist">
                        {c.email} {c.phone && `• ${c.phone}`}
                      </p>
                      {c.subject && <p className="text-[11px] text-nex-blueLight font-semibold mt-2">{c.subject}</p>}
                      <p className="text-xs text-white/80 mt-1 leading-relaxed">{c.message}</p>
                      {c.admin_reply && (
                        <div className="mt-3 p-3 rounded-xl bg-green-500/5 border border-green-500/15">
                          <p className="text-[10px] text-green-400 font-bold mb-1">Admin Reply:</p>
                          <p className="text-xs text-white/80">{c.admin_reply}</p>
                          <p className="text-[9px] text-white/30 mt-1">
                            {new Date(c.admin_reply_at).toLocaleDateString("en-IN")}
                          </p>
                        </div>
                      )}
                      <p className="text-[9px] text-white/30 mt-2">
                        {new Date(c.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1.5 shrink-0">
                      {c.status === "unread" && (
                        <button
                          onClick={() => handleMarkContactRead(c.id)}
                          className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white"
                          title="Mark as Read"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setReplyModal(c);
                          setReplyText(c.admin_reply || "");
                        }}
                        className="h-8 w-8 rounded-full bg-nex-blue/10 hover:bg-nex-blue/20 flex items-center justify-center text-nex-blueLight"
                        title="Reply"
                      >
                        <Send className="h-3.5 w-3.5" />
                      </button>
                      {c.phone && (
                        <>
                          <a
                            href={`tel:${c.phone}`}
                            className="h-8 w-8 rounded-full bg-green-500/10 hover:bg-green-500/20 flex items-center justify-center text-green-400"
                            title="Call"
                          >
                            <Phone className="h-3.5 w-3.5" />
                          </a>
                          <a
                            href={`https://wa.me/${(c.phone || "").replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-8 w-8 rounded-full bg-[#25D366]/10 hover:bg-[#25D366]/20 flex items-center justify-center text-[#25D366]"
                            title="WhatsApp"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                          </a>
                        </>
                      )}
                      <button
                        onClick={() => handleDeleteContact(c.id)}
                        className="h-8 w-8 rounded-full bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-400"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Reply Modal */}
          {replyModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={() => setReplyModal(null)} />
              <div className="glass-panel relative w-full max-w-md rounded-2xl border border-white/10 bg-nex-ink p-6 shadow-glow-blue">
                <button
                  onClick={() => setReplyModal(null)}
                  className="absolute right-4 top-4 text-white/50 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
                <h3 className="font-display text-base font-bold text-white mb-2">Reply to {replyModal.name}</h3>
                <p className="text-[11px] text-nex-mist mb-4">
                  Re: {replyModal.subject || replyModal.message?.substring(0, 60)}
                </p>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={4}
                  placeholder="Type your reply message..."
                  className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3.5 py-2.5 text-xs text-white focus:outline-none resize-none mb-4"
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setReplyModal(null)} className="btn-secondary !py-2 !px-4 text-xs">
                    Cancel
                  </button>
                  <button
                    onClick={handleReplyContact}
                    disabled={sending}
                    className="btn-primary !py-2 !px-5 text-xs flex items-center gap-1.5"
                  >
                    <Send className="h-3.5 w-3.5" /> {sending ? "Sending..." : "Send Reply"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminContactsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-white text-xs font-semibold">Loading Contact Enquiries...</div>}>
      <AdminContactsContent />
    </Suspense>
  );
}
