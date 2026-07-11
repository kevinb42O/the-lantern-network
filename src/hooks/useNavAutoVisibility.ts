import { useState, useEffect, useRef } from 'react'

export function useNavAutoVisibility() {
  const [keyboardActive, setKeyboardActive] = useState(false)
  const [isInactive, setIsInactive] = useState(false)
  // Assuming no modals block the nav in this implementation initially, but we can add event listeners if needed.

  const navHidden = keyboardActive || isInactive
  const navHiddenRef = useRef(navHidden)

  useEffect(() => {
    navHiddenRef.current = navHidden
  }, [navHidden])

  // Keyboard detection via visualViewport
  useEffect(() => {
    const root = document.documentElement
    const textInputSelector = 'input, textarea, select, [contenteditable="true"]'
    let frameId = 0
    let timeoutId = 0

    function updateVisualViewportBottom() {
      if (frameId) {
        window.cancelAnimationFrame(frameId)
      }

      frameId = window.requestAnimationFrame(() => {
        frameId = window.requestAnimationFrame(() => {
          frameId = 0
          measureVisualViewport()
        })
      })
    }

    function settleVisualViewportBottom() {
      updateVisualViewportBottom()
      window.clearTimeout(timeoutId)
      timeoutId = window.setTimeout(updateVisualViewportBottom, 160)
    }

    function measureVisualViewport() {
      const visualViewport = window.visualViewport
      const viewportHeight = visualViewport?.height ?? window.innerHeight
      const bottomOffset = visualViewport
        ? Math.max(0, window.innerHeight - visualViewport.height - visualViewport.offsetTop)
        : 0
      const activeElement = document.activeElement
      const textFieldFocused = Boolean(activeElement?.matches?.(textInputSelector))
      const phoneViewport = window.matchMedia('(max-width: 640px)').matches
      
      // We consider keyboard active if a text field is focused OR visual viewport shrinks significantly.
      // Even on desktop we can hide the nav if a text field is focused to give maximum space.
      const keyboardVisible = textFieldFocused || (phoneViewport && bottomOffset > 120)

      root.style.setProperty('--visual-viewport-height', `${Math.round(viewportHeight)}px`)
      root.style.setProperty('--visual-viewport-bottom', `${Math.round(bottomOffset)}px`)
      setKeyboardActive(keyboardVisible)
    }

    settleVisualViewportBottom()
    window.addEventListener('resize', settleVisualViewportBottom)
    window.addEventListener('focusin', settleVisualViewportBottom)
    window.addEventListener('focusout', settleVisualViewportBottom)
    window.visualViewport?.addEventListener('resize', settleVisualViewportBottom)
    window.visualViewport?.addEventListener('scroll', settleVisualViewportBottom)
    window.screen.orientation?.addEventListener?.('change', settleVisualViewportBottom)

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId)
      }
      window.clearTimeout(timeoutId)
      window.removeEventListener('resize', settleVisualViewportBottom)
      window.removeEventListener('focusin', settleVisualViewportBottom)
      window.removeEventListener('focusout', settleVisualViewportBottom)
      window.visualViewport?.removeEventListener('resize', settleVisualViewportBottom)
      window.visualViewport?.removeEventListener('scroll', settleVisualViewportBottom)
      window.screen.orientation?.removeEventListener?.('change', settleVisualViewportBottom)
      root.style.removeProperty('--visual-viewport-bottom')
      root.style.removeProperty('--visual-viewport-height')
    }
  }, [])

  // Inactivity tracking for auto-hide
  useEffect(() => {
    let timeout: NodeJS.Timeout

    const resetInactivity = () => {
      setIsInactive(false)
      clearTimeout(timeout)
      // Hide after 4.5 seconds of inactivity
      timeout = setTimeout(() => setIsInactive(true), 4500)
    }

    resetInactivity()

    window.addEventListener('mousemove', resetInactivity)
    window.addEventListener('touchstart', resetInactivity)
    window.addEventListener('touchmove', resetInactivity)
    window.addEventListener('wheel', resetInactivity)
    window.addEventListener('keydown', resetInactivity)

    return () => {
      clearTimeout(timeout)
      window.removeEventListener('mousemove', resetInactivity)
      window.removeEventListener('touchstart', resetInactivity)
      window.removeEventListener('touchmove', resetInactivity)
      window.removeEventListener('wheel', resetInactivity)
      window.removeEventListener('keydown', resetInactivity)
    }
  }, [])

  return { navHidden, isInactive, keyboardActive }
}
