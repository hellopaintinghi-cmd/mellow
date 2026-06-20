/**
 * Run this to diagnose Spotify:
 *   node test-spotify.js
 */
import 'dotenv/config'

const { SPOTIFY_CLIENT_ID: id, SPOTIFY_CLIENT_SECRET: secret } = process.env

if (!id || !secret) {
  console.error('❌ No Spotify credentials in .env')
  process.exit(1)
}

// 1. Get token
const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Authorization': 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64'),
  },
  body: 'grant_type=client_credentials',
})
const tokenData = await tokenRes.json()
const token = tokenData.access_token

if (!token) {
  console.error('❌ Token fetch failed:', tokenData)
  process.exit(1)
}
console.log('✅ Spotify token OK')

// 2. Test search
const query = 'lofi rain chill'
const searchRes = await fetch(
  `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10&market=US`,
  { headers: { Authorization: `Bearer ${token}` } }
)
const searchData = await searchRes.json()
const tracks = searchData.tracks?.items ?? []

console.log(`\n📦 Search for "${query}" → ${tracks.length} tracks`)
console.log('preview_url availability:')
tracks.forEach((t, i) => {
  const hasPreview = !!t.preview_url
  console.log(`  ${i+1}. ${t.name} — ${t.artists[0].name} | preview: ${hasPreview ? '✅ ' + t.preview_url.slice(0,50) + '...' : '❌ null'}`)
})

const withPreview = tracks.filter(t => t.preview_url)
console.log(`\n${withPreview.length}/${tracks.length} tracks have preview URLs`)

if (withPreview.length === 0) {
  console.log('\n⚠️  Spotify is returning no preview_url for this market/query.')
  console.log('   This is a known Spotify API issue since late 2024.')
  console.log('   The fix is to use iTunes Search API instead (free, no auth, 30s previews).')
}
