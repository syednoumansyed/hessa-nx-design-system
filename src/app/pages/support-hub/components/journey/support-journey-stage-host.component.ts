import { CommonModule, NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import {
  SupportJourneyAttachmentsPromptStage,
  SupportJourneyIntroStage,
  SupportJourneyPromptStage,
  SupportJourneySelectionChangeEvent,
  SupportJourneySelectionOption,
  SupportJourneySelectionStage,
  SupportJourneyStage,
  SupportJourneySummaryStage,
} from '@pages/support-hub/data-access/journey/support-journey-stage.model';
import { DsIcon, DsIconComponent } from '@ds/icon/icon.component';
import { faHeadset, faPen } from '@fortawesome/pro-regular-svg-icons';
import { faShieldCheck } from '@fortawesome/pro-solid-svg-icons';
import { DsTranslatePipe } from '@ds/i18n/ds-translate.pipe';

@Component({
  selector: 'app-support-journey-stage-host',
  standalone: true,
  templateUrl: './support-journey-stage-host.component.html',
  imports: [CommonModule, NgClass, DsIconComponent, DsTranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupportJourneyStageHostComponent {
  readonly stage = input.required<SupportJourneyStage>();
  readonly showSupportAvatar = input<boolean>(false);

  readonly editStage = output<SupportJourneyStage>();
  readonly selectionChange = output<SupportJourneySelectionChangeEvent>();

  protected readonly supportAvatarIcon = faHeadset;
  protected readonly allowPrivateRequestIcon = faShieldCheck;
  protected readonly privateRequestBannerIcon = faShieldCheck;
  protected readonly editIcon = faPen;
  protected readonly unsupportedStageMessage =
    'This step is not yet available.';

  protected isExternalIcon(icon: DsIcon | null): icon is string {
    return typeof icon === 'string' && icon.startsWith('http');
  }

  protected readonly isReceiverStage = computed(
    () => this.stage().direction === 'receiver',
  );

  protected readonly shouldReserveSupportAvatarSpace = computed(() =>
    this.isReceiverStage(),
  );

  protected readonly shouldShowSupportAvatar = computed(
    () => this.isReceiverStage() && this.showSupportAvatar(),
  );

  protected readonly containerClasses = computed(() => {
    const stage = this.stage();
    return stage.direction === 'sender'
      ? ['items-end', 'self-end']
      : ['items-start', 'self-start'];
  });

  protected readonly bubbleClasses = computed(() => {
    const stage = this.stage();
    const classes = [
      'flex',
      'flex-col',
      'gap-ds-sm',
      'rounded-ds-xl',
      'border-[4px]',
      'border-stroke-black-08',
      'bg-surface-primary',
      'py-ds-md',
      'w-full',
      'max-w-[min(100%,_320px)]',
      'shadow-none',
    ];
    const receiverCornerClasses = [
      'ltr:rounded-bl-none',
      'rtl:rounded-br-none',
    ];
    const senderCornerClasses = ['ltr:rounded-br-none', 'rtl:rounded-bl-none'];

    classes.push(
      ...(stage.direction === 'receiver'
        ? receiverCornerClasses
        : senderCornerClasses),
    );

    if (stage.direction === 'sender' && stage.status === 'completed') {
      const replaceClass = (target: string, replacement: string) => {
        const index = classes.indexOf(target);
        if (index !== -1) {
          classes.splice(index, 1, replacement);
          return;
        }
        classes.push(replacement);
      };

      if (
        stage.kind === 'categorySelection' ||
        stage.kind === 'subcategorySelection'
      ) {
        replaceClass('bg-surface-primary', 'bg-surface-brand-subtle');
        replaceClass('border-stroke-black-08', 'border-stroke-black-04');
      } else {
        replaceClass('bg-surface-primary', 'bg-surface-secondary');
        replaceClass('border-stroke-black-08', 'border-stroke-black-04');
      }
    }

    return classes;
  });

  protected readonly messageRowClasses = computed(() => {
    return this.stage().direction === 'sender' ? ['justify-end'] : [];
  });

  protected readonly timestampClasses = computed(() => {
    return this.stage().direction === 'sender'
      ? ['self-end', 'text-right']
      : ['self-start', 'text-left'];
  });

  protected readonly introStage = computed(() => {
    const stage = this.stage();
    return stage.kind === 'intro' ? (stage as SupportJourneyIntroStage) : null;
  });

  protected readonly promptStage = computed(() => {
    const stage = this.stage();
    return stage.kind === 'categoryPrompt' || stage.kind === 'subcategoryPrompt'
      ? (stage as SupportJourneyPromptStage)
      : null;
  });

  protected readonly selectionStage = computed(() => {
    const stage = this.stage();
    return stage.kind === 'categorySelection' ||
      stage.kind === 'subcategorySelection'
      ? (stage as SupportJourneySelectionStage)
      : null;
  });

  protected readonly senderSelectionStage = computed(() => {
    const stage = this.stage();
    if (stage.direction !== 'sender' || stage.status !== 'completed') {
      return null;
    }

    return stage.kind === 'categorySelection' ||
      stage.kind === 'subcategorySelection'
      ? (stage as SupportJourneySelectionStage)
      : null;
  });

  protected readonly attachmentsStage = computed(() => {
    const stage = this.stage();
    return stage.kind === 'attachmentsPrompt'
      ? (stage as SupportJourneyAttachmentsPromptStage)
      : null;
  });

  protected readonly summaryStage = computed(() => {
    const stage = this.stage();
    return stage.kind === 'summary'
      ? (stage as SupportJourneySummaryStage)
      : null;
  });

  protected readonly hasPrivateRequestOption = computed(() => {
    const stage = this.selectionStage();
    if (!stage || stage.kind !== 'categorySelection') {
      return false;
    }

    if (stage.allowPrivateRequest) {
      return true;
    }

    return stage.options?.some((option) => option.allowPrivateRequest) ?? false;
  });

  protected readonly shouldShowPrivateRequestHint = computed(() => {
    const stage = this.selectionStage();
    if (!stage || stage.kind !== 'categorySelection') {
      return false;
    }

    return stage.status !== 'completed' && this.hasPrivateRequestOption();
  });

  protected onSelectionEdit(stage: SupportJourneySelectionStage): void {
    this.editStage.emit(stage);
  }

  protected onSelectionOptionSelected(
    stage: SupportJourneySelectionStage,
    option: SupportJourneySelectionOption,
  ): void {
    this.selectionChange.emit({ stage, option });
  }
}
