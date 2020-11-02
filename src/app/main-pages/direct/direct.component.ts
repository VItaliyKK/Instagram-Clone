import { DirectService } from './../../shared/services/direct.service';
import { IUser } from './../../shared/interfaces/user.interface';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { AngularFirestore } from '@angular/fire/firestore';
import { IDialogPreview } from './../../shared/interfaces/dialog-preview.interface';
import { Component, OnInit, TemplateRef } from '@angular/core';

@Component({
  selector: 'app-direct',
  templateUrl: './direct.component.html',
  styleUrls: ['./direct.component.scss']
})
export class DirectComponent implements OnInit {
  gotRes:any
  dialogsEmpty: boolean = true;
  dialogs: IDialogPreview[] | any = [];
  modalRef: BsModalRef;
  searchInput:string = ''
  foundUsers:IUser[] | any = []
  selectedListUsers: any[] = [JSON.parse(localStorage.getItem('authUser'))]
  disabledCreateDialog:boolean = true
  showPreloader:boolean = false

  constructor(private firestore: AngularFirestore, 
              private directService: DirectService,
              private modalService: BsModalService) { }

  ngOnInit(): void {
    this.gotRes = this.firestore.collection('dialogs-preview').ref.where('users', 'array-contains', JSON.parse(localStorage.getItem('authUser')).id).orderBy('lastActive', 'desc')
    .onSnapshot(doc => {
        this.dialogsEmpty = doc.empty
        this.dialogs.length = 0
        doc.forEach(obj => {
          this.dialogs.push(obj.data())
        })
      })
  };

  ngOnDestroy(){
    this.gotRes()
  };

  openModal(template: TemplateRef<any>): void {
    this.modalRef = this.modalService.show(template);
  };

  showInterlocutorPhoto(array:any, typeDialog:string, typeReturning:string):string{
    return this.directService.getInterlocutorPhoto(array, typeDialog, typeReturning)
  };

  createNewDialog(){
    if (this.selectedListUsers.length == 2){ 
      let nik:string
      this.selectedListUsers[0].nikname == JSON.parse(localStorage.getItem('authUser')).nikname
        ? nik = this.selectedListUsers[1].nikname
        : nik = this.selectedListUsers[0].nikname
      this.firestore.collection('users').ref.where('nikname', '==', nik).onSnapshot( data => {
        data.forEach( us => {
          this.directService.findDialogWithCurrentUser(us.data())
          this.modalRef.hide()
        })
      })
    } else if (this.selectedListUsers.length > 2) {
      this.directService.createDialog(this.selectedListUsers)
      this.modalRef.hide()
      this.resetCreatingDialogModal()
    }
  };

  //searching users by input field
  searchingUser(){
    if(this.searchInput != ''){
      this.showPreloader = true
      this.firestore.collection("users").ref.orderBy('nikname').startAt(this.searchInput).endAt(this.searchInput +'\uf8ff').limit(10)
      .get().then( doc => {
        this.foundUsers.length = 0
        this.showPreloader = false
        doc.forEach( el => {
          this.foundUsers.push(el.data())
        })
      })
    } else {
      this.foundUsers.length = 0
    }
  }
  // adding/removing user in list
  addInPotensialListDialog(us:any){
      if(us.nikname != JSON.parse(localStorage.getItem('authUser')).nikname){
        const res = this.selectedListUsers.findIndex( use => use.nikname == us.nikname)
        if (res == -1) {
          this.selectedListUsers.push(us)
        } else {
          this.selectedListUsers.splice(res, 1)
        }
        this.checkDisabledCreateDialog()
      }
  }
  //check if user is selected
  checkIsSelected(us:any):boolean{
    const res = this.selectedListUsers.findIndex( user => user.nikname == us.nikname)
    return res == -1 ? false : true
  }
  //tracking disabled button for creating dialog
  checkDisabledCreateDialog(){
    this.selectedListUsers.length == 1 ? this.disabledCreateDialog = true : this.disabledCreateDialog = false
  }
  
  resetCreatingDialogModal(){
    this.selectedListUsers = [JSON.parse(localStorage.getItem('authUser'))]
    this.disabledCreateDialog = true
    this.foundUsers = []
    this.searchInput = ''
  }
}
