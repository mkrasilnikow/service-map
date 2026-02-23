/**
 * @file Keyboard shortcut hook for the Service Map Editor.
 *
 * Binds global keyboard events for:
 *   - Delete / Backspace — remove the selected element
 *   - Escape — reset mode to "select" and clear selection
 *
 * Ignores key events when an input or textarea is focused
 * to avoid interfering with text editing.
 *
 * @param deleteSelected - Callback to delete the currently selected element.
 * @param resetMode - Callback to reset the interaction mode and clear state.
 * @param hasSelection - Whether there is currently a selected element.
 */

import { useEffect } from 'react';

export function useKeyboard(
  deleteSelected: () => void,
  resetMode: () => void,
  hasSelection: boolean,
) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if ((e.key === 'Delete' || e.key === 'Backspace') && hasSelection) {
        e.preventDefault();
        deleteSelected();
      }

      if (e.key === 'Escape') {
        resetMode();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [deleteSelected, resetMode, hasSelection]);
}
