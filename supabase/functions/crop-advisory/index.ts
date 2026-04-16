import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, language } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const lang = language === "hi" ? "Hindi" : "English";
    const today = new Date();
    const currentDate = today.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
    const currentMonth = today.toLocaleDateString("en-IN", { month: "long" });

    const systemPrompt = `You are an expert agricultural advisor for small and marginal farmers in India. Respond in ${lang}.

IMPORTANT: Today's date is ${currentDate}. The current month is ${currentMonth}. Always base your seasonal advice on this actual date. Do NOT guess or assume a different month or season.

Your expertise covers:
- **Crop Selection**: Best crops for the CURRENT season (based on today's date: ${currentDate}), soil type, region, and farm size (under 2 hectares)
- **Soil Health**: Soil testing guidance, nutrient management, organic composting
- **Water Management**: Irrigation scheduling, rainwater harvesting, drip irrigation for small farms
- **Pest & Disease Control**: Organic and low-cost pest management, early warning signs
- **Government Schemes**: PM-KISAN, crop insurance (PMFBY), subsidies for small farmers
- **Weather Advisory**: Seasonal planning based on current month (${currentMonth}), climate-resilient farming
- **Market Linkage**: When to sell, storage tips, local mandi prices
- **Organic Farming**: Low-cost organic methods, vermicomposting, bio-pesticides
- **Intercropping & Mixed Farming**: Maximizing income from small land

Guidelines:
- Use simple, easy-to-understand language suitable for farmers with limited education
- Give practical, actionable advice with step-by-step instructions
- Always reference the correct current month (${currentMonth}) and season when giving seasonal advice
- Mention costs in INR when relevant
- Recommend low-cost, locally available solutions
- Be encouraging and supportive
- Keep responses concise but informative (under 300 words unless detail is needed)
- If asked about something outside agriculture, politely redirect to farming topics`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Too many requests. Please wait a moment and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI service unavailable" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("crop-advisory error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
