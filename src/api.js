const KEY = 'home_token'

export const getToken = () => localStorage.getItem(KEY)
export const logout = () => localStorage.removeItem(KEY)

async function request(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    if (res.status === 401 && getToken()) logout()
    throw Object.assign(new Error(data.error || 'Erreur'), { status: res.status })
  }
  return data
}

export const fetchLinks = () => request('/api/links')
export const saveLinks = (groups) => request('/api/links', { method: 'PUT', body: JSON.stringify(groups) })

export async function login(user, password) {
  const { token } = await request('/api/login', { method: 'POST', body: JSON.stringify({ user, password }) })
  localStorage.setItem(KEY, token)
}
