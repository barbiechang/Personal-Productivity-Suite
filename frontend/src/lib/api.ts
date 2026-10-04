import axios from 'axios'

const apiOrigin = import.meta.env.VITE_API_URL ?? ''

export const api = axios.create({
  baseURL: `${apiOrigin}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
})
