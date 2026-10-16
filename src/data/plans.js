// Plans shown on the site. Edit names, features and prices here.
// IMPORTANT: prices are the current prices (NGN). The amount actually charged comes from the `plans` table in Supabase
// (see supabase/schema.sql), never from the browser. Keep the two in sync.
// Items written as ['text', 1] are shown with a "Soon" tag (not built yet).
// `lim` is the three-number summary on each card. The real limits live in public/lab/access.js.
export const CURRENCY = { code: 'NGN', symbol: '₦' }
export const PLANS = [
  { id: 'free', name: 'Free', tag: 'For getting started', price: 0, col: '#2fd37a', col2: '#0f8f5a', cta: 'Create free account',
    lim: [['10', 'modules'], ['6', 'games'], ['2', 'quizzes']], inc: 'Included',
    f: [
  '15-minute free trial in the lab',
  'Practice terminal with 230+ commands',
  'First 10 of 55 guided modules',
  '6 of 31 games and 2 topic quizzes',
  'Progress saved on this device — upgrade to sync & keep access'
] },
  { id: 'learner', name: 'Learner', tag: 'For steady progress', price: 1300, yearly: 1100, col: '#2f8cff', col2: '#1646a8', cta: 'Choose Learner',
    lim: [['35', 'modules'], ['20', 'games'], ['8', 'quizzes']], inc: 'Everything in Free, plus',
    f: ['35 modules, 20 games and 8 topic quizzes', '4 minutes in Pro Game Zone — upgrade to Pro for unlimited', 'Daily challenge and streaks', 'Profile photo and progress sync across devices'] },
  { id: 'pro', name: 'Pro', tag: 'Everything, no limits', price: 2800, yearly: 2400, col: '#ffb454', col2: '#e0661a', pop: 1, cta: 'Choose Pro',
    lim: [['55', 'modules'], ['31', 'games'], ['All', 'quizzes']], inc: 'Everything in Learner, plus',
    f: [
  'Unlimited Pro Game Zone — Vault, RESCUE, Secret Hunter & more',
  'Every module, game and quiz unlocked',
  'Advanced missions and CTF packs',
  'Learning paths and placement test',
  'Timed exam mode',
  'Certificate of completion'
] },
]
export const planById = (id) => PLANS.find((p) => p.id === id) || PLANS[0]



// Live prices from Supabase public.plans (kobo → NGN). Fallback = static numbers above.
export async function loadPlanPrices(supabase) {
  if (!supabase) return PLANS
  try {
    const { data, error } = await supabase.from('plans').select('id,monthly_kobo,yearly_kobo')
    if (error || !data) return PLANS
    const map = Object.fromEntries(data.map((r) => [r.id, r]))
    return PLANS.map((p) => {
      const r = map[p.id]
      if (!r) return p
      const monthly = Math.round((+r.monthly_kobo || 0) / 100)
      const yearly = Math.round((+r.yearly_kobo || 0) / 100)
      // yearly field in UI is "per month when billed yearly"
      const yearlyPerMonth = yearly > 0 ? Math.round(yearly / 12) : p.yearly
      return {
        ...p,
        price: p.id === 'free' ? 0 : monthly,
        yearly: p.id === 'free' ? 0 : yearlyPerMonth,
        yearlyTotal: yearly,
      }
    })
  } catch {
    return PLANS
  }
}
