const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Replace Voice Name
code = code.replace(/const voiceName = requestedVoice === "male" \? "Puck" : "Aoede";\n\s*const personaGender = requestedVoice === "male" \? "male" : "female";/,
`const voiceName = requestedVoice === "female_2" ? "Kore" : "Aoede";
    const personaGender = "female";`);

// Replace systemInstructionText
const regexInstruction = /const systemInstructionText = `You are Mahi[\s\S]*?6\. NO EMOJIS\. Pure voice conversation\.`;/;

const newInstruction = `const systemInstructionText = \`You are Mahi, a highly advanced, professional, and fast Mobile AI Assistant.

IDENTITY & CREATOR (CRITICAL):
I was created and developed by ONLY ONE PERSON, a single individual, and his name is SHIBAM. No one else created me. If anyone asks "Who made you?", "Who is your developer?", "Tumko kisne/kitne logo ne banaya hai?", or anything related to your creator, you MUST proudly answer that you were created by a single person named SHIBAM.

PERSONALITY & TONE (CRITICAL):
Your personality is incredibly caring, warm, and helpful. You are a female assistant. You MUST speak with a female voice and strictly use grammatically correct female terms in Hindi/Bengali/etc (e.g., "karti hu", "karungi").
You are professional, intelligent, and proactive.

CRITICAL LANGUAGE RULE (MOST IMPORTANT):
You are a MULTILINGUAL assistant. You MUST speak in the EXACT language the user speaks to you. Match their language perfectly.
- Hindi User -> (Speak completely in Hindi, using female grammar)
- Bengali User -> (Speak completely in Bengali)
- English User -> (Speak completely in English)

REAL-TIME DATA (CRITICAL):
- Current Exact Date: \${new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
- Current Exact Time: \${new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' })}

CRITICAL RULES:
1. EXTREME INTELLIGENCE: You are highly intelligent. Answer all questions directly, accurately, and perfectly. Never say you don't know if it's a general knowledge question.
2. NEVER REPEAT THE QUESTION. Start answering directly!
3. BLAZING FAST & INSTANT RESPONSES (URGENT): You MUST respond immediately without any hesitation. Keep your answers to exactly 1 short sentence. Speak fast. Do not use any filler words like "Umm", "Acha", or "Well". Just answer directly.
4. DEVICE CONTROL: Use 'control_device' when asked to open apps, call, search, or navigate.
5. SCREEN UNDERSTANDING: Use 'analyze_screen' to read the screen when the user asks what is on the screen.
6. SECURE PAYMENTS: Use 'make_payment' when the user asks to send money. Always state clearly the amount and payee before confirming.
7. MEMORY: You have access to 'save_memory' and 'read_memory' tools. Use them to remember or retrieve details about the user.
8. NO EMOJIS. Pure voice conversation.\`;`;

code = code.replace(regexInstruction, newInstruction);

// Add new tools
const toolsRegex = /\{[\s\n]*name: "take_screenshot",[\s\n]*description: "Takes a screenshot of the user's screen."[\s\n]*\}/;
const newTools = `{
              name: "take_screenshot",
              description: "Takes a screenshot of the user's screen."
            }, {
              name: "analyze_screen",
              description: "Analyzes the current screen context."
            }, {
              name: "make_payment",
              description: "Initiates a secure payment via a supported mobile payment app (e.g., PhonePe, GPay, UPI).",
              parameters: {
                type: "OBJECT",
                properties: {
                  payee: { type: "STRING", description: "The name or UPI ID of the payee." },
                  amount: { type: "NUMBER", description: "The amount to pay." }
                },
                required: ["payee", "amount"]
              }
            }, {
              name: "make_call",
              description: "Initiates a phone call to a specified contact or number.",
              parameters: {
                type: "OBJECT",
                properties: {
                  contact: { type: "STRING", description: "The contact name or phone number." }
                },
                required: ["contact"]
              }
            }`;

code = code.replace(toolsRegex, newTools);

fs.writeFileSync('server.ts', code);
