import express from 'express';
import {GoogleGenAI, Type} from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import {fileURLToPath} from 'url';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  app.use(express.json());

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  app.post('/api/chat', async (req, res) => {
    const {message} = req.body;

    if (!message) {
      return res.status(400).json({error: 'Message is required'});
    }

    try {
      const interaction = await ai.interactions.create({
        model: 'gemini-3.5-flash',
        input: message,
      });

      res.json({text: interaction.output_text});
    } catch (error: any) {
      console.error('Gemini API Error:', error);
      res.status(500).json({error: error.message || 'Failed to generate response'});
    }
  });

  app.post('/api/ai/parse-product', async (req, res) => {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    try {
      let augmentedText = text;
      
      // Basic URL extraction
      const urlMatch = text.match(/(https?:\/\/[^\s]+)/);
      if (urlMatch) {
        const urlToFetch = urlMatch[0];
        try {
          const fetchRes = await fetch(urlToFetch, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
          });
          const html = await fetchRes.text();
          const cheerio = await import('cheerio');
          const $ = cheerio.load(html);
          
          const title = $('title').text() || $('meta[property="og:title"]').attr('content') || '';
          const description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '';
          const ogImage = $('meta[property="og:image"]').attr('content') || '';
          
          // Shein specific or generic images
          const images: string[] = [];
          if (ogImage) images.push(ogImage);
          $('img').each((i, el) => {
             const src = $(el).attr('src') || $(el).attr('data-src');
             if (src && src.startsWith('http') && !src.includes('icon') && !src.includes('logo')) {
               images.push(src);
             }
          });

          augmentedText += `\n\n--- EXTRACTION FROM URL ---\nTitle: ${title}\nDescription: ${description}\nImages: ${images.slice(0, 5).join(', ')}\nSource URL: ${urlToFetch}`;
        } catch (fetchErr) {
          console.error("Failed to scrape URL:", fetchErr);
        }
      }

      const prompt = `
        Extract product details from the following text (which might be a SHEIN product link description or raw text).
        - If you find any image URLs (ending in .jpg, .png, .webp, etc. or containing image CDNs), include the best one as 'image' and all of them in 'images'.
        - If you find a URL starting with http, include it as originalUrl.
        - Try your best to find the product SKU or Item ID as suggestedCode.
        
        CRITICAL CATEGORY RULES:
        - If the item is a dress, shirt, pants, coat, abaya, or any clothing/fashion item -> Use "الأزياء الراقية".
        - If the item is perfume, cologne, incense, oud -> Use "العطور والعود".
        - If the item is jewelry, watch, ring, necklace -> Use "المجوهرات والساعات".
        - If the item is makeup, skincare, cosmetics, lotion -> Use "الجمال والعناية".
        - If the item is decor, home appliance, furniture, electronics (like kitchen devices) -> Use "المنزل واللايف ستايل"
        - If it's a gift set -> Use "ركن الهدايا".

        Text to parse: ${augmentedText}
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              price: { type: Type.NUMBER },
              description: { type: Type.STRING },
              category: { 
                type: Type.STRING,
                description: "One of: الأزياء الراقية, العطور والعود, المجوهرات والساعات, الجمال والعناية, المنزل واللايف ستايل, ركن الهدايا"
              },
              subCategory: { type: Type.STRING },
              tags: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              image: { type: Type.STRING },
              images: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              suggestedCode: { type: Type.STRING },
              originalUrl: { type: Type.STRING, description: "The original SHEIN or product link if found" }
            },
            required: ["name", "price", "description", "category", "subCategory"]
          }
        }
      });

      const responseText = response.text || '{}';
      const productData = JSON.parse(responseText);

      res.json(productData);
    } catch (error: any) {
      console.error('AI Parsing Error:', error);
      res.status(500).json({ error: 'Failed to parse product info' });
    }
  });

  // Vite middleware for development
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

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
