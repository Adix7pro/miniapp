import axios from 'axios'
import { API } from '../variable/link.js'
import { getChatID } from '../variable/chat.js'

const CART_ENDPOINT = `https://api.erkaboyev.uz/Golddishes/hs/loyalty/cart`

// Helper to get auth headers
const getAuthHeaders = () => ({
  Authorization: `Basic ${btoa(`${API.username}:${API.password}`)}`,
  'ngrok-skip-browser-warning': 'true',
  'Content-Type': 'application/json'
})

class Cart {
  constructor() {
    this.chatID = getChatID()
  }

  /**
   * Add product to cart
   * POST /cart with { chatID, productID }
   */
  async add(productID) {
    try {
      const response = await axios.post(
        CART_ENDPOINT,
        {
          chatID: this.chatID,
          productID: productID
        },
        { headers: getAuthHeaders() }
      )
      // If successful (2xx), return data with quantity incremented and notify listeners
      if (response.status >= 200 && response.status < 300) {
        const data = response.data
        if (data && typeof data === 'object') {
          // Increment quantity when server provides a quantity field
          if (data.quantity !== undefined) {
            data.quantity = (Number(data.quantity) || 0) + 1
          }
        }
        // notify listeners that cart changed
        try { window.dispatchEvent(new CustomEvent('cart-updated')) } catch (e) { /* ignore */ }
        return data
      }
      return response.data
    } catch (error) {
      console.error('Cart.add() error:', error)
      throw error
    }
  }

  /**
   * Get cart items
   * GET /cart?chatID={chatID}
   */
  async get() {
    try {
      const response = await axios.get(
        `${CART_ENDPOINT}?chatID=${this.chatID}`,
        { headers: getAuthHeaders() }
      )
      return response.data
    } catch (error) {
      console.error('Cart.get() error:', error)
      throw error
    }
  }

  /**
   * Decrease product quantity (minus 1)
   * DELETE /cart with body { chatID, productID }
   */
  async delete(productID) {
    try {
      const response = await axios.delete(
        `${CART_ENDPOINT}`,
        { headers: getAuthHeaders(),
          data: {
            chatID: this.chatID,
            productID: productID
          }
         }
      )
      // notify listeners that cart changed
      try { window.dispatchEvent(new CustomEvent('cart-updated')) } catch (e) { /* ignore */ }
      return response.data
    } catch (error) {
      console.error('Cart.delete() error:', error)
      throw error
    }
  }

  /**
   * Delete product completely (remove all quantity)
   * DELETE /cart with { chatID, productID, type: 'all' }
   */
  async deleteProduct(productID) {
    try {
      const response = await axios.delete(
        CART_ENDPOINT,
        {
          headers: getAuthHeaders(),
          data: {
            chatID: this.chatID,
            productID: productID,
            type: 'all'
          }
        }
      )
      // notify listeners that cart changed
      try { window.dispatchEvent(new CustomEvent('cart-updated')) } catch (e) { /* ignore */ }
      return response.data
    } catch (error) {
      console.error('Cart.deleteProduct() error:', error)
      throw error
    }
  }

  /**
   * Reset (clear) entire cart
   * DELETE /cart with { chatID }
   */
  async reset() {
    try {
      const response = await axios.delete(
        CART_ENDPOINT,
        {
          headers: getAuthHeaders(),
          data: {
            chatID: this.chatID
          }
        }
      )
      // notify listeners that cart changed
      try { window.dispatchEvent(new CustomEvent('cart-updated')) } catch (e) { /* ignore */ }
      return response.data
    } catch (error) {
      console.error('Cart.reset() error:', error)
      throw error
    }
  }
}

// Export singleton instance
export default new Cart()
