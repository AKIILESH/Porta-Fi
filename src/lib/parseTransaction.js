// src/lib/parseTransaction.js
// Pure regex engine — no UI, no API calls, no side effects

// ─── Category keyword maps ─────────────────────────────────────────────────

const CATEGORY_KEYWORDS = {
  // EXPENSE categories
  'Food & Dining': [
    'zomato','swiggy','blinkit','zepto','instamart','bigbasket','dunzo',
    'food','lunch','dinner','breakfast','brunch','snack','snacks','meal',
    'restaurant','cafe','coffee','chai','tea','pizza','burger','biryani',
    'hotel','dhaba','canteen','mess','tiffin','groceries','grocery',
    'vegetables','fruits','milk','bread','kirana','supermarket','dmart',
    'reliance fresh','juice','nature basket',
  ],
  'Transport': [
    'uber','ola','rapido','blablacar','cab','taxi','auto','rickshaw',
    'petrol','diesel','fuel','cng','gas station','pump',
    'metro','bus','train','local','bmtc','best','dtc','ksrtc',
    'parking','fastag','toll','highway',
    'flight','airline','indigo','air india','spicejet','go first',
    'airport','railway','irctc','ticket',
  ],
  'Bills & Utilities': [
    'electricity','bijli','bescom','mseb','tata power','adani',
    'water','gas','lpg','cylinder','indane','hp gas','bharat gas',
    'internet','broadband','wifi','jio','airtel','bsnl','vi',
    'mobile','phone','recharge','prepaid','postpaid','bill','utility',
    'cable','dth','tatasky','dish tv','sun direct',
  ],
  'Shopping': [
    'amazon','flipkart','myntra','ajio','nykaa','meesho','snapdeal',
    'clothes','clothing','shirt','jeans','shoes','footwear','kurta',
    'dress','fashion','apparel','accessories','watch','bag','purse',
    'shopping','mall','store','market',
  ],
  'Healthcare': [
    'doctor','hospital','clinic','pharmacy','chemist','medicine',
    'medical','health','apollo','fortis','aiims','max hospital',
    'dentist','dental','eye','optical','lens','diagnostic',
    'lab','test','pathology','xray','scan','mri','consultation',
    'gym','fitness','yoga','workout',
  ],
  'Entertainment': [
    'netflix','hotstar','prime','disney','spotify','youtube premium',
    'apple music','zee5','sonyliv','jiocinema','mxplayer',
    'movie','cinema','pvr','inox','carnival','film','concert',
    'event','show','game','gaming','steam','ps','xbox',
    'bowling','amusement','theme park','water park',
  ],
  'Housing': [
    'rent','house rent','pg','hostel','paying guest','flat','apartment',
    'maintenance','society','hoa','repair','plumber','electrician',
    'carpenter','painter','maid','cook','cleaning','pest control',
    'furniture','sofa','bed','wardrobe','ikea','urban ladder','pepperfry',
  ],
  'Education': [
    'school','college','university','tuition','coaching','classes',
    'course','udemy','coursera','skillshare','unacademy','byjus',
    'books','stationery','notebook','pen','pencil','library',
    'fees','exam','certification',
  ],
  'Travel': [
    'holiday','vacation','trip','tour','travel','hotel booking',
    'oyo','makemytrip','goibibo','yatra','cleartrip','booking.com',
    'airbnb','resort','hostel booking','tourism','sightseeing',
    'visa','passport','forex','currency exchange',
  ],
  'Insurance': [
    'insurance','premium','lic','policy','term plan','health insurance',
    'life insurance','car insurance','bike insurance','motor',
    'hdfc life','icici prudential','star health','bajaj allianz',
  ],
  'Investments': [
    'mutual fund','sip','stocks','shares','zerodha','groww','upstox',
    'angel broking','nps','ppf','fd','fixed deposit','rd',
    'gold','bonds','debentures','ipo','invested','investment',
  ],
  'Personal Care': [
    'salon','haircut','spa','massage','parlour','parlor','grooming',
    'shampoo','soap','toothpaste','cosmetics','makeup','skincare',
    'mamaearth','mcaffeine','wow','plum','lakmé','loreal',
  ],
  'Gifts': [
    'gift','present','birthday','anniversary','wedding','celebration',
    'flowers','bouquet','cake','sweets','mithai','chocolate',
    'amazon gift','flipkart gift',
  ],
  'Electronics': [
    'laptop','phone','mobile','iphone','samsung','oneplus','realme',
    'headphones','earphones','airpods','charger','cable','adapter',
    'computer','tablet','ipad','monitor','keyboard','mouse',
    'croma','reliance digital','vijay sales','apple store',
  ],

  // INCOME categories
  'Salary': [
    'salary','payroll','ctc','in-hand','take home','monthly pay',
    'wages','pay','paycheck','stipend',
  ],
  'Freelance': [
    'freelance','client payment','project payment','invoice',
    'consulting','contract','gig','fiverr','upwork','toptal',
  ],
  'Business': [
    'business income','sales','revenue','profit','shop',
    'store income','business earnings',
  ],
  'Investment Returns': [
    'dividend','returns','capital gains','profit booking',
    'mutual fund returns','stock profit','interest income',
    'fd interest','rd maturity','bond interest',
  ],
  'Rental Income': [
    'rent received','rental','tenant','house rent received',
    'property income','subletting',
  ],
  'Allowance': [
    'allowance','pocket money','hra','da','conveyance',
    'reimbursement','reimbursed','expense claim','dad sent','mom sent'
  ],
  'Bonus': [
    'bonus','incentive','performance bonus','festival bonus',
    'diwali bonus','joining bonus','referral bonus',
  ],
  'Cash Back': [
    'cashback','cash back','reward','points redeemed',
    'paytm cashback','gpay cashback','amazon pay cashback',
  ],
  'Gift': [
    'gift received','gifted','received gift',
  ],
}

// ─── Category lists (mirrors app's category config) ───────────────────────

const EXPENSE_CATS = [
  'Food & Dining', 'Shopping', 'Transport', 'Entertainment',
  'Bills & Utilities', 'Healthcare', 'Housing', 'Education',
  'Travel', 'Insurance', 'Investments', 'Personal Care',
  'Gifts', 'Electronics', 'Other',
]

const INCOME_CATS = [
  'Salary', 'Allowance', 'Freelance', 'Business',
  'Investment Returns', 'Rental Income', 'Gift', 'Bonus',
  'Cash Back', 'Other Income',
]

// ─── Type detection ────────────────────────────────────────────────────────

const INCOME_SIGNALS = [
  /\b(received|got paid|got|credited|salary|income|earned|earning)\b/i,
  /\b(refund|cashback|cash back|dividend|interest earned)\b/i,
  /\b(deposited|bonus|stipend|freelance payment|payment received)\b/i,
  /\b(transferred to me|sent me|allowance|rental income|rent received)\b/i,
  /\b(returns|investment returns|fd maturity|matured|profit)\b/i,
  /\b(reimbursement|reimbursed|claim approved|claim credited)\b/i,
]

const EXPENSE_SIGNALS = [
  /\b(spent|paid|bought|purchased|ordered|booked|debited)\b/i,
  /\b(charged|withdrew|withdrawal|atm|bill paid|fee paid)\b/i,
  /\b(emi|loan payment|subscribed|subscription|renewed)\b/i,
  /\b(transferred|sent|sent to|paying|topped up|recharged)\b/i,
]

// ─── Amount extraction ─────────────────────────────────────────────────────

const AMOUNT_PATTERNS = [
  // ₹1,50,000 or ₹1500 or ₹ 500
  /[₹Rs\.]+\s*([\d,]+(?:\.\d{1,2})?)/i,
  // 1500rs or 1500/-
  /([\d,]+(?:\.\d{1,2})?)\s*(?:rs|₹|\/\-)/i,
  // 2.5k, 2k, 2.5K
  /([\d]+(?:\.\d+)?)\s*[kK]\b/,
  // 1.5 lakh, 1 lakh, 2 lakhs
  /([\d]+(?:\.\d+)?)\s*(?:lakh|lac|lakhs|L)\b/i,
  // 1 cr, 2 crore
  /([\d]+(?:\.\d+)?)\s*(?:cr|crore|crores)\b/i,
  // plain number (last resort — must be standalone)
  /\b(\d{1,7}(?:,\d{2,3})*(?:\.\d{1,2})?)\b/,
]

function extractAmount(text) {
  // Try ₹ prefix
  let m = text.match(/[₹Rs\.]+\s*([\d,]+(?:\.\d{1,2})?)/i)
  if (m) return parseFloat(m[1].replace(/,/g, ''))

  // Rs suffix
  m = text.match(/([\d,]+(?:\.\d{1,2})?)\s*(?:rs|\/\-)/i)
  if (m) return parseFloat(m[1].replace(/,/g, ''))

  // k shorthand: 2k, 2.5k
  m = text.match(/\b([\d]+(?:\.\d+)?)\s*[kK]\b/)
  if (m) return parseFloat(m[1]) * 1000

  // lakh
  m = text.match(/\b([\d]+(?:\.\d+)?)\s*(?:lakh|lac|lakhs)\b/i)
  if (m) return parseFloat(m[1]) * 100000

  // crore
  m = text.match(/\b([\d]+(?:\.\d+)?)\s*(?:cr|crore|crores)\b/i)
  if (m) return parseFloat(m[1]) * 10000000

  // Indian comma format: 1,50,000 or 1,500
  m = text.match(/\b(\d{1,3}(?:,\d{2,3})+(?:\.\d{1,2})?)\b/)
  if (m) return parseFloat(m[1].replace(/,/g, ''))

  // plain number
  m = text.match(/\b(\d+(?:\.\d{1,2})?)\b/)
  if (m) return parseFloat(m[1])

  return null
}

// ─── Date extraction ───────────────────────────────────────────────────────

const DAY_NAMES = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']
const MONTH_NAMES = {
  jan:0, january:0, feb:1, february:1, mar:2, march:2,
  apr:3, april:3, may:4, jun:5, june:5,
  jul:6, july:6, aug:7, august:7, sep:8, september:8,
  oct:9, october:9, nov:10, november:10, dec:11, december:11,
}

function extractDate(text, today) {
  const base   = new Date(today)
  const lower  = text.toLowerCase()

  // today / aaj
  if (/\b(today|aaj|tonight|this morning|this evening)\b/i.test(text))
    return today

  // yesterday / kal
  if (/\b(yesterday|kal|last night)\b/i.test(text)) {
    const d = new Date(base); d.setDate(d.getDate() - 1)
    return d.toISOString().slice(0, 10)
  }

  // X days ago
  let m = text.match(/(\d+)\s*days?\s*ago/i)
  if (m) {
    const d = new Date(base); d.setDate(d.getDate() - parseInt(m[1]))
    return d.toISOString().slice(0, 10)
  }

  // last <weekday>  e.g. "last friday"
  m = lower.match(/last\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/)
  if (m) {
    const targetDay = DAY_NAMES.indexOf(m[1])
    const d = new Date(base)
    const diff = (d.getDay() - targetDay + 7) % 7 || 7
    d.setDate(d.getDate() - diff)
    return d.toISOString().slice(0, 10)
  }

  // this <weekday>  e.g. "this monday"
  m = lower.match(/this\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/)
  if (m) {
    const targetDay = DAY_NAMES.indexOf(m[1])
    const d = new Date(base)
    let diff = targetDay - d.getDay()
    if (diff > 0) diff -= 7  // in the past
    d.setDate(d.getDate() + diff)
    return d.toISOString().slice(0, 10)
  }

  // standalone weekday  e.g. "friday petrol"
  for (const day of DAY_NAMES) {
    if (lower.includes(day)) {
      const targetDay = DAY_NAMES.indexOf(day)
      const d = new Date(base)
      const diff = (d.getDay() - targetDay + 7) % 7 || 7
      d.setDate(d.getDate() - diff)
      return d.toISOString().slice(0, 10)
    }
  }

  // DD/MM or DD-MM
  m = text.match(/\b(\d{1,2})[\/\-](\d{1,2})\b/)
  if (m) {
    const d = new Date(base)
    d.setMonth(parseInt(m[2]) - 1)
    d.setDate(parseInt(m[1]))
    return d.toISOString().slice(0, 10)
  }

  // DD Month  e.g. "12 march", "5 jan"
  m = lower.match(/\b(\d{1,2})\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/)
  if (m) {
    const d = new Date(base)
    d.setMonth(MONTH_NAMES[m[2].slice(0, 3)])
    d.setDate(parseInt(m[1]))
    return d.toISOString().slice(0, 10)
  }

  // last week
  if (/\blast\s+week\b/i.test(text)) {
    const d = new Date(base); d.setDate(d.getDate() - 7)
    return d.toISOString().slice(0, 10)
  }

  // default — today
  return today
}

// ─── Category detection ────────────────────────────────────────────────────

function detectCategory(text, type) {
  const lower = text.toLowerCase()
  const candidates = []

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    // only consider categories matching the transaction type
    const isIncomeCategory = INCOME_CATS.includes(category)
    if (type === 'income' && !isIncomeCategory) continue
    if (type === 'expense' && isIncomeCategory) continue

    let score = 0
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        // longer keyword = more specific match = higher score
        score += kw.length
      }
    }
    if (score > 0) candidates.push({ category, score })
  }

  if (!candidates.length) return null
  candidates.sort((a, b) => b.score - a.score)
  return candidates[0].category
}

// ─── Type detection ────────────────────────────────────────────────────────

function detectType(text) {
  for (const pattern of INCOME_SIGNALS) {
    if (pattern.test(text)) return 'income'
  }
  for (const pattern of EXPENSE_SIGNALS) {
    if (pattern.test(text)) return 'expense'
  }

  // Check income-specific category keywords as signals
  const lower = text.toLowerCase()
  const incomeCategoryKws = [
    ...CATEGORY_KEYWORDS['Salary'],
    ...CATEGORY_KEYWORDS['Bonus'],
    ...CATEGORY_KEYWORDS['Freelance'],
    ...CATEGORY_KEYWORDS['Investment Returns'],
    ...CATEGORY_KEYWORDS['Rental Income'],
    ...CATEGORY_KEYWORDS['Cash Back'],
  ]
  for (const kw of incomeCategoryKws) {
    if (lower.includes(kw)) return 'income'
  }

  return 'expense' // safe default
}

// ─── Merchant extraction ───────────────────────────────────────────────────

// Known merchants — maps to canonical name
const KNOWN_MERCHANTS = {
  zomato: 'Zomato', swiggy: 'Swiggy', blinkit: 'Blinkit',
  zepto: 'Zepto', instamart: 'Instamart', bigbasket: 'BigBasket',
  uber: 'Uber', ola: 'Ola', rapido: 'Rapido',
  amazon: 'Amazon', flipkart: 'Flipkart', myntra: 'Myntra',
  ajio: 'AJIO', nykaa: 'Nykaa', meesho: 'Meesho',
  netflix: 'Netflix', hotstar: 'Hotstar', spotify: 'Spotify',
  youtube: 'YouTube', prime: 'Amazon Prime',
  zerodha: 'Zerodha', groww: 'Groww', upstox: 'Upstox',
  paytm: 'Paytm', phonepe: 'PhonePe', gpay: 'Google Pay',
  croma: 'Croma', jio: 'Jio', airtel: 'Airtel',
  oyo: 'OYO', makemytrip: 'MakeMyTrip', goibibo: 'Goibibo',
  pvr: 'PVR', inox: 'INOX', starbucks: 'Starbucks',
  mcdonalds: "McDonald's", kfc: 'KFC', dominos: "Domino's",
  dunzo: 'Dunzo', dmart: 'DMart', apollo: 'Apollo',
}

function extractMerchant(text) {
  const lower = text.toLowerCase()

  // Check known merchants first
  for (const [key, name] of Object.entries(KNOWN_MERCHANTS)) {
    if (lower.includes(key)) return name
  }

  // Try to extract a capitalised proper noun (e.g. "paid to Rahul", "at Big Bazaar")
  const properNoun = text.match(/(?:at|from|to|@)\s+([A-Z][a-zA-Z\s]{1,20}?)(?:\s+\d|\s+for|\s+on|\s*$|,)/)?.[1]?.trim()
  if (properNoun && properNoun.length > 1) return properNoun

  return null
}

// ─── Note / description cleaning ──────────────────────────────────────────

const NOISE_WORDS = new Set([
  'spent','paid','bought','purchased','ordered','booked','charged',
  'received','got','earned','credited','for','on','at','from','to',
  'the','a','an','rs','inr','rupees','rupee','today','yesterday',
  'this','last','some','my','me','i','it','that','was','is','have',
  'just','also','only','about','around','roughly','approx',
])

function cleanNote(text, amount, merchant, date) {
  let note = text

  // Remove amount patterns
  note = note.replace(/[₹Rs\.]+\s*[\d,]+(?:\.\d{1,2})?/gi, '')
  note = note.replace(/[\d,]+(?:\.\d{1,2})?\s*(?:rs|₹|\/\-)/gi, '')
  note = note.replace(/\b[\d]+(?:\.\d+)?\s*[kK]\b/g, '')
  note = note.replace(/\b[\d]+(?:\.\d+)?\s*(?:lakh|lac|lakhs|L)\b/gi, '')
  note = note.replace(/\b[\d,]+(?:\.\d{1,2})?\b/g, '')

  // Remove date fragments
  note = note.replace(/\b(today|yesterday|last\s+\w+|this\s+\w+|\d+\s+days?\s+ago|last\s+week)\b/gi, '')
  note = note.replace(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi, '')
  note = note.replace(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\b/gi, '')
  note = note.replace(/\d{1,2}[\/\-]\d{1,2}/g, '')

  // Remove merchant name if found
  if (merchant) {
    note = note.replace(new RegExp(merchant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '')
    // also remove the lowercase version
    const lowerMerchant = Object.keys(KNOWN_MERCHANTS).find(k => KNOWN_MERCHANTS[k] === merchant)
    if (lowerMerchant) note = note.replace(new RegExp(lowerMerchant, 'gi'), '')
  }

  // Remove noise words
  const words = note.split(/\s+/)
  const cleaned = words.filter(w => {
    const lw = w.toLowerCase().replace(/[^a-z]/g, '')
    return lw.length > 1 && !NOISE_WORDS.has(lw)
  })

  return cleaned.join(' ').replace(/\s+/g, ' ').trim()
}

// ─── Confidence scoring ────────────────────────────────────────────────────

function scoreConfidence({ amount, type, category, date, merchant, rawText }) {
  let score = 0
  const warnings = []

  // Amount is the most critical field
  if (amount !== null && amount > 0) {
    score += 0.40
  } else {
    warnings.push('Amount not found — please enter it')
  }

  // Type detection
  const hasTypeSignal =
    INCOME_SIGNALS.some(p => p.test(rawText)) ||
    EXPENSE_SIGNALS.some(p => p.test(rawText))
  if (hasTypeSignal) {
    score += 0.20
  } else {
    score += 0.10 // defaulted — partial credit
    warnings.push('Type assumed as expense')
  }

  // Category
  if (category) {
    score += 0.20
  } else {
    warnings.push('Category not recognised — please pick one')
  }

  // Date
  const dateWasDefaulted = !/(today|yesterday|\d+\s*days?\s*ago|last\s+\w+|this\s+\w+|\d{1,2}[\/\-]\d{1,2}|\d{1,2}\s+\w{3})/i.test(rawText)
  if (!dateWasDefaulted) {
    score += 0.10
  } else {
    score += 0.05 // defaulted to today — partial credit
  }

  // Merchant bonus
  if (merchant) score += 0.10

  return { confidence: Math.min(score, 1.0), warnings }
}

// ─── Main export ───────────────────────────────────────────────────────────

/**
 * parseTransaction(rawText, todayISO, defaultAccountId)
 *
 * @param {string} rawText          - User's natural language input
 * @param {string} todayISO         - Today's date as "YYYY-MM-DD"
 * @param {string} defaultAccountId - Phase 1: first account's UUID
 *
 * @returns {{
 *   amount:     number | null,
 *   type:       'expense' | 'income',
 *   category:   string | null,
 *   merchant:   string | null,
 *   date:       string,
 *   description: string,
 *   account_id: string,
 *   confidence: number,
 *   warnings:   string[],
 * }}
 */
export function parseTransaction(rawText, todayISO, defaultAccountId) {
  if (!rawText?.trim()) return null

  const text = rawText.trim()

  const type      = detectType(text)
  const amount    = extractAmount(text)
  const date      = extractDate(text, todayISO)
  const category  = detectCategory(text, type)
  const merchant  = extractMerchant(text)
  const rawNote   = cleanNote(text, amount, merchant, date)

  // Build description: "Merchant — note" or just note or merchant
  let description = ''
  if (merchant && rawNote)      description = `${merchant} — ${rawNote}`
  else if (merchant)            description = merchant
  else if (rawNote)             description = rawNote
  else                          description = text.trim()

  // Capitalise first letter
  description = description.charAt(0).toUpperCase() + description.slice(1)

  const { confidence, warnings } = scoreConfidence({ amount, type, category, date, merchant, rawText: text })

  return {
    amount,
    type,
    category,
    merchant,
    date,
    description,
    account_id: defaultAccountId,
    confidence,
    warnings,
  }
}