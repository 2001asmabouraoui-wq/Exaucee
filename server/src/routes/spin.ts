import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { transporter } from '../lib/mailer.js'

const router = Router()

const PRIZE_META: Record<string, {
  headline: string
  detail: string
  codePrefix: string
  minPurchase: number
  emoji: string
}> = {
  'Free Delivery': {
    headline: 'Free Delivery',
    detail: 'Your next order ships on us — no delivery fees, no conditions.',
    codePrefix: 'EX-SHIP',
    minPurchase: 0,
    emoji: '🚚',
  },
  '-5% Off': {
    headline: '5% Off Your Order',
    detail: 'A little sweetness on your next Exaucée haul.',
    codePrefix: 'EX-5OFF',
    minPurchase: 30,
    emoji: '🌸',
  },
  '-10% Off': {
    headline: '10% Off Your Order',
    detail: 'Ten percent off — because you deserve every bit of it.',
    codePrefix: 'EX-10OFF',
    minPurchase: 50,
    emoji: '✨',
  },
  'Free Gift Wrap': {
    headline: 'Complimentary Gift Wrap',
    detail: 'Your order arrives dressed in our signature Exaucée tissue & ribbon.',
    codePrefix: 'EX-GIFTWRAP',
    minPurchase: 20,
    emoji: '🎀',
  },
  '-15% Off': {
    headline: '15% Off Your Order',
    detail: 'Our biggest wheel reward — yours to spend on anything in the collection.',
    codePrefix: 'EX-15OFF',
    minPurchase: 70,
    emoji: '🧁',
  },
}

function generateCode(prefix: string): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const rand  = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `${prefix}-${rand}`
}

function getExpiry(): { display: string; iso: string } {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
  return {
    display: `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`,
    iso: d.toISOString(),
  }
}

router.post('/', async (req, res) => {
  const { email, name, prize } = req.body

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    res.status(400).json({ error: 'Valid email required' })
    return
  }
  if (!prize) {
    res.status(400).json({ error: 'Prize is required' })
    return
  }

  const meta   = PRIZE_META[prize] ?? { headline: prize, detail: 'Enjoy your reward.', codePrefix: 'EX-WIN', minPurchase: 20, emoji: '🎁' }
  const code   = generateCode(meta.codePrefix)
  const expiry = getExpiry()

  // Save to subscribers (coupon_code column optional — add via Supabase SQL editor if missing)
  const { error: dbErr } = await supabase
    .from('subscribers')
    .upsert(
      [{ email: email.toLowerCase().trim(), name: name?.trim() ?? '', prize, coupon_code: code, coupon_expires_at: expiry.iso }],
      { onConflict: 'email' }
    )
  if (dbErr) console.error('Spin DB save error:', dbErr.message)

  // Send email — non-blocking, errors logged not thrown
  sendPrizeEmail(email, name ?? '', meta, code, expiry.display).catch(err =>
    console.error('Prize email failed:', err?.message ?? err)
  )

  res.status(201).json({ success: true, prize, code })
})

async function sendPrizeEmail(
  email: string,
  name: string,
  meta: typeof PRIZE_META[string],
  code: string,
  expiryDate: string,
) {
  const storeUrl  = process.env.FRONTEND_URL || 'http://localhost:5173'
  const greeting  = name ? `Congratulations, ${name}!` : 'Congratulations!'
  const minNote   = meta.minPurchase > 0
    ? `<tr><td style="padding:0 0 6px;">
        <span style="font-size:12px;color:#9B86A8;">A minimum purchase of </span>
        <span style="font-size:12px;color:#C4828A;font-weight:700;">${meta.minPurchase} TND</span>
        <span style="font-size:12px;color:#9B86A8;"> is required to use this code.</span>
       </td></tr>`
    : ''

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Your Exaucée Prize</title>
</head>
<body style="margin:0;padding:0;background:#FFF9F4;font-family:'Helvetica Neue',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF9F4;padding:32px 16px;">
  <tr><td align="center">
  <table width="100%" style="max-width:520px;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid rgba(196,130,138,0.12);box-shadow:0 8px 40px rgba(61,43,31,0.08);">

    <!-- Rainbow stripe -->
    <tr><td style="height:5px;background:linear-gradient(90deg,#F7D9E0,#C6B7CC,#BFC4CC,#D6E9DC,#FFF9F4,#F7D9E0);padding:0;font-size:0;">&nbsp;</td></tr>

    <!-- Logo header -->
    <tr><td style="padding:36px 32px 28px;text-align:center;">
      <p style="margin:0 0 6px;font-size:11px;font-weight:800;letter-spacing:0.25em;text-transform:uppercase;color:#BFC4CC;">── ✦ ──</p>
      <h1 style="margin:0 0 6px;font-size:38px;font-weight:900;color:#C4828A;letter-spacing:-0.5px;">Exaucée</h1>
      <p style="margin:0;font-size:10px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:#9B86A8;">Your wish, granted.</p>
    </td></tr>

    <!-- Thin divider -->
    <tr><td style="padding:0 32px;">
      <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(196,130,138,0.18),transparent);"></div>
    </td></tr>

    <!-- Prize reveal -->
    <tr><td style="padding:32px 32px 0;text-align:center;">
      <div style="font-size:54px;line-height:1;margin-bottom:18px;">${meta.emoji}</div>
      <p style="margin:0 0 6px;font-size:10px;font-weight:800;letter-spacing:0.22em;text-transform:uppercase;color:#9B86A8;">You've won</p>
      <h2 style="margin:0 0 10px;font-size:28px;font-weight:900;color:#C4828A;line-height:1.1;">${meta.headline}</h2>
      <p style="margin:0 0 28px;font-size:13px;color:#6B5B4E;line-height:1.7;">${greeting}<br>${meta.detail}</p>
    </td></tr>

    <!-- Coupon code card -->
    <tr><td style="padding:0 28px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFFEF9;border:2px dashed rgba(196,130,138,0.3);border-radius:16px;">
      <tr><td style="padding:22px 24px;text-align:center;">
        <p style="margin:0 0 10px;font-size:10px;font-weight:800;letter-spacing:0.22em;text-transform:uppercase;color:#9B86A8;">Your Coupon Code</p>
        <p style="margin:0 0 14px;font-size:24px;font-weight:900;letter-spacing:0.14em;color:#3D2B1F;font-family:'Courier New',Courier,monospace;">${code}</p>
        <p style="margin:0;font-size:12px;color:#9B86A8;line-height:1.7;">
          Add your item to the cart, then enter the <strong style="color:#3D2B1F;">full code above</strong><br>
          — including the prefix — at checkout before confirming.
        </p>
      </td></tr>
      </table>
    </td></tr>

    <!-- Terms box -->
    <tr><td style="padding:0 28px 28px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#FDF6EE;border-radius:12px;">
      <tr><td style="padding:16px 20px;">
        <table cellpadding="0" cellspacing="0">
          ${minNote}
          <tr><td style="font-size:12px;color:#9B86A8;line-height:1.7;padding:0;">
            This code expires on <strong style="color:#3D2B1F;">${expiryDate}</strong> at <strong style="color:#3D2B1F;">11:59 PM</strong>.
          </td></tr>
        </table>
      </td></tr>
      </table>
    </td></tr>

    <!-- CTA button -->
    <tr><td style="padding:0 28px 36px;text-align:center;">
      <a href="${storeUrl}"
         style="display:inline-block;background:linear-gradient(135deg,#C4828A 0%,#9B86A8 100%);color:#ffffff;text-decoration:none;padding:16px 44px;border-radius:50px;font-size:12px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;">
        Step in. Your gift awaits. ✦
      </a>
      <p style="margin:18px 0 0;font-size:11px;color:#BFC4CC;line-height:1.7;">
        Any questions? Find us on Instagram &amp; TikTok<br>
        <strong style="color:#C4828A;">@exaucee</strong>
      </p>
    </td></tr>

    <!-- Footer -->
    <tr><td style="padding:18px 32px;text-align:center;border-top:1px solid #f5efea;">
      <p style="margin:0 0 4px;font-size:11px;color:#BFC4CC;letter-spacing:0.2em;">── ✦ ──</p>
      <p style="margin:0;font-size:10px;color:#C8BEB8;line-height:1.8;">
        © Exaucée — crafted with love in Tunisia.<br>
        You received this email because you entered your address at our Spin &amp; Win.
      </p>
    </td></tr>

  </table>
  </td></tr>
  </table>

</body>
</html>`

  await transporter.sendMail({
    from:    `"Exaucée" <${process.env.GMAIL_USER}>`,
    to:      email,
    subject: `${meta.emoji} ${meta.headline} — your Exaucée code is waiting`,
    html,
  })
}

export default router
