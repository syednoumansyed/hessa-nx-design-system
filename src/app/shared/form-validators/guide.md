# Form Validators Utility Usage Guide

This guide will help you understand how to use the utilities found in the `form-validators` folder.

## Getting Started

First, you need to import the validators from the `form-validators` folder. Here's how you can do it:

```typescript
import { getNationalIdErrorMessage, nationalIdMax10Validator } from "@validators/nationalID";
```

## Using nationalIdMax10Validator

The nationalIdMax10Validator is used to validate that a form control's value is a valid National ID.

Here's an example of how to use it:

```typescript
nationalIdFormControl = new FormControl("", [Validators.required, nationalIdMax10Validator]);
```

In this example, the nationalIdMax10Validator will validate the national ID field's value.

Remember to call these validators in the correct context and handle the validation results appropriately in your forms.

### getting Error messages

in you component class, subscribe to the form control

```typescript
nationalIdFormControlErr = signal<string | null>(null);

this.nationalIdFormControl.statusChanges.pipe(takeUntil(this.destroy$)).subscribe((status) => {
  console.log(`nationalIdFormControl status changed: ${status}`);
  this.nationalIdFormControlErr.set(getNationalIdErrorMessage(this.nationalIdFormControl, this.translocoService));
});
```

in your template pass the error signal to he-input errorText input.

```html
<app-hes-input [label]="'nationalID'" [required]="true" fill="solid" [formControl]="nationalIdFormControl" [errorText]="nationalIdFormControlErr() ?? undefined"></app-hes-input>
```
