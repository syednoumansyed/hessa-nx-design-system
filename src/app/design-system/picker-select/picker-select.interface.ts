import { ObjId } from '@shared/interfaces/common.interface';

/**
 * Option for the picker select component
 */
export interface DsPickerSelectOption {
  /** Unique identifier for the option */
  id: ObjId;
  /** Display text for the option */
  display: string;
  /** Whether this option is disabled */
  disabled?: boolean;
}

/**
 * Configuration for the picker select component
 */
export interface DsPickerSelectConfig {
  /** Available options to select from */
  options: DsPickerSelectOption[];
  /** Label displayed above the trigger */
  label?: string;
  /** Placeholder text when no selection */
  placeholder?: string;
  /** Whether multiple selections are allowed */
  isMultiple?: boolean;
  /** Whether the field is required */
  required?: boolean;
  /** Whether the entire component is disabled */
  disabled?: boolean;
  /** Text for the select/confirm button */
  selectButtonText?: string;
  /** Label for items (e.g., "lessons", "items") - used in modal title and selection count display */
  itemLabel?: string;
}

/**
 * Internal state for tracking selections in the modal
 */
export interface DsPickerSelectState {
  /** Currently selected option IDs (pending confirmation) */
  pendingSelection: ObjId[];
  /** Search/filter text */
  searchText: string;
}
