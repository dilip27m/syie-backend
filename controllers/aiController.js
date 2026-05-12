const { GoogleGenAI } = require('@google/genai');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Models to try in order — fallback chain for quota/availability issues
const MODELS = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-2.5-flash'];

const PROMPT_PREFIX = `You are a helpful writing assistant for a college placement portal. 
Rephrase and improve the following interview experience write-up for clarity, readability, and professionalism.

Rules:
- Keep ALL technical details, company names, round descriptions, and specific questions intact
- Maintain the original structure (rounds, tips, etc.) but improve grammar and flow
- Use clear formatting with bullet points and sections where appropriate
- Keep the tone authentic and student-friendly — not overly corporate
- Do NOT add any information that wasn't in the original
- Do NOT wrap the output in markdown code blocks
- Return ONLY the rephrased text, no preamble or commentary

Original text:
`;

/**
 * @route   POST /api/ai/rephrase
 * @desc    Rephrase interview experience text using Gemini
 * @access  Private
 */
const rephrase = asyncHandler(async (req, res) => {
  const { text } = req.body;

  if (!text || text.trim().length < 10) {
    throw new AppError('Text must be at least 10 characters long', 400);
  }

  if (!process.env.GEMINI_API_KEY) {
    throw new AppError('AI service is not configured', 503);
  }

  let lastError = null;

  // Try each model in the fallback chain
  for (const model of MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: PROMPT_PREFIX + text,
      });

      const rephrased = response.text;

      if (!rephrased) {
        continue; // Try next model if empty response
      }

      return res.json({ rephrased, model });
    } catch (err) {
      console.error(`AI model ${model} failed:`, err.message);
      lastError = err;
      // Continue to next model
    }
  }

  // All models failed
  if (lastError?.status === 429 || lastError?.message?.includes('quota')) {
    throw new AppError('AI service is temporarily unavailable due to rate limits. Please try again in a minute.', 429);
  }

  throw new AppError('AI rephrasing failed. Please try again later.', 502);
});

module.exports = { rephrase };
