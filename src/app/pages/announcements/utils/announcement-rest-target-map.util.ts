import { SchoolStructureEntityType } from '@ui-kit/hes-school-structure-control/school-structure-control-item.interface';
import { SchoolSctructureEntity } from '../data-access/post.interface';

export function getAnnouncementRestTarget(
  targetSchool: Array<{
    id: number;
    type: SchoolStructureEntityType;
  }>,
): SchoolSctructureEntity[] {
  if (Array.isArray(targetSchool)) {
    return targetSchool.map((item) => ({
      entityId: item.id,
      type: item.type === 'sub-company' ? 'company' : item.type,
    }));
  }
  return [];
}
