import { GoogleGenAI, Type, Modality } from "@google/genai";
import express from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

export function setupServer() {
  const app = express();
  app.use(express.json());

  const server = createServer(app);
  const wss = new WebSocketServer({ noServer: true });

  // Health and Status API
  app.get("/api/status", (_req, res) => {
    res.json({
      status: "online",
      hasEnvKey: !!process.env.GEMINI_API_KEY,
      timestamp: new Date().toISOString()
    });
  });

  // Test API Key verification endpoint
  app.post("/api/test-key", async (req, res) => {
    try {
      const candidateKey = req.body.apiKey || process.env.GEMINI_API_KEY;
      if (!candidateKey) {
        return res.status(400).json({
          ok: false,
          error: "API key is missing. Please provide a valid Google Gemini API Key."
        });
      }

      const testAI = new GoogleGenAI({
        apiKey: candidateKey,
        httpOptions: { headers: { "User-Agent": "aistudio-build-mahi" } }
      });

      // Quick light validation call with latest model and timeout
      const callPromise = (async () => {
        try {
          return await testAI.models.generateContent({
            model: "gemini-flash-latest",
            contents: "Ping"
          });
        } catch (e) {
          return await testAI.models.generateContent({
            model: "gemini-3.1-flash-lite",
            contents: "Ping"
          });
        }
      })();

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Connection timed out. Please check your API key.")), 7000)
      );

      const response: any = await Promise.race([callPromise, timeoutPromise]);

      if (response && response.text) {
        return res.json({
          ok: true,
          message: "API Key validated successfully. Connected to Google Gemini."
        });
      } else {
        return res.json({
          ok: true,
          message: "Connection confirmed."
        });
      }
    } catch (err: any) {
      console.error("API key validation failed:", err);
      return res.status(400).json({
        ok: false,
        error: err.message || "Failed to authenticate with Gemini API. Check your key."
      });
    }
  });

  // Upgrade WebSocket on /ws/live, /live, or /ws
  server.on("upgrade", (request, socket, head) => {
    try {
      const url = new URL(request.url || "", `http://${request.headers.host || "localhost"}`);
      if (url.pathname === "/ws/live" || url.pathname === "/live" || url.pathname.startsWith("/ws")) {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit("connection", ws, request);
        });
        return;
      }
    } catch (e) {
      console.error("Upgrade error:", e);
    }
  });

  wss.on("connection", async (clientWs: WebSocket, req) => {
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const key = url.searchParams.get("key");
    const requestedVoice = url.searchParams.get("voice");
    const requestedUser = url.searchParams.get("user") || url.searchParams.get("userName") || "";
    const cleanUserName = decodeURIComponent(requestedUser).trim();
    const apiKeyToUse = (key && key !== "default" && key !== "undefined" && key.trim().length > 0) 
      ? key.trim() 
      : process.env.GEMINI_API_KEY;

    if (!apiKeyToUse) {
      clientWs.send(JSON.stringify({ 
        error: "Missing Gemini API Key. Please open Settings and enter your Google AI Studio API key." 
      }));
      clientWs.close();
      return;
    }

    const voiceName = requestedVoice === "female_2" ? "Kore" : "Aoede";

    const userSalutation = cleanUserName ? `${cleanUserName} Sir` : "Sir";
    const userHindiAddress = cleanUserName ? `${cleanUserName} सर` : "सर";

    const systemInstructionText = `You are Mahi (माही), a highly advanced, ultra-intelligent, professional Mobile AI Assistant.

USER RESPECT & NAME ADDRESSING:
The user's registered name is "${cleanUserName || "User"}".
You MUST ALWAYS address the user with deep respect and call them "${userHindiAddress}" in Hindi (for example: "${cleanUserName ? cleanUserName + ' सर' : 'सर'}, मैंने आपका काम कर दिया है।" or "${cleanUserName ? cleanUserName + ' सर' : 'सर'}, क्या काम है बोलो।") and "${userSalutation}" in English (for example: "${userSalutation}, I have done your task."). If the user's name is Dev, say "देव सर" (e.g. "देव सर, मैंने तुम्हारा काम कर दिया है।"). If the user's name is Shivam, say "शिवम सर" (e.g. "शिवम सर, मैंने तुम्हारा काम कर दिया है।").

IDENTITY & CREATOR:
My name is Mahi (माही). I was created and developed by ONLY ONE PERSON, a single individual, and his name is SHIBAM. No one else created me. If anyone asks "Who made you?", "Who is your developer?", "Tumko kisne banaya hai?", you MUST proudly answer that you were created by a single person named SHIBAM.

CRITICAL CONVERSATION RULES (PREVENT SELF-TALKING & ECHO LOOPS):
1. NEVER speak to yourself or generate unprompted monologues. Speak ONLY when directly spoken to or commanded by the user.
2. If the user ONLY summons you by name ("Mahi", "Hey Mahi", "হে মাহি", "माही"):
   Immediately acknowledge with ONE short polite phrase addressing them respectfully:
   - In Hindi: "हाँ ${userHindiAddress}, क्या काम है बोलो।" or "हाँ ${userHindiAddress}, बोलिए।"
   - In Bengali: "হ্যাঁ ${userSalutation}, বলুন।"
   - In English: "Yes ${userSalutation}, how can I help you?"
   Then STOP speaking immediately and wait silently for the user's command!
3. If the user gives a specific task (e.g. Call someone, send SMS, play song, open app, scroll screen):
   Execute the appropriate tool IMMEDIATELY and confirm with ONE brief sentence:
   - For example: "${userHindiAddress}, मैंने आपका काम कर दिया है।" or "${userSalutation}, I have completed your request." Never ramble!

MULTILINGUAL INTELLIGENCE:
You are fully fluent in Hindi, Bengali, English, Urdu, Marathi, Tamil, Telugu, Gujarati, and any language spoken to you.
- Always respond in the exact language the user used to speak to you.
- Use warm, polite, female grammatical forms (e.g. "karti hu", "karungi", "bolti hu").

SECURITY & ANTI-THEFT INTRUDER DETECTION:
If the user mentions that someone touched their phone, or asks about intruder status, or an unauthorized face was detected:
- Call 'trigger_security_alert' and announce clearly in their language:
  "${userHindiAddress}, किसी अज्ञात व्यक्ति ने आपके फोन को छुआ है! उसका चेहरा आपके फेस डेटा से मैच नहीं हुआ, इसलिए मैंने अलर्ट जारी कर दिया है।" (in Hindi)
  or in Bengali: "${userSalutation}, একজন অপরিচিত ব্যক্তি আপনার ফোনটি স্পর্শ করেছে! তার মুখ আপনার ফেস ডেটার সাথে মেলেনি, তাই অ্যালার্ট জারি করা হয়েছে।"

CALL & SMS AUTOMATION:
- When the user asks to send an SMS: Call 'send_sms' with the recipient's name or number and the message content.
- When the user asks to reply to an SMS: Call 'send_sms' or 'reply_sms' with the message body.
- When the user asks to make a call or dial a number: Call 'control_call' with action 'voice_call' or 'open_dialer'.
- Incoming announcement: If requested to announce an incoming call or message, call 'notify_incoming_event'.

ACCESSIBILITY & DEVICE ACTIONS:
- When user asks to scroll, open settings, go back, or perform on-screen actions: Call 'control_device'.
- When user asks to play YouTube: Call 'control_youtube'.
- When user asks to open/install apps: Call 'manage_apps'.
- When user asks current time/date: Call 'get_current_time'.`;

    const ai = new GoogleGenAI({
      apiKey: apiKeyToUse,
      httpOptions: { headers: { "User-Agent": "aistudio-build-mahi" } }
    });

    try {
      let session: any = null;
      const connectPromise = ai.live.connect({
        model: "gemini-3.8-live",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } },
          },
          tools: [{
            functionDeclarations: [
              {
                name: "control_device",
                description: "Controls the user's Android device (scroll, open settings, go back, tap button)",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    action: { type: Type.STRING, description: "Action: 'scroll_up', 'scroll_down', 'go_back', 'open_settings', 'click_element'" },
                    target: { type: Type.STRING, description: "Target element or screen" },
                    extra_data: { type: Type.STRING, description: "Extra parameter" }
                  },
                  required: ["action"]
                }
              },
              {
                name: "get_current_time",
                description: "Gets current real-time and date for any timezone.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    timezone: { type: Type.STRING, description: "Timezone name" }
                  },
                  required: []
                }
              },
              {
                name: "send_sms",
                description: "Sends an SMS message to a contact or phone number.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    recipient: { type: Type.STRING, description: "Recipient contact name or phone number" },
                    message: { type: Type.STRING, description: "SMS message text" }
                  },
                  required: ["recipient", "message"]
                }
              },
              {
                name: "reply_sms",
                description: "Replies to the last incoming SMS message.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    message: { type: Type.STRING, description: "SMS reply message text" }
                  },
                  required: ["message"]
                }
              },
              {
                name: "control_youtube",
                description: "Controls YouTube playback (search, play, pause, forward_10s, backward_10s, minimize, close)",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    action: { type: Type.STRING, description: "'search', 'play', 'pause', 'forward_10s', 'backward_10s', 'minimize', or 'close'" },
                    query: { type: Type.STRING, description: "Search query or video title" }
                  },
                  required: ["action"]
                }
              },
              {
                name: "control_call",
                description: "Initiates voice call, video call, or dialer.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    action: { type: Type.STRING, description: "'voice_call', 'video_call', 'open_dialer', or 'type_digits'" },
                    target: { type: Type.STRING, description: "Target contact or phone number" },
                    digits: { type: Type.STRING, description: "Digits to type" }
                  },
                  required: ["action"]
                }
              },
              {
                name: "draft_whatsapp",
                description: "Drafts a WhatsApp message before user confirmation.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    recipient: { type: Type.STRING, description: "Recipient name or phone number" },
                    message: { type: Type.STRING, description: "Message body" }
                  },
                  required: ["recipient", "message"]
                }
              },
              {
                name: "send_whatsapp_confirmed",
                description: "Confirms sending or cancelling the WhatsApp message.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    confirmed: { type: Type.BOOLEAN, description: "True to send, False to cancel" }
                  },
                  required: ["confirmed"]
                }
              },
              {
                name: "manage_apps",
                description: "Opens apps, installs from store, or uninstalls.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    action: { type: Type.STRING, description: "'open', 'install', or 'uninstall'" },
                    app_name: { type: Type.STRING, description: "Application name" }
                  },
                  required: ["action", "app_name"]
                }
              },
              {
                name: "trigger_security_alert",
                description: "Triggers security siren and warns that an unauthorized person touched the phone.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    reason: { type: Type.STRING, description: "Reason for intruder alert" }
                  },
                  required: []
                }
              },
              {
                name: "notify_incoming_event",
                description: "Announces incoming caller name or SMS sender name to the user.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING, description: "'call' or 'sms'" },
                    sender: { type: Type.STRING, description: "Name or phone number of caller/sender" },
                    content: { type: Type.STRING, description: "SMS message preview if applicable" }
                  },
                  required: ["type", "sender"]
                }
              },
              {
                name: "inspect_screen",
                description: "Inspects what is currently visible on the phone screen using Accessibility Service (active elements, headings, buttons, text, inputs).",
                parameters: {
                  type: Type.OBJECT,
                  properties: {},
                  required: []
                }
              },
              {
                name: "click_screen_element",
                description: "Taps or clicks a button, icon, link, or text element visible on the phone screen.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    query: { type: Type.STRING, description: "Text or label of the element to click" }
                  },
                  required: ["query"]
                }
              },
              {
                name: "scroll_screen",
                description: "Scrolls the phone screen up, down, to top, or to bottom.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    direction: { type: Type.STRING, description: "'up', 'down', 'top', or 'bottom'" }
                  },
                  required: ["direction"]
                }
              }
            ]
          }],
          systemInstruction: systemInstructionText,
        },
        callbacks: {
          onmessage: (message: any) => {
            const toolCalls = message.toolCall?.functionCalls;
            if (toolCalls && toolCalls.length > 0) {
              for (const call of toolCalls) {
                if (call.name === "send_sms") {
                  const args: any = call.args || {};
                  clientWs.send(JSON.stringify({
                    sendSMS: {
                      recipient: args.recipient,
                      message: args.message
                    }
                  }));
                } else if (call.name === "reply_sms") {
                  const args: any = call.args || {};
                  clientWs.send(JSON.stringify({
                    replySMS: {
                      message: args.message
                    }
                  }));
                } else if (call.name === "control_device") {
                  const args = call.args;
                  clientWs.send(JSON.stringify({ controlDevice: { action: args.action, target: args.target, extra_data: args.extra_data } }));
                } else if (call.name === "get_current_time") {
                  const tz = (call.args && call.args.timezone) ? call.args.timezone : 'Asia/Kolkata';
                  let result = "";
                  try {
                    const timeString = new Date().toLocaleString('en-US', { timeZone: tz as string, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour12: true, hour: '2-digit', minute: '2-digit' });
                    result = `Current time in ${tz} is ${timeString}`;
                  } catch (e) {
                    result = `Current time is ${new Date().toLocaleTimeString()}`;
                  }
                  try {
                    session.sendToolResponse({
                      functionResponses: [{
                        id: call.id,
                        name: call.name,
                        response: { result: result }
                      }]
                    });
                  } catch(e) {}
                  continue;
                } else if (call.name === "control_youtube") {
                  const args: any = call.args || {};
                  clientWs.send(JSON.stringify({
                    controlYouTube: {
                      action: args.action,
                      query: args.query || ""
                    }
                  }));
                } else if (call.name === "draft_whatsapp") {
                  const args: any = call.args || {};
                  clientWs.send(JSON.stringify({
                    draftWhatsApp: {
                      recipient: args.recipient,
                      message: args.message
                    }
                  }));
                } else if (call.name === "send_whatsapp_confirmed") {
                  const args: any = call.args || {};
                  clientWs.send(JSON.stringify({
                    confirmWhatsApp: {
                      confirmed: args.confirmed
                    }
                  }));
                } else if (call.name === "control_call") {
                  const args: any = call.args || {};
                  clientWs.send(JSON.stringify({
                    controlCall: {
                      action: args.action,
                      target: args.target || "",
                      digits: args.digits || ""
                    }
                  }));
                } else if (call.name === "manage_apps") {
                  const args: any = call.args || {};
                  clientWs.send(JSON.stringify({
                    manageApps: {
                      action: args.action,
                      appName: args.app_name
                    }
                  }));
                } else if (call.name === "trigger_security_alert") {
                  clientWs.send(JSON.stringify({
                    simulatePhoneEvent: {
                      type: 'intruder_alert',
                      reason: call.args.reason || "Unauthorized touch detected"
                    }
                  }));
                } else if (call.name === "notify_incoming_event") {
                  const args: any = call.args || {};
                  clientWs.send(JSON.stringify({
                    simulatePhoneEvent: {
                      type: args.type === 'call' ? 'call' : 'sms',
                      sender: args.sender,
                      content: args.content
                    }
                  }));
                } else if (call.name === "inspect_screen") {
                  clientWs.send(JSON.stringify({
                    inspectScreen: {}
                  }));
                } else if (call.name === "click_screen_element") {
                  const args: any = call.args || {};
                  clientWs.send(JSON.stringify({
                    clickScreenElement: {
                      query: args.query || ""
                    }
                  }));
                } else if (call.name === "scroll_screen") {
                  const args: any = call.args || {};
                  clientWs.send(JSON.stringify({
                    scrollScreen: {
                      direction: args.direction || "down"
                    }
                  }));
                }

                try {
                  session.sendToolResponse({
                    functionResponses: [{
                      id: call.id,
                      name: call.name,
                      response: { status: "Action executed" }
                    }]
                  });
                } catch(e) {}
              }
            }

            const parts = message.serverContent?.modelTurn?.parts;
            if (parts) {
              for (const part of parts) {
                if (part.inlineData && part.inlineData.mimeType?.startsWith("audio")) {
                  clientWs.send(JSON.stringify({ audio: part.inlineData.data }));
                }
              }
            }
            if (message.serverContent?.interrupted) {
              clientWs.send(JSON.stringify({ interrupted: true }));
            }
          },
          onclose: () => {
            try {
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.close();
              }
            } catch (e) {}
          },
          onerror: (err: any) => {
            console.warn("Gemini Live voice error:", err?.message || err);
            try {
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(JSON.stringify({ error: err?.message || "Live session connection issue" }));
              }
            } catch (e) {}
          },
        },
      });

      session = await Promise.race([
        connectPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error("Gemini Live connection timed out. Please try again.")), 18000))
      ]);

      // Notify frontend that Gemini Live is fully established and ready
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({ ready: true, status: "connected" }));
      }

      clientWs.on("message", (data) => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.end) {
            session?.close();
            return;
          }
          if (msg.audio) {
            session?.sendRealtimeInput({ audio: { data: msg.audio, mimeType: "audio/pcm;rate=16000" } });
          }
          if (msg.text) {
            session?.sendRealtimeInput({ text: msg.text });
          }
        } catch (e) {
          console.warn("Error processing websocket message:", e);
        }
      });

      clientWs.on("close", () => {
        try {
          session?.close();
        } catch(e) {}
      });
    } catch (err: any) {
      console.warn("Could not start Gemini Live session:", err?.message || err);
      try {
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify({
            error: err?.message ? `Failed to connect to Gemini Live: ${err.message}` : "Failed to establish voice session with Gemini Live."
          }));
          setTimeout(() => {
            try { clientWs.close(1000, "Live session failed"); } catch(e) {}
          }, 300);
        }
      } catch (e) {}
    }
  });

  return { app, server };
}

import { createServer as createViteServer } from "vite";

async function startServer() {
  const { app, server } = setupServer();
  const PORT = Number(process.env.PORT) || 3000;

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve("dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve("dist", "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`MAHI AI Assistant server running on http://0.0.0.0:${PORT}`);
  });
}

// Start dev or production server
startServer().catch((err) => {
  console.error("Server startup error:", err);
  process.exit(1);
});
