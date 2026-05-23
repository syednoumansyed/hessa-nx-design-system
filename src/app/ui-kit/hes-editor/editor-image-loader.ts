import { fromEvent, Observable } from 'rxjs';
import { delay, finalize, map, switchMap } from 'rxjs/operators';
import { EditorImageUploadService } from './editor-image-upload.service';

export function imageLoader(
  service: EditorImageUploadService,
): (file: File) => Observable<string> {
  return (file: File) => {
    service.loading$.next(true);
    return service
      .save(file)
      .pipe(finalize(() => service.loading$.next(false)));
  };
}
