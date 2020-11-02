import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { NgxSpinnerService } from 'ngx-spinner';
import { ProfileService } from './../../../shared/services/profile.service';
import { AngularFireStorage } from '@angular/fire/storage';
import { IMessage } from './../../../shared/interfaces/message.interface';
import { IDialog } from './../../../shared/interfaces/dialog.interface';
import { AngularFirestore } from '@angular/fire/firestore';
import { Event, Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { Component, OnInit, TemplateRef } from '@angular/core';
import { DialogService } from '../../../shared/services/dialog.service';


@Component({
  selector: 'app-dialog',
  templateUrl: './dialog.component.html',
  styleUrls: ['./dialog.component.scss']
})
export class DialogComponent implements OnInit {
  gotResDialog: any
  gotResDirect: any
  messageInput: string = '';
  cuttentIdDialog: string = '';
  currentDialog: IDialog | any = [];
  messages: IMessage[] | any = [];
  usersInfo: any[] = []
  messageIs: boolean = false;
  openPhoto: boolean = false
  modalPhotoUrl: string = ''
  showDialogInfo:boolean = false //for toggle between with messages wrapper and dialog info
  modalRef: BsModalRef;
  selectedMessage:IMessage

  constructor(private router: Router,
    private spinner: NgxSpinnerService,
    private storage: AngularFireStorage,
    private dialogService: DialogService,
    private profileService: ProfileService,
    private modalService: BsModalService,
    private activeRoute: ActivatedRoute,
    private firestore: AngularFirestore) {
    this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationEnd) {
        if (this.router.routerState.snapshot.url.includes('direct')) {
          this.spinner.show()
          this.cuttentIdDialog = this.activeRoute.snapshot.paramMap.get('idDialog')
          this.usersInfo.length = 0
          this.messages.length = 0
          this.currentDialog = []
          this.gotResDirect = this.firestore.collection('dialogs').doc(this.cuttentIdDialog).snapshotChanges()
            .subscribe(data => {
              if (data.payload.exists) { // dialog alreay ixist ?
                this.currentDialog = data.payload.data()
                this.currentDialog.users.forEach(usId => { // get 'profilePhoto' for each user
                  this.profileService.getUserData(usId).subscribe(us => {
                    this.usersInfo.push({
                      idUser: us.id,
                      profilePhoto: us.profilePhoto,
                      nikname: us.nikname,
                      fullname: us.fullname
                    })
                  })
                });
                this.gotResDialog = this.firestore.collection('messages').ref.where('inDialog', '==', this.currentDialog.idDialog).orderBy('date', 'desc')
                  .onSnapshot(data => {
                    this.messages.length = 0
                    if (!data.empty) { // if message is already in dialog 
                      data.forEach(d => {
                        let mess = d.data()
                        mess.id = d.id
                        const isExistInList = this.messages.findIndex( p => p.id == mess.id)
                        isExistInList != -1
                                    ? this.messages.splice(isExistInList, 1, mess)
                                    : this.messages.push(mess)
                      })
                    } else { // if dialog don`t have any messages yet
                      this.messages.length = 0
                    }
                    this.messageIs = this.messages.length != 0
                  })
                this.spinner.hide()
              } else {
                this.spinner.hide()
              }
            })
        }
      }
    });
  };

  ngOnInit(): void {
  }

  ngOnDestroy() {
    if (this.gotResDialog) {
      this.gotResDialog()
    }
    this.gotResDirect.unsubscribe()
  };

  messageIsAuthUser(authorId: string): boolean {
    return authorId == JSON.parse(localStorage.getItem('authUser')).id
  };

  getAuthorUserProfilePhoto(authorId: string): string {
    let currentUser = this.usersInfo.find(obj => obj.idUser == authorId)
    return (currentUser) == 'undefined' ? '' : currentUser.profilePhoto
  };
  getAuthorUserNikname(authorId: string): string {
    let currentUser = this.usersInfo.find(obj => obj.idUser == authorId)
    return (currentUser) == 'undefined' ? '' : currentUser.nikname
  };

  gedUrlPhoto(url: string) {
    this.modalPhotoUrl = url
  };

  sendMessage() {
    if (this.messageInput != '') {
      this.spinner.show()
      let newMessage: IMessage = {
        idAuthor: JSON.parse(localStorage.getItem('authUser')).id,
        inDialog: this.cuttentIdDialog,
        nikname: JSON.parse(localStorage.getItem('authUser')).nikname,
        date: new Date(),
        content: this.messageInput,
        type: 'text'
      }
      this.dialogService.sendMessage(newMessage).then(() => {
        console.log('message created in "firestore/messages"')
        this.firestore.collection('dialogs-preview').doc(this.cuttentIdDialog).update({
          'lastActive': new Date()
        }).then(() => {
          this.messageInput = ''
          this.spinner.hide()
          console.log("updated 'lastActive' in 'firestore/dialogs-preview'")
        })
      })

    }
  };

  sendImageMessage(e) {
    if (e.target.files.length > 0) {
      this.spinner.show()
      let randomName = this.firestore.createId()
      let file = e.target.files[0];
      const type = file.type.slice(file.type.indexOf('/') + 1);
      const filePath = `messages/${randomName}.${type}`;
      this.storage.upload(filePath, file).then(() => {
        console.log('Photo loaded on storage/messages')
        this.dialogService.getUrlPhoto(`${randomName}.${type}`)
          .subscribe((url) => {
            console.log('got URL photo', url)
            let newMessage: IMessage = {
              idAuthor: JSON.parse(localStorage.getItem('authUser')).id,
              inDialog: this.cuttentIdDialog,
              nikname: JSON.parse(localStorage.getItem('authUser')).nikname,
              date: new Date(),
              content: url,
              type: 'photo'
            }
            this.dialogService.sendMessage(newMessage).then(() => {
              console.log('Message type=photo added to firestore/messages')
              this.firestore.collection('dialogs-preview').doc(this.cuttentIdDialog).update({
                'lastActive': new Date()
              }).then(() => {
                this.spinner.hide()
                console.log('Updated "lastActive" on firestore/dialogs-preview')
              })
            })
            this.messageInput = ''
          })
      })
    }
  };

  openMessageOptions(template: TemplateRef<any>, idMessage:IMessage){
    this.selectedMessage = idMessage
    this.modalRef = this.modalService.show(template);
  };

  deleteMessage(){
    this.spinner.show()
    this.firestore.collection('messages').doc(this.selectedMessage.id).delete().then(()=>{
      this.modalRef.hide()
      this.spinner.hide()
      console.log(this.selectedMessage.id,' Message deleted')
    })
  }

  isSelectedMessageAuthUser(mess:IMessage):boolean{
    return mess.idAuthor == JSON.parse(localStorage.getItem('authUser')).id
  }
}
