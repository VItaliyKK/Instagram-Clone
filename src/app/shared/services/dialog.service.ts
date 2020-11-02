import { Observable } from 'rxjs';
import { AngularFireStorage } from '@angular/fire/storage';
import { AngularFirestore } from '@angular/fire/firestore';
import { IMessage } from './../interfaces/message.interface';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DialogService {

  constructor(private firestore: AngularFirestore, private storage: AngularFireStorage) { }

  sendMessage(newMessage: IMessage):Promise<any>{
    return this.firestore.collection('messages').doc(this.firestore.createId()).set(Object.assign({}, newMessage))
  };

  getUrlPhoto( name:string):Observable<any>{
    return this.storage.ref(`messages/${name}`).getDownloadURL()
  }
}
