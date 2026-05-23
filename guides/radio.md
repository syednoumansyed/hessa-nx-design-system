# Using IonRadio with Hessa Styles

This guide shows you how to use `ion-radio` with Hessa Design system styling

## Basic Usage

1. Import `IonRadio` Component and `HesRadioDirective` Directive

   ```typescript
   import { IonRadio } from "@ionic/angular/standalone";
   import { HesRadioDirective } from "@components/hes-radio.directive";
   ```

2. Add it to your component import array

   ```typescript
   @Component({
     standalone: true,
     imports: [IonRadio, HesRadioDirective],
   })
   export class YourComponent {}
   ```

3. Use the `ion-radio` component in your template. Add the `appHesRadio` attribute to apply the custom styles

   ```html
   <ion-radio appHesRadio value="option1"></ion-radio>
   ```

Replace 'option1' with your actual radio button value.

## Specifying Size

The `HesRadioDirective` provides an input named `HesSize` that you can use to specify the size of the `ion-radio` component.

Here's how you can use it:

```html
<ion-radio appHesRadio [HesSize]="'sm'" value="option1"></ion-radio>
```

In this example, the size of the ion-radio component is set to 'sm'. You can pass the following supported sizes

- `md` (Default)
- `sm`
