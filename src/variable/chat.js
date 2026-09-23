// Helper to resolve chatID from several sources (URL, Telegram WebApp, initData)
function sanitizeChatID(raw) {
  if (raw === null || raw === undefined) return null
  const digits = String(raw).replace(/\D/g, '')
  return digits || null
}

function readChatIdFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search)
    return (
      sanitizeChatID(params.get('chatID')) ||
      sanitizeChatID(params.get('chatId')) ||
      sanitizeChatID(params.get('userid')) ||
      sanitizeChatID(params.get('userId'))
    )
  } catch (e) {
    return null
  }
}

function readTelegramUser() {
  try {
    return window?.Telegram?.WebApp?.initDataUnsafe?.user || null
  } catch (e) {
    return null
  }
}

function readChatIdFromInitData() {
  try {
    const rawInitData = window?.Telegram?.WebApp?.initData
    if (!rawInitData) return null
    const params = new URLSearchParams(rawInitData)
    const userJson = params.get('user')
    if (!userJson) return null
    const user = JSON.parse(userJson)
    return sanitizeChatID(user?.id)
  } catch (e) {
    return null
  }
}

export function getChatID() {
  const fromUnsafeUser = sanitizeChatID(readTelegramUser()?.id)
  if (fromUnsafeUser) return fromUnsafeUser


  return null
}

export function getProfileImg() {
  const unsafeUser = readTelegramUser()
  if (unsafeUser) return unsafeUser

  try {
    const rawInitData = window?.Telegram?.WebApp?.initData
    if (!rawInitData) return null
    const params = new URLSearchParams(rawInitData)
    const userJson = params.get('user')
    if (!userJson) return null
    return JSON.parse(userJson)
  } catch (e) {
    return null
  }
}
// Telegram Cloud Storage functions for recipientCode
export function saveRecipientCode(code) {
  if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.CloudStorage) {
    try {
      window.Telegram.WebApp.CloudStorage.setItem('recipientCode', code, (error) => {
        if (error) console.error('Error saving recipientCode to Cloud Storage:', error)
        else console.log('recipientCode saved to Cloud Storage:', code)
      })
    } catch (error) {
      console.error('Error with Telegram Cloud Storage:', error)
      // Fallback to localStorage
      localStorage.setItem('recipientCode', code)
    }
  } else {
    // Fallback to localStorage if Telegram is not available
    localStorage.setItem('recipientCode', code)
  }
}

export function getRecipientCode(callback) {
  if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.CloudStorage) {
    try {
      window.Telegram.WebApp.CloudStorage.getItem('recipientCode', (error, value) => {
        if (error) {
          console.error('Error reading recipientCode from Cloud Storage:', error)
          // Fallback to localStorage
          callback(null, localStorage.getItem('recipientCode'))
        } else {
          callback(null, value)
        }
      })
    } catch (error) {
      console.error('Error with Telegram Cloud Storage:', error)
      // Fallback to localStorage
      callback(null, localStorage.getItem('recipientCode'))
    }
  } else {
    // Fallback to localStorage if Telegram is not available
    callback(null, localStorage.getItem('recipientCode'))
  }
}

export function deleteRecipientCode() {
  if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.CloudStorage) {
    try {
      window.Telegram.WebApp.CloudStorage.removeItem('recipientCode', (error) => {
        if (error) console.error('Error deleting recipientCode from Cloud Storage:', error)
        else console.log('recipientCode deleted from Cloud Storage')
      })
    } catch (error) {
      console.error('Error with Telegram Cloud Storage:', error)
      // Fallback to localStorage
      localStorage.removeItem('recipientCode')
    }
  } else {
    // Fallback to localStorage if Telegram is not available
    localStorage.removeItem('recipientCode')
  }
}
