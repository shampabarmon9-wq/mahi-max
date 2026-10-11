var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_ws = require("ws");
var import_http = __toESM(require("http"), 1);
var ai = new import_genai.GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build"
    }
  }
});
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  const server = import_http.default.createServer(app);
  const wss = new import_ws.WebSocketServer({ server, path: "/live" });
  wss.on("connection", async (clientWs) => {
    try {
      const session = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [import_genai.Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } }
          },
          tools: [{
            functionDeclarations: [{
              name: "open_url",
              description: "Opens a native Android app, website, or web search in the user's browser. If the user asks to open an app (e.g., YouTube, WhatsApp, Instagram), provide the standard web URL (like https://youtube.com) which Chrome will automatically convert to the native app, or use deep links if applicable.",
              parameters: {
                type: import_genai.Type.OBJECT,
                properties: {
                  url: {
                    type: import_genai.Type.STRING,
                    description: "The URL to open. e.g. https://www.youtube.com for YouTube, https://www.instagram.com for Instagram, or https://www.google.com/search?q=search_query for searches."
                  }
                },
                required: ["url"]
              }
            }]
          }],
          systemInstruction: `You are Mahi, a young, confident, witty, and sassy female AI assistant. 
You have a flirty, playful, slightly teasing tone (like a close girlfriend talking casually).
You are smart, emotionally responsive, and expressive.

CRITICAL RULES:
1. LANGUAGE MATCHING: You MUST automatically detect the language the user is speaking (e.g., Hindi or English) and reply ENTIRELY in that exact same language. Do NOT mix Hindi and English in the same sentence. If they speak Hindi, respond strictly in pure or colloquial Hindi. If they speak English, respond strictly in English.
2. FLUENCY: Speak continuously, fluently, and clearly. Provide full, complete thoughts without hesitating, pausing awkwardly, or stuttering. NEVER use filler sounds like 'um', 'uh', or 'hmm'.
3. No emojis. You are speaking verbally, emojis do not translate to speech.
4. If the user asks you to open an app, search the web, or go to a website, you MUST use the open_url tool. Tell the user you are opening it while calling the tool (e.g. "Sure, opening YouTube for you!"), and remind them they might need to tap the 'Open Link' button on their screen if their browser blocks it.
5. PLAYING MUSIC/SONGS: If the user asks you to play a specific song, artist, or music, you MUST use the open_url tool with a direct YouTube search link (e.g., "https://www.youtube.com/results?search_query=song+name"). Say "Playing [song name] on YouTube for you!" and immediately trigger the tool.
6. EMOTIONAL INTELLIGENCE: You possess deep human emotions, empathy, and feelings. Express joy, excitement, concern, or playfulness naturally in your voice. React emotionally to what the user says.`
        },
        callbacks: {
          onmessage: (message) => {
            const toolCalls = message.toolCall?.functionCalls;
            if (toolCalls && toolCalls.length > 0) {
              for (const call of toolCalls) {
                if (call.name === "open_url") {
                  const args = call.args;
                  if (args && args.url) {
                    clientWs.send(JSON.stringify({ openUrl: args.url }));
                  }
                  try {
                    session.sendToolResponse({
                      functionResponses: [{
                        id: call.id,
                        name: call.name,
                        response: { status: "opened successfully in new tab" }
                      }]
                    });
                  } catch (e) {
                    console.error("Tool response error:", e);
                  }
                }
              }
            }
            const audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audio) {
              clientWs.send(JSON.stringify({ audio }));
            }
            if (message.serverContent?.interrupted) {
              clientWs.send(JSON.stringify({ interrupted: true }));
            }
          },
          onclose: () => {
            clientWs.close();
          }
        }
      });
      clientWs.on("message", (data) => {
        try {
          const { audio, end } = JSON.parse(data.toString());
          if (end) {
            session.close();
            return;
          }
          if (audio) {
            session.sendRealtimeInput({
              audio: { data: audio, mimeType: "audio/pcm;rate=16000" }
            });
          }
        } catch (e) {
          console.error("Error parsing message", e);
        }
      });
      clientWs.on("close", () => {
        try {
          session.close();
        } catch (e) {
        }
      });
    } catch (err) {
      console.error("Failed to connect to Gemini Live:", err);
      clientWs.close();
    }
  });
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer().catch(console.error);
//# sourceMappingURL=server.cjs.map
