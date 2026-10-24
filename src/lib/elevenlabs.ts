// Text-to-speech via ElevenLabs. Used by the Scan & Speak page to voice the
// classification result, and could also back the route-brief audio.

const DEFAULT_VOICE_ID =
  process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM"; // "Rachel" — replace with a Hindi-friendly voice you pick in ElevenLabs

export async function textToSpeech(text: string): Promise<ArrayBuffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY is not set. Add it to .env.local — see SETUP.md.");
  }

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${DEFAULT_VOICE_ID}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.4, similarity_boost: 0.8 },
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`ElevenLabs TTS error ${res.status}: ${errText}`);
  }

  return res.arrayBuffer();
}
