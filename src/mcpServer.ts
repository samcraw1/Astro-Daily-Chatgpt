import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import OpenAI from "openai";
import { createCanvas, registerFont } from "canvas";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lazy OpenAI client initialization (after env vars are loaded)
let openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

// Zodiac sign type
const zodiacSigns = [
  "aries",
  "taurus",
  "gemini",
  "cancer",
  "leo",
  "virgo",
  "libra",
  "scorpio",
  "sagittarius",
  "capricorn",
  "aquarius",
  "pisces",
] as const;

// Style options
const styleOptions = ["minimalist", "mystical", "gradient"] as const;

type ZodiacSign = typeof zodiacSigns[number];
type StyleOption = typeof styleOptions[number];
type Element = "fire" | "earth" | "air" | "water";

type Palette = {
  background: string | [string, string];
  primary: string;
  secondary: string;
  accent: string;
};

const zodiacSymbolMap: Record<ZodiacSign, string> = {
  aries: "♈",
  taurus: "♉",
  gemini: "♊",
  cancer: "♋",
  leo: "♌",
  virgo: "♍",
  libra: "♎",
  scorpio: "♏",
  sagittarius: "♐",
  capricorn: "♑",
  aquarius: "♒",
  pisces: "♓",
};

const zodiacElementMap: Record<ZodiacSign, Element> = {
  aries: "fire",
  taurus: "earth",
  gemini: "air",
  cancer: "water",
  leo: "fire",
  virgo: "earth",
  libra: "air",
  scorpio: "water",
  sagittarius: "fire",
  capricorn: "earth",
  aquarius: "air",
  pisces: "water",
};

const elementColorThemes: Record<
  Element,
  {
    accent: string;
    gradientBackground: [string, string];
    gradientSecondary: string;
    gradientPrimary?: string;
  }
> = {
  fire: {
    accent: "#FF7A2F",
    gradientBackground: ["#FFB347", "#FF2D55"],
    gradientSecondary: "#FFE5C1",
  },
  earth: {
    accent: "#6E9A5B",
    gradientBackground: ["#7BC67B", "#2D5A27"],
    gradientSecondary: "#E4F2DB",
    gradientPrimary: "#F9FFF4",
  },
  air: {
    accent: "#4AB3FF",
    gradientBackground: ["#74EBD5", "#5A62FF"],
    gradientSecondary: "#E7F6FF",
  },
  water: {
    accent: "#5C6BF2",
    gradientBackground: ["#1F3B73", "#2D87FF"],
    gradientSecondary: "#D7E6FF",
  },
};

// Color palettes for each style
const stylePalettes: Record<StyleOption, Palette> = {
  minimalist: {
    background: "#F5F5F5",
    primary: "#2C3E50",
    secondary: "#95A5A6",
    accent: "#3498DB",
  },
  mystical: {
    background: "#1A0B2E",
    primary: "#E6D5FF",
    secondary: "#9D84B7",
    accent: "#FFD700",
  },
  gradient: {
    background: ["#667EEA", "#764BA2"],
    primary: "#FFFFFF",
    secondary: "#F0E6FF",
    accent: "#FFD700",
  },
};

const elementLuckyColors: Record<Element, string[]> = {
  fire: [
    "Sunset Orange",
    "Crimson Flame",
    "Golden Ember",
    "Radiant Amber",
    "Scarlet Spark",
  ],
  earth: [
    "Forest Green",
    "Olive Moss",
    "Cedar Brown",
    "Golden Wheat",
    "Sage Leaf",
  ],
  air: [
    "Sky Blue",
    "Sunlit Yellow",
    "Lavender Breeze",
    "Pale Aqua",
    "Silver Mist",
  ],
  water: [
    "Deep Sea Blue",
    "Indigo Tide",
    "Aqua Wave",
    "Moonlit Teal",
    "Royal Plum",
  ],
};

// Daily vibes pool
const dailyVibes = [
  "Energetic & Bold",
  "Calm & Reflective",
  "Creative & Inspired",
  "Focused & Determined",
  "Playful & Light",
  "Mysterious & Introspective",
  "Optimistic & Bright",
  "Grounded & Stable",
];

const symbolFontFamily = (() => {
  const candidateFonts = [
    { path: "/System/Library/Fonts/Apple Symbols.ttf", family: "AppleSymbols" },
    { path: "/System/Library/Fonts/Supplemental/NotoSansSymbols2-Regular.otf", family: "NotoSansSymbols2" },
    { path: "/System/Library/Fonts/Supplemental/Symbola.ttc", family: "Symbola" },
    { path: "/usr/share/fonts/truetype/noto/NotoSansSymbols2-Regular.ttf", family: "NotoSansSymbols2" },
    { path: "/usr/share/fonts/truetype/ancient-scripts/Symbola.ttf", family: "Symbola" },
  ];

  for (const { path: fontPath, family } of candidateFonts) {
    if (fs.existsSync(fontPath)) {
      try {
        registerFont(fontPath, { family });
        console.log(`🆙 Registered zodiac symbol font: ${family}`);
        return family;
      } catch (error) {
        console.warn(`⚠️ Could not register font "${family}" at ${fontPath}:`, error);
      }
    }
  }

  console.warn("⚠️ No dedicated zodiac symbol font found. Falling back to sans-serif.");
  return "sans-serif";
})();

function getPaletteForSign(zodiacSign: ZodiacSign, style: StyleOption): Palette {
  const element = zodiacElementMap[zodiacSign];
  const elementTheme = elementColorThemes[element];
  const basePalette = { ...stylePalettes[style] };

  if (style === "gradient") {
    basePalette.background = elementTheme.gradientBackground;
    basePalette.secondary = elementTheme.gradientSecondary;
    if (elementTheme.gradientPrimary) {
      basePalette.primary = elementTheme.gradientPrimary;
    } else {
      basePalette.primary = "#FFFFFF";
    }
  }

  basePalette.accent = elementTheme.accent;

  return basePalette;
}

function getLuckyColorForSign(zodiacSign: ZodiacSign): string {
  const element = zodiacElementMap[zodiacSign];
  const options = elementLuckyColors[element];
  return options[Math.floor(Math.random() * options.length)];
}

function getDailyVibe(): string {
  return dailyVibes[Math.floor(Math.random() * dailyVibes.length)];
}

// Create MCP Server
export const mcpServer = new Server(
  {
    name: "astro-daily",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define tool argument schema
const GenerateHoroscopeArgsSchema = z.object({
  zodiac_sign: z.enum(zodiacSigns).describe("The zodiac sign for the horoscope"),
  style: z.enum(styleOptions).optional().default("minimalist").describe("Visual style of the graphic: minimalist, mystical, or gradient"),
});

// Tool implementation function
async function generateDailyHoroscope(zodiac_sign: ZodiacSign, style: StyleOption = "minimalist") {
    try {
      console.log(`Generating horoscope for ${zodiac_sign} in ${style} style...`);

      // 1. Generate horoscope text with OpenAI
      const completion = await getOpenAI().chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content:
              "You are a creative astrologer. Generate a inspiring, positive daily horoscope in 2-4 sentences. Be specific and uplifting.",
          },
          {
            role: "user",
            content: `Generate a daily horoscope for ${zodiac_sign}. Make it inspiring and specific to today.`,
          },
        ],
        temperature: 0.9,
        max_tokens: 150,
      });

      const horoscopeText = completion.choices[0].message.content || "Your stars shine bright today!";

      // 2. Generate lucky number (1-99)
      const luckyNumber = Math.floor(Math.random() * 99) + 1;

      // 3. Generate lucky color
      const luckyColor = getLuckyColorForSign(zodiac_sign);

      // 4. Generate daily vibe
      const dailyVibe = getDailyVibe();

      // 5. Create 1080x1920 PNG graphic with Canvas
      const canvas = createCanvas(1080, 1920);
      const ctx = canvas.getContext("2d");

      // Get color palette
      const palette = getPaletteForSign(zodiac_sign, style);

      // Draw background
      if (style === "gradient" && Array.isArray(palette.background)) {
        const gradient = ctx.createLinearGradient(0, 0, 0, 1920);
        gradient.addColorStop(0, palette.background[0]);
        gradient.addColorStop(1, palette.background[1]);
        ctx.fillStyle = gradient;
      } else {
        ctx.fillStyle = palette.background as string;
      }
      ctx.fillRect(0, 0, 1080, 1920);

      // Add decorative elements based on style
      if (style === "mystical") {
        // Add stars
        ctx.fillStyle = palette.accent;
        for (let i = 0; i < 50; i++) {
          const x = Math.random() * 1080;
          const y = Math.random() * 1920;
          const radius = Math.random() * 2 + 1;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Title: Zodiac Sign
      ctx.fillStyle = palette.primary;
      ctx.font = "bold 90px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(zodiac_sign.toUpperCase(), 540, 170);

      // Zodiac Symbol
      const zodiacSymbol = zodiacSymbolMap[zodiac_sign];
      if (zodiacSymbol) {
        ctx.fillStyle = palette.accent;
        ctx.font = `160px ${symbolFontFamily}`;
        ctx.fillText(zodiacSymbol, 540, 330);
      }

      // Subtitle: Today's Horoscope
      ctx.fillStyle = palette.secondary;
      ctx.font = "32px sans-serif";
      ctx.fillText("Today's Horoscope", 540, 420);

      // Date
      const today = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      ctx.font = "24px sans-serif";
      ctx.fillText(today, 540, 470);

      // Horoscope text (wrapped)
      ctx.fillStyle = palette.primary;
      ctx.font = "36px sans-serif";
      ctx.textAlign = "center";
      const words = horoscopeText.split(" ");
      let line = "";
      let y = 620;
      const maxWidth = 900;

      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + " ";
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && i > 0) {
          ctx.fillText(line, 540, y);
          line = words[i] + " ";
          y += 50;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, 540, y);

      // Info boxes
      const boxY = 1240;
      const boxSpacing = 200;

      // Lucky Number
      ctx.fillStyle = palette.accent;
      ctx.font = "bold 28px sans-serif";
      ctx.fillText("LUCKY NUMBER", 540, boxY);
      ctx.fillStyle = palette.primary;
      ctx.font = "bold 72px sans-serif";
      ctx.fillText(luckyNumber.toString(), 540, boxY + 80);

      // Lucky Color
      ctx.fillStyle = palette.accent;
      ctx.font = "bold 28px sans-serif";
      ctx.fillText("LUCKY COLOR", 540, boxY + boxSpacing);
      ctx.fillStyle = palette.primary;
      ctx.font = "36px sans-serif";
      ctx.fillText(luckyColor, 540, boxY + boxSpacing + 60);

      // Daily Vibe
      ctx.fillStyle = palette.accent;
      ctx.font = "bold 28px sans-serif";
      ctx.fillText("TODAY'S VIBE", 540, boxY + boxSpacing * 2);
      ctx.fillStyle = palette.primary;
      ctx.font = "36px sans-serif";
      ctx.fillText(dailyVibe, 540, boxY + boxSpacing * 2 + 60);

      // Footer
      ctx.fillStyle = palette.secondary;
      ctx.font = "24px sans-serif";
      ctx.fillText("✨ Astro Daily ✨", 540, 1850);

      // 6. Save to /output folder
      const outputDir = path.join(process.cwd(), "output");
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const timestamp = Date.now();
      const filename = `${zodiac_sign}_${style}_${timestamp}.png`;
      const filepath = path.join(outputDir, filename);

      const buffer = canvas.toBuffer("image/png");
      fs.writeFileSync(filepath, buffer);

      // 7. Return image URL and base64 data to ChatGPT
      const base64Image = buffer.toString("base64");
      const imageUrl = `file://${filepath}`;

      console.log(`✨ Horoscope generated: ${filepath}`);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              zodiac_sign,
              style,
              horoscope_text: horoscopeText,
              lucky_number: luckyNumber,
              lucky_color: luckyColor,
              daily_vibe: dailyVibe,
              image_path: filepath,
              image_url: imageUrl,
            }, null, 2),
          },
          {
            type: "image",
            data: base64Image,
            mimeType: "image/png",
          },
        ],
      };
    } catch (error) {
      console.error("Error generating horoscope:", error);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : "Unknown error",
            }),
          },
        ],
        isError: true,
      };
    }
}

// Register tools/list handler
mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "generate_daily_horoscope",
        description: "Generates a beautiful daily horoscope graphic with AI-generated text, lucky number, lucky color, and daily vibe. Returns an Instagram story-sized image (1080x1920) that can be displayed in ChatGPT.",
        inputSchema: {
          type: "object",
          properties: {
            zodiac_sign: {
              type: "string",
              enum: [...zodiacSigns],
              description: "The zodiac sign for the horoscope",
            },
            style: {
              type: "string",
              enum: [...styleOptions],
              description: "Visual style of the graphic: minimalist, mystical, or gradient",
            },
          },
          required: ["zodiac_sign"],
        },
      },
    ],
  };
});

// Register tools/call handler
mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "generate_daily_horoscope") {
    try {
      // Validate arguments
      const parsed = GenerateHoroscopeArgsSchema.parse(args);
      const { zodiac_sign, style } = parsed;

      // Call tool implementation
      return await generateDailyHoroscope(zodiac_sign, style);
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
        ],
        isError: true,
      };
    }
  }

  throw new Error(`Unknown tool: ${name}`);
});

// Transport management
export const transports = new Map<string, SSEServerTransport>();

export async function createTransport(res: any): Promise<SSEServerTransport> {
  const transport = new SSEServerTransport("/mcp/message", res);

  // Connect transport to server (this calls start() automatically)
  await mcpServer.connect(transport);

  // Store using the transport's own sessionId
  transports.set(transport.sessionId, transport);

  // Handle transport cleanup
  transport.onclose = () => {
    console.log(`🧹 Cleaning up transport for session: ${transport.sessionId}`);
    transports.delete(transport.sessionId);
  };

  console.log(`✅ MCP transport created for session: ${transport.sessionId}`);

  return transport;
}

export function getTransport(sessionId: string): SSEServerTransport | undefined {
  return transports.get(sessionId);
}
