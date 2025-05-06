const clientId = '';//uzupełnij o client ID ze Spotify
const clientSecret = '';//uzupełnij o client Secret ze Spotify
const redirectUri = 'http://127.0.0.1:5500';
const scopes = 'user-top-read';

let access_token = '';

const lastfmApiKey = '';//Uzupełnij o API key z Last.fm
const lastfmBaseUrl = 'https://ws.audioscrobbler.com/2.0/';


document.getElementById('login-btn').addEventListener('click', () => {

  const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}`;
  window.location = authUrl;
});

function getAccessTokenFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const error = urlParams.get('error');

  if (error) {
    console.error('Authorization error:', error);
    alert('Wystąpił błąd podczas autoryzacji: ' + error);

    window.history.replaceState({}, document.title, redirectUri);
    return;
  }

  if (code) {

    fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(clientId + ':' + clientSecret),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': redirectUri
      })
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (data.access_token) {
          access_token = data.access_token;
          localStorage.setItem('access_token', access_token);
          window.history.replaceState({}, document.title, redirectUri);
          showMainContent();
        } else {
          throw new Error('Access token not received.');
        }
      })
      .catch(error => {
         console.error('Error fetching access token:', error);
         alert('Nie udało się pobrać tokenu dostępu. Spróbuj ponownie.');

         localStorage.removeItem('access_token');
         window.history.replaceState({}, document.title, redirectUri);
         showLogin();
      });
  } else {
    access_token = localStorage.getItem('access_token');
    if (access_token) {
      fetch('https://api.spotify.com/v1/me', {
          headers: { 'Authorization': `Bearer ${access_token}` }
      })
      .then(response => {
          if (response.ok) {
              showMainContent();
          } else if (response.status === 401) {
              console.log('Access token expired or invalid.');
              localStorage.removeItem('access_token');
              showLogin();
          } else {
             throw new Error(`Unexpected response status: ${response.status}`);
          }
      })
      .catch(error => {
          console.error("Error validating token:", error);
          localStorage.removeItem('access_token');
          showLogin();
      });

    } else {
        showLogin();
    }
  }
}

function showLogin() {
    document.getElementById('auth-container').classList.remove('hidden');
    document.getElementById('main-container').classList.add('hidden');
}

function showMainContent() {
    document.getElementById('auth-container').classList.add('hidden');
    document.getElementById('main-container').classList.remove('hidden');
    setupTabs();
    fetchTopTracks();
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('bg-green-600'));
    document.getElementById('tracks-btn')?.classList.add('bg-green-600');
}


function createCard(imageUrl, title, subtitle, type = 'track') {
    const div = document.createElement('div');
    div.className = 'glass-effect hover-card transform transition-all duration-300 p-4 rounded-xl flex items-center space-x-4 mb-4';
    
    const defaultIcons = {
        track: '<svg class="w-8 h-8 text-green-500 animate-pulse-slow" fill="currentColor" viewBox="0 0 20 20"><path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"/></svg>',
        artist: '<svg class="w-8 h-8 text-green-500 animate-pulse-slow" fill="currentColor" viewBox="0 0 20 20"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>',
        genre: '<svg class="w-8 h-8 text-green-500 animate-pulse-slow" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>'
    };
    
    const iconContainer = type === 'artist' ? 'rounded-full' : 'rounded-lg';
    const imageHtml = imageUrl 
        ? `<img src="${imageUrl}" alt="${title}" class="w-16 h-16 ${iconContainer} object-cover ring-2 ring-green-500/20 transform transition-transform duration-300 hover:scale-110">` 
        : `<div class="w-16 h-16 bg-black/50 ${iconContainer} flex items-center justify-center transform transition-transform duration-300 hover:scale-110">${defaultIcons[type]}</div>`;

    div.innerHTML = `
        ${imageHtml}
        <div class="flex-1 min-w-0">
            <p class="text-lg font-semibold truncate bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent hover:from-green-400 hover:to-green-600 transition-all duration-300">${title}</p>
            ${subtitle ? `<p class="text-sm text-gray-400 truncate hover:text-green-400 transition-colors">${subtitle}</p>` : ''}
        </div>
    `;
    
    div.addEventListener('mousedown', function(e) {
        const ripple = document.createElement('div');
        ripple.className = 'ripple';
        this.appendChild(ripple);
        const rect = this.getBoundingClientRect();
        ripple.style.left = `${e.clientX - rect.left}px`;
        ripple.style.top = `${e.clientY - rect.top}px`;
        setTimeout(() => ripple.remove(), 1000);
    });

    div.addEventListener('mouseover', () => {
        div.style.transform = 'translateY(-5px)';
        div.style.boxShadow = '0 10px 20px rgba(34, 197, 94, 0.2)';
    });

    div.addEventListener('mouseout', () => {
        div.style.transform = 'translateY(0)';
        div.style.boxShadow = 'none';
    });

    return div;
}

function addSectionHeader(container, title) {
    const header = document.createElement('h2');
    header.className = 'text-2xl font-bold mb-6 text-center bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent animate-pulse-slow';
    header.textContent = title;
    container.appendChild(header);
}


function setupTabs() {
  const buttons = document.querySelectorAll('.tab-btn');
  buttons.forEach(button => {
    button.replaceWith(button.cloneNode(true));
  });

  document.querySelectorAll('.tab-btn').forEach(button => {
      button.addEventListener('click', () => {
          document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('bg-green-600'));
          button.classList.add('bg-green-600');

          const type = button.dataset.type;
          document.getElementById('right-content').innerHTML = '';

          if (type === 'tracks') fetchTopTracks();
          if (type === 'artists') fetchTopArtists();
          if (type === 'genres') fetchTopGenres();
      });
  });
}

function fetchLastfmData(method, params = {}) {
    const queryParams = new URLSearchParams({
        method: method,
        api_key: lastfmApiKey,
        format: 'json',
        ...params
    });

    return fetch(`${lastfmBaseUrl}?${queryParams}`)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        });
}

function fetchTopTracks() {
    fetch('https://api.spotify.com/v1/me/top/tracks?limit=20&time_range=medium_term', {
        headers: {
            'Authorization': `Bearer ${access_token}`
        }
    })
    .then(response => response.ok ? response.json() : Promise.reject(`Error: ${response.status}`))
    .then(data => {
        const leftContainer = document.getElementById('left-content');
        const rightContainer = document.getElementById('right-content');
        leftContainer.innerHTML = '';
        rightContainer.innerHTML = '';

        addSectionHeader(leftContainer, 'Twoje Ulubione Utwory');

        if (data.items && data.items.length > 0) {
            const favoriteTrackNames = new Set(
                data.items.map(track => `${track.name.toLowerCase()} - ${track.artists[0].name.toLowerCase()}`)
            );

            data.items.forEach(track => {
                const subtitle = track.artists.map(a => a.name).join(', ');
                const imageUrl = track.album.images[0]?.url;
                const card = createCard(imageUrl, track.name, subtitle, 'track');
                card.style.cursor = 'pointer';
                card.addEventListener('click', () => {
                    window.open(track.external_urls.spotify, '_blank');
                });
                leftContainer.appendChild(card);
            });

            addSectionHeader(rightContainer, 'Polecane dla Ciebie na podstawie Last.fm');

            const addedTracks = new Set();
            let recommendationsPromises = [];

            data.items.slice(0, 5).forEach(track => {
                const artist = track.artists[0].name;
                const trackName = track.name;

                recommendationsPromises.push(
                    fetchLastfmData('track.getSimilar', {
                        artist: artist,
                        track: trackName,
                        limit: 10
                    })
                    .then(similarData => {
                        if (similarData.similartracks && similarData.similartracks.track) {
                            return similarData.similartracks.track;
                        }
                        return [];
                    })
                    .catch(error => {
                        console.error(`Error fetching similar tracks for ${trackName}:`, error);
                        return [];
                    })
                );
            });

            Promise.all(recommendationsPromises)
                .then(allSimilarTracks => {
                    const uniqueTracks = allSimilarTracks
                        .flat()
                        .filter(track => {
                            const trackKey = `${track.name.toLowerCase()} - ${track.artist.name.toLowerCase()}`;
                            if (favoriteTrackNames.has(trackKey) || addedTracks.has(trackKey)) {
                                return false;
                            }
                            addedTracks.add(trackKey);
                            return true;
                        })
                        .slice(0, 10);

                    if (uniqueTracks.length > 0) {
                        uniqueTracks.forEach(track => {
                            const card = createCard(
                                null,
                                track.name,
                                track.artist.name,
                                'track'
                            );
                            card.style.cursor = 'pointer';
                            card.addEventListener('click', () => {
                                window.open(track.url, '_blank');
                            });
                            rightContainer.appendChild(card);
                        });
                    } else {
                        rightContainer.innerHTML += '<p class="text-gray-400 text-center mt-4">Nie znaleziono nowych podobnych utworów.</p>';
                    }
                })
                .catch(error => {
                    console.error('Error processing recommendations:', error);
                    rightContainer.innerHTML += '<p class="text-red-500 text-center mt-4">Błąd podczas ładowania podobnych utworów.</p>';
                });
        } else {
            leftContainer.innerHTML += '<p class="text-gray-400 text-center">Nie znaleziono ulubionych utworów.</p>';
        }
    })
    .catch(error => {
        console.error('Error fetching top tracks:', error);
        document.getElementById('left-content').innerHTML = '<p class="text-red-500 text-center">Błąd podczas ładowania utworów.</p>';
        if (error.includes('401')) handleUnauthorized();
    });
}

function fetchTopArtists() {
    fetch('https://api.spotify.com/v1/me/top/artists?limit=20&time_range=medium_term', {
        headers: {
            'Authorization': `Bearer ${access_token}`
        }
    })
    .then(response => response.ok ? response.json() : Promise.reject(`Error: ${response.status}`))
    .then(data => {
        const leftContainer = document.getElementById('left-content');
        const rightContainer = document.getElementById('right-content');
        leftContainer.innerHTML = '';
        rightContainer.innerHTML = '';

        addSectionHeader(leftContainer, 'Twoi Ulubieni Artyści');

        if (data.items && data.items.length > 0) {
            const favoriteArtistNames = new Set(
                data.items.map(artist => artist.name.toLowerCase())
            );

            data.items.forEach(artist => {
                const imageUrl = artist.images[0]?.url || 'https://www.svgrepo.com/show/498167/profile-circle.svg';
                const card = createCard(imageUrl, artist.name, '', 'artist'); 
                card.style.cursor = 'pointer';
                card.addEventListener('click', () => {
                    window.open(artist.external_urls.spotify, '_blank');
                });
                leftContainer.appendChild(card);
            });

            const firstArtist = data.items[0];
            
            fetchLastfmData('artist.getSimilar', {
                artist: firstArtist.name,
                limit: 20
            })
            .then(similarData => {
                addSectionHeader(rightContainer, 'Polecani Artyści na podstawie Last.fm');

                if (similarData.similarartists && similarData.similarartists.artist) {
                    const uniqueArtists = similarData.similarartists.artist.filter(artist => 
                        !favoriteArtistNames.has(artist.name.toLowerCase())
                    );

                    if (uniqueArtists.length > 0) {
                        uniqueArtists.slice(0, 10).forEach(artist => {
                            const card = createCard(
                                null,
                                artist.name,
                                '',
                                'artist'
                            );
                            card.style.cursor = 'pointer';
                            card.addEventListener('click', () => {
                                window.open(artist.url, '_blank');
                            });
                            rightContainer.appendChild(card);
                        });
                    } else {
                        rightContainer.innerHTML += '<p class="text-gray-400 text-center mt-4">Nie znaleziono nowych podobnych artystów.</p>';
                    }
                } else {
                    rightContainer.innerHTML += '<p class="text-gray-400 text-center mt-4">Nie znaleziono podobnych artystów.</p>';
                }
            })
            .catch(error => {
                console.error('Error fetching similar artists from Last.fm:', error);
                rightContainer.innerHTML = '<p class="text-red-500 text-center mt-4">Błąd podczas ładowania podobnych artystów.</p>';
            });
        } else {
            leftContainer.innerHTML += '<p class="text-gray-400 text-center">Nie znaleziono ulubionych artystów.</p>';
        }
    })
    .catch(error => {
        console.error('Error fetching top artists:', error);
        document.getElementById('left-content').innerHTML = '<p class="text-red-500 text-center">Błąd podczas ładowania artystów.</p>';
        if (error.includes('401')) handleUnauthorized();
    });
}

function fetchTopGenres() {
    fetch('https://api.spotify.com/v1/me/top/artists?limit=50&time_range=medium_term', {
        headers: {
            'Authorization': `Bearer ${access_token}`
        }
    })
    .then(response => response.ok ? response.json() : Promise.reject(`Error: ${response.status}`))
    .then(data => {
        const leftContainer = document.getElementById('left-content');
        const rightContainer = document.getElementById('right-content');
        leftContainer.innerHTML = '';
        rightContainer.innerHTML = '';
        addSectionHeader(leftContainer, 'Twoje Ulubione Gatunki');

        if (data.items && data.items.length > 0) {
            const genreCounts = {};
            data.items.forEach(artist => {
                artist.genres.forEach(genre => {
                    genreCounts[genre] = (genreCounts[genre] || 0) + 1;
                });
            });

            const sortedGenres = Object.entries(genreCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([genre]) => genre);

            if (sortedGenres.length > 0) {
                sortedGenres.forEach(genre => {
                    const card = createCard(null, genre, '', 'genre');
                    card.style.cursor = 'pointer';
                    card.addEventListener('click', () => {
                        fetchGenreRecommendations([genre]);
                    });
                    leftContainer.appendChild(card);
                });

                fetchGenreRecommendations([sortedGenres[0]]);
            } else {
                leftContainer.innerHTML += '<p class="text-gray-400 text-center">Nie znaleziono gatunków.</p>';
            }
        } else {
            leftContainer.innerHTML += '<p class="text-gray-400 text-center">Nie znaleziono ulubionych artystów.</p>';
        }
    })
    .catch(error => {
        console.error('Error fetching genres:', error);
        document.getElementById('left-content').innerHTML = '<p class="text-red-500 text-center">Błąd podczas ładowania gatunków.</p>';
        if (error.includes('401')) handleUnauthorized();
    });
}

function fetchGenreRecommendations(seedGenres) {
    if (!seedGenres || seedGenres.length === 0) {
        console.log("Brak gatunków do rekomendacji.");
        const rightContainer = document.getElementById('right-content');
        rightContainer.innerHTML = '<p class="text-gray-400 text-center mt-4">Brak gatunków do rekomendacji.</p>';
        return;
    }

    const rightContainer = document.getElementById('right-content');
    rightContainer.innerHTML = '';
    
    fetchLastfmData('tag.getTopArtists', {
        tag: seedGenres[0],
        limit: 10
    })
    .then(data => {
        if (!data.topartists || !data.topartists.artist || data.topartists.artist.length === 0) {
            rightContainer.innerHTML = '<p class="text-gray-400 text-center mt-4">Brak wyników dla tego gatunku</p>';
            return Promise.reject('No artists found');
        }

        addSectionHeader(rightContainer, `Top rekomendacje w gatunku - ${seedGenres[0]}`);
        
        const combinedSection = document.createElement('div');
        combinedSection.className = 'combined-recommendations space-y-4';
        rightContainer.appendChild(combinedSection);

        const artistPromises = data.topartists.artist.map(artist => 
            fetchLastfmData('artist.getTopTracks', {
                artist: artist.name,
                limit: 1
            })
            .then(trackData => {
                if (trackData.toptracks && trackData.toptracks.track && trackData.toptracks.track.length > 0) {
                    const track = trackData.toptracks.track[0];
                    return {
                        artistName: artist.name,
                        trackName: track.name,
                        url: track.url
                    };
                }
                return null;
            })
            .catch(error => {
                console.error(`Error fetching tracks for ${artist.name}:`, error);
                return null;
            })
        );

        Promise.all(artistPromises)
            .then(results => {
                const validResults = results.filter(result => result !== null);

                if (validResults.length === 0) {
                    combinedSection.innerHTML = '<p class="text-gray-400 text-center mt-4">Brak wyników dla tego gatunku</p>';
                    return;
                }

                validResults.forEach(result => {
                    const card = createCard(
                        null,
                        result.trackName,
                        result.artistName,
                        'track'
                    );
                    
                    card.style.cursor = 'pointer';
                    card.addEventListener('click', () => {
                        window.open(result.url, '_blank');
                    });
                    
                    combinedSection.appendChild(card);
                });
            });
    })
    .catch(error => {
        console.error('Error fetching genre recommendations:', error);
        rightContainer.innerHTML = '<p class="text-red-500 text-center mt-4">Błąd podczas ładowania rekomendacji.</p>';
    });
}


function handleUnauthorized() {
    console.error("Unauthorized access. Token might be expired or invalid.");
    localStorage.removeItem('access_token');
    alert("Sesja wygasła lub wystąpił problem z autoryzacją. Proszę zalogować się ponownie.");
    showLogin();
}


getAccessTokenFromUrl();