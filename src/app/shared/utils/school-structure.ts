import { sideMenuSchoolStructureItem } from '@layout/layout.component';
import {
  Campus,
  Company,
  School,
  Level,
  Class,
} from '@shared/dto-transformation/organization';
import { SchoolStructureEntityType } from '@ui-kit/hes-school-structure-control/school-structure-control-item.interface';

export enum StructureDepth {
  COMPANY,
  SUBCOMPANY,
  CAMPUS,
  SCHOOL,
  LEVEL,
  CLASS,
}

export const mapCompaniesWithChildren = (
  companies: Company[],
  depth: StructureDepth = StructureDepth.SCHOOL,
): sideMenuSchoolStructureItem[] => {
  const mappedCompanies: sideMenuSchoolStructureItem[] = [];
  companies.forEach((company) => {
    const companyItem: sideMenuSchoolStructureItem = mapCompanyWithChildren(
      company,
      depth,
    );
    mappedCompanies.push(companyItem);
  });
  return mappedCompanies;
};

export const mapCompanyWithChildren = (
  company: Company,
  depth: StructureDepth,
) => {
  const companyItem: sideMenuSchoolStructureItem =
    mapCompanyWithoutChildren(company);
  if (company.subCompanies?.length > 0) {
    companyItem.children.push(
      ...mapCompaniesWithChildren(company.subCompanies, depth),
    );
  }
  if (company.campuses?.length > 0) {
    company.campuses.forEach((campus) => {
      const campusItem: sideMenuSchoolStructureItem = mapCampusWithChildren(
        campus,
        company,
        depth,
      );
      companyItem.children.push(campusItem);
    });
  }
  return companyItem;
};

const mapCompanyWithoutChildren = (
  company: Company,
): sideMenuSchoolStructureItem => {
  const isSubCompany = company.parentId !== null;
  return {
    id: company.id,
    name: company.displayName,
    path: `school-structure/${isSubCompany ? 'sub-company' : 'company'}/${company.id}`,
    icon: isSubCompany ? 'sub-company-duotone' : 'company-duotone',
    hesIcon: {
      src: `assets/icons/${isSubCompany ? 'sub-company-duotone' : 'company-duotone'}.svg`,
      class: 'text-2xl',
    },
    hasAccess: company.hasAccess,
    type: isSubCompany ? 'sub-company' : 'company',
    depth: isSubCompany ? StructureDepth.SUBCOMPANY : StructureDepth.COMPANY,
    parentId: isSubCompany ? company.parentId : null,
    children: [],
  };
};

export const mapCampusWithChildren = (
  campus: Campus,
  company: Company,
  depth: StructureDepth,
): sideMenuSchoolStructureItem => {
  const campusItem: sideMenuSchoolStructureItem = mapCampusWithoutChildren(
    campus,
    company,
  );
  if (campus.schools?.length > 0) {
    campus.schools.forEach((school) => {
      const schoolItem: sideMenuSchoolStructureItem = mapSchoolWithChildren(
        school,
        campus,
        depth,
      );
      campusItem.children.push(schoolItem);
    });
  }
  return campusItem;
};

const mapSchoolWithChildren = (
  school: School,
  campus: Campus | null,
  depth: StructureDepth,
): sideMenuSchoolStructureItem => {
  const schoolItem: sideMenuSchoolStructureItem = mapSchoolWithoutChildren(
    school,
    campus,
  );
  if (school.schoolLevels?.length && depth >= StructureDepth.LEVEL) {
    school.schoolLevels.forEach((level) => {
      const levelItem: sideMenuSchoolStructureItem = mapLevelWithChildren(
        level,
        school,
        depth,
      );
      schoolItem.children.push(levelItem);
    });
  }
  return schoolItem;
};

const mapLevelWithChildren = (
  level: Level,
  school: School | null,
  depth: StructureDepth,
): sideMenuSchoolStructureItem => {
  const levelItem: sideMenuSchoolStructureItem = mapLevelWithoutChildren(
    level,
    school,
  );
  if (level.classes?.length && depth > StructureDepth.LEVEL) {
    level.classes.forEach((classData) => {
      const classItem: sideMenuSchoolStructureItem = mapClassWithoutChildren(
        classData,
        level,
      );
      levelItem.children.push(classItem);
    });
  }
  return levelItem;
};

const mapCampusWithoutChildren = (
  campus: Campus,
  company: Company,
): sideMenuSchoolStructureItem => {
  return {
    id: campus.id,
    name: campus.displayName,
    path: `school-structure/campus/${campus.id}`,
    icon: 'campus-duotone',
    hesIcon: {
      src: 'assets/icons/campus-duotone.svg',
      class: 'text-2xl',
    },
    hasAccess: campus.hasAccess,
    type: 'campus',
    depth: StructureDepth.CAMPUS,
    parentId: company.id,
    children: [],
  };
};

const mapLevelWithoutChildren = (
  level: Level,
  school: School | null,
): sideMenuSchoolStructureItem => {
  if (level.schoolLevelId == null) {
    throw new Error('Expected level.schoolLevelId to be non-null');
  }
  return {
    id: level.id,
    schoolLevelId: level.schoolLevelId,
    name: level.displayName,
    path: `school-structure/school/${school?.id}/level/${level.id}`,
    icon: 'level-duotone',
    hesIcon: {
      src: 'assets/icons/level-duotone.svg',
      class: 'text-2xl',
    },
    hasAccess: true,
    type: 'level',
    depth: StructureDepth.LEVEL,
    parentId: school?.id ?? null,
    children: [],
  };
};

export const mapClassWithoutChildren = (
  classDetail: Class,
  level: Level,
): sideMenuSchoolStructureItem => {
  return {
    id: classDetail.id,
    name: classDetail.displayName,
    path: `school-structure/school/${level.schoolId}/level/${level.id}/class/${classDetail.id}`,
    icon: 'class-duotone',
    hesIcon: {
      src: 'assets/icons/class-duotone.svg',
      class: 'text-2xl',
    },
    hasAccess: classDetail.hasAccess,
    type: 'class',
    depth: StructureDepth.CLASS,
    parentId: classDetail?.id ?? null,
    children: [],
  };
};

const mapSchoolWithoutChildren = (
  school: School,
  campus: Campus | null,
): sideMenuSchoolStructureItem => {
  return {
    id: school.id,
    name: school.displayName,
    path: `school-structure/school/${school.id}`,
    hesIcon: {
      src: 'assets/icons/school-duotone.svg',
      class: 'text-2xl',
    },
    icon: 'school-duotone',
    hasAccess: school.hasAccess,
    type: 'school',
    depth: StructureDepth.SCHOOL,
    parentId: campus?.id ?? null,
    children: [],
  };
};

export const mergeChildren = (
  array: sideMenuSchoolStructureItem[],
  seStructureItemCallback?: (item: any) => void,
) => {
  const temp: { [key: string]: any } = {};
  array.forEach((item) => {
    if (seStructureItemCallback) seStructureItemCallback(item);
    if (!temp[item.id]) {
      // If this id is not in the temp object, add it
      temp[item.id] = { ...item, children: [] };
    }

    // Merge the children arrays
    temp[item.id].children = mergeChildren(
      [...temp[item.id].children, ...(item.children || [])],
      seStructureItemCallback,
    );
  });

  // Convert the temp object back to an array
  return sortEntities(Object.values(temp));
};

export function findItemWithParents(
  items: sideMenuSchoolStructureItem[],
  targetItem: sideMenuSchoolStructureItem,
  parents: sideMenuSchoolStructureItem[] = [],
): sideMenuSchoolStructureItem[] | null {
  for (const item of items) {
    if (item.path === targetItem.path) {
      return [...parents, item];
    }

    if (item.children) {
      const found = findItemWithParents(item.children, targetItem, [
        ...parents,
        item,
      ]);
      if (found) {
        return found;
      }
    }
  }

  return null;
}

export function findAllSchools(
  items: sideMenuSchoolStructureItem[],
): sideMenuSchoolStructureItem[] {
  let schools: sideMenuSchoolStructureItem[] = [];

  items.forEach((item) => {
    if (item.type === 'school') {
      schools.push(item);
    }

    if (item.children) {
      schools = schools.concat(findAllSchools(item.children));
    }
  });

  return schools;
}

export function findAllCampuses(
  items: sideMenuSchoolStructureItem[],
): sideMenuSchoolStructureItem[] {
  let schools: sideMenuSchoolStructureItem[] = [];

  items.forEach((item) => {
    if (item.type === 'campus') {
      schools.push(item);
    }

    if (item.children) {
      schools = schools.concat(findAllCampuses(item.children));
    }
  });

  return schools;
}

export function findAllCompanies(
  items: sideMenuSchoolStructureItem[],
): sideMenuSchoolStructureItem[] {
  let schools: sideMenuSchoolStructureItem[] = [];

  items.forEach((item) => {
    if (item.type === 'company' || item.type === 'sub-company') {
      schools.push(item);
    }

    if (item.children) {
      schools = schools.concat(findAllCompanies(item.children));
    }
  });

  return schools;
}

export function findAllCompaniesWithCampuses(
  items: sideMenuSchoolStructureItem[],
): sideMenuSchoolStructureItem[] {
  let schools: sideMenuSchoolStructureItem[] = [];

  items.forEach((item) => {
    if (
      (item.type === 'company' || item.type === 'sub-company') &&
      item.children?.length &&
      item.children?.[0]?.type === 'campus'
    ) {
      schools.push(item);
    }

    if (item.children) {
      schools = schools.concat(findAllCompaniesWithCampuses(item.children));
    }
  });

  return schools;
}

export function findAllEntitiesWithType(
  items: sideMenuSchoolStructureItem[],
  type: SchoolStructureEntityType,
): sideMenuSchoolStructureItem[] {
  let schools: sideMenuSchoolStructureItem[] = [];

  items.forEach((item) => {
    if (item.type === type) {
      schools.push(item);
    }

    if (item.children) {
      schools = schools.concat(findAllEntitiesWithType(item.children, type));
    }
  });

  return schools;
}

export function sortEntities(array: sideMenuSchoolStructureItem[]) {
  const sortedArr = array
    .map((val) => {
      val.name = val.name?.trim();
      return val;
    })
    .sort((a, b) => a.name?.localeCompare(b.name));
  array.forEach((val) => {
    if (val?.children?.length > 1) {
      sortEntities(val.children);
    }
  });
  return sortedArr;
}

// TODO: refactor and remove this
export function findSchoolStructureEntity(
  array: sideMenuSchoolStructureItem[],
  type: SchoolStructureEntityType,
  id: number,
): sideMenuSchoolStructureItem | null {
  for (const item of array) {
    if (item.type === type && item.id === id) {
      return item;
    }
    if (item.children) {
      const found = findSchoolStructureEntity(item.children, type, id);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

/**
 * Retrieves the campus parent company based on the given scope and campus.
 * @param scope - The array of sideMenuSchoolStructureItem objects representing the scope.
 * @param campus - The sideMenuSchoolStructureItem object representing the campus.
 * @returns The campus parent company if found, otherwise null.
 */
export function getCampusCompany(
  scope: sideMenuSchoolStructureItem[],
  campus: sideMenuSchoolStructureItem,
) {
  return (
    findAllCompanies(scope).find((c) => {
      return c.id === campus.parentId;
    }) ?? null
  );
}

export function hasMultipleEntities(
  nodes: sideMenuSchoolStructureItem[],
  targetType: SchoolStructureEntityType,
): boolean {
  // If there are multiple root-level nodes, return true immediately
  if (nodes.length > 1) {
    return true;
  }
  for (const node of nodes) {
    // If the current node type matches the target type, stop checking further
    if (node.type === targetType) {
      return false;
    }

    // If any node has more than one child, return true (because there's branching)
    if (node.children.length > 1) {
      return true;
    }

    // If the node has exactly one child, recursively check that child
    if (node.children.length === 1) {
      if (hasMultipleEntities(node.children, targetType)) {
        return true;
      }
    }
  }

  // If no branching was found, return false
  return false;
}
