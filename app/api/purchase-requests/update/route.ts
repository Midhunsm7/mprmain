import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { request_id, action, comments } = body;

    if (!request_id || !action) {
      return NextResponse.json({ error: "request_id and action required" }, { status: 400 });
    }

    // get user
    const { data: authData } = await supabaseServer.auth.getUser();
    const userId = authData?.user?.id ?? null;

    let update: any = {};
    let logAction = "";

    if (action === "pass") {
      update = { status: "passed_by_accounts", passed_by: userId, current_stage: "admin" };
      logAction = "passed_by_accounts";
    } else if (action === "approve") {
      update = { status: "approved_by_admin", approved_by: userId, current_stage: "admin_approved" };
      logAction = "approved_by_admin";
    } else if (action === "verify") {
      update = { status: "verified", verified_by: userId, current_stage: "completed" };
      logAction = "verified";
    } else if (action === "reject") {
      update = { status: "rejected", current_stage: "closed" };
      logAction = "rejected";
    } else {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from("purchase_requests")
      .update(update)
      .eq("id", request_id)
      .select("*")
      .single();

    if (error) {
      console.error("UPDATE ERROR:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // insert action log
    await supabaseServer.from("purchase_request_actions").insert({
      request_id,
      action: logAction,
      performed_by: userId,
      comments,
    });

    // create notifications for roles/users
    if (action === "pass") {
      await supabaseServer.from("notifications").insert({
        target_role: "admin",
        title: "Purchase passed by Accounts",
        message: `Request ${request_id} was passed by accounts.`,
        link: `/admin/purchases`,
      });
    } else if (action === "approve") {
      await supabaseServer.from("notifications").insert({
        target_role: "accounts",
        title: "Purchase approved by Admin",
        message: `Request ${request_id} approved by admin.`,
        link: `/accounts/purchases`,
      });
    } else if (action === "verify") {
      await supabaseServer.from("notifications").insert({
        target_role: "accounts",
        title: "Purchase verified by Admin",
        message: `Request ${request_id} verified by admin.`,
        link: `/accounts/purchases`,
      });
      await supabaseServer.from("notifications").insert({
        target_role: "purchase_manager",
        title: "Your purchase is verified",
        message: `Your request ${request_id} has been verified.`,
        link: `/purchases`,
      });
    } else if (action === "reject") {
      await supabaseServer.from("notifications").insert({
        target_role: "accounts",
        title: "Purchase rejected",
        message: `Request ${request_id} was rejected.`,
        link: `/accounts/purchases`,
      });
    }

    return NextResponse.json({ success: true, request: data });
  } catch (err: any) {
    console.error("SERVER ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
