import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import { TranslocoDirective } from '@jsverse/transloco';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { convertToAmPm, getDayName } from '../utils';
import { DayOfWeekPipe } from '@pages/course-management/pipes/day-of-week.pipe';
import { Time12hrPipe } from '@pages/course-management/pipes/time-12-hr.pipe';
import { ActivatedRoute, Router } from '@angular/router';
import { VcrAPIService } from '@pages/vcr/data-access/vcr.api-service';
import { VirtualClassroomDTO } from '@pages/vcr/data-access/vcr.dto';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { RbacDirective } from '@shared/role-bace-acces-controller/rbac.directive';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { saxExport3Outline } from '@ng-icons/iconsax/outline';
import { VirtualClassroom } from '@pages/vcr/data-access/vcr.interface';

@Component({
  selector: 'app-announcements',
  templateUrl: './view-virtual-classroom.page.html',
  standalone: true,
  providers: [VcrAPIService],
  viewProviders: [provideIcons({ saxExport3Outline })],
  imports: [
    HesButtonModule,
    IonContent,
    TranslocoDirective,
    RbacDirective,
    NgIcon,
    DayOfWeekPipe,
    Time12hrPipe,
  ],
})
export class ViewVirtualClassRoomPages implements OnInit {
  /**
   * The ID of the virtual classroom.
   * @type {string | null}
   */
  @Input() id: string | null = null;
  getName = getDayName;
  getAmPm = convertToAmPm;
  private readonly virtualClassroomService = inject(VcrAPIService);
  private readonly route = inject(ActivatedRoute);
  isLoading = signal(false);
  readonly updateVrcsPermissionId = RESOURCE_PERMISSION.VCR.UPDATE.UPDATE_VCR;
  _virtualClassroom = signal<VirtualClassroom | null>(null);
  constructor(private router: Router) {}

  ngOnInit() {
    this.getVirtualClassroom(+this.id!);
  }
  private getVirtualClassroom(id: number) {
    this.virtualClassroomService.getVirtualClassroomById(id).subscribe({
      next: (response) => {
        this._virtualClassroom.set(response.data[0]);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }
  onEdit() {
    this.router.navigate(['../' + this.id + '/update'], {
      relativeTo: this.route,
    });
  }
}
