import { ethers } from "ethers";
import { supabaseAdmin } from "../../lib/supabaseAdmin.js";
import { SeaportABI, SeaportAddress } from "../../Context/constants";

// RPC Base Sepolia
const provider = new ethers.providers.JsonRpcProvider(process.env.BASE_SEPOLIA_RPC || "https://sepolia.base.org");
const seaport = new ethers.Contract(SeaportAddress, SeaportABI, provider);

export default async function handler(req, res) {
  try {
    if (req.method === "POST") {
      console.log("=== POST /api/orders DEBUG ===");
      console.log("Request body:", JSON.stringify(req.body, null, 2));
      
      const { parameters, signature } = req.body;
      
      if (!parameters) {
        console.error("❌ Missing parameters in request body");
        return res.status(400).json({ error: "Missing parameters" });
      }
      
      if (!signature) {
        console.error("❌ Missing signature in request body");
        return res.status(400).json({ error: "Missing signature" });
      }
      
      console.log("Parameters received:", parameters);
      console.log("Signature received:", signature);
      
      try {
        // 1) Hash & counter = "source of truth" (Seaport)
        console.log("Calling seaport.getOrderHash...");
        const orderHash = await seaport.getOrderHash(parameters);
        console.log("Order hash computed:", orderHash);
        
        console.log("Calling seaport.getCounter...");
        const counter = await seaport.getCounter(parameters.offerer);
        console.log("Counter retrieved:", counter.toString());
        
        // 2) Insert en DB
        console.log("Inserting into Supabase...");
        
        // Helper function to convert BigNumber to string/number
        const convertBigNumber = (value) => {
          if (value && typeof value === 'object' && value.type === 'BigNumber') {
            return value.hex ? ethers.BigNumber.from(value.hex).toString() : '0';
          }
          return String(value);
        };
        
        const { data, error } = await supabaseAdmin
          .from("seaport_orders")
          .insert({
            order_hash: orderHash,
            maker: parameters.offerer,
            token_contract: parameters.offer[0].token,
            token_id: String(parameters.offer[0].identifierOrCriteria),
            price_wei: convertBigNumber(parameters.consideration[0].startAmount),
            start_time: Number(parameters.startTime),
            end_time: Number(parameters.endTime),
            counter: convertBigNumber(counter),
            signature,
            parameters,
            status: "active"
          })
          .select()
          .single();

        if (error) {
          console.error("❌ Supabase insert error:", error);
          return res.status(400).json({ error });
        }
        
        console.log("✅ Order inserted successfully:", data);
        return res.status(200).json(data);
        
      } catch (seaportError) {
        console.error("❌ Seaport contract error:", seaportError);
        return res.status(400).json({ 
          error: "Seaport contract error", 
          details: seaportError.message 
        });
      }
    }

    if (req.method === "GET") {
      const status = req.query.status || "active";
      const { data, error } = await supabaseAdmin
        .from("seaport_orders")
        .select("*")
        .eq("status", status)
        .order("created_at", { ascending: false });

      if (error) return res.status(400).json({ error });
      return res.status(200).json(data);
    }

    return res.status(405).end();
  } catch (e) {
    console.error("❌ General error in /api/orders:", e);
    return res.status(500).json({ error: e.message });
  }
}
