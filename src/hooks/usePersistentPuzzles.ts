import { useCallback, useEffect, useRef, useState } from 'react';
import type { Puzzle } from '../types/puzzle';
import {
  deletePersistedPhoto,
  persistPickedPhoto,
} from '../storage/photoFiles';
import {
  loadCompletedIds,
  loadUserPuzzles,
  saveCompletedIds,
  saveUserPuzzles,
} from '../storage/puzzleStore';

/**
 * Fire-and-forget a persistence write. The storage helpers already
 * swallow their own errors, so this is just to make "not awaited" explicit
 * and keep a stray rejection from surfacing.
 */
function persist(p: Promise<unknown>): void {
  p.catch(() => {});
}

export interface PersistentPuzzles {
  /** Uploaded photos, newest first. `[]` until `hydrated`. */
  userPuzzles: Puzzle[];
  /** Copy each picked photo into app storage, then prepend to the list. */
  addPuzzles: (puzzles: Puzzle[]) => void;
  /** Remove an uploaded photo and delete its file. */
  deletePuzzle: (id: string) => void;
  /** Ids of every puzzle solved at least once. */
  completedIds: ReadonlySet<string>;
  markCompleted: (puzzleId: string) => void;
  clearCompleted: (puzzleId: string) => void;
  /** False until the first read from storage has landed. */
  hydrated: boolean;
}

/**
 * Owns the two slices of app state that outlive a launch: the uploaded
 * puzzle list and the set of completed puzzle ids. Reads them once on
 * mount; every mutation updates React state immediately (the source of
 * truth for the UI) and writes back to storage fire-and-forget.
 * See docs/specs/hooks/usePersistentPuzzles.md.
 */
export function usePersistentPuzzles(): PersistentPuzzles {
  const [userPuzzles, setUserPuzzles] = useState<Puzzle[]>([]);
  const [completedIds, setCompletedIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [hydrated, setHydrated] = useState(false);
  // Ignore async results that resolve after unmount.
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    Promise.all([loadUserPuzzles(), loadCompletedIds()]).then(
      ([puzzles, ids]) => {
        if (!mounted.current) {
          return;
        }
        setUserPuzzles(puzzles);
        setCompletedIds(new Set(ids));
        setHydrated(true);
      },
    );
    return () => {
      mounted.current = false;
    };
  }, []);

  const addPuzzles = useCallback((incoming: Puzzle[]) => {
    Promise.all(
      incoming.map(async puzzle => {
        if (!puzzle.imageUri) {
          return puzzle;
        }
        const imageUri = await persistPickedPhoto(puzzle.imageUri, puzzle.id);
        return { ...puzzle, imageUri };
      }),
    ).then(persisted => {
      if (!mounted.current) {
        return;
      }
      setUserPuzzles(current => {
        const next = [...persisted, ...current];
        persist(saveUserPuzzles(next));
        return next;
      });
    });
  }, []);

  const deletePuzzle = useCallback((id: string) => {
    setUserPuzzles(current => {
      const target = current.find(p => p.id === id);
      if (target?.imageUri) {
        persist(deletePersistedPhoto(target.imageUri));
      }
      const next = current.filter(p => p.id !== id);
      persist(saveUserPuzzles(next));
      return next;
    });
  }, []);

  const markCompleted = useCallback((puzzleId: string) => {
    setCompletedIds(current => {
      if (current.has(puzzleId)) {
        return current;
      }
      const next = new Set(current).add(puzzleId);
      persist(saveCompletedIds([...next]));
      return next;
    });
  }, []);

  const clearCompleted = useCallback((puzzleId: string) => {
    setCompletedIds(current => {
      if (!current.has(puzzleId)) {
        return current;
      }
      const next = new Set(current);
      next.delete(puzzleId);
      persist(saveCompletedIds([...next]));
      return next;
    });
  }, []);

  return {
    userPuzzles,
    addPuzzles,
    deletePuzzle,
    completedIds,
    markCompleted,
    clearCompleted,
    hydrated,
  };
}
