import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { language } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const lang = language === "hi" ? "Hindi" : "English";
    const today = new Date();
    const currentDate = today.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an agricultural market data provider. Today's date is ${currentDate}. Return ONLY valid JSON with no markdown formatting. Provide current approximate market prices for agricultural commodities relevant to Indian farmers. Include wheat, rice, palm oil, mustard oil, cotton, sugarcane, maize, soybean, pulses (dal varieties like chana, moong, masoor).

Return JSON in this exact format:
{
  "commodities": [
    {
      "name": "commodity name in ${lang}",
      "category": "grain" | "oilseed" | "other",
      "price": number (in INR),
      "unit": "per quintal" or "per kg" in ${lang},
      "change": number (percentage change, can be negative),
      "trend": "up" | "down" | "stable",
      "mandi": "market name in ${lang}"
    }
  ],
  "lastUpdated": "current date/time string in ${lang}",
  "marketSummary": "2-3 sentence market summary in ${lang}"
}`
          },
          {
            role: "user",
            content: `Provide today's (${currentDate}) approximate agricultural commodity market prices for India.`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_market_data",
              description: "Return structured market data",
              parameters: {
                type: "object",
                properties: {
                  commodities: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        category: { type: "string", enum: ["grain", "oilseed", "other"] },
                        price: { type: "number" },
                        unit: { type: "string" },
                        change: { type: "number" },
                        trend: { type: "string", enum: ["up", "down", "stable"] },
                        mandi: { type: "string" }
                      },
                      required: ["name", "category", "price", "unit", "change", "trend", "mandi"]
                    }
                  },
                  lastUpdated: { type: "string" },
                  marketSummary: { type: "string" }
                },
                required: ["commodities", "lastUpdated", "marketSummary"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "return_market_data" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI request failed");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const marketData = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(marketData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("No structured data returned");
  } catch (e) {
    console.error("market-prices error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
