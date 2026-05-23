import { Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IconDefinition,
  faPlus,
  faSearch,
} from '@fortawesome/pro-regular-svg-icons';
import { IonSelect, IonSelectOption } from '@ionic/angular/standalone';
import { TranslocoDirective } from '@jsverse/transloco';
import { RbacDirective } from '@shared/role-bace-acces-controller/rbac.directive';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { HessaInputComponent } from '@ui-kit/hessa-input/hessa-input.component';
import { OnInit } from '@angular/core';

@Component({
  selector: 'app-document-control-panel',
  templateUrl: './document-control-panel.component.html',
  standalone: true,
  imports: [
    RouterLink,
    TranslocoDirective,
    HesButtonModule,
    HessaInputComponent,
    IonSelect,
    IonSelectOption,
    ReactiveFormsModule,
    RbacDirective,
  ],
})
export class DocumentControlPanelComponent implements OnInit {
  @Input() languageCtrl!: FormControl<string | null>;
  @Input() searchCtrl!: FormControl<string | null>;
  @Input() addNewDocumentPermission!: number;
  @Input() routerLinkPath!: string[];
  @Input() addDocButtonText: string;

  iconPrefix: IconDefinition = faSearch;
  faPlus = faPlus;

  constructor() {}

  ngOnInit() {}
}
