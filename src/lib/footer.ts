/**
 * Builds the standard HK Drinks footer appended to every published post.
 *
 * Format:
 *   🚚 Free delivery across Hong Kong on orders $1200+
 *   📱 Order via WhatsApp: +852 53440036
 *   🛒 Shop now: hkdrinks.shop/[product-link]
 *
 * The product link is optional. If provided, it replaces the [product-link]
 * placeholder. If not provided, the footer falls back to a bare hkdrinks.shop
 * link so the CTA line still appears.
 *
 * Accepts a variety of input formats and normalizes them:
 *   - "https://hkdrinks.shop/products/cincoro-reposado" → "hkdrinks.shop/products/cincoro-reposado"
 *   - "http://hkdrinks.shop/products/..."                → "hkdrinks.shop/products/..."
 *   - "hkdrinks.shop/products/..."                       → "hkdrinks.shop/products/..."
 *   - "/products/cincoro-reposado"                       → "hkdrinks.shop/products/cincoro-reposado"
 *   - "products/cincoro-reposado"                        → "hkdrinks.shop/products/cincoro-reposado"
 *   - "bit.ly/abc" (external)                            → "bit.ly/abc"
 *   - "" (empty)                                         → "hkdrinks.shop" (default)
 */
export function normalizeProductLink(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) return ''

  // Strip protocol
  let s = trimmed
  if (s.startsWith('https://')) s = s.slice(8)
  else if (s.startsWith('http://')) s = s.slice(7)

  // Strip leading www.
  if (s.startsWith('www.')) s = s.slice(4)

  // If it already starts with hkdrinks.shop, use as-is
  if (s.startsWith('hkdrinks.shop')) return s

  // If it starts with a slash, prepend hkdrinks.shop
  if (s.startsWith('/')) return `hkdrinks.shop${s}`

  // If it looks like an external domain (has a dot in the first segment), use as-is
  // e.g. bit.ly/abc, amzn.to/xyz
  const firstSegment = s.split('/')[0] ?? ''
  if (firstSegment.includes('.')) return s

  // Otherwise treat as a path and prepend hkdrinks.shop/
  return `hkdrinks.shop/${s}`
}

/**
 * Returns the 3-line footer block. Always returns all 3 lines —
 * the Shop now line falls back to the bare domain if no product link.
 */
export function buildFooter(productLink: string = ''): string {
  const normalized = normalizeProductLink(productLink)
  const shopLine = `🛒 Shop now: ${normalized || 'hkdrinks.shop'}`
  return [
    '',
    '🚚 Free delivery across Hong Kong on orders $1200+',
    '📱 Order via WhatsApp: +852 53440036',
    shopLine,
  ].join('\n')
}

/**
 * Append the footer to an existing caption (which may already include hashtags).
 * The footer goes at the very end, after any hashtags.
 */
export function appendFooter(caption: string, productLink: string = ''): string {
  return caption + buildFooter(productLink)
}
