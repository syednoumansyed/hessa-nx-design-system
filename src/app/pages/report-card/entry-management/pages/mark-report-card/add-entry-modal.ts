import { ModalController } from '@ionic/angular/standalone';
import { AddNewEntryComponent } from './components/add-new-entry-modal.component';
import { Subject } from 'rxjs';

export async function openAddNewEntryModal({
  modalCtrl,
  closeModal,
  reportCardColumnId,
  reportCardColumnSubjectId,
  onRefresh,
  entryId,
  entryTitle,
}: {
  modalCtrl: ModalController;
  closeModal: () => void;
  reportCardColumnId?: number;
  reportCardColumnSubjectId?: number;
  entryId?: number;
  entryTitle?: string;
  onRefresh: Subject<void>;
}) {
  const modal = await modalCtrl?.create({
    component: AddNewEntryComponent,
    componentProps: {
      closeModal: closeModal,
      reportCardColumnId,
      reportCardColumnSubjectId,
      onRefresh,
      entryId,
      entryTitle,
    },
    cssClass: 'sm-modal overflow-y-auto',
  });
  modal.present();
}
