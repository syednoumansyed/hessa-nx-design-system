import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AuthService } from '@auth/auth.service';
import { IResponse } from '@shared/interfaces';
import { ObjId } from '@shared/interfaces/common.interface';
import { ApiUrl } from '@shared/utils/api-url.util';

@Injectable()
export class ChatTagsManagmentService {
  // #region private properties
  // #endregion

  // #region injection
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  // #endregion

  // #region public methods

  generateTags(params: GenerateTagsParam) {
    return this.http.get<generateTagsResponse>(`${ApiUrl.v1BE}/chats/tags`, {
      params,
    });
  }

  // #endregion
}

// #region internal
type generateTagsResponse = IResponse<string[]>;
type GenerateTagsParam = {
  conversationType: 'USER' | 'GROUP';
  academicYearId: ObjId;
  senderChatId: ObjId;
  receiverChatId: ObjId;
  classId?: ObjId;
};

// #endregion
