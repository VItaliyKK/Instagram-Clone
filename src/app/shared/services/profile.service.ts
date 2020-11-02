import { IActivity } from './../interfaces/activity.interface';
import { DirectService } from './direct.service';
import { Router } from '@angular/router';
import { AngularFireStorage } from '@angular/fire/storage';
import { AngularFirestore } from '@angular/fire/firestore';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {

  constructor(private firestore: AngularFirestore,
    private spinner: NgxSpinnerService,
    private storage: AngularFireStorage,
    private directService: DirectService,
    private router: Router) { }

  fullDeleteUser(id: string): Promise<void> {
    return this.firestore.collection('users').doc(id).delete();
  };

  getImageURL(id: string): Observable<string> {
    return this.storage.ref(`/profile-photo/${id}.jpeg`).getDownloadURL()
  };
  
  getUserData(id: string): Observable<any> {
    return this.firestore.collection('users').doc(id).valueChanges()
  };

  // check whether the transition to the profile of the authorized user
  checkIfViewAuthUserProfile(currentIdUs: string): boolean {
    return currentIdUs == JSON.parse(localStorage.getItem('authUser')).id
  };
  
  findDialogWithCurrentUser(idUserParams: any) {
    this.spinner.show()
    let searchDialogs = []
    this.firestore.collection('dialogs-preview').ref.where('users', 'array-contains', JSON.parse(localStorage.getItem('authUser')).id)
      .get().then(doc => {
        if (!doc.empty) { // if authUser already has at least 1 dialog
          doc.forEach(obj => {
            searchDialogs.push(obj.data())
          })
          let includeUser = false
          searchDialogs.forEach((dialogPreview, i) => {
            if (dialogPreview.type == 'private') {
              let include = dialogPreview.users.findIndex((userId) => userId == idUserParams.id)
              if (include != -1) {
                includeUser = true
                this.router.navigateByUrl(`/direct/${searchDialogs[i].idDialogPreview}`)
              }
            }
          })
          if (!includeUser) {
            this.directService.createDialog([JSON.parse(localStorage.getItem('authUser')), idUserParams])
          }
        } else { // if authUser has not any dialog
          this.directService.createDialog([JSON.parse(localStorage.getItem('authUser')), idUserParams])
        }
      })
  };
  
  addActivity(newActivity: IActivity) {
    const randId = this.firestore.createId()
    this.firestore.collection('activity').doc(randId).set(Object.assign({}, newActivity))
      .then(() => {
      })
  };
  
  deleteActivity(authUsId, hostUsId, type: 'following' | 'like' | 'comment', idPost?: string, commentId?: string): void {
    if (type == 'following') { //якщо дія follow / unfollow
      this.firestore.collection('activity').ref.where('forUser', '==', hostUsId).where('fromUser', '==', authUsId)
        .where('type', '==', 'following').get().then(data => {
          data.forEach(doc => {
            this.firestore.collection('activity').doc(doc.id).delete().then(() => {
            })
          })
        })
    } else if (type == 'like') { //if action is: add like / delete like
      this.firestore.collection('activity').ref.where('forUser', '==', hostUsId).where('fromUser', '==', authUsId)
        .where('pinPost', '==', idPost).where('type', '==', 'like').get().then(data => {
          data.forEach(doc => {
            this.firestore.collection('activity').doc(doc.id).delete().then(() => {
            })
          })
        })
    } else { //if action is: add comment / delete comment
      this.firestore.collection('activity').ref.where('forUser', '==', hostUsId).where('fromUser', '==', authUsId)
        .where('pinPost', '==', idPost).where('idComment', '==', commentId).get().then(data => {
          data.forEach(doc => {
            this.firestore.collection('activity').doc(doc.id).delete().then(() => {
            })
          })
        })
    }
  };

  getListFollowingOrFollowers(followId: string) {
    return this.firestore.collection('users').doc(followId).get()
  };
}
