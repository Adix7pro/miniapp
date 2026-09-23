// Minimal Telegram WebApp helper
// Mocking switch: when true, helpers return mock data instead of reading
// from window.Telegram.WebApp. This makes local development and testing
// independent from the real Telegram WebApp environment.
let MOCK_MODE = true

export function enableMock(flag) {
  MOCK_MODE = !!flag
}

export function isInTelegram() {
  return typeof window !== 'undefined' && !!window.Telegram && !!window.Telegram.WebApp
}

export function initTelegram() {
  if (!isInTelegram()) return null
  const tg = window.Telegram.WebApp
  try {
    // Expand the WebApp to use full height inside Telegram
    if (typeof tg.expand === 'function') tg.expand()
    // Set a default main button
    if (tg.MainButton && typeof tg.MainButton.setText === 'function') {
      tg.MainButton.setText('Start')
      tg.MainButton.show()
    }
  } catch (e) {
    // ignore any errors from Telegram API
    // console.warn('Telegram init failed', e)
  }
  return tg
}

export function getInitData() {
  if (MOCK_MODE) {
    return {
      auth_date: Date.now(),
      user: {
        id: 1001,
        is_bot: false,
        first_name: 'Mock',
        last_name: 'User',
        username: 'mock_user',
        language_code: 'uz'
      }
    }
  }
  if (!isInTelegram()) return null
  try {
    return window.Telegram?.WebApp?.initData || null
  } catch (e) {
    return null
  }
}

// Return the parsed unsafe init data (available in Telegram WebApp as initDataUnsafe)
// This can include a `user` object with fields like id, first_name, last_name, username, language_code.
export function getUnsafeInitUser() {
  // When mock mode is enabled return a deterministic mock user
  if (MOCK_MODE) {
    return {
      id: 1001,
      first_name: 'Mock',
      last_name: 'User',
      username: 'mock_user',
      language_code: 'uz',
      // photo_url can remain null or point to a placeholder
      photo_url: null,
    }
  }

  if (!isInTelegram()) return null
  try {
    return window.Telegram?.WebApp?.initDataUnsafe?.user || null
  } catch (e) {
    return null
  }
}

// For convenience export the current mock mode state
export function isMockEnabled() {
  return MOCK_MODE
}
