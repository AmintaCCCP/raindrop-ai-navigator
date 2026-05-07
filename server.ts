import express from 'express';
import { createServer as createViteServer } from 'vite';
import axios from 'axios';
import cors from 'cors';
import { OpenAI } from 'openai';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Helper for raindrop API
  const getRaindropHeaders = (req: any) => {
    const apiKey = req.headers['x-raindrop-key'] || process.env.RAINDROP_API_KEY;
    if (!apiKey) throw new Error('RAINDROP_API_KEY is missing. Please configure it in settings.');
    return { Authorization: `Bearer ${apiKey}` };
  };

  // --- API Routes ---

  // 0. Auth check
  app.get('/api/check-auth', (req, res) => {
    const key = process.env.LOGIN_KEY || process.env.VITE_LOGIN_KEY;
    res.json({ authRequired: !!key });
  });

  app.post('/api/check-auth', (req, res) => {
    const key = process.env.LOGIN_KEY || process.env.VITE_LOGIN_KEY;
    if (!key) return res.json({ success: true });
    if (req.body.key === key) return res.json({ success: true });
    res.status(401).json({ success: false, error: 'Invalid key' });
  });

  // 1. Get Collections
  app.get('/api/raindrop/collections', async (req, res) => {
    try {
      const hdrs = getRaindropHeaders(req);
      const [rootRes, childRes] = await Promise.all([
        axios.get('https://api.raindrop.io/rest/v1/collections', { headers: hdrs }),
        axios.get('https://api.raindrop.io/rest/v1/collections/childrens', { headers: hdrs })
      ]);
      const items = [...(rootRes.data?.items || []), ...(childRes.data?.items || [])];
      res.json({ result: true, items });
    } catch (error: any) {
      console.error('Error fetching collections:', error.response?.data || error.message);
      res.status(error.response?.status || 500).json({ error: 'Failed to fetch collections' });
    }
  });

  // 2. Get Bookmarks (Raindrops)
  app.get('/api/raindrop/bookmarks/:collectionId', async (req, res) => {
    try {
      const { collectionId } = req.params;
      const { page = 0, perpage = 50 } = req.query;
      const response = await axios.get(`https://api.raindrop.io/rest/v1/raindrops/${collectionId}`, {
        headers: getRaindropHeaders(req),
        params: { page, perpage },
      });
      res.json(response.data);
    } catch (error: any) {
      console.error('Error fetching bookmarks:', error.response?.data || error.message);
      res.status(error.response?.status || 500).json({ error: 'Failed to fetch bookmarks' });
    }
  });

  // 3. Update Bookmark
  app.put('/api/raindrop/bookmarks/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const response = await axios.put(`https://api.raindrop.io/rest/v1/raindrop/${id}`, data, {
        headers: getRaindropHeaders(req),
      });
      res.json(response.data);
    } catch (error: any) {
      console.error('Error updating bookmark:', error.response?.data || error.message);
      res.status(error.response?.status || 500).json({ error: 'Failed to update bookmark' });
    }
  });

  // 4. Delete Bookmark
  app.delete('/api/raindrop/bookmarks/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const response = await axios.delete(`https://api.raindrop.io/rest/v1/raindrop/${id}`, {
        headers: getRaindropHeaders(req),
      });
      res.json(response.data);
    } catch (error: any) {
      console.error('Error deleting bookmark:', error.response?.data || error.message);
      res.status(error.response?.status || 500).json({ error: 'Failed to delete bookmark' });
    }
  });

  // 5. Check dead link
  app.post('/api/util/check-link', async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) return res.status(400).json({ error: 'URL is required' });
      
      // Use a GET request with a short timeout to prevent hanging
      const response = await axios.get(url, { timeout: 8000, 
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' } 
      });
      res.json({ status: response.status, alive: response.status >= 200 && response.status < 400 });
    } catch (error: any) {
      // If it fails structurally, or times out, it's considered dead
      const status = error.response?.status || 500;
      res.json({ status, alive: false, message: error.message });
    }
  });

  // 6. AI Enrich (Generate tags/description)
  app.post('/api/ai/enrich', async (req, res) => {
    try {
      const { url, title, currentDescription, settings } = req.body;
      const { baseUrl, apiKey, modelId, language } = settings || {};

      if (!apiKey || !modelId) {
        return res.status(400).json({ error: 'Missing AI provider settings. Please configure them in the settings.' });
      }

      const openai = new OpenAI({
        apiKey,
        baseURL: baseUrl || undefined, // Allow undefined for default OpenAI URL
      });

      const prompt = `
You are an expert web content categorizer. Given the following URL, Title, and maybe partial description of a website, generate a refined descriptive summary (max 3 sentences) and exactly 4 relevant tags. 

Target Output Language: ${language || 'English'}
URL: ${url}
Title: ${title}
Current Description: ${currentDescription || 'None'}

Respond STRICTLY in JSON format with two fields:
{
  "description": "...",
  "tags": ["tag1", "tag2", "tag3", "tag4"]
}`;

      const chatCompletion = await openai.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: modelId,
        response_format: { type: "json_object" }, // ensure we get json
      });

      let content = chatCompletion.choices[0].message.content;
      if (!content) {
         throw new Error("No content received from AI.");
      }

      res.json(JSON.parse(content));
    } catch (error: any) {
      console.error('Error enriching content via AI:', error);
      res.status(500).json({ error: error.message || 'Failed to enrich with AI' });
    }
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
