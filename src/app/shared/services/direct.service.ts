import { Subject } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';
import { Router } from '@angular/router';
import { IDialog } from './../interfaces/dialog.interface';
import { IDialogPreview } from './../interfaces/dialog-preview.interface';
import { AngularFirestore } from '@angular/fire/firestore';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DirectService {
  feedDialogCreated: Subject<any> = new Subject<any>()

  constructor(private firestore: AngularFirestore, private router: Router, private spinner: NgxSpinnerService) { }

  createDialog(arrUsers: any[], redirectToDialog: boolean = true) {
    const randomId = this.firestore.createId()
    let newDialogPreview: IDialogPreview = {
      idDialogPreview: randomId,
      lastActive: new Date(),
      type: arrUsers.length < 3 ? 'private' : 'group',
      users: [],
      usersData: []
    }
    arrUsers.forEach((user) => {
      newDialogPreview.users.push(user.id)
      newDialogPreview.usersData.push({
        nikname: user.nikname,
        profilePhoto: user.profilePhoto
      })
    })
    this.firestore.collection('dialogs-preview').doc(randomId).set(Object.assign({}, newDialogPreview))
      .then(() => {
        let newDialog: IDialog = {
          idDialog: randomId,
          type: arrUsers.length < 3 ? 'private' : 'group',
          users: []
        }
        arrUsers.forEach((user) => {
          newDialog.users.push(user.id)
        })
        this.firestore.collection('dialogs').doc(randomId).set(Object.assign({}, newDialog))
          .then(() => {
            this.feedDialogCreated.next(newDialog.idDialog)
            this.spinner.hide()
            if (redirectToDialog) {
              this.router.navigateByUrl(`/direct/${randomId}`)
            }
          })
      })
  };

  findDialogWithCurrentUser(idUserParams: any, redirectToDialog: boolean = true) {
    this.spinner.show()
    let searchDialogs = []
    this.firestore.collection('dialogs-preview').ref.where('users', 'array-contains', JSON.parse(localStorage.getItem('authUser')).id)
      .get().then(doc => {
        if (!doc.empty) { // if authUser has already at least 1 dialog
          doc.forEach(obj => {
            searchDialogs.push(obj.data())
          })
          let includeUser = false
          searchDialogs.forEach((dialogPreview, i) => { //серед тих dialogs які знайдено
            if (dialogPreview.type == 'private') { //якщо dialog type is 'private'
              let include = dialogPreview.users.findIndex((userId) => userId == idUserParams.id)
              if (include != -1) { 
                includeUser = true
                this.feedDialogCreated.next(dialogPreview[i])
                //dialog found! -> go to this dialog
                if (redirectToDialog) {
                  this.router.navigateByUrl(`/direct/${searchDialogs[i].idDialogPreview}`)
                }
              }
            }
          })
          if (!includeUser) {
            console.log('Діалогу не знайдено')
            this.createDialog([JSON.parse(localStorage.getItem('authUser')), idUserParams])
          }
        } else { // якщо authUser не має жодного dialog
          this.createDialog([JSON.parse(localStorage.getItem('authUser')), idUserParams])
        }
      })
  };

  getInterlocutorPhoto(arr:any, dialogType:string, whatReturning:string):string{
    if (whatReturning == 'profilePhoto' && dialogType == 'private') {
      return arr[0].nikname == JSON.parse(localStorage.getItem('authUser')).nikname ? arr[1].profilePhoto : arr[0].profilePhoto
    } else if (whatReturning == 'nikname') {
      if (dialogType == 'private'){
        return arr[0].nikname == JSON.parse(localStorage.getItem('authUser')).nikname ? arr[1].nikname : arr[0].nikname
      } else{
        let niknames = ''
        arr.forEach( (value) => {niknames = value.nikname + ', ' + niknames},'')
        return niknames
      }
    }
  };
}
