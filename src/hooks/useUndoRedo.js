import { useState, useCallback, useRef } from "react";

export function useUndoRedo(maxHistory = 30) {
  const undoStack = useRef([]);
  const redoStack = useRef([]);
  const [, forceUpdate] = useState(0);

  const pushAction = useCallback((action) => {
    undoStack.current.push(action);
    if (undoStack.current.length > maxHistory) {
      undoStack.current.shift();
    }
    redoStack.current = [];
    forceUpdate((n) => n + 1);
  }, [maxHistory]);

  const undo = useCallback(() => {
    const action = undoStack.current.pop();
    if (!action) return;
    redoStack.current.push(action);
    forceUpdate((n) => n + 1);
    return action;
  }, []);

  const redo = useCallback(() => {
    const action = redoStack.current.pop();
    if (!action) return;
    undoStack.current.push(action);
    forceUpdate((n) => n + 1);
    return action;
  }, []);

  const canUndo = undoStack.current.length > 0;
  const canRedo = redoStack.current.length > 0;

  return { pushAction, undo, redo, canUndo, canRedo };
}
