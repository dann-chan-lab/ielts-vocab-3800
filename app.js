// Application Mode ('flashcard' | 'typing')
let currentAppMode = 'flashcard';

// Application State
let allWords = [];
let filteredWords = [];
let currentIndex = 0;
let isFlipped = false;
let isShuffle = false;
let shuffleOrder = [];
let weakWords = new Set();
let currentAudio = null;

// Auto Listen State
let isAutoListening = false;
let autoListenRate = localStorage.getItem('ielts_auto_listen_rate') !== null ? parseFloat(localStorage.getItem('ielts_auto_listen_rate')) : 1.0;
let autoListenDelay = localStorage.getItem('ielts_auto_listen_delay') !== null ? parseInt(localStorage.getItem('ielts_auto_listen_delay')) : 3;
let autoListenFlipDelay = localStorage.getItem('ielts_auto_listen_flip_delay') !== null ? parseFloat(localStorage.getItem('ielts_auto_listen_flip_delay')) : 0.0;
let autoListenTimer = null;

// Typing Mode State
let typingMode = 'en-to-en'; // 'en-to-en' | 'ja-to-en'
let typingFilteredWords = [];
let typingIndex = 0;
let targetWordText = '';
let targetChars = [];
let typedCharIndex = 0;
let currentWordMistyped = false;
let typingIsShuffle = false;
let typingIsWeakOnly = false;
let typingIsMistakeOnly = false;
let typingSoundEnabled = true;
let typingTtsEnabled = true;
let sessionMistypes = new Set(); // Word numbers mistyped in this session
let typingMistakesMap = new Map(); // All-time mistake DB: wordNo -> { wordNo, word, count, lastAt }
let sessionTotalKeys = 0;
let sessionMistakeKeys = 0;
let isTransitioningWord = false;
let isShowingHint = false;
let audioCtx = null;

// Settings & Synchronization State
let gasUrl = localStorage.getItem('ielts_gas_url') || 'https://script.google.com/macros/s/AKfycbxmXXm4p7Gb-xRo3YxctB5CENye-8PyK8WX9NBxqwhV0OaW96DTwkQYRKzwq7eJs2kN/exec';
let localWeakWordsKey = 'ielts_weak_words';
let localTypingMistakesKey = 'ielts_typing_mistakes';
let selectedVoiceName = localStorage.getItem('ielts_selected_voice') || 'default';
let phoneticsCache = JSON.parse(localStorage.getItem('ielts_phonetics_cache') || '{}');

// Swipe/Touch gesture detection
let touchStartX = 0;
let touchEndX = 0;

// Main Navigation Elements
const mainAppContainer = document.getElementById('main-app-container');
const navTabFlashcard = document.getElementById('nav-tab-flashcard');
const navTabTyping = document.getElementById('nav-tab-typing');
const flashcardHeader = document.getElementById('flashcard-header');
const flashcardView = document.getElementById('flashcard-view');
const typingView = document.getElementById('typing-view');

// Flashcard DOM Elements
const flashcard = document.getElementById('flashcard');
const searchInput = document.getElementById('search-input');
const searchSuggestions = document.getElementById('search-suggestions');
const levelFilter = document.getElementById('level-filter');
const wordSelect = document.getElementById('word-select');
const weakFilterBtn = document.getElementById('weak-filter-btn');
const progressIndex = document.getElementById('current-index');
const progressTotal = document.getElementById('total-count');
const progressBar = document.getElementById('progress-bar');
const autoListenBtn = document.getElementById('auto-listen-btn');

const cardWord = document.getElementById('card-word');
const cardPhonetic = document.getElementById('card-phonetic');
const cardPos = document.getElementById('card-pos');
const cardExampleEn = document.getElementById('card-example-en');
const cardMeaning = document.getElementById('card-meaning');
const cardSynonymContainer = document.getElementById('card-synonym-container');
const cardSynonym = document.getElementById('card-synonym');
const cardExampleJa = document.getElementById('card-example-ja');

const cardNoFront = document.getElementById('card-no-front');
const cardNoBack = document.getElementById('card-no-back');
const cardLevelFront = document.getElementById('card-level-front');
const cardLevelBack = document.getElementById('card-level-back');

const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const ttsBtn = document.getElementById('tts-btn');
const ttsWave = document.getElementById('tts-wave');
const weakToggleBtn = document.getElementById('weak-toggle-btn');
const shuffleBtn = document.getElementById('shuffle-btn');

// Typing Mode DOM Elements
const typingModeEnBtn = document.getElementById('typing-mode-en-btn');
const typingModeJaBtn = document.getElementById('typing-mode-ja-btn');
const typingLevelFilter = document.getElementById('typing-level-filter');
const typingWordSelect = document.getElementById('typing-word-select');
const typingWeakFilterBtn = document.getElementById('typing-weak-filter-btn');
const typingMistakeFilterBtn = document.getElementById('typing-mistake-filter-btn');
const typingMistakeBadgeCount = document.getElementById('typing-mistake-badge-count');
const typingShuffleBtn = document.getElementById('typing-shuffle-btn');
const typingTtsToggleBtn = document.getElementById('typing-tts-toggle-btn');
const typingSoundToggleBtn = document.getElementById('typing-sound-toggle-btn');

const typingCurrentIdx = document.getElementById('typing-current-idx');
const typingTotalCnt = document.getElementById('typing-total-cnt');
const typingAccuracyVal = document.getElementById('typing-accuracy-val');
const typingCurrentMistakes = document.getElementById('typing-current-mistakes');
const typingProgressBar = document.getElementById('typing-progress-bar');

const typingBoard = document.getElementById('typing-board');
const typingHiddenInput = document.getElementById('typing-hidden-input');
const typingInputField = document.getElementById('typing-input-field');
const typingClearInputBtn = document.getElementById('typing-clear-input-btn');
const typingCardNo = document.getElementById('typing-card-no');
const typingCardLevel = document.getElementById('typing-card-level');
const typingCardPos = document.getElementById('typing-card-pos');
const typingCardWeakBtn = document.getElementById('typing-card-weak-btn');
const typingCardMeaning = document.getElementById('typing-card-meaning');
const typingCardPhonetic = document.getElementById('typing-card-phonetic');
const typingDisplay = document.getElementById('typing-display');
const typingHintPeek = document.getElementById('typing-hint-peek');
const typingHintWord = document.getElementById('typing-hint-word');
const typingExampleBox = document.getElementById('typing-example-box');
const typingExampleEn = document.getElementById('typing-example-en');
const typingExampleJa = document.getElementById('typing-example-ja');

const typingPrevWordBtn = document.getElementById('typing-prev-word-btn');
const typingSpeakBtn = document.getElementById('typing-speak-btn');
const typingSkipWordBtn = document.getElementById('typing-skip-word-btn');

// Typing Result Modal Elements
const typingResultModal = document.getElementById('typing-result-modal');
const typingResultCloseBtn = document.getElementById('typing-result-close-btn');
const resultAccuracy = document.getElementById('result-accuracy');
const resultMistakes = document.getElementById('result-mistakes');
const resultWordCount = document.getElementById('result-word-count');
const resultMistakeCountBadge = document.getElementById('result-mistake-count-badge');
const resultMistakesList = document.getElementById('result-mistakes-list');
const typingRetryMistakesBtn = document.getElementById('typing-retry-mistakes-btn');
const resultRetryCount = document.getElementById('result-retry-count');
const typingRestartSessionBtn = document.getElementById('typing-restart-session-btn');
const typingBackToCardsBtn = document.getElementById('typing-back-to-cards-btn');

// Settings Elements
const settingsToggleBtn = document.getElementById('settings-toggle-btn');
const settingsModal = document.getElementById('settings-modal');
const settingsCloseBtn = document.getElementById('settings-close-btn');
const gasUrlInput = document.getElementById('gas-url-input');
const syncStatusDot = document.getElementById('sync-status-dot');
const syncStatusText = document.getElementById('sync-status-text');
const ttsVoiceSelect = document.getElementById('tts-voice-select');
const autoListenRateSelect = document.getElementById('auto-listen-rate-select');
const autoListenFlipDelaySelect = document.getElementById('auto-listen-flip-delay-select');
const autoListenDelaySelect = document.getElementById('auto-listen-delay-select');
const saveSettingsBtn = document.getElementById('save-settings-btn');
const forceUpdateBtn = document.getElementById('force-update-btn');
const updateBtnText = document.getElementById('update-btn-text');
const clearMistakesBtn = document.getElementById('clear-mistakes-btn');

// Release Notes Elements
const releaseNotesToggleBtn = document.getElementById('release-notes-toggle-btn');
const releaseNotesModal = document.getElementById('release-notes-modal');
const releaseNotesCloseBtn = document.getElementById('release-notes-close-btn');

// Lock Screen Elements
const lockScreen = document.getElementById('lock-screen');
const lockInput = document.getElementById('lock-input');
const lockSubmitBtn = document.getElementById('lock-submit-btn');
const lockErrorMsg = document.getElementById('lock-error-msg');



// Load words master data from Google Sheet, LocalStorage Cache, or local JSON file
async function loadWordsFromSources() {
  let wordsLoaded = false;
  
  if (gasUrl) {
    try {
      console.log('Fetching vocabulary list from Google Sheet...');
      updateSyncStatus('syncing', '単語データを読み込み中...');
      
      const response = await fetch(`${gasUrl}?action=get_words&t=${Date.now()}`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          allWords = data;
          localStorage.setItem('ielts_cached_words', JSON.stringify(allWords));
          console.log(`Loaded ${allWords.length} words from Google Sheet.`);
          wordsLoaded = true;
          updateSyncStatus('online', 'スプレッドシートと同期完了');
        }
      }
    } catch (e) {
      console.warn('Failed to load words from Google Sheet, falling back to local cache/file.', e);
    }
  }

  if (!wordsLoaded) {
    // Try local storage cache
    const cachedWords = localStorage.getItem('ielts_cached_words');
    if (cachedWords) {
      try {
        allWords = JSON.parse(cachedWords);
        console.log(`Loaded ${allWords.length} words from Local Cache.`);
        wordsLoaded = true;
      } catch (e) {
        console.error('Failed to parse cached words', e);
      }
    }
  }

  if (!wordsLoaded) {
    try {
      const response = await fetch('./words.json?t=' + Date.now());
      allWords = await response.json();
      console.log(`Loaded ${allWords.length} words from local words.json.`);
      wordsLoaded = true;
    } catch (error) {
      console.error('Failed to load words.json', error);
      cardWord.textContent = "Error loading words";
    }
  }
  populateWordSelect();
}

// Initialization
window.addEventListener('DOMContentLoaded', () => {
  // Bind Nav Tabs immediately (so they work regardless of async init timing)
  if (navTabFlashcard) {
    navTabFlashcard.addEventListener('click', () => switchAppMode('flashcard'));
  }
  if (navTabTyping) {
    navTabTyping.addEventListener('click', () => switchAppMode('typing'));
  }

  // Load local weak words cache first
  loadLocalWeakWords();
  loadLocalTypingMistakes();
  
  // Register Service Worker for offline use
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then((registration) => {
        console.log('Service Worker Registered');
        // Force check for updated service worker immediately
        registration.update();
        
        // Listen for updates and automatically reload the page to apply the new assets
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (!refreshing) {
            refreshing = true;
            window.location.reload();
          }
        });
      })
      .catch((err) => console.log('Service Worker failed to register', err));
  }

  checkLockState();
});

// Lock Screen Handling
function checkLockState() {
  const isUnlocked = localStorage.getItem('ielts_unlocked') === 'true';
  if (isUnlocked) {
    lockScreen.classList.add('hidden');
    initApp();
  } else {
    lockScreen.classList.remove('hidden');
    
    // Set up lock screen event listeners
    lockSubmitBtn.addEventListener('click', handleUnlock);
    lockInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleUnlock();
    });
    
    // Focus input
    setTimeout(() => lockInput.focus(), 100);
  }
}

async function handleUnlock() {
  const password = lockInput.value;
  if (!password) return;

  const hash = await sha256(password);
  // Hash of 'ielts3800'
  const correctHash = '7717681831e758766b69bf3f496420546062bcca113e729b880b3a85a358aa6c';

  if (hash === correctHash) {
    localStorage.setItem('ielts_unlocked', 'true');
    lockScreen.classList.add('hidden');
    initApp();
  } else {
    // Show error with shake animation
    lockErrorMsg.classList.remove('hidden');
    const card = document.querySelector('.lock-card');
    card.classList.remove('shake');
    void card.offsetWidth; // Trigger reflow to restart animation
    card.classList.add('shake');
    lockInput.value = '';
    lockInput.focus();
  }
}

async function initApp() {
  // Load words master data from best source
  await loadWordsFromSources();

  // Init Settings inputs
  gasUrlInput.value = gasUrl;
  
  // Initialize voices list
  populateVoicesList();
  if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = populateVoicesList;
  }

  // Sync weak words & mistake words with Google Sheet if URL exists
  if (gasUrl) {
    syncWithSpreadsheet();
    syncMistakesWithSpreadsheet();
  }

  // Restore last studied word position (retrieve before applyFilters overwrites it)
  const lastWordNo = localStorage.getItem('ielts_last_word_no');

  // Initial Filter & Render for flashcard
  applyFilters();
  
  // Initialize typing word select list
  populateTypingWordSelect();
  updateMistakeBadgeUI();
  
  if (lastWordNo) {
    const lastIdx = filteredWords.findIndex(w => w.No.toString() === lastWordNo.toString());
    if (lastIdx !== -1) {
      currentIndex = lastIdx;
      displayCurrentWord();
    }
  }
  
  setupEventListeners();
}

// SHA-256 Hashing helper
async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// Event Listeners Configuration
function setupEventListeners() {
  // Card Flip on Click
  flashcard.addEventListener('click', () => toggleCardFlip(false));
  
  // Navigation
  prevBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    navigate(-1);
  });
  nextBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    navigate(1);
  });
  
  // TTS & Play
  ttsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    speakWord(false);
  });
  
  // Auto Listen Toggle
  if (autoListenBtn) {
    autoListenBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleAutoListening();
    });
  }
  
  // Weak Word toggle
  weakToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    stopAutoListening();
    toggleWeakWord();
  });
  
  // Shuffle
  shuffleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    stopAutoListening();
    toggleShuffle();
  });

  // Filters inputs
  searchInput.addEventListener('input', () => {
    stopAutoListening();
    applyFilters();
    updateSuggestions();
  });
  searchInput.addEventListener('focus', () => {
    stopAutoListening();
    updateSuggestions();
  });
  levelFilter.addEventListener('change', () => {
    stopAutoListening();
    applyFilters();
  });
  wordSelect.addEventListener('change', () => {
    stopAutoListening();
    const val = wordSelect.value;
    if (val) {
      const targetWord = allWords.find(w => w.No.toString() === val.toString());
      if (targetWord) {
        jumpToWord(targetWord);
      }
    }
  });
  weakFilterBtn.addEventListener('click', () => {
    stopAutoListening();
    const isPressed = weakFilterBtn.getAttribute('aria-pressed') === 'true';
    weakFilterBtn.setAttribute('aria-pressed', !isPressed ? 'true' : 'false');
    applyFilters();
  });

  // Close suggestions when clicking outside
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !searchSuggestions.contains(e.target)) {
      searchSuggestions.classList.add('hidden');
    }
  });

  // Settings Panel Actions
  settingsToggleBtn.addEventListener('click', openSettings);
  settingsCloseBtn.addEventListener('click', closeSettings);
  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) closeSettings();
  });
  saveSettingsBtn.addEventListener('click', saveSettings);
  if (forceUpdateBtn) {
    forceUpdateBtn.addEventListener('click', () => {
      stopAutoListening();
      forceUpdateApp();
    });
  }

  // Release Notes Actions
  if (releaseNotesToggleBtn) {
    releaseNotesToggleBtn.addEventListener('click', () => {
      releaseNotesModal.classList.remove('hidden');
    });
  }
  if (releaseNotesCloseBtn) {
    releaseNotesCloseBtn.addEventListener('click', () => {
      releaseNotesModal.classList.add('hidden');
    });
  }
  if (releaseNotesModal) {
    releaseNotesModal.addEventListener('click', (e) => {
      if (e.target === releaseNotesModal) {
        releaseNotesModal.classList.add('hidden');
      }
    });
  }

  // Navigation Tabs Switching
  if (navTabFlashcard) {
    navTabFlashcard.addEventListener('click', () => switchAppMode('flashcard'));
  }
  if (navTabTyping) {
    navTabTyping.addEventListener('click', () => switchAppMode('typing'));
  }

  // Typing Mode Event Listeners
  if (typingModeEnBtn) {
    typingModeEnBtn.addEventListener('click', () => setTypingMode('en-to-en'));
  }
  if (typingModeJaBtn) {
    typingModeJaBtn.addEventListener('click', () => setTypingMode('ja-to-en'));
  }
  if (typingLevelFilter) {
    typingLevelFilter.addEventListener('change', () => applyTypingFilters());
  }
  if (typingWordSelect) {
    typingWordSelect.addEventListener('change', (e) => jumpToTypingWord(e.target.value));
  }
  if (typingWeakFilterBtn) {
    typingWeakFilterBtn.addEventListener('click', toggleTypingWeakFilter);
  }
  if (typingMistakeFilterBtn) {
    typingMistakeFilterBtn.addEventListener('click', toggleTypingMistakeFilter);
  }
  if (typingShuffleBtn) {
    typingShuffleBtn.addEventListener('click', toggleTypingShuffle);
  }
  if (typingTtsToggleBtn) {
    typingTtsToggleBtn.addEventListener('click', toggleTypingTts);
  }
  if (typingSoundToggleBtn) {
    typingSoundToggleBtn.addEventListener('click', toggleTypingSound);
  }
  if (typingCardWeakBtn) {
    typingCardWeakBtn.addEventListener('click', toggleWeakWordInTyping);
  }
  if (typingPrevWordBtn) {
    typingPrevWordBtn.addEventListener('click', () => navigateTyping(-1));
  }
  if (typingSkipWordBtn) {
    typingSkipWordBtn.addEventListener('click', skipTypingWord);
  }
  if (typingSpeakBtn) {
    typingSpeakBtn.addEventListener('click', () => speakWordText(targetWordText));
  }
  if (typingInputField) {
    typingInputField.addEventListener('input', handleTypingInput);
    typingInputField.addEventListener('keydown', handleTypingInputKeyDown);
  }
  if (typingClearInputBtn) {
    typingClearInputBtn.addEventListener('click', clearTypingInput);
  }
  if (typingBoard) {
    typingBoard.addEventListener('click', (e) => {
      // Keep input focused when clicking on typing card
      if (typingInputField && e.target !== typingInputField) {
        typingInputField.focus();
      }
    });
  }

  // Typing Result Modal Actions
  if (typingResultCloseBtn) {
    typingResultCloseBtn.addEventListener('click', hideTypingResultModal);
  }
  if (typingResultModal) {
    typingResultModal.addEventListener('click', (e) => {
      if (e.target === typingResultModal) hideTypingResultModal();
    });
  }
  if (typingRetryMistakesBtn) {
    typingRetryMistakesBtn.addEventListener('click', retryMistypedWords);
  }
  if (typingRestartSessionBtn) {
    typingRestartSessionBtn.addEventListener('click', restartTypingSession);
  }
  if (typingBackToCardsBtn) {
    typingBackToCardsBtn.addEventListener('click', () => {
      hideTypingResultModal();
      switchAppMode('flashcard');
    });
  }
  if (clearMistakesBtn) {
    clearMistakesBtn.addEventListener('click', clearAllMistakes);
  }

  // Keyboard navigation support
  document.addEventListener('keydown', (e) => {
    // If in typing practice mode, delegate to typing handler
    if (currentAppMode === 'typing') {
      handleTypingKeyDown(e);
      return;
    }

    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'SELECT' || document.activeElement.tagName === 'TEXTAREA') {
      return; // Skip when typing in search, input, or textarea fields
    }
    
    if (e.code === 'ArrowRight' || e.code === 'KeyD') {
      navigate(1);
    } else if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
      navigate(-1);
    } else if (e.code === 'Space') {
      e.preventDefault();
      toggleCardFlip(false);
    } else if (e.code === 'ArrowUp' || e.code === 'KeyW') {
      e.preventDefault();
      speakWord(false);
    } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
      e.preventDefault();
      stopAutoListening();
      toggleWeakWord();
    }
  });



  // Mobile Swipe gestures
  flashcard.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  flashcard.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipeGesture();
  }, { passive: true });
}

// Swipe handling
function handleSwipeGesture() {
  const swipeThreshold = 50;
  if (touchEndX < touchStartX - swipeThreshold) {
    // Swiped left -> Next word
    navigate(1);
  } else if (touchEndX > touchStartX + swipeThreshold) {
    // Swiped right -> Previous word
    navigate(-1);
  }
}

// Local caching of Weak Words
function loadLocalWeakWords() {
  const localData = localStorage.getItem(localWeakWordsKey);
  if (localData) {
    try {
      const parsed = JSON.parse(localData);
      weakWords = new Set(parsed);
    } catch (e) {
      console.error('Error parsing cached weak words', e);
      weakWords = new Set();
    }
  }
}

function saveLocalWeakWords() {
  localStorage.setItem(localWeakWordsKey, JSON.stringify(Array.from(weakWords)));
}

// Apps Script Integration: Fetch & Synchronize
async function syncWithSpreadsheet() {
  if (!gasUrl) return;
  
  updateSyncStatus('syncing', '同期中...');
  
  try {
    // Add time parameter to bypass browser caching
    const url = `${gasUrl}?action=get&t=${Date.now()}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Network error');
    
    const result = await response.json();
    if (result.success && Array.isArray(result.weakWords)) {
      // Merge remote into local set
      result.weakWords.forEach(no => weakWords.add(no));
      saveLocalWeakWords();
      
      updateSyncStatus('online', 'スプレッドシートと同期完了');
      // If currently showing weak words filter, update list
      if (weakFilterBtn.getAttribute('aria-pressed') === 'true') {
        applyFilters();
      } else {
        updateActiveStates();
      }
    } else {
      throw new Error(result.error || 'Unknown error');
    }
  } catch (err) {
    console.warn('Sync failed, running in local-only mode:', err);
    updateSyncStatus('offline', 'オフライン（ローカル保存中）');
  }
}

async function sendWeakWordUpdateToGas(action, wordNo) {
  if (!gasUrl) return;
  
  updateSyncStatus('syncing', '更新を送信中...');
  
  try {
    const url = `${gasUrl}?action=${action}&wordNo=${wordNo}&t=${Date.now()}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Network response not ok');
    
    const result = await response.json();
    if (result.success) {
      updateSyncStatus('online', '同期完了');
    } else {
      throw new Error(result.error);
    }
  } catch (err) {
    console.error('Sync update failed', err);
    updateSyncStatus('offline', '未同期の変更があります');
  }
}

function updateSyncStatus(status, text) {
  syncStatusDot.className = `status-dot ${status}`;
  syncStatusText.textContent = text;
}

// Navigation & Presentation
function toggleCardFlip(isAuto = false) {
  if (!isAuto) {
    stopAutoListening();
  }
  isFlipped = !isFlipped;
  if (isFlipped) {
    flashcard.classList.add('flipped');
  } else {
    flashcard.classList.remove('flipped');
  }
}

function navigate(direction, isAuto = false) {
  if (filteredWords.length === 0) return;
  
  if (!isAuto) {
    stopAutoListening();
  }
  
  // Make sure we unflip the card first
  if (isFlipped) {
    toggleCardFlip(isAuto);
    // Wait for unflip transition to complete before updating content
    setTimeout(() => {
      changeIndex(direction);
    }, 200);
  } else {
    changeIndex(direction);
  }
}

function changeIndex(direction) {
  currentIndex += direction;
  
  // Infinite wrap-around
  if (currentIndex >= filteredWords.length) {
    currentIndex = 0;
  } else if (currentIndex < 0) {
    currentIndex = filteredWords.length - 1;
  }
  
  displayCurrentWord();
}

async function updatePhonetic(word, localPhonetic) {
  if (localPhonetic) {
    cardPhonetic.textContent = localPhonetic;
    cardPhonetic.style.display = 'block';
    return;
  }

  if (phoneticsCache[word] !== undefined) {
    cardPhonetic.textContent = phoneticsCache[word];
    cardPhonetic.style.display = phoneticsCache[word] ? 'block' : 'none';
    return;
  }
  
  cardPhonetic.textContent = '';
  cardPhonetic.style.display = 'none';
  
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    if (res.ok) {
      const data = await res.json();
      const phoneticText = data[0]?.phonetic || data[0]?.phonetics?.find(p => p.text)?.text || '';
      phoneticsCache[word] = phoneticText;
      localStorage.setItem('ielts_phonetics_cache', JSON.stringify(phoneticsCache));
      
      // Only update if the user hasn't navigate away from the word
      if (filteredWords[currentIndex] && filteredWords[currentIndex].Word === word) {
        cardPhonetic.textContent = phoneticText;
        cardPhonetic.style.display = phoneticText ? 'block' : 'none';
      }
    } else {
      phoneticsCache[word] = '';
      localStorage.setItem('ielts_phonetics_cache', JSON.stringify(phoneticsCache));
    }
  } catch (e) {
    console.error('Failed to fetch phonetic', e);
  }
}
function parseSynonyms(synonymStr) {
  if (!synonymStr) return [];
  // Strip "類:" or "類：" or "類: " prefix if it exists
  let cleanStr = synonymStr.replace(/^(類[:：]|類)\s*/, '');
  // Split by comma (handles half-width and full-width commas)
  return cleanStr.split(/[,，]\s*/).map(s => s.trim()).filter(Boolean);
}

function displayCurrentWord() {
  if (filteredWords.length === 0) {
    renderEmptyState();
    return;
  }

  const wordData = filteredWords[currentIndex];
  
  // Load Card text
  cardWord.textContent = wordData.Word;
  updatePhonetic(wordData.Word, wordData.Phonetic);
  cardPos.textContent = wordData.POS;
  cardMeaning.textContent = wordData.Meaning;
  
  // Synonym mapping
  if (wordData.Synonym) {
    const parsedSyns = parseSynonyms(wordData.Synonym);
    if (parsedSyns.length > 0) {
      cardSynonym.innerHTML = '';
      parsedSyns.forEach(syn => {
        const badge = document.createElement('span');
        badge.className = 'synonym-badge';
        badge.textContent = syn;
        
        // Find if this synonym exists in allWords
        const matchingWord = allWords.find(w => w.Word.toLowerCase() === syn.toLowerCase());
        if (matchingWord) {
          badge.classList.add('has-match');
          badge.title = `No.${matchingWord.No} - ${matchingWord.Word} へジャンプ`;
          badge.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent card flip
            jumpToWord(matchingWord);
          });
        } else {
          // If not in the database, click it to search
          badge.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent card flip
            searchInput.value = syn;
            applyFilters();
          });
        }
        cardSynonym.appendChild(badge);
      });
      cardSynonymContainer.style.display = 'flex';
    } else {
      cardSynonymContainer.style.display = 'none';
    }
  } else {
    cardSynonymContainer.style.display = 'none';
  }
  
  cardExampleEn.textContent = wordData.Example_EN || 'No English example sentence available.';
  cardExampleJa.textContent = wordData.Example_JA || '日本語訳はありません。';
  
  // Word Info & Badge
  const noStr = wordData.No;
  cardNoFront.textContent = noStr;
  cardNoBack.textContent = noStr;
  
  cardLevelFront.textContent = wordData.Level;
  cardLevelBack.textContent = wordData.Level;
  
  // Update Indicators & buttons
  progressIndex.textContent = currentIndex + 1;
  progressTotal.textContent = filteredWords.length;
  
  const percentage = ((currentIndex + 1) / filteredWords.length) * 100;
  progressBar.style.width = `${percentage}%`;
  
  // Update word select dropdown to match current word
  wordSelect.value = wordData.No;

  // Save current word No to localStorage for resuming later
  localStorage.setItem('ielts_last_word_no', wordData.No);

  updateActiveStates();
}

function renderEmptyState() {
  cardWord.textContent = "該当なし";
  cardPhonetic.textContent = "";
  cardPhonetic.style.display = "none";
  cardPos.textContent = "";
  cardMeaning.textContent = "フィルターに該当する単語がありません。";
  cardSynonymContainer.style.display = 'none';
  cardExampleEn.textContent = "";
  cardExampleJa.textContent = "";
  cardNoFront.textContent = "0000";
  cardNoBack.textContent = "0000";
  cardLevelFront.textContent = "NONE";
  cardLevelBack.textContent = "NONE";
  
  progressIndex.textContent = "0";
  progressTotal.textContent = "0";
  progressBar.style.width = "0%";
  
  weakToggleBtn.classList.remove('active');
}

function updateActiveStates() {
  if (filteredWords.length === 0) return;
  
  const currentWord = filteredWords[currentIndex];
  const isWeak = weakWords.has(currentWord.No);
  
  if (isWeak) {
    weakToggleBtn.classList.add('active');
    weakToggleBtn.setAttribute('aria-label', '苦手登録を解除');
  } else {
    weakToggleBtn.classList.remove('active');
    weakToggleBtn.setAttribute('aria-label', '苦手登録をする');
  }
}

// Toggle functions
function toggleWeakWord() {
  if (filteredWords.length === 0) return;
  const currentWord = filteredWords[currentIndex];
  const wordNo = currentWord.No;
  
  if (weakWords.has(wordNo)) {
    weakWords.delete(wordNo);
    sendWeakWordUpdateToGas('remove', wordNo);
  } else {
    weakWords.add(wordNo);
    sendWeakWordUpdateToGas('add', wordNo);
  }
  
  saveLocalWeakWords();
  updateActiveStates();
  
  // If we are filtering by weak words and just removed a star, we should refresh the lists
  if (weakFilterBtn.getAttribute('aria-pressed') === 'true' && !weakWords.has(wordNo)) {
    // If it's the last word in the filtered list, we need to adapt the index
    setTimeout(() => {
      applyFilters();
    }, 300);
  }
}

// Filters logic
function applyFilters() {
  const searchTerm = searchInput.value.toLowerCase().trim();
  const selectedLevel = levelFilter.value;
  const isWeakOnly = weakFilterBtn.getAttribute('aria-pressed') === 'true';
  
  // Keep track of current word before filter to restore position if possible
  const previousWordNo = filteredWords[currentIndex] ? filteredWords[currentIndex].No : null;
  
  filteredWords = allWords.filter(word => {
    // Level match
    if (selectedLevel !== 'all' && word.Level !== selectedLevel) return false;
    
    // Weak words match
    if (isWeakOnly && !weakWords.has(word.No)) return false;
    
    // Search match
    if (searchTerm) {
      const matchWord = word.Word.toLowerCase().includes(searchTerm);
      const matchMeaning = word.Meaning.toLowerCase().includes(searchTerm);
      const matchSynonym = word.Synonym && word.Synonym.toLowerCase().includes(searchTerm);
      if (!matchWord && !matchMeaning && !matchSynonym) return false;
    }
    
    return true;
  });
  
  if (isShuffle) {
    // Apply shuffle layout mapping
    shuffleArray(filteredWords);
  }
  
  // Try to find previous word's new index to preserve navigation state
  if (previousWordNo && filteredWords.length > 0) {
    const newIdx = filteredWords.findIndex(w => w.No === previousWordNo);
    currentIndex = newIdx !== -1 ? newIdx : 0;
  } else {
    currentIndex = 0;
  }
  
  displayCurrentWord();
  populateWordSelect(filteredWords);
}

function toggleShuffle() {
  isShuffle = !isShuffle;
  if (isShuffle) {
    shuffleBtn.classList.add('active');
  } else {
    shuffleBtn.classList.remove('active');
  }
  applyFilters();
}

// Helper to randomise arrays
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Web Speech Synthesis (TTS Audio)
function speakWord(isAutoMode = false) {
  if (filteredWords.length === 0) return;
  
  if (!isAutoMode) {
    stopAutoListening();
  }

  const wordData = filteredWords[currentIndex];
  const word = wordData.Word;
  const example = wordData.Example_EN;
  
  if (!window.speechSynthesis) {
    if (!isAutoMode) {
      alert("Speech Synthesis is not supported in this browser.");
    }
    return;
  }

  // Cancel current speaking
  window.speechSynthesis.cancel();
  
  const wordUtterance = new SpeechSynthesisUtterance(word);
  wordUtterance.lang = 'en-US';
  
  // Apply auto listen rate if auto mode
  const currentRate = isAutoMode ? autoListenRate : 1.0;
  wordUtterance.rate = currentRate;
  
  // Load selected custom voice if configured
  let selectedVoice = null;
  if (selectedVoiceName !== 'default') {
    const voices = window.speechSynthesis.getVoices();
    selectedVoice = voices.find(v => v.name === selectedVoiceName);
    if (selectedVoice) wordUtterance.voice = selectedVoice;
  }

  // Visual wave animation toggle
  wordUtterance.onstart = () => {
    ttsWave.classList.add('active');
    ttsBtn.classList.add('speaking');
  };

  const handleTTSFinished = () => {
    ttsWave.classList.remove('active');
    ttsBtn.classList.remove('speaking');
    
    if (isAutoMode && isAutoListening) {
      const flipDelay = isNaN(autoListenFlipDelay) ? 0 : autoListenFlipDelay;
      const nextDelay = isNaN(autoListenDelay) ? 3 : autoListenDelay;

      // 1. Wait specified delay before flipping the card to show back face (Japanese)
      autoListenTimer = setTimeout(() => {
        if (!isAutoListening) return;
        
        if (!isFlipped) {
          toggleCardFlip(true);
        }
        
        // 2. Wait specified delay and go to next word
        autoListenTimer = setTimeout(() => {
          if (isAutoListening) {
            navigate(1, true);
            
            // Small pause after navigation before speaking again
            autoListenTimer = setTimeout(() => {
              if (isAutoListening) {
                speakWord(true);
              }
            }, 800);
          }
        }, nextDelay * 1000);
        
      }, flipDelay * 1000);
    }
  };
  
  if (example && example !== 'No English example sentence available.' && example !== 'Please wait while the vocabulary loads.') {
    wordUtterance.onend = () => {
      // Small pause before speaking the example
      const pauseDuration = 700 / currentRate;
      autoListenTimer = setTimeout(() => {
        if (isAutoMode && !isAutoListening) return;
        
        const exampleUtterance = new SpeechSynthesisUtterance(example);
        exampleUtterance.lang = 'en-US';
        exampleUtterance.rate = currentRate;
        if (selectedVoice) exampleUtterance.voice = selectedVoice;
        
        exampleUtterance.onend = () => {
          handleTTSFinished();
        };
        
        exampleUtterance.onerror = () => {
          handleTTSFinished();
        };
        
        window.speechSynthesis.speak(exampleUtterance);
      }, pauseDuration);
    };
  } else {
    wordUtterance.onend = () => {
      handleTTSFinished();
    };
  }

  wordUtterance.onerror = () => {
    handleTTSFinished();
  };

  window.speechSynthesis.speak(wordUtterance);
}

// Auto Listening Functions
function toggleAutoListening() {
  isAutoListening = !isAutoListening;
  if (isAutoListening) {
    autoListenBtn.classList.add('active');
    autoListenBtn.setAttribute('aria-label', '自動リスニングを停止');
    
    if (isFlipped) {
      toggleCardFlip(true);
      setTimeout(() => {
        speakWord(true);
      }, 300);
    } else {
      speakWord(true);
    }
  } else {
    stopAutoListening();
  }
}

function stopAutoListening() {
  if (!isAutoListening) return;
  isAutoListening = false;
  autoListenBtn.classList.remove('active');
  autoListenBtn.setAttribute('aria-label', '自動リスニングを開始');
  clearTimeout(autoListenTimer);
  window.speechSynthesis.cancel();
  
  ttsWave.classList.remove('active');
  ttsBtn.classList.remove('speaking');
}

// Audio Voices Loading
function populateVoicesList() {
  if (!window.speechSynthesis) return;
  
  const voices = window.speechSynthesis.getVoices();
  // Filter for English voices only for clarity
  const englishVoices = voices.filter(v => v.lang.startsWith('en-'));
  
  // Clear other than default option
  ttsVoiceSelect.innerHTML = '<option value="default">ブラウザ標準音声</option>';
  
  englishVoices.forEach(voice => {
    const option = document.createElement('option');
    option.value = voice.name;
    option.textContent = `${voice.name} (${voice.lang})`;
    if (voice.name === selectedVoiceName) {
      option.selected = true;
    }
    ttsVoiceSelect.appendChild(option);
  });
}

// Settings Modal Controls
function openSettings() {
  stopAutoListening();
  gasUrlInput.value = gasUrl;
  
  const rateSelect = document.getElementById('auto-listen-rate-select');
  const flipDelaySelect = document.getElementById('auto-listen-flip-delay-select');
  const delaySelect = document.getElementById('auto-listen-delay-select');

  if (rateSelect) {
    rateSelect.value = autoListenRate.toFixed(1);
  }
  if (flipDelaySelect) {
    flipDelaySelect.value = autoListenFlipDelay;
  }
  if (delaySelect) {
    delaySelect.value = autoListenDelay;
  }

  settingsModal.classList.remove('hidden');
}

function closeSettings() {
  settingsModal.classList.add('hidden');
}

function saveSettings() {
  const newUrl = gasUrlInput.value.trim();
  const selectedVoice = ttsVoiceSelect.value;
  
  const rateSelect = document.getElementById('auto-listen-rate-select');
  const flipDelaySelect = document.getElementById('auto-listen-flip-delay-select');
  const delaySelect = document.getElementById('auto-listen-delay-select');

  // Save Auto Listen preferences
  if (rateSelect) {
    autoListenRate = parseFloat(rateSelect.value);
    localStorage.setItem('ielts_auto_listen_rate', autoListenRate);
  }
  if (flipDelaySelect) {
    autoListenFlipDelay = parseFloat(flipDelaySelect.value);
    localStorage.setItem('ielts_auto_listen_flip_delay', autoListenFlipDelay);
  }
  if (delaySelect) {
    autoListenDelay = parseInt(delaySelect.value);
    localStorage.setItem('ielts_auto_listen_delay', autoListenDelay);
  }

  // Save URL
  if (newUrl !== gasUrl) {
    gasUrl = newUrl;
    localStorage.setItem('ielts_gas_url', gasUrl);
    if (gasUrl) {
      syncWithSpreadsheet();
      syncMistakesWithSpreadsheet();
      loadWordsFromSources().then(() => applyFilters());
    } else {
      updateSyncStatus('offline', '未接続（ローカル動作中）');
      localStorage.removeItem('ielts_cached_words');
      loadWordsFromSources().then(() => applyFilters());
    }
  }
  
  // Save Voice preference
  selectedVoiceName = selectedVoice;
  localStorage.setItem('ielts_selected_voice', selectedVoice);
  
  closeSettings();
}

async function forceUpdateApp() {
  if (!forceUpdateBtn || !updateBtnText) return;
  
  forceUpdateBtn.disabled = true;
  updateBtnText.textContent = 'アップデート中...';
  
  try {
    // 1. Clear LocalStorage caches
    localStorage.removeItem('ielts_cached_words');
    localStorage.removeItem('ielts_phonetics_cache');
    
    // 2. Clear Service Worker Cache Storage
    if ('caches' in window) {
      const cacheKeys = await caches.keys();
      for (const key of cacheKeys) {
        await caches.delete(key);
      }
      console.log('Cache Storage cleared');
    }
    
    // 3. Load fresh words data from network
    await loadWordsFromSources();
    applyFilters();
    
    // 3. Sync weak words if GAS URL exists
    if (gasUrl) {
      await syncWithSpreadsheet();
    }
    
    // 4. Update service worker to check for new assets
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (let registration of registrations) {
        await registration.update();
      }
    }
    
    updateBtnText.textContent = 'アップデート完了！';
    
    setTimeout(() => {
      // Force reload by appending a query parameter to bypass browser index.html cache
      window.location.href = window.location.origin + window.location.pathname + '?t=' + Date.now();
    }, 1200);
    
  } catch (error) {
    console.error('Failed to force update:', error);
    updateBtnText.textContent = 'エラーが発生しました';
    
    setTimeout(() => {
      forceUpdateBtn.disabled = false;
      updateBtnText.textContent = '最新の状態にアップデート';
    }, 3000);
  }
}

// Search Suggestions & Direct Jump logic
function updateSuggestions() {
  const query = searchInput.value.toLowerCase().trim();
  if (!query) {
    searchSuggestions.innerHTML = '';
    searchSuggestions.classList.add('hidden');
    return;
  }

  // Filter suggestions from allWords (so we can find any word regardless of current filter)
  const matches = allWords.filter(word => {
    const matchWord = word.Word.toLowerCase().includes(query);
    const matchMeaning = word.Meaning.toLowerCase().includes(query);
    const matchNo = word.No && word.No.toString().includes(query);
    return matchWord || matchMeaning || matchNo;
  }).slice(0, 15);

  if (matches.length === 0) {
    searchSuggestions.innerHTML = '<div class="search-suggestion-item" style="cursor: default; color: var(--text-muted);">一致する単語がありません</div>';
    searchSuggestions.classList.remove('hidden');
    return;
  }

  searchSuggestions.innerHTML = '';
  matches.forEach(word => {
    const item = document.createElement('div');
    item.className = 'search-suggestion-item';
    
    const wordSpan = document.createElement('span');
    wordSpan.className = 'search-suggestion-word';
    wordSpan.textContent = word.Word;

    const meaningSpan = document.createElement('span');
    meaningSpan.className = 'search-suggestion-meaning';
    meaningSpan.textContent = word.Meaning;

    const noSpan = document.createElement('span');
    noSpan.className = 'search-suggestion-no';
    noSpan.textContent = `No.${word.No}`;

    item.appendChild(wordSpan);
    item.appendChild(meaningSpan);
    item.appendChild(noSpan);

    item.addEventListener('click', (e) => {
      e.stopPropagation();
      jumpToWord(word);
    });

    searchSuggestions.appendChild(item);
  });
  searchSuggestions.classList.remove('hidden');
}

function jumpToWord(word) {
  // Clear search input value
  searchInput.value = '';
  searchSuggestions.classList.add('hidden');
  searchSuggestions.innerHTML = '';

  // Check if this word is in the current filters (e.g. level, weak-only).
  // If not, reset the filters to ensure the word will be visible.
  let selectedLevel = levelFilter.value;
  if (selectedLevel !== 'all' && word.Level !== selectedLevel) {
    levelFilter.value = 'all';
  }

  const isWeakOnly = weakFilterBtn.getAttribute('aria-pressed') === 'true';
  if (isWeakOnly && !weakWords.has(word.No)) {
    weakFilterBtn.setAttribute('aria-pressed', 'false');
  }

  // Re-run applyFilters to rebuild filteredWords (since search input is now empty)
  applyFilters();

  // Find index in the newly filtered list
  const targetIdx = filteredWords.findIndex(w => w.No === word.No);
  if (targetIdx !== -1) {
    if (isFlipped) {
      toggleCardFlip();
      setTimeout(() => {
        currentIndex = targetIdx;
        displayCurrentWord();
      }, 200);
    } else {
      currentIndex = targetIdx;
      displayCurrentWord();
    }
  }
}

function populateWordSelect(wordsToShow = allWords) {
  if (!wordSelect) return;
  
  const currentVal = wordSelect.value;
  wordSelect.innerHTML = '<option value="">単語を選択してジャンプ...</option>';
  
  // Sort by No to ensure they appear in order
  const sortedWords = [...wordsToShow].sort((a, b) => parseInt(a.No) - parseInt(b.No));
  
  sortedWords.forEach(word => {
    const option = document.createElement('option');
    option.value = word.No;
    option.textContent = `No.${word.No} - ${word.Word}`;
    wordSelect.appendChild(option);
  });
  
  if (currentVal && wordsToShow.some(w => w.No.toString() === currentVal.toString())) {
    wordSelect.value = currentVal;
  }
}

// =========================================================
// Typing Practice Mode Implementation (PC-oriented)
// =========================================================

// Speech Helper for typing mode
function speakWordText(text) {
  if (!text || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 1.0;
  
  if (selectedVoiceName !== 'default') {
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.name === selectedVoiceName);
    if (voice) utterance.voice = voice;
  }
  
  window.speechSynthesis.speak(utterance);
}

// Web Audio API Synthesizer (No external audio files needed)
function initAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playAudioSound(type) {
  if (!typingSoundEnabled) return;
  initAudioContext();
  if (!audioCtx) return;

  try {
    const now = audioCtx.currentTime;
    
    if (type === 'type') {
      // Crisp click sound
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.03);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.03);
    } else if (type === 'correct') {
      // Cheerful 2-tone chime (E5 -> A5)
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      const gain2 = audioCtx.createGain();

      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(659.25, now); // E5
      gain1.gain.setValueAtTime(0.1, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.15);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(880.00, now + 0.08); // A5
      gain2.gain.setValueAtTime(0.12, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.3);
    } else if (type === 'mistake') {
      // Low buzz error sound
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.linearRampToValueAtTime(110, now + 0.1);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    }
  } catch (err) {
    console.warn('Audio playback error', err);
  }
}

// ---------------------------------------------------------
// Mistyped Words DB Management (Separate from Weak Words)
// ---------------------------------------------------------

function loadLocalTypingMistakes() {
  try {
    const raw = localStorage.getItem(localTypingMistakesKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        typingMistakesMap.clear();
        parsed.forEach(item => {
          if (item && item.wordNo) {
            typingMistakesMap.set(item.wordNo, item);
          }
        });
      }
    }
  } catch (e) {
    console.error('Failed to load typing mistakes from localStorage', e);
  }
  updateMistakeBadgeUI();
}

function saveLocalTypingMistakes() {
  try {
    const list = Array.from(typingMistakesMap.values());
    localStorage.setItem(localTypingMistakesKey, JSON.stringify(list));
  } catch (e) {
    console.error('Failed to save typing mistakes', e);
  }
  updateMistakeBadgeUI();
}

function updateMistakeBadgeUI() {
  const count = typingMistakesMap.size;
  if (typingMistakeBadgeCount) {
    typingMistakeBadgeCount.textContent = count;
  }
}

function recordTypingMistake(word) {
  if (!word || !word.No) return;
  const wordNo = word.No;
  const existing = typingMistakesMap.get(wordNo);
  const nowStr = new Date().toISOString();
  
  if (existing) {
    existing.count = (existing.count || 1) + 1;
    existing.lastAt = nowStr;
    existing.word = word.Word;
  } else {
    typingMistakesMap.set(wordNo, {
      wordNo: wordNo,
      word: word.Word,
      count: 1,
      lastAt: nowStr
    });
  }
  
  saveLocalTypingMistakes();
  sendMistakeUpdateToGas('add_mistake', wordNo, word.Word);
}

async function syncMistakesWithSpreadsheet() {
  if (!gasUrl) return;
  try {
    const url = `${gasUrl}?action=get_mistakes&t=${Date.now()}`;
    const response = await fetch(url);
    if (!response.ok) return;
    
    const result = await response.json();
    if (result.success && Array.isArray(result.mistakes)) {
      result.mistakes.forEach(item => {
        if (!item || !item.wordNo) return;
        const current = typingMistakesMap.get(item.wordNo);
        if (current) {
          current.count = Math.max(current.count || 1, item.count || 1);
          current.word = item.word || current.word;
        } else {
          typingMistakesMap.set(item.wordNo, {
            wordNo: item.wordNo,
            word: item.word,
            count: item.count || 1,
            lastAt: item.lastMistypedAt || ''
          });
        }
      });
      saveLocalTypingMistakes();
    }
  } catch (err) {
    console.warn('Sync mistakes failed:', err);
  }
}

async function sendMistakeUpdateToGas(action, wordNo, wordText) {
  if (!gasUrl) return;
  try {
    const url = `${gasUrl}?action=${action}&wordNo=${encodeURIComponent(wordNo)}&word=${encodeURIComponent(wordText || '')}&t=${Date.now()}`;
    await fetch(url);
  } catch (err) {
    console.warn(`sendMistakeUpdateToGas (${action}) failed:`, err);
  }
}

async function clearAllMistakes() {
  if (!confirm('これまでに記録されたミスタイプ単語の履歴をすべて消去しますか？\n（単語帳の苦手単語★には影響しません）')) {
    return;
  }
  typingMistakesMap.clear();
  saveLocalTypingMistakes();
  sendMistakeUpdateToGas('clear_mistakes', '', '');
  if (typingIsMistakeOnly) {
    typingIsMistakeOnly = false;
    typingMistakeFilterBtn.classList.remove('active');
    typingMistakeFilterBtn.setAttribute('aria-pressed', 'false');
  }
  applyTypingFilters();
  alert('ミスタイプ単語の履歴をリセットしました。');
}

// ---------------------------------------------------------
// Navigation & Mode Switching
// ---------------------------------------------------------

function switchAppMode(mode) {
  currentAppMode = mode;
  
  if (mode === 'typing') {
    stopAutoListening();
    if (navTabFlashcard) {
      navTabFlashcard.classList.remove('active');
      navTabFlashcard.setAttribute('aria-selected', 'false');
    }
    if (navTabTyping) {
      navTabTyping.classList.add('active');
      navTabTyping.setAttribute('aria-selected', 'true');
    }
    
    if (flashcardHeader) flashcardHeader.classList.add('hidden');
    if (flashcardView) flashcardView.classList.add('hidden');
    if (typingView) typingView.classList.remove('hidden');
    if (mainAppContainer) mainAppContainer.classList.add('typing-active');
    
    // Set level filter to match flashcard level if possible
    if (typingLevelFilter && levelFilter) {
      typingLevelFilter.value = levelFilter.value;
    }
    
    if (allWords && allWords.length > 0) {
      applyTypingFilters();
    }
    setTimeout(() => {
      if (typingInputField) typingInputField.focus();
    }, 100);
  } else {
    if (navTabTyping) {
      navTabTyping.classList.remove('active');
      navTabTyping.setAttribute('aria-selected', 'false');
    }
    if (navTabFlashcard) {
      navTabFlashcard.classList.add('active');
      navTabFlashcard.setAttribute('aria-selected', 'true');
    }
    
    if (typingView) typingView.classList.add('hidden');
    if (flashcardHeader) flashcardHeader.classList.remove('hidden');
    if (flashcardView) flashcardView.classList.remove('hidden');
    if (mainAppContainer) mainAppContainer.classList.remove('typing-active');
    
    if (allWords && allWords.length > 0) {
      applyFilters();
    }
  }
}
window.switchAppMode = switchAppMode;

function setTypingMode(mode) {
  typingMode = mode;
  if (mode === 'en-to-en') {
    typingModeEnBtn.classList.add('active');
    typingModeEnBtn.setAttribute('aria-checked', 'true');
    typingModeJaBtn.classList.remove('active');
    typingModeJaBtn.setAttribute('aria-checked', 'false');
  } else {
    typingModeJaBtn.classList.add('active');
    typingModeJaBtn.setAttribute('aria-checked', 'true');
    typingModeEnBtn.classList.remove('active');
    typingModeEnBtn.setAttribute('aria-checked', 'false');
  }
  renderTypingDisplay();
  if (typingInputField) {
    typingInputField.value = '';
    typingInputField.classList.remove('error', 'success');
    typingInputField.focus();
  }
}

// ---------------------------------------------------------
// Typing Filters & Data Slicing
// ---------------------------------------------------------

function applyTypingFilters() {
  const selectedLevel = typingLevelFilter.value;
  
  typingFilteredWords = allWords.filter(word => {
    // Level match
    if (selectedLevel !== 'all' && word.Level !== selectedLevel) return false;
    
    // Weak words filter (from flashcards ★)
    if (typingIsWeakOnly && !weakWords.has(word.No)) return false;
    
    // Mistyped words only filter
    if (typingIsMistakeOnly && !typingMistakesMap.has(word.No)) return false;
    
    return true;
  });
  
  if (typingIsShuffle) {
    shuffleArray(typingFilteredWords);
  }
  
  typingIndex = 0;
  sessionTotalKeys = 0;
  sessionMistakeKeys = 0;
  sessionMistypes.clear();
  
  populateTypingWordSelect(typingFilteredWords);
  displayCurrentTypingWord();
}

function populateTypingWordSelect(wordsToShow = allWords) {
  if (!typingWordSelect) return;
  
  typingWordSelect.innerHTML = '<option value="">単語を選択してジャンプ...</option>';
  const sortedWords = [...wordsToShow].sort((a, b) => parseInt(a.No) - parseInt(b.No));
  
  sortedWords.forEach(word => {
    const opt = document.createElement('option');
    opt.value = word.No;
    opt.textContent = `No.${word.No} - ${word.Word}`;
    typingWordSelect.appendChild(opt);
  });
}

function jumpToTypingWord(wordNo) {
  if (!wordNo) return;
  const targetIdx = typingFilteredWords.findIndex(w => w.No === wordNo);
  if (targetIdx !== -1) {
    typingIndex = targetIdx;
    displayCurrentTypingWord();
  }
}

function toggleTypingWeakFilter() {
  typingIsWeakOnly = !typingIsWeakOnly;
  typingWeakFilterBtn.classList.toggle('active', typingIsWeakOnly);
  typingWeakFilterBtn.setAttribute('aria-pressed', String(typingIsWeakOnly));
  applyTypingFilters();
}

function toggleTypingMistakeFilter() {
  typingIsMistakeOnly = !typingIsMistakeOnly;
  typingMistakeFilterBtn.classList.toggle('active', typingIsMistakeOnly);
  typingMistakeFilterBtn.setAttribute('aria-pressed', String(typingIsMistakeOnly));
  applyTypingFilters();
}

function toggleTypingShuffle() {
  typingIsShuffle = !typingIsShuffle;
  typingShuffleBtn.classList.toggle('active', typingIsShuffle);
  typingShuffleBtn.setAttribute('aria-pressed', String(typingIsShuffle));
  applyTypingFilters();
}

function toggleTypingTts() {
  typingTtsEnabled = !typingTtsEnabled;
  typingTtsToggleBtn.classList.toggle('active', typingTtsEnabled);
}

function toggleTypingSound() {
  typingSoundEnabled = !typingSoundEnabled;
  typingSoundToggleBtn.classList.toggle('active', typingSoundEnabled);
}

function toggleWeakWordInTyping() {
  if (typingFilteredWords.length === 0) return;
  const word = typingFilteredWords[typingIndex];
  if (!word) return;
  
  const wordNo = word.No;
  if (weakWords.has(wordNo)) {
    weakWords.delete(wordNo);
    sendWeakWordUpdateToGas('remove', wordNo);
  } else {
    weakWords.add(wordNo);
    sendWeakWordUpdateToGas('add', wordNo);
  }
  saveLocalWeakWords();
  
  // Update star icon in typing card
  const isWeak = weakWords.has(wordNo);
  typingCardWeakBtn.classList.toggle('active', isWeak);
  updateActiveStates(); // Keep flashcard in sync
}

// ---------------------------------------------------------
// Display & Render Current Typing Word
// ---------------------------------------------------------

function displayCurrentTypingWord() {
  if (typingFilteredWords.length === 0) {
    typingCurrentIdx.textContent = '0';
    typingTotalCnt.textContent = '0';
    typingProgressBar.style.width = '0%';
    typingCardNo.textContent = '----';
    typingCardLevel.textContent = 'None';
    typingCardPos.textContent = '-';
    typingCardMeaning.textContent = '該当する単語がありません';
    typingCardPhonetic.textContent = '';
    typingExampleEn.textContent = 'フィルター条件を変更してください。';
    typingExampleJa.textContent = '';
    typingDisplay.innerHTML = '<span style="font-size: 20px; color: var(--text-muted);">No Words Available</span>';
    typingHintPeek.classList.add('hidden');
    return;
  }
  
  if (typingIndex >= typingFilteredWords.length) {
    showTypingResultModal();
    return;
  }
  
  const word = typingFilteredWords[typingIndex];
  targetWordText = word.Word;
  targetChars = word.Word.split('');
  typedCharIndex = 0;
  currentWordMistyped = false;
  isTransitioningWord = false;
  isShowingHint = false;
  
  // Card Info
  typingCardNo.textContent = word.No;
  typingCardLevel.textContent = word.Level;
  typingCardPos.textContent = word.POS || '---';
  typingCardMeaning.textContent = word.Meaning;
  typingCardPhonetic.textContent = word.Phonetic || '';
  typingExampleEn.textContent = word.Example_EN || '';
  typingExampleJa.textContent = word.Example_JA || '';
  
  // Sync weak star state
  typingCardWeakBtn.classList.toggle('active', weakWords.has(word.No));
  
  // Reset hint
  typingHintPeek.classList.add('hidden');
  typingHintWord.textContent = targetWordText;
  
  // Word select dropdown sync
  if (typingWordSelect) {
    typingWordSelect.value = word.No;
  }
  
  renderTypingDisplay();
  updateTypingStatsUI();
  
  if (typingInputField) {
    typingInputField.value = '';
    typingInputField.classList.remove('error', 'success');
    typingInputField.focus();
  }
  if (typingClearInputBtn) {
    typingClearInputBtn.classList.add('hidden');
  }
  if (typingHiddenInput) {
    typingHiddenInput.value = '';
  }
}

function renderTypingDisplay() {
  typingDisplay.innerHTML = '';
  
  if (typingMode === 'en-to-en') {
    // English Shown Mode: Display actual letters with status colors
    targetChars.forEach((char, i) => {
      const span = document.createElement('span');
      span.textContent = char;
      
      if (char === ' ') {
        span.className = 'char-space';
        span.innerHTML = '&nbsp;';
      } else {
        if (i < typedCharIndex) {
          span.className = 'char-done';
        } else if (i === typedCharIndex) {
          span.className = 'char-current';
        } else {
          span.className = 'char-pending';
        }
      }
      typingDisplay.appendChild(span);
    });
  } else {
    // Japanese Shown Mode: Cloze / Hidden Mode
    targetChars.forEach((char, i) => {
      if (char === ' ') {
        const spaceSpan = document.createElement('span');
        spaceSpan.className = 'char-space';
        spaceSpan.innerHTML = '&nbsp;';
        typingDisplay.appendChild(spaceSpan);
      } else {
        const box = document.createElement('span');
        box.className = 'char-hidden-box';
        
        if (i < typedCharIndex) {
          box.textContent = char;
          box.classList.add('char-done');
        } else if (i === typedCharIndex) {
          box.textContent = isShowingHint ? char : '_';
          box.classList.add('char-current');
        } else {
          box.textContent = isShowingHint ? char : '_';
          box.classList.add('char-pending');
        }
        typingDisplay.appendChild(box);
      }
    });
  }
}

function updateTypingStatsUI() {
  const total = typingFilteredWords.length;
  const currentNum = Math.min(typingIndex + 1, total);
  
  typingCurrentIdx.textContent = currentNum;
  typingTotalCnt.textContent = total;
  
  const pct = total > 0 ? ((typingIndex) / total) * 100 : 0;
  typingProgressBar.style.width = `${pct}%`;
  
  // Accuracy calculation
  let acc = 100;
  if (sessionTotalKeys > 0) {
    acc = Math.max(0, Math.round(((sessionTotalKeys - sessionMistakeKeys) / sessionTotalKeys) * 100));
  }
  typingAccuracyVal.textContent = `${acc}%`;
  typingCurrentMistakes.textContent = sessionMistakeKeys;
}

// ---------------------------------------------------------
// Input Field Typing Handlers (Visible Input Box)
// ---------------------------------------------------------

function handleTypingInput(e) {
  if (typingFilteredWords.length === 0 || isTransitioningWord) return;
  const currentWord = typingFilteredWords[typingIndex];
  if (!currentWord) return;

  initAudioContext();

  const val = typingInputField.value;
  const expected = targetWordText;
  
  if (!val) {
    typingInputField.classList.remove('error', 'success');
    if (typingClearInputBtn) typingClearInputBtn.classList.add('hidden');
    typedCharIndex = 0;
    renderTypingDisplay();
    return;
  }

  if (typingClearInputBtn) {
    typingClearInputBtn.classList.remove('hidden');
  }

  sessionTotalKeys++;

  const isMatch = val.toLowerCase() === expected.slice(0, val.length).toLowerCase();

  if (isMatch) {
    typingInputField.classList.remove('error');
    typedCharIndex = val.length;
    renderTypingDisplay();
    playAudioSound('type');

    // Full match check (Word complete!)
    if (val.toLowerCase() === expected.toLowerCase()) {
      isTransitioningWord = true;
      typingInputField.classList.add('success');
      playAudioSound('correct');

      if (currentWordMistyped) {
        sessionMistypes.add(currentWord.No);
        recordTypingMistake(currentWord);
      }

      if (typingTtsEnabled) {
        speakWordText(targetWordText);
      }

      setTimeout(() => {
        typingIndex++;
        if (typingIndex >= typingFilteredWords.length) {
          showTypingResultModal();
        } else {
          displayCurrentTypingWord();
        }
      }, 350);
    }
  } else {
    // Mistake
    typingInputField.classList.add('error');
    currentWordMistyped = true;
    sessionMistakeKeys++;
    sessionMistypes.add(currentWord.No);
    recordTypingMistake(currentWord);

    playAudioSound('mistake');
    updateTypingStatsUI();
  }
}

function handleTypingInputKeyDown(e) {
  if (e.key === 'Tab') {
    e.preventDefault();
    isShowingHint = !isShowingHint;
    typingHintPeek.classList.toggle('hidden', !isShowingHint);
    renderTypingDisplay();
    return;
  }

  if (e.key === 'Escape') {
    e.preventDefault();
    skipTypingWord();
    return;
  }

  if (e.key === 'Enter') {
    e.preventDefault();
    const val = typingInputField.value.trim().toLowerCase();
    const expected = targetWordText.toLowerCase();
    if (val === expected) {
      // Completed, advance
      if (!isTransitioningWord) {
        isTransitioningWord = true;
        playAudioSound('correct');
        setTimeout(() => {
          typingIndex++;
          if (typingIndex >= typingFilteredWords.length) {
            showTypingResultModal();
          } else {
            displayCurrentTypingWord();
          }
        }, 350);
      }
    } else {
      // Show hint on Enter if not completed
      isShowingHint = true;
      typingHintPeek.classList.remove('hidden');
      renderTypingDisplay();
    }
  }
}

function clearTypingInput() {
  if (typingInputField) {
    typingInputField.value = '';
    typingInputField.classList.remove('error', 'success');
    typingInputField.focus();
  }
  if (typingClearInputBtn) {
    typingClearInputBtn.classList.add('hidden');
  }
  typedCharIndex = 0;
  renderTypingDisplay();
}

// Global typing key listener (auto-focuses input if user types anywhere in typing mode)
function handleTypingKeyDown(e) {
  if (document.activeElement === typingLevelFilter || document.activeElement === typingWordSelect || document.activeElement === gasUrlInput) {
    return;
  }

  if (document.activeElement !== typingInputField && typingInputField) {
    typingInputField.focus();
  }
}

function navigateTyping(delta) {
  const newIndex = typingIndex + delta;
  if (newIndex >= 0 && newIndex < typingFilteredWords.length) {
    typingIndex = newIndex;
    displayCurrentTypingWord();
  }
}

function skipTypingWord() {
  if (typingFilteredWords.length === 0) return;
  const word = typingFilteredWords[typingIndex];
  // Count as mistake if skipped
  sessionMistypes.add(word.No);
  recordTypingMistake(word);
  
  typingIndex++;
  if (typingIndex >= typingFilteredWords.length) {
    showTypingResultModal();
  } else {
    displayCurrentTypingWord();
  }
}

// ---------------------------------------------------------
// Result Modal & Retry Logic
// ---------------------------------------------------------

function showTypingResultModal() {
  let acc = 100;
  if (sessionTotalKeys > 0) {
    acc = Math.max(0, Math.round(((sessionTotalKeys - sessionMistakeKeys) / sessionTotalKeys) * 100));
  }
  resultAccuracy.textContent = `${acc}%`;
  resultMistakes.textContent = `${sessionMistakeKeys}回`;
  resultWordCount.textContent = `${typingFilteredWords.length}語`;
  
  // Render mistake words list
  resultMistakesList.innerHTML = '';
  const mistypedList = allWords.filter(w => sessionMistypes.has(w.No));
  resultMistakeCountBadge.textContent = mistypedList.length;
  
  if (mistypedList.length > 0) {
    mistypedList.forEach(w => {
      const row = document.createElement('div');
      row.className = 'mistake-row';
      row.innerHTML = `
        <span class="mistake-row-word">No.${w.No} ${w.Word}</span>
        <span class="mistake-row-meaning">${w.Meaning}</span>
      `;
      resultMistakesList.appendChild(row);
    });
    
    typingRetryMistakesBtn.classList.remove('hidden');
    resultRetryCount.textContent = mistypedList.length;
  } else {
    resultMistakesList.innerHTML = '<div style="text-align: center; color: var(--secondary); font-size: 13px; padding: 8px;">ノーミスパーフェクト！素晴らしい！ ✨</div>';
    typingRetryMistakesBtn.classList.add('hidden');
  }
  
  typingResultModal.classList.remove('hidden');
}

function hideTypingResultModal() {
  typingResultModal.classList.add('hidden');
  if (typingHiddenInput) typingHiddenInput.focus();
}

function retryMistypedWords() {
  hideTypingResultModal();
  // Enable mistyped-only mode
  typingIsMistakeOnly = true;
  typingMistakeFilterBtn.classList.add('active');
  typingMistakeFilterBtn.setAttribute('aria-pressed', 'true');
  applyTypingFilters();
}

function restartTypingSession() {
  hideTypingResultModal();
  applyTypingFilters();
}


