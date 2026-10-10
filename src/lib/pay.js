import { supabase } from './supabase.js'
import { PAYMENTS_ENABLED } from './config.js'

// A discount code the learner typed on the Plans section is remembered here until checkout.
const CK = 'kcoupon'
export const getCoupon = () => { try { return localStorage.getItem(CK) || '' } catch { return '' } }
export const setCoupon = (c) => { try { if (c) localStorage.setItem(CK, c); else localStorage.removeItem(CK) } catch { /* ignore */ } }

// Starts a Paystack checkout. The amount (and any discount) is decided on the server, never sent by the browser.
export async function startCheckout({ plan, interval, coupon = getCoupon() }) {
  if (!PAYMENTS_ENABLED || !supabase) throw new Error('Payments are not switched on yet.')
  const { data, error } = await supabase.functions.invoke('paystack-init', { body: { plan, interval, coupon } })
  if (error || data?.error) {
    let m = 'Could not start the payment. Please try again.', why = ''
    try {
      const j = data?.error ? data : await error.context.json()
      why = String((j && (j.error || j.message)) || '')
      if (/discount code/i.test(why)) { m = why; setCoupon(''); why = '' }
    } catch { /* keep the generic message */ }
    if (!why && error && (error.name === 'FunctionsFetchError' || /failed to send|failed to fetch|networkerror/i.test(String(error.message || '')))) why = 'the payment service could not be reached'
    throw new Error(why ? `${m} (${why})` : m)
  }
  let url
  try { url = new URL(data?.authorization_url) } catch { url = null }
  if (!url || url.protocol !== 'https:' || !/(^|\.)paystack\.(com|co)$/.test(url.hostname)) throw new Error('Unexpected response from the payment service.')
  window.location.assign(url.href)
}

export async function verifyPayment(reference) {
  if (!supabase) throw new Error('Payments are not switched on yet.')
  const { data, error } = await supabase.functions.invoke('paystack-verify', { body: { reference } })
  if (error) throw new Error('We could not confirm the payment yet.')
  return data
}
