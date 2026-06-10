<template>
  <div class="pointer-events-none fixed inset-0 overflow-hidden" style="z-index:35;" aria-hidden="true">
    <div
      v-for="p in petals"
      :key="p.id"
      class="sakura-petal absolute"
      :style="p.style"
    ></div>
  </div>
</template>

<script setup lang="ts">
const petals = [
  { id:  1, style: { left:'3%',   animationDuration:'12s', animationDelay:'-2s',   width:'10px', height:'13px', opacity:'0.65' } },
  { id:  2, style: { left:'9%',   animationDuration:'16s', animationDelay:'-6s',   width:'8px',  height:'11px', opacity:'0.5'  } },
  { id:  3, style: { left:'17%',  animationDuration:'11s', animationDelay:'-1s',   width:'12px', height:'15px', opacity:'0.7'  } },
  { id:  4, style: { left:'24%',  animationDuration:'14s', animationDelay:'-9s',   width:'9px',  height:'12px', opacity:'0.55' } },
  { id:  5, style: { left:'31%',  animationDuration:'10s', animationDelay:'-4s',   width:'11px', height:'14px', opacity:'0.6'  } },
  { id:  6, style: { left:'38%',  animationDuration:'17s', animationDelay:'-12s',  width:'8px',  height:'10px', opacity:'0.5'  } },
  { id:  7, style: { left:'45%',  animationDuration:'13s', animationDelay:'-7s',   width:'13px', height:'16px', opacity:'0.65' } },
  { id:  8, style: { left:'52%',  animationDuration:'9s',  animationDelay:'-3s',   width:'9px',  height:'12px', opacity:'0.6'  } },
  { id:  9, style: { left:'59%',  animationDuration:'15s', animationDelay:'-10s',  width:'11px', height:'14px', opacity:'0.55' } },
  { id: 10, style: { left:'66%',  animationDuration:'12s', animationDelay:'-5s',   width:'8px',  height:'11px', opacity:'0.7'  } },
  { id: 11, style: { left:'73%',  animationDuration:'18s', animationDelay:'-14s',  width:'12px', height:'15px', opacity:'0.5'  } },
  { id: 12, style: { left:'80%',  animationDuration:'11s', animationDelay:'-2s',   width:'10px', height:'13px', opacity:'0.65' } },
  { id: 13, style: { left:'87%',  animationDuration:'14s', animationDelay:'-8s',   width:'9px',  height:'12px', opacity:'0.6'  } },
  { id: 14, style: { left:'93%',  animationDuration:'16s', animationDelay:'-11s',  width:'11px', height:'14px', opacity:'0.55' } },
  { id: 15, style: { left:'6%',   animationDuration:'13s', animationDelay:'-15s',  width:'7px',  height:'10px', opacity:'0.45' } },
  { id: 16, style: { left:'55%',  animationDuration:'10s', animationDelay:'-6s',   width:'14px', height:'17px', opacity:'0.6'  } },
  { id: 17, style: { left:'42%',  animationDuration:'15s', animationDelay:'-13s',  width:'8px',  height:'11px', opacity:'0.5'  } },
  { id: 18, style: { left:'78%',  animationDuration:'12s', animationDelay:'-4s',   width:'10px', height:'13px', opacity:'0.65' } },
]
</script>

<style scoped>
.sakura-petal {
  top: -20px;
  background: linear-gradient(135deg, #FFB7C5 0%, #F9A8BF 50%, #F0C0CC 100%);
  border-radius: 150% 0% 150% 0%;
  animation: sakura-fall linear infinite;
  will-change: transform;
}

@keyframes sakura-fall {
  0% {
    transform: translateY(-20px) rotate(0deg) translateX(0px);
    opacity: 0;
  }
  8% {
    opacity: var(--op, 0.6);
  }
  25% {
    transform: translateY(25vh) rotate(90deg) translateX(40px);
  }
  50% {
    transform: translateY(50vh) rotate(200deg) translateX(-30px);
  }
  75% {
    transform: translateY(75vh) rotate(300deg) translateX(50px);
  }
  92% {
    opacity: var(--op, 0.6);
  }
  100% {
    transform: translateY(108vh) rotate(400deg) translateX(10px);
    opacity: 0;
  }
}
</style>
