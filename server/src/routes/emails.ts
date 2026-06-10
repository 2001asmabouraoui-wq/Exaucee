import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { adminAuth } from '../middleware/auth.js'
import { transporter } from '../lib/mailer.js'

const router = Router()

// POST /api/emails/send — send campaign to all or selected subscribers (admin)
router.post('/send', adminAuth, async (req, res) => {
  const { subject, body, target_emails } = req.body

  if (!subject?.trim() || !body?.trim()) {
    res.status(400).json({ error: 'subject and body are required' })
    return
  }

  let recipients: string[] = []

  if (Array.isArray(target_emails) && target_emails.length > 0) {
    recipients = target_emails
  } else {
    const { data, error } = await supabase.from('subscribers').select('email')
    if (error) { res.status(500).json({ error: 'Failed to fetch subscribers' }); return }
    recipients = (data ?? []).map((s: any) => s.email)
  }

  if (recipients.length === 0) {
    res.status(400).json({ error: 'No recipients — add subscribers first' })
    return
  }

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family:'Helvetica Neue',Arial,sans-serif;background:#FFF9F4;margin:0;padding:20px;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #f0ebe3;">
    <div style="background:#C4828A;padding:28px 32px;text-align:center;">
      <h1 style="color:#ffffff;font-size:28px;margin:0;letter-spacing:1px;">✦ Exaucée</h1>
      <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px;">your wish, granted.</p>
    </div>
    <div style="padding:32px;color:#3D2B1F;font-size:14px;line-height:1.8;">
      ${body.replace(/\n/g, '<br>')}
    </div>
    <div style="padding:16px 32px;text-align:center;font-size:11px;color:#9B86A8;border-top:1px solid #f0ebe3;">
      © Exaucée · <a href="mailto:${process.env.GMAIL_USER}" style="color:#C4828A;">Contact</a>
    </div>
  </div>
</body>
</html>`

  try {
    await transporter.sendMail({
      from: `"Exaucée" <${process.env.GMAIL_USER}>`,
      bcc: recipients,
      subject,
      html,
    })
    res.json({ success: true, sent_to: recipients.length })
  } catch (err: any) {
    console.error('Campaign send error:', err)
    res.status(500).json({ error: 'Email send failed: ' + err.message })
  }
})

// GET /api/emails/segment/:type — returns email list for a segment (admin)
router.get('/segment/:type', adminAuth, async (req, res) => {
  const type = String(req.params.type)

  if (type === 'all') {
    const { data } = await supabase.from('subscribers').select('email')
    return res.json({ emails: (data ?? []).map((s: any) => s.email), count: data?.length ?? 0 })
  }

  if (['lipgloss'].includes(type)) {
    const { data } = await supabase.from('orders').select('email, items')
    const emails = new Set<string>()
    for (const order of (data ?? [])) {
      if ((order.items ?? []).some((i: any) => i.category === type || (i.name ?? '').toLowerCase().includes(type))) {
        if (order.email) emails.add(order.email)
      }
    }
    return res.json({ emails: Array.from(emails), count: emails.size })
  }

  if (type === 'inactive') {
    const since = new Date(Date.now() - 60 * 86400000).toISOString()
    const { data: activeOrders } = await supabase.from('orders').select('email').gte('created_at', since)
    const activeEmails = new Set((activeOrders ?? []).map((o: any) => o.email))
    const { data: allOrders } = await supabase.from('orders').select('email')
    const allEmails = [...new Set((allOrders ?? []).map((o: any) => o.email))]
    const inactiveEmails = allEmails.filter(e => !activeEmails.has(e))
    return res.json({ emails: inactiveEmails, count: inactiveEmails.length })
  }

  res.status(400).json({ error: 'Unknown segment type' })
})

export default router
