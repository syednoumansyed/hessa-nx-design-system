# DS Action List Item Component

A configurable action list item component designed with design system CSS classes that displays content with status indicators and interactive elements.

## Features

- ✅ Avatar display with fallback initials
- ✅ Upper supporting text (status/category)
- ✅ Primary title text
- ✅ Supporting text with icon and count badge
- ✅ Success/Danger/Default variants
- ✅ Navigation arrow (optional)
- ✅ Click event handling
- ✅ Fully responsive with design system styling

## Usage

### Basic Example

```typescript
import { DsActionListItemComponent, DsActionListItemConfig } from "@ds/action-list";

const basicConfig: DsActionListItemConfig = {
  id: "user-1",
  title: "Add Name",
  showArrow: true,
};
```

```html
<ds-action-list-item [config]="basicConfig" (itemClick)="handleItemClick($event)" />
```

```typescript
handleItemClick(config: DsActionListItemConfig) {
  console.log('Item clicked:', config.title);
  console.log('Item ID:', config.id);
  // Direct access to the full configuration
}
```

### Complete Example (with avatar and supporting text)

```typescript
const completedTaskConfig: DsActionListItemConfig = {
  id: "task-1",
  upperSupportingText: "Pending",
  title: "Add Name",
  avatar: {
    fullName: "John Doe",
    imageUrl: "https://example.com/avatar.jpg",
  },
  supportingText: {
    text: "Completed",
    icon: faCheckCircle,
    count: 9,
    variant: "success",
  },
  showArrow: true,
};
```

### With Avatar Only

```typescript
const avatarConfig: DsActionListItemConfig = {
  id: "user-2",
  title: "Jane Smith",
  avatar: {
    imageUrl: "https://example.com/avatar.jpg",
    fullName: "Jane Smith",
  },
  showArrow: true,
};
```

### Danger Variant

```typescript
const errorConfig: DsActionListItemConfig = {
  id: "error-1",
  upperSupportingText: "Failed",
  title: "Process Documents",
  supportingText: {
    text: "Error",
    icon: faExclamationTriangle,
    count: 3,
    variant: "danger",
  },
  showArrow: true,
};
```

### With Disabled State

```typescript
const disabledConfig: DsActionListItemConfig = {
  id: "disabled-item",
  title: "Disabled Item",
  showArrow: true,
};
```

```html
<ds-action-list-item [config]="disabledConfig" [disabled]="true" (itemClick)="handleItemClick($event)" />
```

## Configuration Options

### DsActionListItemComponent Inputs

| Property   | Type                     | Required | Default | Description                             |
| ---------- | ------------------------ | -------- | ------- | --------------------------------------- |
| `config`   | `DsActionListItemConfig` | Yes      | -       | Configuration object for the list item  |
| `disabled` | `boolean`                | No       | `false` | Disables click interactions when `true` |

### DsActionListItemComponent Outputs

| Event       | Type                                   | Description                                        |
| ----------- | -------------------------------------- | -------------------------------------------------- |
| `itemClick` | `EventEmitter<DsActionListItemConfig>` | Emitted when the item is clicked (if not disabled) |

### DsActionListItemConfig

| Property              | Type                                   | Required | Description                                 |
| --------------------- | -------------------------------------- | -------- | ------------------------------------------- |
| `id`                  | `string`                               | No       | Unique identifier for the item              |
| `title`               | `string`                               | Yes      | Main title text                             |
| `upperSupportingText` | `string`                               | No       | Text above the main title (e.g., "Pending") |
| `avatar`              | `DsActionListItemAvatarConfig`         | No       | Avatar configuration                        |
| `supportingText`      | `DsActionListItemSupportingTextConfig` | No       | Status text with icon and count             |
| `showArrow`           | `boolean`                              | No       | Show navigation arrow (default: true)       |

### DsActionListItemAvatarConfig

| Property       | Type                   | Required | Description                       |
| -------------- | ---------------------- | -------- | --------------------------------- |
| `imageUrl`     | `string`               | No       | URL to the avatar image           |
| `fullName`     | `string`               | No       | Full name for fallback initials   |
| `fallbackText` | `string`               | No       | Custom fallback text for initials |
| `size`         | `'sm' \| 'md' \| 'lg'` | No       | Avatar size (component uses 'sm') |

### DsActionListItemSupportingTextConfig

| Property  | Type                                 | Required | Description                        |
| --------- | ------------------------------------ | -------- | ---------------------------------- |
| `text`    | `string`                             | Yes      | Status text (e.g., "Completed")    |
| `icon`    | `DsIcon`                             | No       | Icon from design system            |
| `count`   | `number`                             | No       | Count badge number                 |
| `variant` | `'success' \| 'danger' \| 'default'` | No       | Color variant (default: 'default') |

## Events

| Event       | Description                                             | Payload                  |
| ----------- | ------------------------------------------------------- | ------------------------ |
| `itemClick` | Fired when the item is clicked (only when not disabled) | `DsActionListItemConfig` |

## Component Behavior

- **Click Handling**: The entire component area is clickable unless `disabled` is `true`
- **Disabled State**: When `disabled` is `true`, click events are prevented and no `itemClick` events are emitted
- **Avatar Fallback**: If no `imageUrl` is provided, the avatar displays initials from `fullName` or falls back to the `title`
- **Arrow Display**: The navigation arrow is shown by default but can be hidden with `showArrow: false`

## Import

```typescript
import { DsActionListItemComponent } from "@ds/action-list";
import type { DsActionListItemConfig, DsActionListItemAvatarConfig, DsActionListItemSupportingTextConfig } from "@ds/action-list";
```

## Styling

The component uses design system CSS classes for consistent styling:

- **Success variant**:
  - Text: `text-content-success`
  - Icon: `text-neutral-cool-500`
  - Badge: `bg-surface-success`
- **Danger variant**:
  - Text: `text-content-error`
  - Icon: `text-icon-error`
  - Badge: `bg-surface-notification-badge`
- **Default variant**:
  - Text: `text-gray-600`
  - Icon: `text-gray-500`
  - Badge: `bg-gray-500`

The component also uses:

- Container: `rounded-ds-xl border-4 border-stroke-black-04 p-ds-xl`
- Arrow container: `bg-pastels-purple-200`
- Text emphasis classes: `text-emphasis-high`, `text-emphasis-mid`

## Examples from Design

The component matches the design requirements with:

- "Pending" as upper supporting text using `text-emphasis-mid`
- "Add Name" as the main title using `content-md-high-emphasis`
- Checkmark icon with "Completed 9" as supporting text in success variant
- Navigation arrow in a purple container background
- Avatar support with initials fallback
- Responsive design with proper spacing and truncation
