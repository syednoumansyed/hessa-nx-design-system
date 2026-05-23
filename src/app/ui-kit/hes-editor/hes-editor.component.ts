import {
  Component,
  INJECTOR,
  Inject,
  Injector,
  InputSignal,
  OnInit,
  Signal,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  model,
} from '@angular/core';
import { AsyncPipe } from '@angular/common';
import {
  AbstractControl,
  ControlValueAccessor,
  FormControl,
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { IonLabel } from '@ionic/angular/standalone';
import {
  TUI_EDITOR_DEFAULT_EDITOR_TOOLS,
  TUI_EDITOR_DEFAULT_EXTENSIONS,
  TUI_EDITOR_EXTENSIONS,
  TUI_IMAGE_LOADER,
  TuiEditorModule,
  TuiEditorTool,
  tuiEditorOptionsProvider,
  TuiEditorSocketModule,
} from '@tinkoff/tui-editor';
import { DOMPURIFY_CONFIG, NgDompurifySanitizer } from '@tinkoff/ng-dompurify';
import {
  TUI_SANITIZER,
  TuiLoaderModule,
  TuiErrorModule,
  TuiSvgModule,
} from '@taiga-ui/core';
import { imageLoader } from './editor-image-loader';
import { EditorImageUploadService } from './editor-image-upload.service';
import { HesIconComponent } from '../../shared/components/hes-icon/hes-icon.component';
import { faPen } from '@fortawesome/pro-light-svg-icons';
import { TUI_VALIDATION_ERRORS, TuiFieldErrorPipeModule } from '@taiga-ui/kit';
import { TranslocoService } from '@jsverse/transloco';
import { ExampleTuiYoutubeToolModule } from './youtube-tool/youtube-tool.module';
import { DomSanitizer } from '@angular/platform-browser';

export function maxContenLengthValidator(
  maxLength: InputSignal<number | undefined>,
  errMsg: Signal<string | undefined>,
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (maxLength() === undefined) return null;
    const isValid =
      control.value && stripHtmlTags(control.value).length <= maxLength()!;
    return isValid
      ? null
      : {
          maxLength: errMsg(),
        };
  };
}

function stripHtmlTags(input: string): string {
  return input.replace(/<\/?[^>]+(>|$)/g, '');
}

@Component({
  selector: 'app-hes-editor',
  templateUrl: './hes-editor.component.html',
  styleUrls: ['./hes-editor.component.scss'],
  standalone: true,
  imports: [
    IonLabel,
    FormsModule,
    ReactiveFormsModule,
    TuiEditorModule,
    TuiEditorSocketModule,
    TuiLoaderModule,
    TuiSvgModule,
    HesIconComponent,
    TuiFieldErrorPipeModule,
    TuiErrorModule,
    AsyncPipe,
    ExampleTuiYoutubeToolModule,
  ],

  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => HesEditorComponent),
      multi: true,
    },
    { provide: TUI_SANITIZER, useClass: NgDompurifySanitizer },
    {
      provide: DOMPURIFY_CONFIG,
      useValue: {
        ADD_TAGS: ['iframe'],
        KEEP_CONTENT: true,
      },
    },
    {
      provide: TUI_EDITOR_EXTENSIONS,
      deps: [INJECTOR],
      useFactory: (injector: Injector) => [
        ...TUI_EDITOR_DEFAULT_EXTENSIONS,
        import('@tinkoff/tui-editor/extensions/image-editor').then(
          ({ tuiCreateImageEditorExtension }) =>
            tuiCreateImageEditorExtension({ injector }),
        ),
        import('@tiptap/extension-image').then(({ default: Image }) =>
          Image.configure({ inline: true, allowBase64: true }),
        ),
        import('@tinkoff/tui-editor/extensions/youtube').then(
          ({ Youtube }) => Youtube,
        ),
      ],
    },
    {
      provide: TUI_IMAGE_LOADER,
      useFactory: imageLoader,
      deps: [EditorImageUploadService],
    },
    tuiEditorOptionsProvider({
      appearance: 'hes-editor',
    }),
    {
      provide: TUI_VALIDATION_ERRORS,
      useValue: {},
    },
  ],
})
export class HesEditorComponent implements OnInit, ControlValueAccessor {
  private readonly transloco = inject(TranslocoService);
  faPen = faPen;
  placeholder = input<string>();
  label = input<string>();
  uploadImageUrl = input<string>();
  allowImgUpload = input<boolean>(true);
  allowYoutubeExtension = input<boolean>(true);
  isEditabeControl = input(false);
  isEditable = model<boolean>(false);
  previewOnly = model<boolean>(false);
  preview = model<boolean>(false);
  required = input<boolean>();
  maxLength = input<number>();
  uploadAsNonBinary = input<boolean>(false);

  maxLengthErrMsg = computed<string>(() => {
    return this.transloco.translate('global.validation.max_length', {
      chars: this.maxLength(),
      label: this.label()?.toLocaleLowerCase(),
    });
  });

  readonly control = new FormControl('', [
    maxContenLengthValidator(this.maxLength, this.maxLengthErrMsg),
  ]);
  readonly tools: TuiEditorTool[] = TUI_EDITOR_DEFAULT_EDITOR_TOOLS;
  readonly textOnlyTools: TuiEditorTool[] = [
    TuiEditorTool.Align,
    TuiEditorTool.Bold,
    TuiEditorTool.Clear,
    TuiEditorTool.Code,
    TuiEditorTool.Color,
    TuiEditorTool.Details,
    TuiEditorTool.Group,
    TuiEditorTool.HR,
    TuiEditorTool.Hilite,
    TuiEditorTool.Italic,
    TuiEditorTool.Link,
    TuiEditorTool.List,
    TuiEditorTool.MergeCells,
    TuiEditorTool.Quote,
    TuiEditorTool.RowsColumnsManaging,
    TuiEditorTool.Size,
    TuiEditorTool.SplitCells,
    TuiEditorTool.Strikethrough,
    TuiEditorTool.Sub,
    TuiEditorTool.Sup,
    TuiEditorTool.Table,
    TuiEditorTool.Tex,
    TuiEditorTool.Underline,
    TuiEditorTool.Undo,
  ];

  private onChange: (value: any) => void;
  private onTouched: () => void;

  readonly imageUploadService = inject(EditorImageUploadService);

  constructor(@Inject(DomSanitizer) private readonly sanitizer: DomSanitizer) {
    effect(() => {
      if (this.isEditabeControl() && !this.isEditable()) {
        this.control.disable();
      } else {
        this.control.enable();
      }
    });
  }

  ngOnInit() {
    this.control.valueChanges.subscribe((value) => {
      const isEmpty = stripHtmlTags(value || '').trimStart().length <= 0;
      if (isEmpty) {
        this.control.patchValue('', { emitEvent: false });
      }
      if (this.onChange) {
        this.onChange(isEmpty ? '' : value);
        this.onTouched();
      }
    });
    const imageUrl = this.uploadImageUrl();
    if (imageUrl) {
      this.imageUploadService.uploadUrl = imageUrl;
    }
    if (this.uploadAsNonBinary()) {
      this.imageUploadService.setUploadAsNonBinary();
    } else {
      this.imageUploadService.setUploadAsBinary();
    }
  }

  writeValue(value: any): void {
    this.control.setValue(value, { emitEvent: false });
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    if (isDisabled) {
      this.control.disable();
    } else {
      this.control.enable();
    }
  }

  toggleIsEditable() {
    this.isEditable.update((v) => !v);
  }
}
