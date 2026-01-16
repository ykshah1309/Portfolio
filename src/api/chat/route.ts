// app/api/chat/route.ts (for App Router)
// OR pages/api/chat.ts (for Pages Router)

import { NextRequest, NextResponse } from 'next/server';
import { HfInference } from '@huggingface/inference';

// Initialize Hugging Face client with server-side API key
const HF_API_KEY = process.env.HF_API_KEY; // Remove NEXT_PUBLIC prefix
const HF_MODEL = "mistralai/Mistral-7B-Instruct-v0.3";

// Retry logic for handling cold starts and transient failures
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 2000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      console.error(`Attempt ${attempt + 1} failed:`, error.message);

      // Don't retry on certain errors
      if (error.message?.includes('401') || error.message?.includes('403')) {
        throw error; // Authentication errors shouldn't be retried
      }

      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

export async function POST(req: NextRequest) {
  console.log('\n=== API Route Called ===');
  
  try {
    // Validate API key
    if (!HF_API_KEY || HF_API_KEY === 'your-huggingface-key-here') {
      console.error('HF API key not configured');
      return NextResponse.json(
        { 
          error: 'API key not configured',
          fallback: true 
        },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { query, history, context } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request: query is required' },
        { status: 400 }
      );
    }

    console.log(`Query: "${query}"`);
    console.log(`History length: ${history?.length || 0}`);
    console.log(`Context provided: ${!!context}`);

    // Initialize Hugging Face client
    const hf = new HfInference(HF_API_KEY);

    // Build messages array for chat completion
    const messages: Array<{ role: string; content: string }> = [];

    // Add system prompt with context
    if (context) {
      messages.push({
        role: 'system',
        content: `You are Portfolio AI, Yash's professional AI assistant.

Context about Yash:
${context}

RULES:
1. Be concise (2-3 sentences max)
2. Only use information from context
3. For self-introduction: "I'm Portfolio AI, Yash's AI assistant that helps showcase his portfolio."
4. For projects: Mention briefly and suggest viewing details
5. For contact: Share email/LinkedIn/GitHub
6. For skills: List key technologies
7. For education: Mention NJIT and Mumbai University
8. If unsure: Say "Based on my knowledge: [relevant info from context]"
9. NEVER make up information not in context

Respond naturally and professionally.`
      });
    }

    // Add conversation history (last 6 messages)
    if (history && Array.isArray(history)) {
      const recentHistory = history.slice(-6);
      for (const msg of recentHistory) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({
            role: msg.role,
            content: msg.content
          });
        }
      }
    }

    // Add current query
    messages.push({
      role: 'user',
      content: query
    });

    console.log(`Calling Hugging Face API with ${messages.length} messages...`);

    // Make API call with retry logic
    const response = await retryWithBackoff(async () => {
      const result = await hf.chatCompletion({
        model: HF_MODEL,
        messages: messages,
        max_tokens: 150,
        temperature: 0.7,
        top_p: 0.9,
      });

      return result;
    }, 3, 2000);

    if (!response?.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from Hugging Face API');
    }

    const aiText = response.choices[0].message.content.trim();
    console.log(`API Response: "${aiText.substring(0, 100)}..."`);

    // Parse action if present (format: {"action":"OPEN_PROJECT","payload":{"projectId":"id"}})
    let action = null;
    const jsonMatch = aiText.match(/\{"action":\s*".*?"(?:,\s*"payload":\s*\{.*?\})?\}/);
    if (jsonMatch) {
      try {
        action = JSON.parse(jsonMatch[0]);
        console.log('Action detected:', action);
      } catch (e) {
        console.error('Failed to parse action JSON:', e);
      }
    }

    // Remove action JSON from text if present
    const cleanText = jsonMatch ? aiText.replace(jsonMatch[0], '').trim() : aiText;

    return NextResponse.json({
      text: cleanText || "I'm here to help you explore Yash's portfolio!",
      action: action,
      source: 'huggingface-api'
    });

  } catch (error: any) {
    console.error('API Route Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to generate response',
        details: error.message || 'Unknown error',
        fallback: true
      },
      { status: 500 }
    );
  }
}

// For Pages Router (pages/api/chat.ts), use this instead:
/*
import type { NextApiRequest, NextApiResponse } from 'next';
import { HfInference } from '@huggingface/inference';

const HF_API_KEY = process.env.HF_API_KEY;
const HF_MODEL = "mistralai/Mistral-7B-Instruct-v0.3";

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 2000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      console.error(`Attempt ${attempt + 1} failed:`, error.message);

      if (error.message?.includes('401') || error.message?.includes('403')) {
        throw error;
      }

      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('\n=== API Route Called ===');

  try {
    if (!HF_API_KEY || HF_API_KEY === 'your-huggingface-key-here') {
      console.error('HF API key not configured');
      return res.status(500).json({
        error: 'API key not configured',
        fallback: true
      });
    }

    const { query, history, context } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Invalid request: query is required' });
    }

    console.log(`Query: "${query}"`);

    const hf = new HfInference(HF_API_KEY);

    const messages: Array<{ role: string; content: string }> = [];

    if (context) {
      messages.push({
        role: 'system',
        content: `You are Portfolio AI, Yash's professional AI assistant.

Context about Yash:
${context}

RULES:
1. Be concise (2-3 sentences max)
2. Only use information from context
3. Respond naturally and professionally
4. Never make up information not in context`
      });
    }

    if (history && Array.isArray(history)) {
      const recentHistory = history.slice(-6);
      for (const msg of recentHistory) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({
            role: msg.role,
            content: msg.content
          });
        }
      }
    }

    messages.push({
      role: 'user',
      content: query
    });

    console.log(`Calling Hugging Face API...`);

    const response = await retryWithBackoff(async () => {
      return await hf.chatCompletion({
        model: HF_MODEL,
        messages: messages,
        max_tokens: 150,
        temperature: 0.7,
        top_p: 0.9,
      });
    }, 3, 2000);

    if (!response?.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from Hugging Face API');
    }

    const aiText = response.choices[0].message.content.trim();
    console.log(`API Response received`);

    let action = null;
    const jsonMatch = aiText.match(/\{"action":\s*".*?"(?:,\s*"payload":\s*\{.*?\})?\}/);
    if (jsonMatch) {
      try {
        action = JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error('Failed to parse action JSON:', e);
      }
    }

    const cleanText = jsonMatch ? aiText.replace(jsonMatch[0], '').trim() : aiText;

    return res.status(200).json({
      text: cleanText || "I'm here to help you explore Yash's portfolio!",
      action: action,
      source: 'huggingface-api'
    });

  } catch (error: any) {
    console.error('API Route Error:', error);

    return res.status(500).json({
      error: 'Failed to generate response',
      details: error.message || 'Unknown error',
      fallback: true
    });
  }
}
*/
