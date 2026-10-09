import { CURRENCY } from '../data/plans.js'

// Price shown per month. Yearly plans show their cheaper per-month figure (p.yearly), billed as 12 x that.
export const monthlyPrice = (p, bp) => (bp === 'y' && p.yearly ? p.yearly : p.price)
export const money = (n) => (n === 0 ? '0' : Number.isInteger(n) ? n.toLocaleString('en-NG') : n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
export const priceLine = (p, bp) => (!p.price ? 'Free forever' : `${CURRENCY.symbol}${money(monthlyPrice(p, bp))} / month${bp === 'y' ? ', billed yearly' : ''}`)
