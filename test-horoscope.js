import { CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { mcpServer } from "./src/mcpServer.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

async function testHoroscope() {
  try {
    console.log("📋 Generating Scorpio horoscope...\n");

    // Call the tools/call handler directly
    const request = {
      method: "tools/call",
      params: {
        name: "generate_daily_horoscope",
        arguments: {
          zodiac_sign: "scorpio",
          style: "mystical",
        },
      },
    };

    // Create a validated request using the schema
    const validatedRequest = CallToolRequestSchema.parse(request);

    // Get the handler and call it
    const handler = mcpServer._requestHandlers.get("tools/call");

    if (!handler) {
      throw new Error("tools/call handler not found");
    }

    const result = await handler(validatedRequest);

    // Parse and display the result
    const textContent = result.content.find((c) => c.type === "text");
    if (textContent) {
      const data = JSON.parse(textContent.text);
      console.log("✨ SCORPIO HOROSCOPE ✨\n");
      console.log("Date:", new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }));
      console.log("\n" + "=".repeat(60));
      console.log("\nHoroscope:", data.horoscope_text);
      console.log("\n💫 Lucky Number:", data.lucky_number);
      console.log("🎨 Lucky Color:", data.lucky_color);
      console.log("🌟 Daily Vibe:", data.daily_vibe);
      console.log("\n" + "=".repeat(60));
      console.log("\n📷 Image saved to:", data.image_path);
      console.log("\n✅ Test completed successfully!");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

testHoroscope();
