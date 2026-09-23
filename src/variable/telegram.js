// Helpers for Telegram WebApp environment handling
export function isTelegramWebApp() {
  try {
    if (typeof window === 'undefined') return false

    // Basic checks for presence of WebApp object
    if (window.Telegram && window.Telegram.WebApp) return true
    if (window.TelegramWebviewProxy && window.TelegramWebviewProxy.WebApp) return true

    // Parent frame may expose Telegram (iframe scenarios)
    try {
      if (window.parent && window.parent !== window) {
        if (window.parent.Telegram && window.parent.Telegram.WebApp) return true
        if (window.parent.TelegramWebviewProxy && window.parent.TelegramWebviewProxy.WebApp) return true
      }
    } catch (e) {
      // cross-origin access may throw; ignore
    }

    // Fallbacks: initDataUnsafe presence or referrer hints
    if (window.Telegram && window.Telegram.initDataUnsafe && window.Telegram.initDataUnsafe.user) return true
    if (window.TelegramWebviewProxy && window.TelegramWebviewProxy.initDataUnsafe && window.TelegramWebviewProxy.initDataUnsafe.user) return true
    if (typeof document !== 'undefined' && document.referrer && document.referrer.includes('t.me')) return true

    return false
  } catch (e) {
    return false
  }
}
export function enterTelegramFullscreen() {
  try {
    const tg = window.Telegram || window.TelegramWebviewProxy
    if (!tg || !tg.WebApp) return false

    const WebApp = tg.WebApp
    // mark ready
    if (typeof WebApp.ready === 'function') {
      try { WebApp.ready() } catch (e) { console.warn('WebApp.ready failed', e) }
    }

    // hide main button if available
    if (WebApp.MainButton && typeof WebApp.MainButton.hide === 'function') {
      try { WebApp.MainButton.hide() } catch (e) { console.warn('MainButton.hide failed', e) }
    }

    // Prefer requestFullscreen if the Telegram WebApp exposes it
    const tryRequestFullscreen = async () => {
      if (typeof WebApp.requestFullscreen === 'function') {
        try {
          await WebApp.requestFullscreen()
          console.log('WebApp.requestFullscreen succeeded')
          return true
        } catch (e) {
          console.warn('WebApp.requestFullscreen threw', e)
        }
      }

      // Fallback: try browser Fullscreen API on documentElement
      try {
        const el = document.documentElement
        if (el.requestFullscreen) {
          await el.requestFullscreen()
          console.log('document.requestFullscreen succeeded')
          return true
        }
        if (el.webkitRequestFullscreen) {
          el.webkitRequestFullscreen()
          console.log('webkitRequestFullscreen invoked')
          return true
        }
        if (el.msRequestFullscreen) {
          el.msRequestFullscreen()
          console.log('msRequestFullscreen invoked')
          return true
        }
      } catch (e) {
        console.warn('document.requestFullscreen failed', e)
      }

      return false
    }

    // Try a few times because some clients need a short delay
    tryRequestFullscreen()
    setTimeout(tryRequestFullscreen, 250)
    setTimeout(tryRequestFullscreen, 800)

    return true
  } catch (e) {
    return false
  }
}
