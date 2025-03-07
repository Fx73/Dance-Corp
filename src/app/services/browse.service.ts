import { DeckDescriptorDTO, deckDescriptorConverter } from '../shared/DTO/deckDescriptorDTO';
import { Firestore, collection, doc, getDoc, getDocs, getFirestore, limit, orderBy, query, startAfter, startAt, where } from 'firebase/firestore';
import { getDownloadURL, getStorage, ref } from 'firebase/storage';

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class BrowseService {
  db: Firestore
  readonly batchSize = 60;

  constructor() {
    this.db = getFirestore()

  }

  async getAllDescriptors(lastDescriptor: DeckDescriptorDTO | undefined): Promise<DeckDescriptorDTO[]> {
    const descriptors: DeckDescriptorDTO[] = [];
    const publicRef = collection(this.db, 'public').withConverter(deckDescriptorConverter);

    const q = query(
      publicRef,
      orderBy('id'),
      startAt(lastDescriptor ? lastDescriptor.id : null),
      limit(this.batchSize)
    )

    const querySnapshot = await getDocs(q)

    querySnapshot.forEach((doc) => {
      descriptors.push(doc.data());
    });

    return descriptors;
  }

  async getAllDescriptorsWithSearch(lastDescriptor: DeckDescriptorDTO | undefined, searchTerm: string): Promise<DeckDescriptorDTO[]> {
    const descriptors: DeckDescriptorDTO[] = [];
    const publicRef = collection(this.db, 'public').withConverter(deckDescriptorConverter);

    const q = query(
      publicRef,
      where('title', ">=", searchTerm),
      where('title', "<", searchTerm + "z"),
      orderBy('title'),
      orderBy('id'),
      startAfter(lastDescriptor ? lastDescriptor.id : null),
      limit(this.batchSize)
    )


    const querySnapshot = await getDocs(q)

    querySnapshot.forEach((doc) => {
      descriptors.push(doc.data());
    });

    return descriptors;
  }


  async getDescriptorById(id: string): Promise<DeckDescriptorDTO | undefined> {
    const docRef = doc(this.db, 'public', id).withConverter(deckDescriptorConverter);
    const docSnapshot = await getDoc(docRef);

    if (docSnapshot.exists()) {
      return docSnapshot.data();
    } else {
      return undefined;
    }
  }

  async getZipFileById(id: string): Promise<Blob | null> {
    const storageRef = ref(getStorage(), `Public/${id}.zip`);
    const downloadUrl = await getDownloadURL(storageRef);

    const response = await fetch(downloadUrl);
    if (response.ok) {
      return await response.blob();
    } else {
      return null;
    }
  }

}
