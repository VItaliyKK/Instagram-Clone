import { NgxSpinnerService } from 'ngx-spinner';
import { ProfileService } from './../../shared/services/profile.service';
import { Activity } from './../../shared/models/activity.model';
import { IActivity } from './../../shared/interfaces/activity.interface';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { ContentWrapperService } from '../../shared/services/content-wrapper.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-activity',
  templateUrl: './activity.component.html',
  styleUrls: ['./activity.component.scss']
})
export class ActivityComponent implements OnInit {
  activSubscribe: firebase.firestore.Query<firebase.firestore.DocumentData>
  userDataSubscribe: Subscription
  activities: IActivity[] | any = []
  result: any
  activityEmpty: boolean = false
  @ViewChild('bottom_content') bottomContent: ElementRef;
  lastVisible: 0 | firebase.firestore.QueryDocumentSnapshot<firebase.firestore.DocumentData> = 0 // to load data in portions
  blockUpload: boolean = true //block upload a new posts
  amountLoadingData: number = 10; //number of loading posts
  showPreloader:boolean = false

  constructor(private firestore: AngularFirestore,
    private spinner: NgxSpinnerService,
    private profileService: ProfileService,
    private contentService: ContentWrapperService) { }

  ngOnInit() {
    this.loadMainActivities()
  }

  onScroll() { //listening 'bottom' content to upload 'Activities'
    if (this.bottomContent.nativeElement.offsetTop + 45 <= window.scrollY + window.innerHeight) {
      if (!this.blockUpload) {
        this.loadMainActivities()
      }
    }
  }

  loadMainActivities(): void {
    this.showPreloader = true 
    this.blockUpload = true
    if (this.lastVisible == 0) {
      this.activSubscribe = this.firestore.collection('activity').ref.where('forUser', '==', JSON.parse(localStorage.getItem('authUser')).id).orderBy('date', 'desc').limit(this.amountLoadingData)
      this.amountLoadingData = 5
    } else {
      this.activSubscribe = this.firestore.collection('activity').ref.where('forUser', '==', JSON.parse(localStorage.getItem('authUser')).id).orderBy('date', 'desc').startAfter(this.lastVisible).limit(this.amountLoadingData)
    }
    this.result = this.activSubscribe.onSnapshot(doc => {
      this.showPreloader = false
      if (!doc.empty) {
        this.activityEmpty = false
        this.lastVisible = doc.docs[doc.docs.length - 1];
        doc.forEach(data => {
          let activity = data.data()
          activity.id = data.id
          if (activity.type == 'following') { //if 'following' -> determine the type button
            this.userDataSubscribe = this.firestore.collection('users').doc(activity.fromUser).get().subscribe(doc => {
              activity.nikname = doc.data().nikname
              activity.profilePhoto = doc.data().profilePhoto
            })
            activity.isFollowToo = this.vheckIfFollowToo(activity.fromUser)
          } else { // if 'like/comment' -> get post photo 
            this.firestore.collection('posts').doc(activity.pinPost).get().toPromise().then(doc => {
              activity.postPhoto = doc.data().photos[0]
            })
            this.firestore.collection('users').doc(activity.fromUser).get().toPromise()
              .then(usDoc => {
                activity.nikname = usDoc.data().nikname
                activity.profilePhoto = usDoc.data().profilePhoto
              })
          }
          const isExistInList = this.activities.findIndex(p => p.id == activity.id)
          isExistInList != -1
            ? this.activities.splice(isExistInList, 1, activity)
            : this.activities.push(activity)
        })
        if (doc.docs.length < this.amountLoadingData) { //if not a full portion of 'Activities' is loaded -> do not load anything more
          this.blockUpload = true
        } else {
          this.blockUpload = false
        }
      } else {
        this.activityEmpty = this.lastVisible == 0
      }
    })
  };

  ngOnDestroy() {
    !this.result || this.result()
    if (this.userDataSubscribe) {
      this.userDataSubscribe.unsubscribe() //unsubscribe from user updates
    }
  };

  vheckIfFollowToo(usId: string): boolean {
    return JSON.parse(localStorage.getItem('authUser')).following.findIndex(id_us => id_us == usId) == -1
      ? false
      : true
  };

  getContextActivity(activityType: string): string {
    if (activityType == 'following') {
      return ' started following you.'
    } else if (activityType == 'like') {
      return ' liked your photo.'
    } else {
      return ' commented your photo.'
    }
  };

  followOrUnfollow(activ: IActivity): void {
    this.spinner.show()
    if (activ.isFollowToo) { //if subscribed for user too
      this.contentService.unfollowing(JSON.parse(localStorage.getItem('authUser')).id, activ.fromUser)
        .then(() => {
          this.spinner.hide()
          activ.isFollowToo = false
          this.addOrRemoveActivity(false, activ)
        })
    } else { //if don`t subscribed for user yet
      this.contentService.following(JSON.parse(localStorage.getItem('authUser')).id, activ.fromUser)
        .then(() => {
          this.spinner.hide()
          activ.isFollowToo = true
          this.addOrRemoveActivity(true, activ)
        })
    }
  };

  addOrRemoveActivity(action: boolean, activity: IActivity) {
    if (action) { //create activity
      let newAction = new Activity(new Date(), 'following', JSON.parse(localStorage.getItem('authUser')).id, activity.fromUser)
      this.profileService.addActivity(newAction)
    } else { //delete activity
      this.profileService.deleteActivity(activity.forUser, activity.fromUser, 'following')
    }
  }
}
