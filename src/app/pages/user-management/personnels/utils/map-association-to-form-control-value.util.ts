import { AssociatePersonnelData } from '@shared/dto-transformation';
import { SchoolStructureControlValue } from '@ui-kit/hes-school-structure-control/school-structure-control-item.interface';

export function mapAssociationToFormControlValue(data: AssociatePersonnelData) {
  const result: SchoolStructureControlValue[] = [];
  const { schools, companies, campuses } = data || {};

  const pushToResult = (
    array: any[],
    type: SchoolStructureControlValue['type'],
  ) => {
    array?.forEach((item) => {
      result.push({
        id: item.id,
        type: type == 'company' && !!item.parentId ? 'sub-company' : type,
      });
    });
  };

  pushToResult(schools, 'school');
  pushToResult(campuses, 'campus');
  pushToResult(companies, 'company');
  return result;
}
