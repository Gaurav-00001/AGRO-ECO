import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageBase64, type, language } = await req.json();
    // type: "tree" | "animal"
    // language: "en" | "hi"

    if (!imageBase64 || !type) {
      return new Response(JSON.stringify({ error: "imageBase64 and type are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const lang = language === "hi" ? "Hindi" : "English";

    let systemPrompt = "";
    if (type === "tree") {
      systemPrompt = `You are an expert agricultural scientist and plant pathologist specializing in oil palm diseases. You MUST directly diagnose the tree from the image. NEVER say "I am an AI" or "I cannot give farming advice" or add disclaimers. Act as a real agricultural expert giving direct advice to a farmer.

Analyze the image and respond in EXACTLY this format:

Disease: [Name the specific disease if found, e.g., Ganoderma Basal Stem Rot, Bud Rot, Leaf Spot Disease, Nutrient Deficiency, or "Healthy" if no disease]
Confidence: [Give a percentage 0-100 based on visual evidence]
Severity: [Mild / Moderate / Severe]
Treatment: [Give specific, actionable treatment - name exact pesticide/fungicide, dosage, and application method. E.g., "Apply Hexaconazole 5% EC at 2ml/L water, spray on affected fronds every 15 days" or "Apply Trichoderma harzianum bio-fungicide at trunk base, 50g per tree"]
Symptoms: [Describe what you observe in the image]

Be direct, specific, and practical. A farmer's livelihood depends on your accuracy. Respond in ${lang}.`;
    } else {
      systemPrompt = `You are an expert veterinarian and animal breed specialist. Analyze the image of the animal and provide:
1. Breed identification (most likely breed)
2. Health assessment: Good, Fair, or Poor
3. Health score (0-100)
4. Observable health indicators (coat condition, body condition, posture, etc.)
5. Any visible health concerns
6. Recommendations for the farmer

Respond in ${lang}. Be concise and practical for a farmer.`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: type === "tree" ? "Analyze this oil palm tree image." : "Analyze this animal image." },
              { type: "image_url", image_url: { url: imageBase64 } },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content || "Unable to analyze image.";

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-image error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
