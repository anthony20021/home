<script setup>
defineProps({ link: { type: Object, required: true } })
</script>

<template>
  <a class="card" :href="link.url" target="_blank" rel="noopener noreferrer">
    <span class="icon">{{ link.icon || '🔗' }}</span>
    <span class="text">
      <strong>{{ link.name }}</strong>
      <small v-if="link.desc">{{ link.desc }}</small>
    </span>
  </a>
</template>

<style scoped>
.card {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 1rem 1.1rem;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
  color: inherit;
  text-decoration: none;
  transition: transform 0.15s, border-color 0.15s, box-shadow 0.15s;
}
.card:hover {
  transform: translateY(-2px);
  border-color: var(--accent);
  box-shadow: 0 6px 18px rgb(0 0 0 / 0.2);
}
.icon { font-size: 1.8rem; }
.text { display: flex; flex-direction: column; min-width: 0; }
small { color: var(--muted); }
</style>
