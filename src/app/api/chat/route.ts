// src/app/api/chat/route.ts
// ⚠️ CRITICAL: This file MUST be at src/app/api/chat/route.ts
// NOT at src/api/chat/route.ts - that location will cause 404 errors!

import { NextRequest, NextResponse } from 'next/server';

// OPTION 1: OpenRouter (RECOMMENDED - Free tier: 200 requests/day)
// Get your free API key at: https://openrouter.ai/
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// OPTION 2: Google Gemini (Free tier: 1500 requests/day)
// Get your free API key at: https://aistudio.google.com/
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// OPTION 3: Groq (Free tier with fast inference)
// Get your free API key at: https://console.groq.com/
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Determine which provider to use based on available keys
function getProvider(): 'openrouter' | 'gemini' | 'groq' | null {
  if (OPENROUTER_API_KEY) return 'openrouter';
  if (GEMINI_API_KEY) return 'gemini';
  if (GROQ_API_KEY) return 'groq';
  return null;
}

export async function POST(req: NextRequest) {
  console.log('\n=== Chat API Called ===');
  
  const provider = getProvider();
  
  if (!provider) {
    console.error('No API key configured. Set one of: OPENROUTER_API_KEY, GEMINI_API_KEY, or GROQ_API_KEY');
    return NextResponse.json({ 
      error: 'No API key configured', 
      fallback: true 
    }, { status: 500 });
  }

  console.log(`Using provider: ${provider}`);

  try {
    const body = await req.json();
    const { query, context } = body;
    
    if (!query) {
      return NextResponse.json({ error: 'Query required' }, { status: 400 });
    }

    console.log(`Query: "${query.substring(0, 50)}..."`);

    const systemPrompt = `You are Portfolio AI, Yash Shah's professional AI assistant. You help visitors learn about Yash's portfolio.

Context about Yash:
${context || 'Yash is a Data Scientist and AI/ML Engineer with an MS from NJIT.'}

Rules:
- Be concise (2-3 sentences max)
- Only use information from the context provided
- Be professional, friendly, and helpful
- If you don't know something, say so honestly`;

    let responseText: string;

    // ============ OPENROUTER ============
    if (provider === 'openrouter') {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://yashshah.dev', // Your site URL
          'X-Title': 'Portfolio AI' // Your app name
        },
        body: JSON.stringify({
          // Free models on OpenRouter (no credit card required)
          model: 'meta-llama/llama-3.3-70b-instruct:free',
          // Alternative free models:
          // model: 'deepseek/deepseek-r1:free',
          // model: 'mistralai/mistral-7b-instruct:free',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: query }
          ],
          max_tokens: 200,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('OpenRouter error:', error);
        throw new Error(`OpenRouter error: ${response.status}`);
      }

      const data = await response.json();
      responseText = data.choices?.[0]?.message?.content || '';
    }
    
    // ============ GEMINI ============
    else if (provider === 'gemini') {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: `${systemPrompt}\n\nUser: ${query}` }]
            }],
            generationConfig: {
              maxOutputTokens: 200,
              temperature: 0.7
            }
          })
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error('Gemini error:', error);
        throw new Error(`Gemini error: ${response.status}`);
      }

      const data = await response.json();
      responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }
    
    // ============ GROQ ============
    else if (provider === 'groq') {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile', // or 'mixtral-8x7b-32768'
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: query }
          ],
          max_tokens: 200,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Groq error:', error);
        throw new Error(`Groq error: ${response.status}`);
      }

      const data = await response.json();
      responseText = data.choices?.[0]?.message?.content || '';
    }
    
    else {
      throw new Error('No provider configured');
    }

    if (!responseText) {
      throw new Error('No text in response');
    }

    console.log(`Response: "${responseText.substring(0, 100)}..."`);

    return NextResponse.json({
      text: responseText.trim(),
      source: provider
    });

  } catch (error: any) {
    console.error('API Error:', error.message);
    return NextResponse.json({
      error: error.message,
      fallback: true
    }, { status: 500 });
  }
}
