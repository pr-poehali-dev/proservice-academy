export interface AiSettings {
  provider: "ollama" | "openai";
  ollamaUrl: string;
  ollamaModel: string;
  openaiKey: string;
  openaiModel: string;
}

const AI_SETTINGS_KEY = "psa_ai_settings";

export function defaultAiSettings(): AiSettings {
  return {
    provider: "ollama",
    ollamaUrl: "http://localhost:11434",
    ollamaModel: "llama3",
    openaiKey: "",
    openaiModel: "gpt-4o-mini",
  };
}

export function getAiSettings(): AiSettings {
  try {
    const stored = localStorage.getItem(AI_SETTINGS_KEY);
    if (stored) return { ...defaultAiSettings(), ...JSON.parse(stored) };
  } catch (_e) { /* ignore */ }
  return defaultAiSettings();
}

export function saveAiSettingsToStorage(settings: AiSettings): void {
  localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(settings));
}

export async function callAi(prompt: string, system = ""): Promise<string> {
  const s = getAiSettings();
  if (s.provider === "ollama") {
    const res = await fetch(`${s.ollamaUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: s.ollamaModel,
        stream: false,
        messages: [
          ...(system ? [{ role: "system", content: system }] : []),
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!res.ok) throw new Error(`Ollama error ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return data.message?.content || data.response || "";
  } else {
    if (!s.openaiKey) throw new Error("OpenAI API ключ не указан");
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${s.openaiKey}` },
      body: JSON.stringify({
        model: s.openaiModel,
        messages: [
          ...(system ? [{ role: "system", content: system }] : []),
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!res.ok) throw new Error(`OpenAI error ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  }
}
