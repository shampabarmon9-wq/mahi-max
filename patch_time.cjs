const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Replace the REAL-TIME DATA section in the prompt
const promptRegex = /REAL-TIME DATA \(CRITICAL\):[\s\S]*?- Current Exact Time: [^\n]+/g;
const promptReplacement = `REAL-TIME DATA (CRITICAL):
- You MUST NEVER guess the current time or date. 
- You have a 'get_current_time' tool. You MUST call this tool immediately whenever the user asks for the current time, day, or date, for ANY timezone or location in the world.`;
code = code.replace(promptRegex, promptReplacement);

// Add the tool declaration
const toolsRegex = /\{[\s\n]*name: "make_call",/;
const newTool = `{
              name: "get_current_time",
              description: "Gets the exact current real-time and date for any location/timezone in the world. Call this whenever the user asks for the current time or date.",
              parameters: {
                type: Type.OBJECT,
                properties: {
                  timezone: { type: Type.STRING, description: "The timezone to check (e.g., 'Asia/Kolkata', 'America/New_York', 'UTC', 'Europe/London'). Optional, defaults to local/Indian time if not specified." }
                },
                required: []
              }
            }, {
              name: "make_call",`;
code = code.replace(toolsRegex, newTool);

// Add the tool execution logic
const executionRegex = /\} else if \(call\.name === "make_call"\) \{/g;
const newExecution = `} else if (call.name === "get_current_time") {
                     const tz = (call.args && call.args.timezone) ? call.args.timezone : 'Asia/Kolkata';
                     let result = "";
                     try {
                        const timeString = new Date().toLocaleString('en-US', { timeZone: tz, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });
                        result = \`Current time in \${tz} is \${timeString}\`;
                     } catch (e) {
                        result = \`Error: Invalid timezone '\${tz}'. Try specifying a standard IANA timezone like 'America/New_York'.\`;
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
                     continue; // Skip the generic response below
                  } else if (call.name === "make_call") {`;
code = code.replace(executionRegex, newExecution);

fs.writeFileSync('server.ts', code);
