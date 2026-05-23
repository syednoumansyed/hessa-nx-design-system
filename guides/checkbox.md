# Using IonCheckbox with Hessa Styles

This guide shows you how to use `ion-checkbox` with Hessa Design system styling

## Basic Usage

1. Import `IonRadio` Component and `HesRadioDirective` Directive

   ```typescript
   import { IonCheckbox } from "@ionic/angular/standalone";
   import { HesCheckboxDirective } from "@components/hes-checkbox.directive";
   ```

2. Add it to your component import array

   ```typescript
   @Component({
     standalone: true,
     imports: [IonCheckbox, HesCheckboxDirective],
   })
   export class YourComponent {}
   ```

3. Use the `ion-checkbox` component in your template. Add the `appHesCheckbox` attribute to apply the custom styles

   ```html
   <ion-checkbox appHesCheckbox>option 1</ion-checkbox>
   ```

Replace 'option1' with your actual checkbox value.

## Specifying Size

The `HesCheckboxDirective` provides an input named `HesSize` that you can use to specify the size of the `ion-radio` component.

Here's how you can use it:

```html
<ion-checkbox appHesCheckbox [HesSize]="'sm'">option1</ion-checkbox>
```

In this example, the size of the ion-checkbox component is set to 'sm'. You can pass the following supported sizes

- `md` (Default)
- `sm`
