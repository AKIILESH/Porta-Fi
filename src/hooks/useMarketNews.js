// src/hooks/useMarketNews.js
import { useQuery } from '@tanstack/react-query'

const ET_MARKETS_RSS = 'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms'

const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
  'https://thingproxy.freeboard.io/fetch/',
  'https://api.codetabs.com/v1/proxy?quest=',
]

function parseRSS(xmlText) {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(xmlText, 'text/xml')
    const items = Array.from(doc.querySelectorAll('item'))

    return items.map(item => {
      const title = item.querySelector('title')?.textContent?.trim() || ''
      const link = item.querySelector('link')?.textContent?.trim() || ''
      const pubDate = item.querySelector('pubDate')?.textContent?.trim() || ''
      const desc = item.querySelector('description')?.textContent?.trim() || ''

      // Strip CDATA, HTML tags, entities — keep full text, no truncation
      const cleanDesc = desc
        .replace(/<!\[CDATA\[|\]\]>/g, '')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\s+/g, ' ')
        .trim()

      const cleanTitle = title
        .replace(/<!\[CDATA\[|\]\]>/g, '')
        .replace(/<[^>]+>/g, '')
        .trim()

      const date = pubDate ? new Date(pubDate) : new Date()

      const text = (cleanTitle + ' ' + cleanDesc).toLowerCase()
      let category = 'general'
      if (text.match(/nifty|sensex|bse|nse|index/)) category = 'indices'
      else if (text.match(/rbi|repo|rate|monetary|inflation/)) category = 'macro'
      else if (text.match(/fii|dii|foreign|institutional/)) category = 'flows'
      else if (text.match(/rupee|usd|inr|dollar|currency/)) category = 'currency'
      else if (text.match(/gold|silver|commodity|crude|oil/)) category = 'commodities'
      else if (text.match(/result|profit|revenue|earnings|q[1-4]/)) category = 'earnings'
      else if (text.match(/ipo|listing|subscription/)) category = 'ipo'
      else if (text.match(/mutual fund|sip|nav|scheme/)) category = 'mf'

      return { id: link || cleanTitle, title: cleanTitle, desc: cleanDesc, link, date, timeAgo: getTimeAgo(date), category }
    }).filter(item => item.title)
  } catch (e) {
    console.error('RSS parse error:', e)
    return []
  }
}

function getTimeAgo(date) {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

async function fetchWithFallback(url, proxies) {
  for (const proxy of proxies) {
    try {
      const res = await fetch(`${proxy}${encodeURIComponent(url)}`, {
        headers: { 'Accept': 'application/xml, text/xml, */*' },
        signal: AbortSignal.timeout(6000),
      })
      if (res.ok) return await res.text()
    } catch (e) {
      console.warn(`Proxy ${proxy} failed:`, e.message)
    }
  }
  throw new Error('All CORS proxies failed')
}

export function useMarketNews() {
  return useQuery({
    queryKey: ['marketNews'],
    queryFn: async () => {
      const text = await fetchWithFallback(ET_MARKETS_RSS, CORS_PROXIES)
      return parseRSS(text)
    },
    staleTime: 10 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
    retry: 2,
    retryDelay: 1500,
  })
}