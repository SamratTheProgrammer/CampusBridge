import express from 'express';

const router = express.Router();

/**
 * GET /api/translate
 * Translates text into target language using Google Translate API endpoint
 * Query params:
 *   - text: string to translate (required)
 *   - target: target language code, defaults to 'hi' (Hindi)
 *   - source: source language code, defaults to 'auto'
 */
router.get('/', async (req, res) => {
  try {
    const { text, target = 'hi', source = 'auto' } = req.query;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Text query parameter is required' });
    }

    const trimmedText = text.trim();
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(source)}&tl=${encodeURIComponent(target)}&dt=t&q=${encodeURIComponent(trimmedText)}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Translation upstream returned status ${response.status}`);
    }

    const data = await response.json();
    let translatedText = '';
    if (Array.isArray(data[0])) {
      translatedText = data[0].map((item) => item[0]).filter(Boolean).join('');
    }
    const detectedSource = data[2] || 'auto';

    return res.json({
      success: true,
      originalText: trimmedText,
      translatedText: translatedText || trimmedText,
      detectedSource,
      targetLanguage: target,
    });
  } catch (error) {
    console.error('[CampusBridge Translate API Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to translate caption',
      error: error.message,
    });
  }
});

/**
 * POST /api/translate
 * Fallback POST endpoint for longer text/captions
 */
router.post('/', async (req, res) => {
  try {
    const { text, target = 'hi', source = 'auto' } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Text is required in body' });
    }

    const trimmedText = text.trim();
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(source)}&tl=${encodeURIComponent(target)}&dt=t&q=${encodeURIComponent(trimmedText)}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Translation upstream returned status ${response.status}`);
    }

    const data = await response.json();
    let translatedText = '';
    if (Array.isArray(data[0])) {
      translatedText = data[0].map((item) => item[0]).filter(Boolean).join('');
    }
    const detectedSource = data[2] || 'auto';

    return res.json({
      success: true,
      originalText: trimmedText,
      translatedText: translatedText || trimmedText,
      detectedSource,
      targetLanguage: target,
    });
  } catch (error) {
    console.error('[CampusBridge Translate API Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to translate caption',
      error: error.message,
    });
  }
});

export default router;
