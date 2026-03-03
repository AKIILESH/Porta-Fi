// supabase/functions/fetch-yahoo/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const YAHOO_FINANCE_URL = 'https://query1.finance.yahoo.com/v8/finance/chart'

serve(async (req) => {
  try {
    // Enable CORS
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json'
    }

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers, status: 204 })
    }

    // Only allow POST
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers }
      )
    }

    const { ticker } = await req.json()
    
    if (!ticker) {
      return new Response(
        JSON.stringify({ error: 'Ticker is required' }),
        { status: 400, headers }
      )
    }

    console.log(`Fetching Yahoo data for: ${ticker}`)
    
    // Fetch from Yahoo Finance
    const response = await fetch(
      `${YAHOO_FINANCE_URL}/${ticker}?interval=1d&range=1d`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Yahoo returned ${response.status}`)
    }

    const data = await response.json()
    
    return new Response(
      JSON.stringify(data),
      { status: 200, headers }
    )

  } catch (error) {
    console.error('Edge function error:', error.message)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})