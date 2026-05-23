import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ReactionData, ReactionType } from '@ds/react/types/react.types';
import {
  ReactionAddResponse,
  ReactionRemoveResponse,
  ReactionToggleResponse,
} from '@shared/types/react.dto';
import { ApiUrl } from '@shared/utils/api-url.util';
import { updateReactionLocally } from '@shared/utils/reaction.utils';

@Injectable({
  providedIn: 'root',
})
export class ReactionService {
  constructor(private http: HttpClient) {}

  // Handle inconsistent targetId types from backend
  private normalizeTargetId(targetId: string | number): string {
    return targetId.toString();
  }

  revertReaction(
    reactions: ReactionData[],
    reactionType: ReactionType,
    wasAdding: boolean,
  ): ReactionData[] {
    return updateReactionLocally(reactions, reactionType, !wasAdding);
  }

  addReaction(
    targetId: string,
    targetType: string,
    reactionType: ReactionType,
  ): Observable<ReactionAddResponse> {
    const body = { targetId, targetType, reactionType };
    return this.http.post<ReactionAddResponse>(
      `${ApiUrl.v2BE}/reactions`,
      body,
    );
  }

  removeReaction(
    targetId: string,
    targetType: string,
    reactionType: ReactionType,
  ): Observable<ReactionRemoveResponse> {
    const body = { targetId, targetType, reactionType };
    return this.http.delete<ReactionRemoveResponse>(
      `${ApiUrl.v2BE}/reactions`,
      { body },
    );
  }

  toggleReaction(
    targetId: string,
    targetType: string,
    reactionType: ReactionType,
    isAdding: boolean,
  ): Observable<ReactionToggleResponse> {
    return isAdding
      ? this.addReaction(targetId, targetType, reactionType)
      : this.removeReaction(targetId, targetType, reactionType);
  }
}
