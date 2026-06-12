/**
 * useWebSocket hook — manages a WebSocket connection with auto-reconnect.
 *
 * Features:
 * - Auto-reconnect every 3 seconds on disconnect
 * - Parses incoming JSON messages automatically
 * - Returns last received data + connection status
 *
 * Usage:
 *   const { data, isConnected } = useWebSocket('ws://localhost:8000/ws/patient/IH-20260001/')
 */

import { useState, useEffect, useRef, useCallback } from 'react'

const useWebSocket = (url) => {
  const [data, setData]               = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const wsRef     = useRef(null)
  const reconnectRef = useRef(null)

  const connect = useCallback(() => {
    // Don't reconnect if already open
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    wsRef.current = new WebSocket(url)

    wsRef.current.onopen = () => {
      setIsConnected(true)
      // Clear any pending reconnect timer
      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current)
        reconnectRef.current = null
      }
    }

    wsRef.current.onclose = () => {
      setIsConnected(false)
      // Schedule reconnect after 3 seconds
      reconnectRef.current = setTimeout(connect, 3000)
    }

    wsRef.current.onerror = () => {
      wsRef.current?.close()
    }

    wsRef.current.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data)
        setData(parsed)
      } catch (e) {
        console.warn('[useWebSocket] Failed to parse message:', event.data)
      }
    }
  }, [url])

  useEffect(() => {
    if (!url) return

    connect()

    return () => {
      // Cleanup on unmount: close socket + cancel reconnect
      if (reconnectRef.current) clearTimeout(reconnectRef.current)
      wsRef.current?.close()
    }
  }, [url, connect])

  return { data, isConnected }
}

export default useWebSocket
