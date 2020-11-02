import { AuthService } from './../../../shared/auth/auth.service';
import { AngularFirestore } from '@angular/fire/firestore';
import { IUser } from './../../../shared/interfaces/user.interface';
import { ProfileService } from './../../../shared/services/profile.service';
import { Component, OnInit, TemplateRef } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { AngularFireStorage } from '@angular/fire/storage';
import { NgxSpinnerService } from 'ngx-spinner';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.scss']
})
export class EditProfileComponent implements OnInit {
  gotRes:any
  currentUser: IUser;
  id: string
  fullname: string
  nikname: string
  website: string
  bio: string
  email: string
  location: string
  updateStatus: string = '';
  storageListener: Subscription
  modalRef: BsModalRef;

  constructor(private modalService: BsModalService,
              private profService: ProfileService,
              private firestore: AngularFirestore,
              private spinner: NgxSpinnerService,
              private storage: AngularFireStorage,
              private authService: AuthService) { }

  ngOnInit(): void {
    this.spinner.show()
    this.gotRes = this.profService.getUserData(JSON.parse(localStorage.getItem('authUser')).id).subscribe(
      data => {
        this.currentUser = data
        this.id = data.id
        this.fullname = data.fullname
        this.nikname = data.nikname
        this.website = data.website
        this.bio = data.bio
        this.email = data.email
        this.location = data.location
        this.spinner.hide()
      }
    )
  };

  ngOnDestroy(): void {
    !this.storageListener || this.storageListener.unsubscribe()
    !this.gotRes || this.gotRes.unsubscribe()
  }

  openModal(template: TemplateRef<any>): void {
    this.modalRef = this.modalService.show(template);
  }
  // update profile data
  updateUserData(){
    this.spinner.show()
    this.firestore.collection('users').doc(this.id).update({
      "fullname": this.fullname,
      "nikname": this.nikname,
      "website": this.website,
      "bio": this.bio,
      "email": this.email,
      "location": this.location
    }).then( () => {
      this.updateStatus = 'Data been upgraded !';
    }).catch(error => {
      this.updateStatus = error.message;
    }).finally( () => {
      this.spinner.hide()
      setTimeout( () => {
        this.updateStatus = '';
      }, 2500)
    })
  };

  deleteProfPhoto(){
    this.spinner.show()
    this.storage.ref(`profile-photo/${this.id}.jpeg`).delete()
        .subscribe( res => {
          this.firestore.collection('users').doc(this.id).update({
            "profilePhoto": ''
          }).then( ()=>{
            let locStorage = JSON.parse(localStorage.getItem('authUser'))
            locStorage.profilePhoto = ''
            this.authService.changeLocalStorageData(locStorage)
            // report to the 'header' that 'profilePhoto' has changed
            this.authService.changeUserAuthProfilePhoto('')
            this.spinner.hide()
            this.modalRef.hide()
          })
        })
  }
  
  uploadProfPhoto(event){
    this.spinner.show()
    const file = event.target.files[0];
    const type = file.type.slice(file.type.indexOf('/') + 1);
    const filePath = `profile-photo/${this.id}.${type}`;
    this.storage.upload(filePath, file)
        .then(image => {
          this.storageListener = this.storage.ref(`profile-photo/${image.metadata.name}`).getDownloadURL()
            .subscribe(url => {
              this.currentUser.profilePhoto = url;
              this.firestore.collection('users').doc(this.id).update({
                "profilePhoto": this.currentUser.profilePhoto
              }).then(() => {
                this.authService.changeUserAuthProfilePhoto(this.currentUser.profilePhoto)
                this.currentUser.profilePhoto = this.currentUser.profilePhoto
                this.authService.changeLocalStorageData(this.currentUser)
                this.spinner.hide()
                this.modalRef.hide()
                this.updateStatus = 'Profile Photo been upgraded !';
                setTimeout( () => {
                  this.updateStatus = '';
                }, 2000)
              })
            });
        });
  }
}
