import {
  Component,
  OnInit,
  Input,
  signal,
  input,
  computed,
} from '@angular/core';
import {
  IonPopover,
  IonItem,
  IonList,
  IonActionSheet,
} from '@ionic/angular/standalone';
import { faEllipsisVertical } from '@fortawesome/pro-solid-svg-icons';
import { isMobile } from '@shared/utils/platform';
import { IAction } from './model';
import { randomId } from '@shared/utils/randomId';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';

@Component({
  selector: 'app-hes-action-sheet',
  templateUrl: './hes-action-sheet.component.html',
  styleUrls: ['./hes-action-sheet.component.scss'],
  standalone: true,
  imports: [
    IonPopover,
    HesButtonModule,
    IonItem,
    IonList,
    IonActionSheet,
    HesButtonModule,
  ],
})
export class HesActionSheetComponent implements OnInit {
  faEllipsisVertical = faEllipsisVertical;
  isMobile = isMobile();
  actionSheetButtons = computed(() => {
    return this.actions?.map((action) => {
      return {
        text: action.text,
        data: {
          action: action.text,
        },
        handler: () => {
          if (action.onClick) {
            action.onClick(this.data);
          }
          return;
        },
      };
    });
  });
  // actionSheetButtons: ActionSheetButton[];
  randomId: string = randomId();
  _actions = signal<IAction[]>([]);

  @Input({ required: true }) set actions(val: IAction[]) {
    const filterActions = val
      .filter((action) =>
        action && action.hasPermission ? action.hasPermission(this.data) : true,
      )
      .map((action) => {
        return {
          ...action,
          text:
            action.textFormatter && this.data
              ? action.textFormatter(this.data)
              : action.text,
        };
      });
    this._actions.set(filterActions);
  }

  get actions() {
    return this._actions();
  }

  @Input() data: any;

  forceActionSheet = input(false);

  constructor() {}

  ngOnInit() {}

  onClick(action: IAction) {
    if (action.onClick) {
      action.onClick(this.data);
    }
    return;
  }

  onMenuClick(event: MouseEvent) {
    event.stopPropagation();
  }
}
