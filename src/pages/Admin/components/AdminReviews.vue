<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const props = defineProps<{ apiUrl: string; authToken: string }>()

interface Review {
  id: string
  product_name: string
  reviewer_name: string
  rating: number
  comment: string
  created_at: string
  approved: boolean
}

type FilterTab = 'all' | 'pending' | 'approved'

const reviews        = ref<Review[]>([])
const loading        = ref(false)
const actionMsg      = ref('')
const actionErr      = ref('')
const activeFilter   = ref<FilterTab>('all')
const confirmDeleteId = ref<string | null>(null)

const headers = computed(() => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${props.authToken}`,
}))

const filteredReviews = computed(() => {
  if (activeFilter.value === 'pending')  return reviews.value.filter(r => !r.approved)
  if (activeFilter.value === 'approved') return reviews.value.filter(r => r.approved)
  return reviews.value
})

const countAll      = computed(() => reviews.value.length)
const countPending  = computed(() => reviews.value.filter(r => !r.approved).length)
const countApproved = computed(() => reviews.value.filter(r => r.approved).length)

async function load() {
  loading.value = true
  actionMsg.value = actionErr.value = ''
  const res = await fetch(`${props.apiUrl}/api/reviews/all`, { headers: headers.value })
  reviews.value = res.ok ? await res.json() : []
  loading.value = false
}

async function toggleApproval(review: Review) {
  const res = await fetch(`${props.apiUrl}/api/reviews/${review.id}`, {
    method: 'PATCH',
    headers: headers.value,
    body: JSON.stringify({ approved: !review.approved }),
  })
  if (res.ok) {
    review.approved = !review.approved
    actionMsg.value = review.approved ? '✓ Review approved.' : '✓ Review unapproved.'
  } else {
    actionErr.value = 'Failed to update review.'
  }
}

async function deleteReview(id: string) {
  await fetch(`${props.apiUrl}/api/reviews/${id}`, {
    method: 'DELETE',
    headers: headers.value,
  })
  confirmDeleteId.value = null
  actionMsg.value = '✓ Review deleted.'
  await load()
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-TN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function renderStars(rating: number) {
  const filled = Math.round(rating)
  return '★'.repeat(filled) + '☆'.repeat(Math.max(0, 5 - filled))
}

onMounted(load)
</script>

<template>
  <div class="max-w-3xl mx-auto">

    <!-- Feedback -->
    <p v-if="actionMsg" class="text-xs mb-4 px-4 py-2.5 rounded-xl" style="background:#F0FFF8; color:#5A9E8A; border:1px solid #b6f0d8;">{{ actionMsg }}</p>
    <p v-if="actionErr" class="text-xs mb-4 px-4 py-2.5 rounded-xl" style="background:#FFF5F5; color:#C4828A; border:1px solid #f0c4c4;">{{ actionErr }}</p>

    <!-- Filter tabs -->
    <div class="filter-tabs mb-5">
      <button
        @click="activeFilter = 'all'"
        class="filter-btn"
        :class="{ 'filter-btn--active': activeFilter === 'all' }"
      >All <span class="tab-count">{{ countAll }}</span></button>
      <button
        @click="activeFilter = 'pending'"
        class="filter-btn"
        :class="{ 'filter-btn--active': activeFilter === 'pending' }"
      >Pending <span class="tab-count">{{ countPending }}</span></button>
      <button
        @click="activeFilter = 'approved'"
        class="filter-btn"
        :class="{ 'filter-btn--active': activeFilter === 'approved' }"
      >Approved <span class="tab-count">{{ countApproved }}</span></button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-16 text-sm opacity-30" style="color:#3D2B1F;">Loading…</div>

    <!-- Empty -->
    <div v-else-if="filteredReviews.length === 0" class="empty-state">No reviews found.</div>

    <!-- Reviews list -->
    <div v-else class="flex flex-col gap-3">
      <div
        v-for="r in filteredReviews"
        :key="r.id"
        class="review-card"
        :class="{ 'review-card--approved': r.approved }"
      >
        <!-- Header row -->
        <div class="flex items-start justify-between gap-3 mb-2">
          <div class="min-w-0">
            <p class="text-xs font-bold truncate" style="color:#3D2B1F;">{{ r.reviewer_name }}</p>
            <p class="text-[10px] opacity-60 truncate" style="color:#3D2B1F;">{{ r.product_name }}</p>
          </div>
          <div class="flex items-center gap-2 flex-shrink-0">
            <span class="approved-badge" v-if="r.approved">Approved</span>
            <span class="pending-badge" v-else>Pending</span>
            <span class="text-[10px] opacity-40" style="color:#3D2B1F;">{{ formatDate(r.created_at) }}</span>
          </div>
        </div>

        <!-- Stars -->
        <div class="stars mb-2">{{ renderStars(r.rating) }} <span class="text-[10px] opacity-50 ml-1" style="color:#3D2B1F;">{{ r.rating }}/5</span></div>

        <!-- Comment -->
        <p class="text-xs leading-relaxed mb-3" style="color:#3D2B1F; opacity:0.8;">{{ r.comment || '—' }}</p>

        <!-- Actions -->
        <div class="flex gap-2">
          <button
            v-if="!r.approved"
            @click="toggleApproval(r)"
            class="approve-btn"
          >Approve</button>
          <button
            v-else
            @click="toggleApproval(r)"
            class="unapprove-btn"
          >Unapprove</button>
          <button @click="confirmDeleteId = r.id" class="del-btn">Delete</button>
        </div>
      </div>
    </div>

    <!-- Delete confirm modal -->
    <div v-if="confirmDeleteId" class="modal-overlay" @click.self="confirmDeleteId = null">
      <div class="confirm-box">
        <p class="text-sm font-bold mb-1" style="color:#3D2B1F;">Delete this review?</p>
        <p class="text-xs opacity-60 mb-5" style="color:#3D2B1F;">This action cannot be undone.</p>
        <div class="flex gap-3">
          <button @click="confirmDeleteId = null" class="cancel-btn">Cancel</button>
          <button @click="deleteReview(confirmDeleteId!)" class="confirm-btn">Delete</button>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.empty-state {
  text-align: center; padding: 28px 0;
  font-size: 12px; color: #9B86A8; opacity: 0.6;
}

/* Filter tabs */
.filter-tabs {
  display: flex; gap: 6px; flex-wrap: wrap;
  border-bottom: 2px solid #f0ebe3; padding-bottom: 0;
}
.filter-btn {
  padding: 7px 16px; border-radius: 10px 10px 0 0;
  border: 1px solid transparent; border-bottom: none;
  font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.08em;
  color: #9B86A8; background: transparent; cursor: pointer;
  transition: all 0.15s; position: relative; bottom: -2px;
  display: flex; align-items: center; gap: 5px;
}
.filter-btn--active {
  background: #ffffff; border-color: #f0ebe3;
  border-bottom-color: #ffffff; color: #C4828A;
}
.filter-btn:hover:not(.filter-btn--active) { color: #3D2B1F; }
.tab-count {
  font-size: 9px; font-weight: 800;
  background: #f0ebe3; color: #9B86A8;
  padding: 1px 6px; border-radius: 10px;
}
.filter-btn--active .tab-count { background: #C4828A18; color: #C4828A; }

/* Review card */
.review-card {
  border: 1px solid #f0ebe3; border-radius: 14px;
  padding: 16px; background: #fff;
  transition: border-color 0.2s;
}
.review-card--approved {
  border-color: #5A9E8A30; background: #FAFFFD;
}

/* Stars */
.stars { font-size: 14px; color: #C9A45A; letter-spacing: 1px; }

/* Badges */
.approved-badge {
  font-size: 9px; font-weight: 800; letter-spacing: 0.08em;
  text-transform: uppercase; color: #5A9E8A;
  background: #5A9E8A18; border: 1px solid #5A9E8A40;
  padding: 2px 8px; border-radius: 20px;
}
.pending-badge {
  font-size: 9px; font-weight: 800; letter-spacing: 0.08em;
  text-transform: uppercase; color: #C9A45A;
  background: #C9A45A18; border: 1px solid #C9A45A40;
  padding: 2px 8px; border-radius: 20px;
}

/* Action buttons */
.approve-btn {
  padding: 6px 14px; border-radius: 20px; flex-shrink: 0;
  border: 1.5px solid #5A9E8A; background: #fff;
  color: #5A9E8A; font-size: 10px; font-weight: 700; cursor: pointer;
  transition: all 0.2s;
}
.approve-btn:hover { background: #5A9E8A; color: #fff; }
.unapprove-btn {
  padding: 6px 14px; border-radius: 20px; flex-shrink: 0;
  border: 1.5px solid #e0dbd5; background: #fff;
  color: #9B86A8; font-size: 10px; font-weight: 700; cursor: pointer;
  transition: all 0.2s;
}
.unapprove-btn:hover { background: #9B86A8; color: #fff; border-color: #9B86A8; }
.del-btn {
  padding: 6px 14px; border-radius: 20px; cursor: pointer;
  border: 1.5px solid #f0c4c4; background: #fff;
  color: #C4828A; font-size: 10px; font-weight: 700;
  transition: all 0.2s;
}
.del-btn:hover { background: #C4828A; color: #fff; border-color: #C4828A; }

/* Modal */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.3);
  display: flex; align-items: center; justify-content: center; z-index: 200;
}
.confirm-box {
  background: #fff; border-radius: 16px; padding: 28px 32px;
  max-width: 300px; width: 90%; text-align: center; border: 1px solid #f0ebe3;
}
.cancel-btn  { flex: 1; padding: 10px; border-radius: 10px; border: 1px solid #f0ebe3; background: #fff; font-size: 12px; font-weight: 600; color: #3D2B1F; cursor: pointer; }
.confirm-btn { flex: 1; padding: 10px; border-radius: 10px; border: none; background: #C4828A; font-size: 12px; font-weight: 700; color: #fff; cursor: pointer; }
</style>
