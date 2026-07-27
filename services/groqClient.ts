/**
 * Groq API Client with Gemini Fallback
 *
 * Prioritizes Groq API for faster, cheaper inference on reasoning tasks.
 * Falls back to Gemini if Groq fails (rate limit, service issue, or billing).
 */

import axios, { AxiosError } from 'axios';
import { getGoogleGenAIClient, generateContent as geminiGenerateContent } from './apiKeys';

const isBrowser = typeof window !== 'undefined';

interface GroqMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface GroqRequest {
  model?: string;
  messages: GroqMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
}

interface GroqResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

function getGroqApiKey(): string {
  if (isBrowser) {
    return (import.meta as any).env?.VITE_GROQ_API_KEY || '';
  }
  return process.env.VITE_GROQ_API_KEY || '';
}

function getGroqEndpoint(): string {
  if (isBrowser) {
    return (import.meta as any).env?.VITE_GROQ_ENDPOINT_URL || 'https://api.groq.com/openai/v1';
  }
  return process.env.VITE_GROQ_ENDPOINT_URL || 'https://api.groq.com/openai/v1';
}

function getGroqModel(): string {
  if (isBrowser) {
    return (import.meta as any).env?.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile';
  }
  return process.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile';
}

/**
 * Call Groq API with exponential backoff retry
 */
export async function queryGroqWithFallback(
  messages: GroqMessage[],
  options: Partial<GroqRequest> = {}
): Promise<string> {
  const apiKey = getGroqApiKey();
  const endpoint = getGroqEndpoint();
  const model = options.model || getGroqModel();

  if (!apiKey) {
    console.warn('[groqClient] VITE_GROQ_API_KEY not configured, falling back to Gemini');
    return fallbackToGemini(messages);
  }

  // Attempt Groq with retry logic
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await axios.post<GroqResponse>(
        `${endpoint}/chat/completions`,
        {
          model,
          messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.max_tokens || 2048,
          top_p: options.top_p || 0.9,
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      if (response.data?.choices?.[0]?.message?.content) {
        console.debug(`[groqClient] Success on attempt ${attempt + 1}`);
        return response.data.choices[0].message.content;
      }
    } catch (error: any) {
      const status = error?.response?.status;
      const message = error?.response?.data?.error?.message || error.message;

      console.warn(`[groqClient] Attempt ${attempt + 1} failed: ${status} - ${message}`);

      // Determine if we should retry
      if (status === 429 || status === 503) {
        // Rate limited or service unavailable - wait and retry
        if (attempt < 2) {
          const delayMs = Math.pow(2, attempt) * 1000 + Math.random() * 500;
          console.log(`[groqClient] Retrying in ${delayMs.toFixed(0)}ms...`);
          await new Promise(res => setTimeout(res, delayMs));
          continue;
        }
      }

      // Check for billing or auth errors
      if (status === 402 || status === 401 || message.includes('billing') || message.includes('exceeded')) {
        console.warn('[groqClient] Billing or auth issue detected, falling back to Gemini');
        return fallbackToGemini(messages);
      }

      // For other errors on last attempt, fall back to Gemini
      if (attempt === 2) {
        console.warn('[groqClient] Max retries exceeded, falling back to Gemini');
        return fallbackToGemini(messages);
      }
    }
  }

  // Final fallback
  return fallbackToGemini(messages);
}

/**
 * Fallback to Gemini API
 */
async function fallbackToGemini(messages: GroqMessage[]): Promise<string> {
  try {
    const client = getGoogleGenAIClient();
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Convert Groq message format to Gemini format
    const geminiContents = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      parts: [{ text: msg.content }],
    }));

    const result = await model.generateContent({
      contents: geminiContents as any,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    });

    const text = result.response.text?.();
    if (text) {
      console.debug('[groqClient] Fallback to Gemini successful');
      return text;
    }

    throw new Error('Gemini returned empty response');
  } catch (error: any) {
    console.error('[groqClient] Gemini fallback failed:', error.message);
    throw error;
  }
}

/**
 * Test both APIs to report their status
 */
export async function testApiStatus(): Promise<{
  groq: { status: 'OK' | 'FAILED' | 'MISSING_KEY'; message: string };
  gemini: { status: 'OK' | 'FAILED' | 'MISSING_KEY'; message: string };
}> {
  const groqKey = getGroqApiKey();
  const geminiClient = getGoogleGenAIClient();

  const result = {
    groq: { status: 'OK' as const, message: 'Configured' },
    gemini: { status: 'OK' as const, message: 'Configured' },
  };

  // Test Groq
  if (!groqKey) {
    result.groq = { status: 'MISSING_KEY', message: 'VITE_GROQ_API_KEY not configured' };
  } else {
    try {
      await queryGroqWithFallback([
        { role: 'user', content: 'Hello' },
      ]);
      result.groq = { status: 'OK', message: 'API is working' };
    } catch (error: any) {
      result.groq = { status: 'FAILED', message: error.message };
    }
  }

  // Test Gemini
  if (!geminiClient) {
    result.gemini = { status: 'MISSING_KEY', message: 'VITE_GEMINI_API_KEY not configured' };
  } else {
    try {
      const model = geminiClient.getGenerativeModel({ model: 'gemini-2.0-flash' });
      await model.generateContent('Hello');
      result.gemini = { status: 'OK', message: 'API is working' };
    } catch (error: any) {
      result.gemini = { status: 'FAILED', message: error.message };
    }
  }

  return result;
}

export default {
  queryGroqWithFallback,
  testApiStatus,
};
