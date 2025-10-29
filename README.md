# Astro Daily - MCP Horoscope Generator

A Model Context Protocol (MCP) server that generates beautiful daily horoscope graphics for ChatGPT. Simply ask for your horoscope and get an AI-generated prediction with a stunning Instagram story-sized image.

## What It Does

**Single Tool:** `generate_daily_horoscope`

When you ask ChatGPT "Give me my Scorpio horoscope", this MCP server:
1. Generates personalized horoscope text using OpenAI GPT-4
2. Creates a lucky number (1-99)
3. Picks a lucky color
4. Selects a daily vibe/mood
5. Generates a beautiful 1080x1920 Instagram story graphic
6. Returns the image directly in ChatGPT

## Features

- **12 Zodiac Signs:** Aries, Taurus, Gemini, Cancer, Leo, Virgo, Libra, Scorpio, Sagittarius, Capricorn, Aquarius, Pisces
- **3 Visual Styles:**
  - `minimalist` - Clean, modern design
  - `mystical` - Dark theme with stars
  - `gradient` - Vibrant gradient backgrounds
- **AI-Generated Content:** Fresh horoscopes every time using GPT-4
- **Instagram Ready:** Perfect 1080x1920 story format

## Prerequisites

- Node.js 18+ installed
- OpenAI API key
- ChatGPT with MCP support

## Installation

1. **Clone or create the project:**
   ```bash
   cd "Astro Daily"
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```

   Then edit `.env.local` with your OpenAI API key:
   ```
   OPENAI_API_KEY=sk-...your-key-here
   PORT=3000
   ```

## Running the Server

### Development mode (with auto-reload):
```bash
npm run dev
```

### Production mode:
```bash
npm run build
npm start
```

You should see:
```
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║        ✨ Astro Daily MCP Server Running ✨              ║
║                                                           ║
║  Server URL: http://localhost:3000                        ║
║  SSE Endpoint: http://localhost:3000/mcp                  ║
║  Message Endpoint: http://localhost:3000/mcp/message      ║
║                                                           ║
║  Ready to generate beautiful horoscope graphics! 🌟      ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

## Connecting to ChatGPT

1. Open ChatGPT desktop app or web interface with MCP support
2. Go to Settings → MCP Servers
3. Add a new server with URL: `http://localhost:3000/mcp`
4. Save and reconnect

## Usage Examples

Once connected, try these prompts in ChatGPT:

```
"Give me my Scorpio horoscope"
"What's the horoscope for Leo today?"
"Generate a mystical style horoscope for Pisces"
"Show me a gradient horoscope for Aries"
```

ChatGPT will call the `generate_daily_horoscope` tool and display your personalized horoscope image.

## API Reference

### Tool: generate_daily_horoscope

**Parameters:**
- `zodiac_sign` (required): One of: aries, taurus, gemini, cancer, leo, virgo, libra, scorpio, sagittarius, capricorn, aquarius, pisces
- `style` (optional): One of: minimalist, mystical, gradient (default: minimalist)

**Returns:**
- JSON with horoscope data
- Base64 encoded PNG image (1080x1920)

**Example:**
```json
{
  "zodiac_sign": "scorpio",
  "style": "mystical",
  "horoscope_text": "Your intuition is heightened today...",
  "lucky_number": 42,
  "lucky_color": "Royal Purple",
  "daily_vibe": "Mysterious & Introspective",
  "image_path": "/path/to/output/scorpio_mystical_1234567890.png"
}
```

## Project Structure

```
Astro Daily/
├── src/
│   ├── mcpServer.ts      # MCP server with generate_daily_horoscope tool
│   └── server.ts         # Express server with SSE endpoints
├── output/               # Generated horoscope images saved here
├── .env.local           # Your environment variables (not committed)
├── .env.example         # Example environment variables
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
└── README.md           # This file
```

## Technical Details

### MCP Architecture

This server implements the Model Context Protocol using:

1. **SSE Transport** - Server-Sent Events for real-time ChatGPT connection
2. **Tool Registration** - Single `generate_daily_horoscope` tool with Zod validation
3. **Session Management** - Unique session IDs for each ChatGPT connection
4. **Image Generation** - Canvas API for creating graphics
5. **AI Integration** - OpenAI GPT-4 for horoscope text generation

### Endpoints

- `GET /` - Health check and server info
- `GET /mcp` - Establish SSE connection (used by ChatGPT)
- `POST /mcp/message?sessionId={id}` - Receive tool calls from ChatGPT
- `GET /output/*` - Static file serving for generated images

## Troubleshooting

**"Session not found" error:**
- Restart the MCP server
- Reconnect ChatGPT to the server

**"Missing OpenAI API key" error:**
- Check that `.env.local` exists with `OPENAI_API_KEY`
- Restart the server after adding the key

**Canvas installation issues:**
- On macOS: `brew install pkg-config cairo pango libpng jpeg giflib librsvg`
- On Ubuntu: `sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev`

**Port already in use:**
- Change `PORT` in `.env.local` to a different number (e.g., 3001)

## Development

To modify the horoscope generation:

1. **Change colors/styles:** Edit `stylePalettes` in `src/mcpServer.ts:45-61`
2. **Add new vibes:** Update `dailyVibes` array in `src/mcpServer.ts:75-82`
3. **Modify layout:** Edit canvas drawing code in `src/mcpServer.ts:154-245`
4. **Change AI prompt:** Update OpenAI completion in `src/mcpServer.ts:115-127`

## License

MIT

---

Made with ✨ for beautiful daily horoscopes
