import { inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { SupportCustomFieldDTO } from './support-custom-field.dto';
import { SupportCustomField } from './support-custom-field.interface';

export function createSupportCustomFieldDtoTransform() {
  const transloco = inject(TranslocoService);
  const isArabic = () => transloco.getActiveLang() === 'ar';

  return {
    customField(dto: SupportCustomFieldDTO): SupportCustomField {
      return {
        id: dto.id,
        labelDisplayName: isArabic() ? dto.arLabel : dto.enLabel,
        descriptionDisplayName: isArabic()
          ? dto.arDescription
          : dto.enDescription,
        isRequired: dto.required,
        arLabel: dto.arLabel,
        enLabel: dto.enLabel,
        arDescription: dto.arDescription,
        enDescription: dto.enDescription,
      };
    },

    customFields(dtos: SupportCustomFieldDTO[]): SupportCustomField[] {
      return dtos.map((dto) => this.customField(dto));
    },
  };
}
