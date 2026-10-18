<script setup>
import { ref, onMounted } from 'vue'
import { fetchLinks, saveLinks, login, logout, getToken } from '../api.js'

const authed = ref(!!getToken())
const user = ref('')
const password = ref('')
const error = ref('')
const status = ref('')
const groups = ref([])

async function load() {
  groups.value = await fetchLinks().catch(() => [])
}
onMounted(() => { if (authed.value) load() })

async function doLogin() {
  error.value = ''
  try {
    await login(user.value, password.value)
    password.value = ''
    authed.value = true
    await load()
  } catch (e) {
    error.value = e.message
  }
}

function doLogout() {
  logout()
  authed.value = false
}

const addGroup = () => groups.value.push({ category: 'Nouvelle catégorie', items: [] })
const removeGroup = (gi) => confirm('Supprimer cette catégorie et ses liens ?') && groups.value.splice(gi, 1)
const addItem = (g) => g.items.push({ name: '', url: 'https://', icon: '', desc: '' })
const removeItem = (g, ii) => g.items.splice(ii, 1)
function move(arr, i, d) {
  const j = i + d
  if (j < 0 || j >= arr.length) return
  ;[arr[i], arr[j]] = [arr[j], arr[i]]
}

async function save() {
  status.value = ''
  error.value = ''
  try {
    groups.value = await saveLinks(groups.value)
    status.value = 'Enregistré ✔'
  } catch (e) {
    error.value = e.message
    if (e.status === 401) authed.value = false
  }
}
</script>

<template>
  <main>
    <header>
      <h1>⚙️ Administration</h1>
      <div class="actions">
        <router-link to="/">← Retour</router-link>
        <button v-if="authed" class="ghost" @click="doLogout">Déconnexion</button>
      </div>
    </header>

    <form v-if="!authed" class="login" @submit.prevent="doLogin">
      <input v-model="user" placeholder="Identifiant" autocomplete="username" required />
      <input v-model="password" type="password" placeholder="Mot de passe" autocomplete="current-password" required />
      <button>Connexion</button>
      <p v-if="error" class="err">{{ error }}</p>
    </form>

    <template v-else>
      <section v-for="(g, gi) in groups" :key="gi" class="group">
        <div class="row head">
          <input v-model="g.category" class="title" placeholder="Catégorie" />
          <button class="ghost" @click="move(groups, gi, -1)">↑</button>
          <button class="ghost" @click="move(groups, gi, 1)">↓</button>
          <button class="danger" @click="removeGroup(gi)">🗑</button>
        </div>

        <div v-for="(it, ii) in g.items" :key="ii" class="row item">
          <input v-model="it.icon" class="icon" placeholder="🎮" />
          <input v-model="it.name" placeholder="Nom" />
          <input v-model="it.url" class="url" placeholder="https://…" />
          <input v-model="it.desc" placeholder="Description (optionnel)" />
          <button class="ghost" @click="move(g.items, ii, -1)">↑</button>
          <button class="ghost" @click="move(g.items, ii, 1)">↓</button>
          <button class="danger" @click="removeItem(g, ii)">✕</button>
        </div>

        <button class="ghost" @click="addItem(g)">+ Ajouter un lien</button>
      </section>

      <button class="ghost" @click="addGroup">+ Ajouter une catégorie</button>

      <div class="bar">
        <button @click="save">Enregistrer</button>
        <span v-if="status" class="ok">{{ status }}</span>
        <span v-if="error" class="err">{{ error }}</span>
      </div>
    </template>
  </main>
</template>

<style scoped>
main { max-width: 1000px; margin: 0 auto; padding: 2rem 1rem 5rem; }
header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 2rem; }
h1 { margin: 0; }
.actions { display: flex; gap: 1rem; align-items: center; }
a { color: var(--accent); text-decoration: none; }
input {
  padding: 0.55rem 0.7rem; background: var(--card); color: inherit; min-width: 0;
  border: 1px solid var(--border); border-radius: 8px; font: inherit;
}
input:focus { outline: none; border-color: var(--accent); }
button {
  padding: 0.55rem 1rem; border: 0; border-radius: 8px; cursor: pointer;
  background: var(--accent); color: #0f1220; font: inherit; font-weight: 600;
}
button.ghost { background: transparent; color: var(--text); border: 1px solid var(--border); }
button.ghost:hover { border-color: var(--accent); }
button.danger { background: transparent; color: #ff7b7b; border: 1px solid var(--border); }
.login { display: flex; flex-direction: column; gap: 0.8rem; max-width: 320px; margin: 3rem auto; }
.group { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 1rem; margin-bottom: 1.2rem; }
.row { display: flex; gap: 0.5rem; margin-bottom: 0.6rem; }
.row input { flex: 1; }
.row .icon { flex: 0 0 56px; text-align: center; }
.row .url { flex: 1.6; }
.title { font-weight: 700; font-size: 1.05rem; }
.bar { position: sticky; bottom: 0; display: flex; gap: 1rem; align-items: center; padding: 1rem 0; background: var(--bg); }
.ok { color: #6ee7a0; }
.err { color: #ff7b7b; }
@media (max-width: 700px) { .row { flex-wrap: wrap; } .row input { flex: 1 1 45%; } }
</style>
