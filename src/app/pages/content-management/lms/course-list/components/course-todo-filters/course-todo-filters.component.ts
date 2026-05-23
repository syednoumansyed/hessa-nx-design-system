import { CommonModule } from '@angular/common';
import { Component, inject, output, signal } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { TopicTodoFilter } from '@shared/enums';
import { HesTranslateService } from '@shared/services/hes-translate.service';

@Component({
  selector: 'app-course-todo-filters',
  standalone: true,
  templateUrl: './course-todo-filters.component.html',
  imports: [TranslocoDirective, CommonModule],
})
export class CourseTodoFiltersComponent {
  private readonly hesTranslateService = inject(HesTranslateService);
  selectedFilter = output<TopicTodoFilter | undefined>();
  topicTodoFilter = TopicTodoFilter;

  filterData = signal([
    {
      id: TopicTodoFilter.CRITICAL,
      label: this.hesTranslateService.t('status.critical'),
      selected: false,
    },
    {
      id: TopicTodoFilter.THIS_WEEK,
      label: this.hesTranslateService.t('status.this_week.txt'),
      selected: false,
    },
    {
      id: TopicTodoFilter.UPCOMING,
      label: this.hesTranslateService.t('status.upcoming_week.txt'),
      selected: false,
    },
    {
      id: TopicTodoFilter.MISSED,
      label: this.hesTranslateService.t('status.missed.txt'),
      selected: false,
    },
  ]);

  onFilterSelected(filterId: TopicTodoFilter) {
    this.filterData.update((filters) =>
      filters.map((filter) => ({
        ...filter,
        selected: filter.id === filterId ? !filter.selected : false,
      })),
    );

    const selectedFilterItem = this.filterData().find(
      (filter) => filter.selected,
    );
    this.selectedFilter.emit(selectedFilterItem?.id);
  }
}
