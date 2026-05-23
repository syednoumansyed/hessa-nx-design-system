import { Component, OnInit } from '@angular/core';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';

@Component({
  selector: 'app-splash-screen-web',
  templateUrl: './splash-screen-web.component.html',
  styleUrls: ['./splash-screen-web.component.scss'],
  standalone: true,
  imports: [TranslocoDirective],
})
export class SplashScreenWebComponent implements OnInit {
  activeLang: string = 'en';

  constructor(private translocoService: TranslocoService) {}

  ngOnInit() {
    this.activeLang = this.translocoService.getActiveLang();
  }
}
