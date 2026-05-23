import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';
import { TranslocoDirective } from '@jsverse/transloco';
import { StudentReportCardService } from '@pages/report-card/view/data-access/student-report-card.service';
import { StudentSelectionScopeService } from '@core/student-selection-scope.service';
import { AvatarComponent } from '@ds/avatar/avatar.component';
import {
  ReportCardStudentRecord,
  StudentReportCardEntry,
} from '@pages/report-card/view/data-access/student-report-card.interface';
import { StudentsService } from '@pages/user-management/students/students.service';
import { ObjId } from '@shared/interfaces/common.interface';
import { NoDataCardComponent } from '@shared/components/no-data-card/no-data-card.component';
import { ReportCardProcessingAPIService } from '@pages/report-card/processing/data-access/report-card-processing.api-service';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { ActivatedRoute } from '@angular/router';
import { UserProfileColors } from '@shared/enums';

type StudentReportCardItem = ReportCardStudentRecord & { title: string };

interface StudentDisplayInfo {
  id: number;
  dateOfBirth: string;
  pioneerId: string | null;
  registrationDate: string;
  userId: number;
  displayFullName: string;
  phoneNumber: string;
  nationalId: string;
  countryCode: string;
  gender: string;
  profileColor?: UserProfileColors;
  level: string;
  className: string;
}

@Component({
  selector: 'app-students-report-card',
  templateUrl: './students-report-card.page.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    AvatarComponent,
    TranslocoDirective,
    NoDataCardComponent,
  ],
})
export class StudentsReportCardPage implements OnInit {
  private readonly studentSelectionScopeService = inject(
    StudentSelectionScopeService,
  );
  private readonly reportCardService = inject(StudentReportCardService);
  private readonly reportCardProcessingAPIService = inject(
    ReportCardProcessingAPIService,
  );
  private readonly toaster = inject(HesToasterService);
  private readonly translate = inject(HesTranslateService);
  private studentService = inject(StudentsService);
  private route = inject(ActivatedRoute);

  student = signal<StudentDisplayInfo | null>(null);
  reportCards = signal<StudentReportCardItem[]>([]);

  constructor() {
    effect(() => {
      const id = this.studentSelectionScopeService.selectedStudent()?.id;
      if (id != null) this.getStudentReportCards(id);
    });
  }

  ngOnInit() {}

  getStudentReportCards(id: number) {
    this.reportCardService.getStudentReportCards(id).subscribe({
      next: (res) => {
        this.mapFields(res.data ?? []);
      },
      error: (err) => {
        console.error(err);
        this.reportCards.set([]);
        this.getStudentDetails(id);
      },
    });
  }

  mapFields(reportCardData: StudentReportCardEntry[]) {
    if (!reportCardData.length) {
      this.reportCards.set([]);
      return;
    }

    const firstEntry = reportCardData[0];
    const student: StudentDisplayInfo = {
      id: firstEntry.student.id,
      dateOfBirth: firstEntry.student.dateOfBirth,
      pioneerId: firstEntry.student.pioneerId,
      registrationDate: firstEntry.student.registrationDate,
      userId: firstEntry.student.userId,
      displayFullName: firstEntry.student.displayFullName,
      phoneNumber: firstEntry.student.phoneNumber,
      nationalId: firstEntry.student.nationalId,
      countryCode: firstEntry.student.countryCode,
      gender: String(firstEntry.student.gender),
      profileColor: firstEntry.student.profileColor as UserProfileColors,
      level: firstEntry.level.displayName,
      className: firstEntry.class.displayName,
    };
    this.student.set(student);

    const cards = reportCardData.map((card) => ({
      ...card.reportCardStudent,
      title: card.reportCard.title,
    }));
    this.reportCards.set(cards);
  }

  openPDF(card: StudentReportCardItem) {
    if (card.url) window.open(card.url, '_blank');
  }

  private getStudentDetails(id: ObjId) {
    this.studentService.getStudent(id).subscribe({
      next: (res) => {
        // set student details
        const student: StudentDisplayInfo = {
          id: res.id,
          dateOfBirth: res.dateOfBirth,
          pioneerId: res.pioneerId,
          registrationDate: res.registrationDate,
          userId: res.userId,
          displayFullName: res.displayName,
          phoneNumber: res.phoneNumber ?? '',
          nationalId: res.nationalId,
          countryCode: res.countryCode ?? '',
          gender: res.gender,
          profileColor: res.profileColor as UserProfileColors,
          level: res.level ? res.level.displayName : '',
          className: res.class ? res.class.displayName : '',
        };
        this.student.set(student);
      },
    });
  }
}
