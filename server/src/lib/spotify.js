/**
 * Spotify Web API — Client Credentials flow
 * Searches for tracks matching a mood query and returns ones with preview_url.
 * Falls back to static songs.json if keys are missing or search fails.
 */

let _token     = null
let _tokenExp  = 0

async function getToken() {
  if (_token && Date.now() < _tokenExp) return _token

  const { SPOTIFY_CLIENT_ID: id, SPOTIFY_CLIENT_SECRET: secret } = process.env
  if (!id || !secret) return null

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method:  'POST',
    headers: {
      'Content-Type':  'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64'),
    },
    body: 'grant_type=client_credentials',
  })

  if (!res.ok) {
    console.error('[Spotify] Token fetch failed:', res.status, await res.text())
    return null
  }

  const data = await res.json()
  _token    = data.access_token
  _tokenExp = Date.now() + (data.expires_in - 60) * 1000   // refresh 60s early
  return _token
}

/**
 * Search Spotify and return up to `limit` tracks that have a 30s preview URL.
 * Each returned track has the shape our frontend expects.
 */
export async function searchTracks(query, limit = 8) {
  const token = await getToken()
  if (!token) return null

  try {
    const q   = encodeURIComponent(query)
    const res = await fetch(
      `https://api.spotify.com/v1/search?q=${q}&type=track&limit=30&market=US`,
      { headers: { Authorization: `Bearer ${token}` } }
    )

    if (!res.ok) {
      console.error('[Spotify] Search failed:', res.status)
      return null
    }

    const data   = await res.json()
    const tracks = (data.tracks?.items ?? [])
      .filter(t => t.preview_url)   // only tracks we can actually play
      .slice(0, limit)
      .map(t => ({
        id:               t.id,
        title:            t.name,
        artist:           t.artists.map(a => a.name).join(', '),
        album:            t.album.name,
        albumArt:         t.album.images[0]?.url ?? null,
        previewUrl:       t.preview_url,
        spotifyUrl:       t.external_urls.spotify,
        durationSec:      Math.round(t.duration_ms / 1000),
        genre:            'spotify',
        // Placeholder audio features (Spotify removed free access to /audio-features in 2024)
        energy:           0.5,
        danceability:     0.5,
        valence:          0.5,
        acousticness:     0.3,
        instrumentalness: 0.1,
        coverPalette:     null,
      }))

    return tracks.length > 0 ? tracks : null
  } catch (err) {
    console.error('[Spotify] searchTracks error:', err.message)
    return null
  }
}

/**
 * Build a good Spotify search query from world metadata + Gemini's suggestion.
 */
export function buildSpotifyQuery(world, geminiQuery = null) {
  if (geminiQuery) return geminiQuery
  // Fallback: genre + emotion
  const emotion = world.emotionTags[0] ?? ''
  return `${world.primaryGenre} ${emotion} ${world.secondaryGenre}`.trim()
}
