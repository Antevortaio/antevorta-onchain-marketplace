import { supabaseAdmin } from "../../../lib/supabaseAdmin.js";

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      return res.status(405).end();
    }

    const { hash } = req.query;
    if (!hash || typeof hash !== "string") {
      return res.status(400).json({ error: "Order hash is required" });
    }

    // Update status to fulfilled
    const { error } = await supabaseAdmin
      .from("seaport_orders")
      .update({ status: "fulfilled" })
      .eq("order_hash", hash);

    if (error) {
      return res.status(400).json({ error });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
