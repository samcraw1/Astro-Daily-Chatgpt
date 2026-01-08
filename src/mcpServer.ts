import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import OpenAI from "openai";

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

function getLuckyColorForSign(zodiacSign: ZodiacSign): string {
  const element = zodiacElementMap[zodiacSign];
  const options = elementLuckyColors[element];
  return options[Math.floor(Math.random() * options.length)];
}

function getDailyVibe(): string {
  return dailyVibes[Math.floor(Math.random() * dailyVibes.length)];
}

function getBackgroundDescription(style: StyleOption, element: Element): string {
  const elementScenes = {
    fire: "warm sunset oranges and reds",
    earth: "forest greens and earth tones",
    air: "ethereal blues and purples",
    water: "deep ocean blues and indigos"
  };

  const baseScene = elementScenes[element];

  switch (style) {
    case "mystical":
      return `Dramatic cosmic scene with ${baseScene}, silhouette of person gazing at stars, constellation patterns, magical glow`;
    case "gradient":
      return `Smooth modern gradient in ${baseScene}, vibrant, ethereal, contemporary`;
    case "minimalist":
      return `Clean minimalist ${baseScene}, subtle texture, elegant, sophisticated`;
    default:
      return baseScene;
  }
}

function buildDALLEPrompt(
  zodiacSign: ZodiacSign,
  style: StyleOption,
  horoscopeText: string,
  luckyNumber: number,
  luckyColor: string,
  dailyVibe: string,
  date: string
): string {
  const element = zodiacElementMap[zodiacSign];
  const zodiacSymbol = zodiacSymbolMap[zodiacSign];
  const backgroundDescription = getBackgroundDescription(style, element);

  return `Create a professional Instagram story graphic (9:16 vertical format, 1080x1920px):

BACKGROUND:
${backgroundDescription}

TEXT ELEMENTS (all must be clearly readable):

1. TOP: Large elegant gold script text "${zodiacSign.toUpperCase()}"
   Below: italic white serif "Today's Horoscope"
   Below: small gray "${date}"
   Include ${zodiacSign} constellation symbol (${zodiacSymbol}) glowing subtly

2. CENTER: White sans-serif font, center-aligned:
   "${horoscopeText}"
   (with text shadow for readability)

3. BOTTOM:
   Left: "LUCKY NUMBER" in gold, "${luckyNumber}" in large white
   Right: "LUCKY COLOR" in gold, "${luckyColor}" in white
   Center: "TODAY'S VIBE" in gold, "${dailyVibe}" in white

4. FOOTER: "✨ Astro Daily ✨" in small silver

TYPOGRAPHY:
- Title: Elegant script (Great Vibes/Edwardian Script style)
- Body: Clean sans-serif (Helvetica/Inter style)
- Gold: #FFD700
- All text crisp with shadows/outlines for readability

AESTHETIC: Instagram story, professional, cinematic, inspirational`;
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

    // Generate horoscope text with GPT-4
    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are a creative astrologer. Generate an inspiring, positive daily horoscope in 2-4 sentences. Be specific and uplifting. Keep it concise for Instagram.",
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
    const luckyNumber = Math.floor(Math.random() * 99) + 1;
    const luckyColor = getLuckyColorForSign(zodiac_sign);
    const dailyVibe = getDailyVibe();
    const today = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Build DALL-E prompt
    const dallePrompt = buildDALLEPrompt(
      zodiac_sign,
      style,
      horoscopeText,
      luckyNumber,
      luckyColor,
      dailyVibe,
      today
    );

    // Call DALL-E to generate image
    const dalleResponse = await getOpenAI().images.generate({
      model: "dall-e-3",
      prompt: dallePrompt,
      n: 1,
      size: "1024x1792",
      quality: "hd", // HD for better text rendering
    });

    const imageUrl = dalleResponse.data[0].url;

    console.log(`✨ Horoscope generated for ${zodiac_sign}`);

    // Return with image URL for ChatGPT to display
    return {
      content: [
        {
          type: "text",
          text: `Here's your ${zodiac_sign.toUpperCase()} horoscope for ${today}!

**Horoscope:** ${horoscopeText}

**Lucky Number:** ${luckyNumber}
**Lucky Color:** ${luckyColor}
**Today's Vibe:** ${dailyVibe}

Your Instagram-style horoscope graphic: ${imageUrl}`,
        },
      ],
    };
  } catch (error) {
    console.error("Error generating horoscope:", error);
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
