import { Component, HostBinding } from '@angular/core';
import { INoRowsOverlayAngularComp } from 'ag-grid-angular';
import { INoRowsOverlayParams } from 'ag-grid-community';
import { IonImg } from '@ionic/angular/standalone';
import { INoRowsOverlay } from '../model';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';

@Component({
  standalone: true,
  imports: [IonImg, HesButtonModule],
  template: ` <div
    class="pointer-events-auto flex h-full w-full items-center justify-center overflow-y-scroll bg-white"
    role="presentation"
  >
    <div
      class="flex max-w-full shrink-0 flex-col items-center justify-center gap-4 pb-8 pt-8"
    >
      @if (params.imgSrc) {
        <ion-img
          [src]="params.imgSrc"
          alt="nx logo"
          class="h-[18rem] w-[24.5rem]"
          widt
        ></ion-img>
      }
      @if (params.title || params.subTitle) {
        <div class="flex flex-col items-center justify-center">
          <div
            class="mb-4 mt-4 self-stretch whitespace-pre-line text-center text-xl font-semibold text-gray-900 md:text-2xl"
          >
            {{ params.title }}
          </div>
          <div
            class="text-md text- mb-2 self-stretch whitespace-pre-line text-center text-sm font-normal text-gray-500 md:text-base"
          >
            {{ params.subTitle || '' }}
          </div>
        </div>
      }
      @if (params.btnText && params.btnClick) {
        <ion-button
          class="min-w-56"
          hesSize="xl"
          (click)="params.btnClick()"
          hesBtn
          >{{ params.btnText }}</ion-button
        >
      }
    </div>
  </div>`,
})
export class CustomNoRowsOverlayComponent implements INoRowsOverlayAngularComp {
  public params!: INoRowsOverlayParams & INoRowsOverlay;

  agInit(params: INoRowsOverlayParams & INoRowsOverlay): void {
    this.params = params;
  }

  @HostBinding('class')
  get elementClasses() {
    return 'w-full h-full';
  }
}
