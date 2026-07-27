/**
 * API Keys Verification Script
 *
 * Tests both Groq (primary) and Gemini (fallback) API keys
 * Run with: npx tsx scripts/testApiKeys.ts
 */

import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf-8');
  const lines = envFile.split('\n');
  for (const line of lines) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match && !line.startsWith('#')) {
      const key = match[1];
      let value = (match[2] || '').trim();
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value;
    }
  }
}

const GROQ_API_KEY = process.env.VITE_GROQ_API_KEY;
const GROQ_ENDPOINT = process.env.VITE_GROQ_ENDPOINT_URL || 'https://api.groq.com/openai/v1';
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;

console.log('\n' + '='.repeat(70));
console.log('API KEYS VERIFICATION TEST');
console.log('='.repeat(70) + '\n');

async function testGroqApi(): Promise<boolean> {
  console.log('🔍 Testing GROQ API...');

  if (!GROQ_API_KEY) {
    console.log('   ❌ VITE_GROQ_API_KEY is not configured\n');
    return false;
  }

  try {
    const response = await axios.post(
      `${GROQ_ENDPOINT}/chat/completions`,
      {
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: 'Reply with "OK" only' }],
        max_tokens: 10,
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    if (response.data?.choices?.[0]?.message?.content) {
      console.log('   ✅ GROQ API is WORKING');
      console.log(`   📍 Model: ${response.data.model}`);
      console.log(`   💬 Response: "${response.data.choices[0].message.content}"`);
      console.log(`   📊 Tokens used: ${response.data.usage?.total_tokens}\n`);
      return true;
    } else {
      console.log('   ❌ GROQ API returned empty response\n');
      return false;
    }
  } catch (error: any) {
    const status = error?.response?.status;
    const message = error?.response?.data?.error?.message || error.message;

    console.log(`   ❌ GROQ API FAILED`);
    console.log(`   Status: ${status || 'Unknown'}`);
    console.log(`   Error: ${message}\n`);

    if (status === 402 || message.includes('billing')) {
      console.log('   ⚠️  Issue: Billing account problem\n');
    }
    return false;
  }
}

async function testGeminiApi(): Promise<boolean> {
  console.log('🔍 Testing GEMINI API...');

  if (!GEMINI_API_KEY) {
    console.log('   ❌ VITE_GEMINI_API_KEY is not configured\n');
    return false;
  }

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: 'Reply with "OK" only',
              },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 10,
        },
      },
      {
        timeout: 15000,
      }
    );

    if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.log('   ✅ GEMINI API is WORKING');
      console.log(`   📍 Model: gemini-2.0-flash`);
      console.log(`   💬 Response: "${response.data.candidates[0].content.parts[0].text}"`);
      console.log(`   📊 Tokens used: ${response.data.usageMetadata?.totalTokenCount}\n`);
      return true;
    } else {
      console.log('   ❌ GEMINI API returned empty response\n');
      return false;
    }
  } catch (error: any) {
    const status = error?.response?.status;
    const message = error?.response?.data?.error?.message || error.message;

    console.log(`   ❌ GEMINI API FAILED`);
    console.log(`   Status: ${status || 'Unknown'}`);
    console.log(`   Error: ${message}\n`);

    if (message.includes('billing') || message.includes('exceeded')) {
      console.log('   ⚠️  Issue: Billing/spending limit issue\n');
    }
    return false;
  }
}

async function runTests() {
  const groqWorking = await testGroqApi();
  const geminiWorking = await testGeminiApi();

  console.log('='.repeat(70));
  console.log('SUMMARY');
  console.log('='.repeat(70));
  console.log(`Groq (Primary):  ${groqWorking ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`Gemini (Fallback): ${geminiWorking ? '✅ WORKING' : '❌ FAILED'}`);

  if (groqWorking && geminiWorking) {
    console.log('\n🎉 Both APIs are working! Primary: Groq, Fallback: Gemini\n');
    process.exit(0);
  } else if (groqWorking) {
    console.log('\n✅ Groq is working (Gemini backup unavailable)\n');
    process.exit(0);
  } else if (geminiWorking) {
    console.log('\n⚠️  Gemini is working, but Groq is not available\n');
    console.log('App will still work with Gemini as fallback.\n');
    process.exit(0);
  } else {
    console.log('\n❌ Both APIs are unavailable! App will not work.\n');
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
