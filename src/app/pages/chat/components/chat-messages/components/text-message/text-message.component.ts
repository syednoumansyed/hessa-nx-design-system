import { CommonModule } from '@angular/common';
import { Component, computed, input, OnInit } from '@angular/core';
import { BaseMessage } from '@cometchat/chat-sdk-javascript';
import { LinkifyPipe } from '@shared/pipes/linkify.pipe';
import { extractYouTubeUrls, youtubeUrlToId } from '@pages/vcr/pages/utils';
import { YouTubePlayer } from '@angular/youtube-player';
import { isMobile } from '@utils/platform';
import { NewlinePipe } from '@pages/chat/pipe/new-line.pipe';

@Component({
  selector: 'app-text-message',
  templateUrl: './text-message.component.html',
  standalone: true,
  imports: [CommonModule, NewlinePipe, LinkifyPipe, YouTubePlayer],
})
export class TextMessageComponent implements OnInit {
  message = input.required<BaseMessage>();
  youtubeIds = computed(() => {
    const urls = extractYouTubeUrls(this.message().getData().text);
    return urls.map((url) => youtubeUrlToId(url));
  });
  messageText = computed(() => {
    return this.message().getData().text;
  });
  width = isMobile() ? window.innerWidth * 0.75 : '';

  constructor() {}

  ngOnInit() {}
}
