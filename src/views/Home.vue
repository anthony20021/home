<script setup>
import { ref, computed, onMounted } from 'vue'
import { fetchLinks } from '../api.js'
import LinkCard from '../components/LinkCard.vue'

const groups = ref([])
const query = ref('')

onMounted(async () => { groups.value = await fetchLinks().catch(() => []) })

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return groups.value
  return groups.value
    .map((g) => ({ ...g, items: g.items.filter((i) => `${i.name} ${i.desc ?? ''}`.toLowerCase().includes(q)) }))
    .filter((g) => g.items.length)
})
</script>

<template>
  <main>
    <header>
      <h1>🏠 Home</h1>
      <div class="actions">
        <input v-model="query" type="search" placeholder="Rechercher…" autofocus />
        <router-link to="/admin" class="admin" title="Administration">⚙️</router-link>
      </div>
    </header>

    <section v-for="g in filtered" :key="g.category">
      <h2>{{ g.category }}</h2>
      <div class="grid">
        <LinkCard v-for="l in g.items" :key="l.url + l.name" :link="l" />
      </div>
    </section>

    <p v-if="!filtered.length" class="empty">Aucun lien.</p>
  </main>
</template>

<style scoped>
main { max-width: 960px; margin: 0 auto; padding: 2rem 1rem 4rem; }
header { display: flex; flex-wrap: wrap; gap: 1rem; align-items: center; justify-content: space-between; margin-bottom: 2rem; }
h1 { margin: 0; }
.actions { display: flex; gap: 0.6rem; align-items: center; }
.admin { text-decoration: none; font-size: 1.3rem; opacity: 0.6; }
.admin:hover { opacity: 1; }
input {
  padding: 0.6rem 0.9rem; min-width: 220px;
  background: var(--card); color: inherit;
  border: 1px solid var(--border); border-radius: 10px; font: inherit;
}
input:focus { outline: none; border-color: var(--accent); }
h2 { margin: 2rem 0 0.8rem; color: var(--muted); font-size: 0.95rem; text-transform: uppercase; letter-spacing: 0.08em; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 0.9rem; }
.empty { color: var(--muted); text-align: center; margin-top: 3rem; }
</style>
