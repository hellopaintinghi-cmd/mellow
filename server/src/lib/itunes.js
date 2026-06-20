/**
 * iTunes Search API — free, no auth, reliable 30s previews
 * Replaces Spotify preview_url which Spotify removed for most tracks in late 2024.
 *
 * Docs: https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI
 */

/**
 * Search iTunes for tracks matching a query.
 * Returns tracks in the same shape our frontend expects.
 */
export async function searchItunesTracks(query, limit = 8) {
  try {
    const url = `https://itunes.apple.com/search?` + new URLSearchParams({
      term:       query,
      media:      'music',
      entity:     'song',
      limit:      String(limit * 3), // fetch more, filter down
      explicit:   'No',
    })

    const res  = await fetch(url)
    if (!res.ok) {
      console.error('[iTunes] Search failed:', res.status)
      return null
    }

    const data   = await res.json()
    const tracks = (data.results ?? [])
      .filter(t => t.previewUrl)          // only tracks with actual preview audio
      .slice(0, limit)
      .map(t => ({
        id:          String(t.trackId),
        title:       t.trackName,
        artist:      t.artistName,
        album:       t.collectionName,
        albumArt:    t.artworkUrl100?.replace('100x100', '300x300') ?? null,
        previewUrl:  t.previewUrl,        // 30-second AAC preview, always works
        spotifyUrl:  null,                // no Spotify link from iTunes
        durationSec: Math.round((t.trackTimeMillis ?? 30000) / 1000),
        genre:       t.primaryGenreId ? t.primaryGenreId.toString() : 'music',
        energy:           0.5,
        danceability:     0.5,
        valence:          0.5,
        acousticness:     0.3,
        instrumentalness: 0.1,
        coverPalette:     null,
      }))

    return tracks.length > 0 ? tracks : null
  } catch (err) {
    console.error('[iTunes] searchTracks error:', err.message)
    return null
  }
}

/**
 * Build a good iTunes search query from world + gemini data.
 * iTunes works best with genre + mood keywords rather than full sentences.
 */
export function buildItunesQuery(world, geminiQuery = null) {
  if (geminiQuery) {
    // Clean up Gemini's query for iTunes (it handles short keyword strings well)
    return geminiQuery.replace(/["""]/g, '').trim()
  }
  return `${world.primaryGenre} ${world.emotionTags[0] ?? ''} ${world.secondaryGenre ?? ''}`.trim()
}
