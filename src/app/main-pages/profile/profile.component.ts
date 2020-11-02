import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { AngularFireStorage } from '@angular/fire/storage';
import { Activity } from './../../shared/models/activity.model';
import { IUser } from './../../shared/interfaces/user.interface';
import { ContentWrapperService } from './../../shared/services/content-wrapper.service';
import { AuthService } from './../../shared/auth/auth.service';
import { ProfileService } from './../../shared/services/profile.service';
import { Component, OnInit, TemplateRef } from '@angular/core';
import { Router, Event, NavigationEnd } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { AngularFirestore } from '@angular/fire/firestore';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  gotRes: Subscription //for unsubscribe user data
  gotFollowListListener: Subscription
  currentUser: IUser | any = {}
  profilePath: string = 'profile'
  followers: string[] = [];
  following: string[] = [];
  postsCount: number = 0 //for view number of posts
  followersCount: number = 0 //for view number of followers
  followingCount: number = 0 //for view number of following
  activeURL: string = '' //include active URL for comparison when switching to another profile
  newUserEntered:boolean = false; // show modal for select 'profile photo'
  selectedPhotoBtnContinue:boolean = true //blocking button 'continue'
  modalRef: BsModalRef;
  followListFullInfo: any[] = []
  followListTypeTitleModal:boolean = true //true -> following; false -> followers
  showPreloader:boolean = false

  constructor(private profileServ: ProfileService,
              private spinner: NgxSpinnerService,
              private router: Router,
              private storage: AngularFireStorage,
              private firestore: AngularFirestore,
              private authService: AuthService,
              private modalService: BsModalService,
              private contentService: ContentWrapperService) { 
                this.router.events.subscribe((event: Event) => {
                  if (event instanceof NavigationEnd) {
                    let urlNow = this.router.routerState.snapshot.url
                    let urlParams = urlNow.split('/');
                    let newUserId = urlParams[urlParams.length-1]
                    if (this.modalRef) {
                      this.modalService.hide(this.modalRef.id)
                    }
                    // urlParams.length == 4 --> ''/profile/posts/:id --> для того щоб при відкриванні post-details не підгружались дані user
                    if (this.currentUser.id != newUserId && urlNow.includes('profile') && urlParams.length == 4) {
                      this.currentUser.id = this.contentService.getIdCurrentUserThrouthURL()
                      this.getUserData(newUserId)
                      this.subscribeUserProfilePath();
                    }
                  }
                });            
               }

  ngOnInit(): void {
    if (JSON.parse(localStorage.getItem('isNewUser'))) {
      this.newUserEntered = true
    }
    this.modalService.onHide.subscribe(() => {
      this.followListFullInfo = [] 
    })
  };

  ngOnDestroy(){
    if (this.gotFollowListListener){
      this.gotFollowListListener.unsubscribe()
    }
    this.gotRes.unsubscribe() 
    this.modalService.onHide.unsubscribe()
  };

  openModal(template: TemplateRef<any>, params:any = {backdrop: 'static', keyboard: false}): void {
    this.modalRef = this.modalService.show(template, params);
  };

  continueUsingNewUser():void{
    localStorage.removeItem('isNewUser')
    this.newUserEntered = false
  }

  private subscribeUserProfilePath(): void {
    this.authService.userAuthPath.subscribe((newPath) => {
      this.profilePath = newPath
    })
  }

  getUserData(id: string) {
    if (this.gotRes){
      this.gotRes.unsubscribe()
    }
    this.spinner.show()
    this.gotRes = this.profileServ.getUserData(id).subscribe(
      dataUser => {
        if (!dataUser) {
          this.router.navigateByUrl(`/not-exist`)
        } else {
          this.currentUser = dataUser
          this.followers = dataUser.followers
          this.following = dataUser.following
          this.postsCount = this.currentUser.posts.length
          this.followersCount = this.followers.length
          this.followingCount = this.following.length
          this.currentUser.isFriend = this.followers.includes(JSON.parse(localStorage.getItem('authUser')).id)
          this.currentUser.viewAuthUser = this.profileServ.checkIfViewAuthUserProfile(this.currentUser.id)
          if (this.currentUser.profilePhoto == '' && this.currentUser.id == JSON.parse(localStorage.getItem('authUser')).id) {
            this.newUserEntered = true
          }
          this.spinner.hide()
        }
      }
    )
  };

  followOrUnfollowUser(){
    this.spinner.show()
    if (this.currentUser.isFriend){ // if currentUser already subscribe on user
      this.contentService.unfollowing(JSON.parse(localStorage.getItem('authUser')).id, this.currentUser.id)
          .then( () => {
            this.profileServ.deleteActivity(JSON.parse(localStorage.getItem('authUser')).id, this.currentUser.id, 'following')
            this.currentUser.viewAuthUser = this.profileServ.checkIfViewAuthUserProfile(this.currentUser.id)
            this.currentUser.isFriend = false
            this.spinner.hide()
          })
    } else{ // if currentUser has not subscribe on user yet
      this.contentService.following(JSON.parse(localStorage.getItem('authUser')).id, this.currentUser.id)
          .then( () => {
            let newAction = new Activity(new Date(), 'following', JSON.parse(localStorage.getItem('authUser')).id, this.currentUser.id)
            this.profileServ.addActivity(newAction)
            this.currentUser.viewAuthUser = this.profileServ.checkIfViewAuthUserProfile(this.currentUser.id)
            this.currentUser.isFriend = true
            this.spinner.hide()
          })
    }
  };

  goToDialog(){
    this.profileServ.findDialogWithCurrentUser({id:this.currentUser.id, nikname:this.currentUser.nikname, profilePhoto:this.currentUser.profilePhoto})
  }

  uploadProfPhoto(event):void{
    this.spinner.show()
    const file = event.target.files[0];
    const type = file.type.slice(file.type.indexOf('/') + 1);
    const filePath = `profile-photo/${this.currentUser.id}.${type}`;
    this.storage.upload(filePath, file)
        .then(image => {
          this.storage.ref(`profile-photo/${image.metadata.name}`).getDownloadURL()
            .subscribe(url => {
              this.currentUser.profilePhoto = url;
              this.firestore.collection('users').doc(this.currentUser.id).update({
                "profilePhoto": this.currentUser.profilePhoto
              }).then(() => {
                this.authService.changeUserAuthProfilePhoto(this.currentUser.profilePhoto)//change url profile photo for subscribers
                this.authService.changeLocalStorageData(this.currentUser)
                this.spinner.hide()
                this.selectedPhotoBtnContinue = false
              })
            })
        })
  };

  showFollowingOrFollowersList(template:TemplateRef<any>, type: string){
    if (type == 'following' && this.following.length > 0) {
      this.loadFollowingOrFollowersList('following', template)
    } else if (type == 'followers' && this.followers.length > 0){
      this.loadFollowingOrFollowersList('followers', template)
    }
  };

  // upload following/followers
  loadFollowingOrFollowersList(typeFollow:string, templatee:TemplateRef<any>){
    this.openModal(templatee, {backdrop: true});
    this.followListTypeTitleModal = false
    this.followListFullInfo.length = 0
    this[typeFollow].forEach( followingUsID => {
      this.gotFollowListListener =  this.profileServ.getListFollowingOrFollowers(followingUsID).subscribe( doc => { 
        this.showPreloader = false
        let gotFollUs: any = doc.data()
        gotFollUs.isFollowToo = gotFollUs.followers.includes(JSON.parse(localStorage.getItem('authUser')).id)
        gotFollUs.isAuthUs = gotFollUs.id == JSON.parse(localStorage.getItem('authUser')).id
        const isExistInList = this.followListFullInfo.findIndex(p => p.id == gotFollUs.id)
        isExistInList != -1
          ? this.followListFullInfo.splice(isExistInList, 1, gotFollUs)
          : this.followListFullInfo.push(gotFollUs)
      })
    })
  }

  followOrUnfollow(uss: IUser): void {
    let gotResFollow:Promise<void>
    this.spinner.show()
    uss.isFollowToo 
          ? gotResFollow = this.contentService.unfollowing(JSON.parse(localStorage.getItem('authUser')).id, uss.id)
          : gotResFollow = this.contentService.following(JSON.parse(localStorage.getItem('authUser')).id, uss.id)
    gotResFollow.then(() => {
      this.spinner.hide()
      this.addOrRemoveActivity(uss.isFollowToo ? false : true, uss.id)
      uss.isFollowToo = uss.isFollowToo ? false : true
    })
  };

  addOrRemoveActivity(action: boolean, userID: string) {
    if (action) { //create activity
      let newAction = new Activity(new Date(), 'following', JSON.parse(localStorage.getItem('authUser')).id, userID)
      this.profileServ.addActivity(newAction)
    } else { //delete activity
      this.profileServ.deleteActivity(JSON.parse(localStorage.getItem('authUser')).id, userID, 'following')
    }
  };
}