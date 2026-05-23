import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { IQuestionFormControlConfig } from '@pages/course-management/components/question-form-control-generator/question-form-control-generator.component';
import {
  AddExamPayloadDTO,
  ExamData,
} from '@pages/course-management/data-access/cms-exam.dto';
import { QuestionDto } from '@pages/course-management/data-access/lms-exam.dto';
import { IResponse } from '@shared/interfaces';
import { ObjId } from '@shared/interfaces/common.interface';
import { ApiUrl } from '@shared/utils/api-url.util';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CMSExamService {
  private readonly _examQuestions = signal<IQuestionFormControlConfig[]>([]);
  examQuestions = this._examQuestions.asReadonly();
  private readonly _examDetails = signal<ExamData | null>(null);
  public examDetails = this._examDetails.asReadonly();

  constructor(private http: HttpClient) {}

  addExam(payload: AddExamPayloadDTO): Observable<IResponse<ExamData>> {
    return this.http.post<IResponse<ExamData>>(
      `${ApiUrl.v1BE}/courses/cms/exams`,
      payload,
    );
  }

  updateExam(
    id: number,
    payload: AddExamPayloadDTO,
  ): Observable<IResponse<ExamData>> {
    return this.http.put<IResponse<ExamData>>(
      `${ApiUrl.v1BE}/courses/cms/exams/${id}`,
      payload,
    );
  }

  deleteExam(id: number, withSubmission: boolean = false): Observable<any> {
    return this.http.delete(
      `${ApiUrl.v1BE}/courses/cms/exams/${id}${withSubmission ? '/submissions' : ''}`,
    );
  }

  getExam(courseId: ObjId): Observable<IResponse<ExamData>> {
    return this.http
      .get<IResponse<ExamData>>(`${ApiUrl.v1BE}/courses/cms/exams/${courseId}`)
      .pipe(
        map((response) => {
          return response;
        }),
      );
  }

  mapAllQuestions(questions: QuestionDto[], isResultView: boolean) {
    const questionControls = questions.map((question, index) => {
      return {
        id: question.id,
        questionType: question.type,
        question: question.text,
        isExam: true,
        totalQuestions: questions.length,
        order: index + 1,
        submittedAnswer: question.answer?.questionOptionId,
        formControlName: `question_${question.id}`, // Example: dynamic formControlName based on question id
        showCorrectAnswer: true,
        attachment: question.attachments?.[0],
        modelEssayAnswer: question.modelAnswer,
        showSubmission: true,
        options: question.options
          ? question.options.map((option) => {
              return {
                id: option.questionId,
                displayedValue: option.text,
                value: option.id,
                correctAnswer: option.isCorrect,
              };
            })
          : [],
      };
    });
    this._examQuestions.set(questionControls);
  }

  updateExamDetails(examDetails: ExamData) {
    this._examDetails.set(examDetails);
  }

  publishExam(examId: number): Observable<any> {
    return this.http.put(`${ApiUrl.v1BE}/courses/cms/exams/${examId}/publish`, {
      publish: true,
    });
  }
}
