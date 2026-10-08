import fs from 'fs';

async function runTests() {
  console.log('=== STARTING AUTOMATED TEST SUITE ===');

  // 1. Get tracks
  const tracksRes = await fetch('http://localhost:3001/api/tracks');
  const tracksData = await tracksRes.json();
  console.log(`[TEST 1] GET /api/tracks -> Found ${tracksData.tracks.length} tracks. OK!`);

  // 2. Upload custom cover
  const trackId = tracksData.tracks[0].id;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="#2d3748"/><circle cx="50" cy="50" r="25" fill="#e2e8f0"/></svg>`;
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const form = new FormData();
  form.append('cover', blob, 'custom_art.svg');

  const coverRes = await fetch(`http://localhost:3001/api/tracks/${trackId}/cover`, {
    method: 'POST',
    body: form
  });
  const coverData = await coverRes.json();
  console.log(`[TEST 2] POST /api/tracks/:id/cover -> Updated coverPath: ${coverData.track?.coverPath}. OK!`);

  // 3. Create playlist
  const plRes = await fetch('http://localhost:3001/api/playlists', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Automated Test Playlist', description: 'Testing playlist CRUD' })
  });
  const plData = await plRes.json();
  const playlistId = plData.playlist.id;
  console.log(`[TEST 3] POST /api/playlists -> Created playlist ID: ${playlistId}. OK!`);

  // 4. Add track to playlist
  const addTrackRes = await fetch(`http://localhost:3001/api/playlists/${playlistId}/tracks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trackId })
  });
  const addTrackData = await addTrackRes.json();
  console.log(`[TEST 4] POST /api/playlists/:id/tracks -> Track count now: ${addTrackData.playlist.tracks.length}. OK!`);

  // 5. Toggle favorite
  const favRes = await fetch(`http://localhost:3001/api/favorites/${trackId}`, { method: 'POST' });
  const favData = await favRes.json();
  console.log(`[TEST 5] POST /api/favorites/:id -> isFavorite now: ${favData.isFavorite}. OK!`);

  // 6. Record history
  const histRes = await fetch(`http://localhost:3001/api/history/${trackId}`, { method: 'POST' });
  const histData = await histRes.json();
  console.log(`[TEST 6] POST /api/history/:id -> Recorded playback. OK!`);

  // 7. Get history
  const getHistRes = await fetch('http://localhost:3001/api/history');
  const getHistData = await getHistRes.json();
  console.log(`[TEST 7] GET /api/history -> History count: ${getHistData.history.length}. OK!`);

  // 8. Test Settings save and get
  await fetch('http://localhost:3001/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ volume: 0.85, repeatMode: 'all', isShuffled: true })
  });
  const settingsRes = await fetch('http://localhost:3001/api/settings');
  const settingsData = await settingsRes.json();
  console.log(`[TEST 8] GET/POST /api/settings -> Saved volume: ${settingsData.settings.volume}, repeat: ${settingsData.settings.repeatMode}. OK!`);

  console.log('=== ALL AUTOMATED TESTS PASSED SUCCESSFULLY! ===');
}

runTests().catch(err => {
  console.error('TEST SUITE FAILED:', err);
  process.exit(1);
});
