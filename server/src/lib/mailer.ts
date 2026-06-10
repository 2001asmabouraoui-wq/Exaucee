import nodemailer from 'nodemailer'

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

interface OrderItem {
  name: string
  category: string
  price: number
  quantity: number
}

interface OrderData {
  id: string
  name: string
  email: string
  phone?: string
  address: string
  zip: string
  city: string
  country: string
  payment_method: string
  comment?: string
  items: OrderItem[]
  subtotal: number
  shipping: number
  total: number
}

export async function sendOrderNotification(order: OrderData) {
  const itemRows = order.items
    .map(i => `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f0ebe3;">${i.name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0ebe3;text-align:center;">${i.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0ebe3;text-align:right;">${i.price} TND</td>
    </tr>`)
    .join('')

  const html = `
  <!DOCTYPE html>
  <html>
  <body style="font-family:'Helvetica Neue',Arial,sans-serif;background:#FFF9F4;margin:0;padding:20px;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #f0ebe3;">
      <div style="background:#C4828A;padding:28px 32px;text-align:center;">
        <h1 style="color:#ffffff;font-size:28px;margin:0;letter-spacing:1px;">✦ Exaucée</h1>
        <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px;">New Order Received</p>
      </div>
      <div style="padding:28px 32px;">
        <p style="color:#3D2B1F;font-size:13px;margin-top:0;">
          <strong>Order ID:</strong> ${order.id}<br>
          <strong>Date:</strong> ${new Date().toLocaleString('fr-TN', { timeZone: 'Africa/Tunis' })}
        </p>

        <h3 style="color:#C4828A;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin-bottom:12px;">Customer</h3>
        <p style="color:#3D2B1F;font-size:13px;margin:0 0 4px;"><strong>${order.name}</strong></p>
        <p style="color:#3D2B1F;font-size:13px;margin:0 0 4px;">${order.email}</p>
        <p style="color:#3D2B1F;font-size:13px;margin:0 0 16px;">${order.phone || '—'}</p>

        <h3 style="color:#C4828A;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin-bottom:12px;">Delivery Address</h3>
        <p style="color:#3D2B1F;font-size:13px;margin:0 0 16px;">
          ${order.address}<br>${order.zip} ${order.city}<br>${order.country}
        </p>

        <h3 style="color:#C4828A;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin-bottom:12px;">Items Ordered</h3>
        <table style="width:100%;border-collapse:collapse;font-size:13px;color:#3D2B1F;">
          <thead>
            <tr style="background:#FFF9F4;">
              <th style="padding:8px 12px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#9B86A8;">Product</th>
              <th style="padding:8px 12px;text-align:center;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#9B86A8;">Qty</th>
              <th style="padding:8px 12px;text-align:right;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#9B86A8;">Price</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>

        <div style="margin-top:20px;border-top:2px solid #f0ebe3;padding-top:16px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
            <span style="color:#3D2B1F;font-size:13px;">Subtotal</span>
            <span style="color:#3D2B1F;font-size:13px;font-weight:600;">${order.subtotal} TND</span>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
            <span style="color:#3D2B1F;font-size:13px;">Shipping</span>
            <span style="color:#3D2B1F;font-size:13px;font-weight:600;">${order.shipping} TND</span>
          </div>
          <div style="display:flex;justify-content:space-between;margin-top:10px;padding-top:10px;border-top:1px solid #f0ebe3;">
            <span style="color:#3D2B1F;font-size:14px;font-weight:700;">Total</span>
            <span style="color:#C4828A;font-size:16px;font-weight:700;">${order.total} TND</span>
          </div>
        </div>

        <div style="margin-top:20px;padding:14px;background:#FFF9F4;border-radius:10px;">
          <span style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#9B86A8;">Payment</span><br>
          <span style="color:#3D2B1F;font-size:13px;font-weight:600;">${order.payment_method === 'cash' ? 'Cash on Delivery' : 'e-Money'}</span>
        </div>

        ${order.comment ? `<div style="margin-top:16px;padding:14px;background:#FFF9F4;border-radius:10px;">
          <span style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#9B86A8;">Note</span><br>
          <span style="color:#3D2B1F;font-size:13px;">${order.comment}</span>
        </div>` : ''}
      </div>
      <div style="padding:16px 32px;text-align:center;font-size:11px;color:#9B86A8;">
        Exaucée — your wish, granted.
      </div>
    </div>
  </body>
  </html>`

  await transporter.sendMail({
    from: `"Exaucée Orders" <${process.env.GMAIL_USER}>`,
    to: process.env.ADMIN_EMAIL,
    subject: `✦ New Order — ${order.name} — ${order.total} TND`,
    html,
  })
}

export async function sendRestockNotification(customerEmail: string, productName: string) {
  await transporter.sendMail({
    from: `"Exaucée" <${process.env.GMAIL_USER}>`,
    to: customerEmail,
    subject: `✦ ${productName} is back in stock!`,
    html: `<div style="font-family:'Helvetica Neue',Arial,sans-serif;background:#FFF9F4;padding:32px;">
      <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #f0ebe3;">
        <div style="background:#C4828A;padding:24px 32px;text-align:center;">
          <h1 style="color:#fff;font-size:26px;margin:0;">✦ Exaucée</h1>
        </div>
        <div style="padding:28px 32px;">
          <h2 style="color:#3D2B1F;font-size:18px;margin-top:0;">Great news! Your favourite is back 🎉</h2>
          <p style="color:#3D2B1F;font-size:14px;"><strong>${productName}</strong> is back in stock and ready to order.</p>
          <a href="${process.env.FRONTEND_URL || 'https://exaucee.tn'}" style="display:inline-block;margin-top:16px;padding:12px 28px;background:#C4828A;color:#fff;border-radius:30px;text-decoration:none;font-weight:700;font-size:12px;letter-spacing:1px;text-transform:uppercase;">Shop Now</a>
        </div>
        <div style="padding:16px 32px;text-align:center;font-size:11px;color:#9B86A8;">Exaucée — your wish, granted.</div>
      </div>
    </div>`,
  })
}

export async function sendLowStockAlert(productName: string, remaining: number) {
  await transporter.sendMail({
    from: `"Exaucée Store" <${process.env.GMAIL_USER}>`,
    to: process.env.ADMIN_EMAIL,
    subject: `⚠️ Low Stock Alert — ${productName}`,
    html: `<div style="font-family:sans-serif;padding:24px;background:#FDF6EE;">
      <h2 style="color:#C4828A;">Low Stock Alert</h2>
      <p style="color:#3D2B1F;"><strong>${productName}</strong> is running low.</p>
      <p style="color:#3D2B1F;">Remaining units: <strong>${remaining}</strong></p>
      <p style="color:#9B86A8;font-size:12px;">Exaucée Admin</p>
    </div>`,
  })
}
