# BinBol — setup for the live demo

Hackathon submission deadline: **today, Oct 24 2026, 6:00 PM**. This doc is
the shortest path from this scaffold to a demoable app. Do these in order.

## 1. Get a Gemini API key (free, ~1 minute, no card)

1. Go to https://aistudio.google.com/apikey
2. Sign in with any Google account, click "Create API key".
3. Paste it into `.env.local` as `GEMINI_API_KEY=...`

This powers the photo → waste-stream classification (`src/lib/gemini.ts`).
Free tier is generous enough for a demo (15 req/min on `gemini-2.0-flash`).
If you'd rather use OpenAI or Anthropic vision instead, only
`src/lib/gemini.ts` needs to change — the rest of the app just calls
`classifyWasteImage()`.

## 2. Add your ElevenLabs API key

You said you already have one — paste it into `.env.local`:

```
ELEVENLABS_API_KEY=sk_...
```

Pick a voice from https://elevenlabs.io/app/voice-library (or your own
cloned voice) and put its id in `ELEVENLABS_VOICE_ID`. This powers the
"Speak" step in Scan & Speak (`src/lib/elevenlabs.ts` → `/api/tts`).

## 3. Set up the Conversational AI agent (Call & Report)

This is the one piece that needs manual dashboard configuration — it can't
be done from code.

1. Go to https://elevenlabs.io/app/conversational-ai → **Create an agent**.
2. **First message** (Hindi): `Namaste! BinBol mein aapka swagat hai. Kaunsa bin bhar gaya hai, ya kya report karna hai?`
3. **System prompt** — paste this:

   ```
   You are BinBol's phone/voice agent for an Indian college campus waste
   system. Callers are students, cleaning staff, or estate office staff
   reporting a full, overflowing, or mixed bin, in Hindi or English.

   Known bin stations: RJB-01 (Rajendra Bhawan, main gate), RJB-03
   (Rajendra Bhawan, behind mess), MESS-2 (Mess block 2, back door), GB-04
   (Govind Bhawan, common room side), KB-02 (Kasturba Bhawan, near
   parking), LHC-01 (LHC main entrance).

   When the caller describes a location (even vaguely, e.g. "peeche wala
   hara bin"), match it to the closest known station and confirm it with
   them before filing. Ask for: station, waste stream (wet/dry/hazardous/
   sanitary), and status (overflowing/full/mixed). Once confirmed, call the
   file_report tool. Always read the ticket id back to the caller in the
   language they used. Keep responses short — this is a phone call, not chat.
   ```

4. **Language**: set Hindi as a supported language (multilingual).
5. **Add a tool** → Server tool (webhook):
   - Name: `file_report`
   - Method: `POST`
   - URL: `https://<your-vercel-deployment>.vercel.app/api/reports`
   - Body parameters (the agent fills these from the conversation):
     - `stationId` (string, e.g. `RJB-03`)
     - `stream` (string enum: `wet`, `dry`, `hazardous`, `sanitary`)
     - `status` (string enum: `overflowing`, `full`, `mixed`)
     - `via` — hardcode to `"voice"`
     - `lang` (string: `hi` or `en`)
     - `note` (string, optional — anything extra the caller said)
   - The endpoint is already live at `src/app/api/reports/route.ts` and
     returns `{ ok: true, ticket: {...} }` with the ticket id — have the
     agent read `ticket.id` back to the caller.
6. Copy the **Agent ID** from the agent's settings page into
   `.env.local` as `NEXT_PUBLIC_ELEVENLABS_AGENT_ID=...`. This makes the
   mic widget appear on `/call` automatically.
7. **You must deploy first** (step 4) so the webhook has a real URL to hit —
   ElevenLabs can't call `localhost`. Update the tool URL after your first
   Vercel deploy, using the real deployment URL.

If you're short on time, the manual fallback form on `/call` already POSTs
to the exact same `/api/reports` endpoint, so the dashboard and routing
demo work even before the voice agent is wired up — do that step last if
you have to cut scope.

## 4. Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. On your phone (same wifi), use your laptop's
LAN IP instead of localhost so the camera (`capture="environment"`) and mic
work on a real device — camera input generally requires HTTPS on remote
origins, which is another reason to deploy to Vercel for the live demo.

## 5. Deploy to Vercel

```bash
npx vercel
```

(or connect the GitHub repo at vercel.com/new). Add the three env vars
(`ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, `GEMINI_API_KEY`,
`NEXT_PUBLIC_ELEVENLABS_AGENT_ID`) in the Vercel project's Environment
Variables settings, then redeploy. Use the resulting `https://*.vercel.app`
URL for:
- The QR code you print/display for "Scan & Speak" (point it at
  `/scan/RJB-03` etc., one per physical or printed bin).
- The ElevenLabs webhook URL in step 3.

## Known limitation (be upfront about this with judges)

The scan/report log (`src/lib/store.ts`) is an in-memory store, not a real
database — it's good enough for a single live demo session but will not
survive a Vercel cold start/redeploy. If asked "what's next," say: swap in
Supabase/Postgres for the pilot (mentioned as the natural next step, not a
gap you missed).

## What's seeded vs. what's real

- `src/lib/stations.ts` has 6 placeholder bin stations with placeholder
  coordinates. Swap in real IIT Roorkee bhawan locations if you want the
  dashboard to feel grounded for local judges.
- Nothing else is mocked — classification, TTS, ticket filing, and route
  scoring all run against your real API keys and real photos/voice.
