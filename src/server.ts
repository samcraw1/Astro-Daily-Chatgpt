import express from "express";
import { mcpServer, createTransport, getTransport } from "./mcpServer.js";
import dotenv from "dotenv";
import { randomUUID } from "crypto";

// Load environment variables
dotenv.config({ path: ".env.local" });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// CORS headers for ChatGPT
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

// Health check endpoint
app.get("/", (req, res) => {
  res.json({
    name: "Astro Daily MCP Server",
    version: "1.0.0",
    status: "running",
    endpoints: {
      "streamable-http": "POST /mcp (newer protocol)",
      "legacy-sse": "GET /mcp (legacy HTTP+SSE)",
      "legacy-message": "POST /mcp/message (legacy)",
    },
  });
});

// POST /mcp - Streamable HTTP transport (newer protocol)
app.post("/mcp", async (req, res) => {
  const sessionId = req.query.sessionId as string;

  console.log(`📨 POST /mcp request, session: ${sessionId || "new"}`);

  if (sessionId) {
    // Existing session - route to existing transport
    const transport = getTransport(sessionId);

    if (!transport) {
      return res.status(404).json({
        error: "Session not found. Please reconnect via GET /mcp",
      });
    }

    try {
      await transport.handlePostMessage(req.body, res);
    } catch (error) {
      console.error("Error handling message:", error);
      if (!res.headersSent) {
        res.status(500).json({
          error: error instanceof Error ? error.message : "Internal server error",
        });
      }
    }
  } else {
    // No session - handle as stateless JSON-RPC
    console.log(`📋 Stateless JSON-RPC request`);

    try {
      const { method, params } = req.body;

      if (method === "tools/list") {
        const result = await mcpServer.request({ method: "tools/list", params }, {});
        res.json(result);
      } else if (method === "tools/call") {
        const result = await mcpServer.request({ method: "tools/call", params }, {});
        res.json(result);
      } else {
        res.status(400).json({
          error: `Unknown method: ${method}`,
        });
      }
    } catch (error) {
      console.error("Error handling stateless request:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  }
});

// SSE endpoint - Establishes connection with ChatGPT (legacy HTTP+SSE transport)
app.get("/mcp", (req, res) => {
  // Generate unique session ID
  const sessionId = randomUUID();

  console.log(`📡 New SSE connection request, session: ${sessionId}`);

  // Set SSE headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Session-Id": sessionId,
  });

  // Create transport for this session
  const transport = createTransport(sessionId);

  // Send session ID to client (endpoint discovery for legacy clients)
  res.write(`event: endpoint\n`);
  res.write(`data: /mcp?sessionId=${sessionId}\n\n`);

  // Handle transport messages
  transport.on("message", (message) => {
    res.write(`event: message\n`);
    res.write(`data: ${JSON.stringify(message)}\n\n`);
  });

  // Handle client disconnect
  req.on("close", () => {
    console.log(`🔌 SSE connection closed for session: ${sessionId}`);
    transport.close();
  });
});

// Message endpoint - Receives messages from ChatGPT
app.post("/mcp/message", async (req, res) => {
  const sessionId = req.query.sessionId as string;

  if (!sessionId) {
    return res.status(400).json({
      error: "Missing sessionId query parameter",
    });
  }

  console.log(`📨 Received message for session: ${sessionId}`);

  // Get transport for this session
  const transport = getTransport(sessionId);

  if (!transport) {
    console.error(`❌ No transport found for session: ${sessionId}`);
    return res.status(404).json({
      error: "Session not found. Please reconnect via GET /mcp",
    });
  }

  try {
    // Send message to transport
    await transport.handlePostMessage(req.body, res);
  } catch (error) {
    console.error("Error handling message:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
});

// Static file serving for generated images (optional, for web preview)
app.use("/output", express.static("output"));

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║        ✨ Astro Daily MCP Server Running ✨              ║
║                                                           ║
║  Server URL: http://localhost:${PORT}                        ║
║  SSE Endpoint: http://localhost:${PORT}/mcp                  ║
║  Message Endpoint: http://localhost:${PORT}/mcp/message      ║
║                                                           ║
║  Ready to generate beautiful horoscope graphics! 🌟      ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);

  console.log("\n📋 Available Tool:");
  console.log("  - generate_daily_horoscope");
  console.log("\n💡 Usage in ChatGPT:");
  console.log('  "Give me my Scorpio horoscope"');
  console.log('  "Generate a mystical style horoscope for Leo"');
  console.log("\n");
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down server...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Shutting down server...");
  process.exit(0);
});
