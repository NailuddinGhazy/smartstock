
const API_URL = 'http://localhost:8000'

export async function getCsrfCookie() {
  const response = await fetch(`${API_URL}/sanctum/csrf-cookie`, {
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Gagal menyiapkan keamanan sesi login.')
  }
}

export async function apiFetch(path, options = {}) {
  const xsrfCookie = document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith('XSRF-TOKEN='))

  const headers = {
    Accept: 'application/json',
    ...options.headers,
  }

  const method = (options.method || 'GET').toUpperCase()

  if (!['GET', 'HEAD', 'OPTIONS'].includes(method) && xsrfCookie) {
    headers['X-XSRF-TOKEN'] = decodeURIComponent(
      xsrfCookie.slice('XSRF-TOKEN='.length)
    )
  }

  return fetch(`${API_URL}${path}`, {
    ...options,
    method,
    headers,
    credentials: 'include',
  })
}
