import { Subscription } from 'rxjs';

export class HesSubscription {
  private subscription = new Subscription();

  set add(sub: Subscription | null | undefined) {
    if (!sub) {
      return;
    }
    this.subscription.add(sub);
  }

  unsubscribe() {
    this.subscription.unsubscribe();
  }
}
