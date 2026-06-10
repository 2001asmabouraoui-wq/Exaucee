import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import ordersRouter from './routes/orders.js'
import uploadRouter from './routes/upload.js'
import productsRouter from './routes/products.js'
import subscribersRouter from './routes/subscribers.js'
import emailsRouter from './routes/emails.js'
import adminsRouter from './routes/admins.js'
import spinRouter     from './routes/spin.js'
import couponsRouter  from './routes/coupons.js'
import reviewsRouter  from './routes/reviews.js'
import wishlistRouter from './routes/wishlist.js'
import restockRouter  from './routes/restock.js'
import trackRouter    from './routes/track.js'
import bundlesRouter  from './routes/bundles.js'
import referralRouter from './routes/referral.js'
import loyaltyRouter  from './routes/loyalty.js'
import settingsRouter from './routes/settings.js'
import perksRouter    from './routes/perks.js'

const app = express()

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
].filter(Boolean) as string[]

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true)
    cb(new Error('Not allowed by CORS'))
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'x-admin-secret', 'Authorization'],
}))

app.use(express.json({ limit: '10mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'Exaucée API' })
})

app.use('/api/orders',      ordersRouter)
app.use('/api/products',    productsRouter)
app.use('/api/subscribers', subscribersRouter)
app.use('/api/emails',      emailsRouter)
app.use('/api/admins',      adminsRouter)
app.use('/api/spin',        spinRouter)
app.use('/api/upload',     uploadRouter)
app.use('/api/coupons',   couponsRouter)
app.use('/api/reviews',   reviewsRouter)
app.use('/api/wishlist',       wishlistRouter)
app.use('/api/restock-notify', restockRouter)
app.use('/api/track',          trackRouter)
app.use('/api/bundles',        bundlesRouter)
app.use('/api/referral',       referralRouter)
app.use('/api/loyalty',        loyaltyRouter)
app.use('/api/settings',      settingsRouter)
app.use('/api/perks',         perksRouter)

const PORT = Number(process.env.PORT) || 3001
app.listen(PORT, () => {
  console.log(`✦ Exaucée API running on port ${PORT}`)
})
