import { Injectable, signal } from '@angular/core';
import {
  ModalSheetConfig,
  ModalSheetEntry,
  ModalSheetRef,
  ModalSheetResult,
} from './modal-sheet.types';

@Injectable({ providedIn: 'root' })
export class ModalSheetService {
  private nextId = 0;

  /** The internal stack of sheet entries. Container component reads this. */
  readonly stack = signal<ModalSheetEntry[]>([]);

  /**
   * Present a new modal sheet on top of the stack.
   */
  present<TResult = unknown>(config: ModalSheetConfig): ModalSheetRef<TResult> {
    const id = this.nextId++;

    let onDismissResolve!: (result: ModalSheetResult<TResult>) => void;
    const onDismissPromise = new Promise<ModalSheetResult<TResult>>(
      (resolve) => {
        onDismissResolve = resolve;
      },
    );

    const dismissFn = (data?: unknown, role?: string) => {
      this.dismissEntry(id, data, role);
    };

    const entry: ModalSheetEntry = {
      id,
      config: config as ModalSheetConfig,
      state: 'active',
      dismissFn,
      onDismissResolve: onDismissResolve as (result: ModalSheetResult) => void,
    };

    this.stack.update((current) => {
      const withPushed = current.map((e, i) => {
        if (i === current.length - 1) {
          return { ...e, state: 'behind' as const };
        }
        if (i === current.length - 2) {
          return { ...e, state: 'hidden' as const };
        }
        return e;
      });
      return [...withPushed, entry];
    });

    return {
      dismiss: async (data?: TResult, role?: string) => {
        dismissFn(data, role);
        return true;
      },
      onDismiss: async () => onDismissPromise,
    };
  }

  /**
   * Dismiss the top-most sheet.
   */
  dismissTop(data?: unknown, role?: string): void {
    const current = this.stack();
    if (current.length === 0) return;
    const topEntry = current[current.length - 1];
    this.dismissEntry(topEntry.id, data, role);
  }

  /**
   * Dismiss a specific entry from the stack by id.
   */
  private dismissEntry(id: number, data?: unknown, role?: string): void {
    const current = this.stack();
    const entryIndex = current.findIndex((e) => e.id === id);
    if (entryIndex === -1) return;

    const entry = current[entryIndex];

    // Resolve the onDismiss promise
    entry.onDismissResolve({ data, role });

    // Remove the entry and recalculate states
    const remaining = current.filter((e) => e.id !== id);
    const recalculated = remaining.map((e, i) =>
      this.recalcState(e, i, remaining.length),
    );

    this.stack.set(recalculated);
  }

  /**
   * Recalculate the visual state based on position in stack.
   */
  private recalcState(
    entry: ModalSheetEntry,
    index: number,
    totalOrIndex?: number,
  ): ModalSheetEntry {
    const total =
      typeof totalOrIndex === 'number' && arguments.length === 3
        ? totalOrIndex
        : (totalOrIndex ?? index + 1);
    const fromTop = total - 1 - index;

    let newState: 'active' | 'behind' | 'hidden';
    if (fromTop === 0) {
      newState = 'active';
    } else if (fromTop === 1) {
      newState = 'behind';
    } else {
      newState = 'hidden';
    }

    if (entry.state === newState) return entry;
    return { ...entry, state: newState };
  }

  /**
   * Returns true if any sheets are open.
   */
  get hasSheets(): boolean {
    return this.stack().length > 0;
  }
}
