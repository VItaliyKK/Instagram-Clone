import { DialogService } from './../../shared/services/dialog.service';
import { IMessage } from './../../shared/interfaces/message.interface';
import { DirectService } from './../../shared/services/direct.service';
import { IUser } from './../../shared/interfaces/user.interface';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { Activity } from './../../shared/models/activity.model';
import { Comment } from './../../shared/models/comments.model';
import { PostDetailsService } from './../../shared/services/post-details.service';
import { ProfileService } from './../../shared/services/profile.service';
import { AngularFirestore } from '@angular/fire/firestore';
import { IPost } from './../../shared/interfaces/post.interface';
import { Component, OnInit, ViewChild, ElementRef, TemplateRef } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  gotRes: firebase.firestore.Query<firebase.firestore.DocumentData>
  result:any
  currentUser:IUser
  posts: IPost[] | any = [];
  postLikesLength: number = 0; //number of likes in post
  addCommentInput: string = ''
  emptyListFollowing: boolean = false //to inform that "user" have empty list "following"
  lastVisible: any = 0 // for upload data a portions
  blockUpload: boolean = true //block upload a new posts
  amountLoadingData: number = 2; //number of uploading posts
  @ViewChild('bottom_content') bottomContent: ElementRef;
  modalRef: BsModalRef;
  selectedUserForSendPost: IUser[] = []
  foundUsers: IUser[] | any = []
  searchInput: string = ''
  disabledCreateDialog: boolean = true
  postIdForShare: string = ''
  showPreloader:boolean = false
  userListener: Subscription
  directDialogCreatedListener: Subscription
  postDetailsDialogCreatedListener: Subscription

  constructor(private firestore: AngularFirestore,
              private profileService: ProfileService,
              private modalService: BsModalService,
              private directService: DirectService,
              private dialogService: DialogService,
              private postDetailsService: PostDetailsService,
              private spinner: NgxSpinnerService) { }

  ngOnInit(): void {
    this.userListener = this.profileService.getUserData(JSON.parse(localStorage.getItem('authUser')).id)
    .subscribe( d => {
      this.currentUser = d
      this.loadMainPosts()
    })
  };

  ngOnDestroy() {
    !this.directDialogCreatedListener || this.directDialogCreatedListener.unsubscribe()
    !this.postDetailsDialogCreatedListener || this.postDetailsDialogCreatedListener.unsubscribe()
    this.userListener.unsubscribe()
    !this.result || this.result()
  };

  openModal(template: TemplateRef<any>, params: any = { backdrop: 'static', keyboard: false }): void {
    this.modalRef = this.modalService.show(template, params);
  };

  loadMainPosts() {
    this.blockUpload = true
    this.showPreloader = true
    if (this.currentUser.following.length != 0) {
      if (this.lastVisible == 0) {
        this.gotRes = this.firestore.collection('posts').ref.where('id', 'in', this.currentUser.following)
          .orderBy('date', 'desc').limit(this.amountLoadingData)
      } else {
        this.gotRes = this.firestore.collection('posts').ref.where('id', 'in', this.currentUser.following)
          .orderBy('date', 'desc').startAfter(this.lastVisible).limit(this.amountLoadingData)
      }
      this.result = this.gotRes.onSnapshot(data => {
        this.lastVisible = data.docs[data.docs.length - 1];
        data.forEach(docPost => {
          let post = docPost.data()
          const isExistInList = this.posts.findIndex(p => p.idPost == post.idPost)
          isExistInList != -1
            ? this.posts.splice(isExistInList, 1, this.addMethodsForPost(post))
            : this.posts.push(this.addMethodsForPost(post))
        });
        if (data.docs.length < this.amountLoadingData) { //if uploaded a not full portion posts -> don`t upload any posts
          this.blockUpload = true
        } else {
          this.blockUpload = false
        }
        this.showPreloader = false
      })
    } else {
      this.emptyListFollowing = true
      this.showPreloader = false
    }
  }

  onScroll() { //traking 'bottom content' for upload posts
    if (this.bottomContent.nativeElement.offsetTop + 45 <= window.scrollY + window.innerHeight) {
      if (!this.blockUpload) {
        this.loadMainPosts()
      }
    }
  }

  addNewComment(Post: IPost) { // add new comment
    if (this.addCommentInput != '') {
      this.spinner.show()
      const idComment = this.firestore.createId()
      const newComment = new Comment(idComment, this.currentUser.id, this.currentUser.nikname, Post.idPost, new Date(), this.addCommentInput, this.currentUser.profilePhoto)
      this.postDetailsService.addNewComment(newComment).then(() => {
        let newAction = new Activity(new Date(), 'like', this.currentUser.id, Post.id, Post.idPost, '', '', idComment)
        this.profileService.addActivity(newAction)
        this.spinner.hide()
        this.addCommentInput = ''
      })
    }
  };
  // add/remove like
  addOrRemoveLike(post: any) {
    this.spinner.show()
    if (post.isLiked) { // if 'like' is already
      this.postDetailsService.addOrRemoveLike(post.idPost, this.currentUser.id, post.likesCount, false)
        .then(() => {
          this.profileService.deleteActivity(this.currentUser.id, post.id, 'like', post.idPost)
          post.isLiked = false
          this.spinner.hide()
        })
    } else { // if haven`t "like" yet
      this.postDetailsService.addOrRemoveLike(post.idPost, this.currentUser.id, post.likesCount, true)
        .then(() => {
          let newAction = new Activity(new Date(), 'like', this.currentUser.id, post.id, post.idPost)
          this.profileService.addActivity(newAction)
          post.isLiked = true
          this.spinner.hide()
        })
    }
  };

  // adding parameters for each uploaded post
  addMethodsForPost(post: any): any {
    let modPost = post
    modPost.isLiked = modPost.likes.findIndex(el => el == this.currentUser.id) != -1 ? true : false
    modPost.isSaved = modPost.saved.findIndex(el => el == this.currentUser.id) != -1 ? true : false
    modPost.getLikesCount = () => modPost.likes.length
    modPost.getCommentsCount = () => modPost.comments.length
    modPost.postPhotosLength = modPost.photos.length
    modPost.likesCount = modPost.likes.length
    return modPost
  };

  // adding post in 'saved' list
  addOrRemoveSavedPost(post: any) {
    if (post.isSaved) {
      this.postDetailsService.addOrRemoveSavedPost(post.idPost, false)
    } else {
      this.postDetailsService.addOrRemoveSavedPost(post.idPost, true)
    }
  };

  postHasOnePhoto(post: IPost): boolean {
    return post.photos.length < 2
  };

  searchingUser() {
    if (this.searchInput != '') {
      this.showPreloader = true
      this.firestore.collection("users").ref.orderBy('nikname').startAt(this.searchInput).endAt(this.searchInput + '\uf8ff').limit(10)
        .onSnapshot(doc => {
          this.foundUsers.length = 0
          doc.forEach(el => {
            this.foundUsers.push(el.data())
          })
          this.showPreloader = false
        })
    } else {
      this.foundUsers.length = 0
    }
  };

  checkIsSelected(us: any): boolean {
    return this.selectedUserForSendPost.length == 0 ? false : this.selectedUserForSendPost[0].id == us.id
  }

  // adding/removing user in list
  addInListUserForSharedPost(us: any) {
    if (us.nikname != this.currentUser.nikname) {
      if (this.selectedUserForSendPost.length == 0) {
        this.selectedUserForSendPost[0] = us
      } else {
        this.selectedUserForSendPost[0].id == us.id
          ? this.selectedUserForSendPost = []
          : this.selectedUserForSendPost[0] = us
      }
      this.checkDisabledCreateDialog()
    }
  }

  //tracking disabled button for creating dialog
  checkDisabledCreateDialog() {
    this.selectedUserForSendPost.length == 0 ? this.disabledCreateDialog = true : this.disabledCreateDialog = false
  };

  sharePostProcess(templ: TemplateRef<any>, postID: string) {
    this.openModal(templ)
    this.postIdForShare = postID
    this.directDialogCreatedListener = this.directService.feedDialogCreated.subscribe(idDialog => {
      this.sendMessage(this.postIdForShare, idDialog)
    })
    this.postDetailsDialogCreatedListener = this.postDetailsService.feedDialogCreated.subscribe(idDialog => {
      this.sendMessage(this.postIdForShare, idDialog)
    })
  }

  sendPost() {
    this.postDetailsService.sendPost([...this.selectedUserForSendPost])
  }

  sendMessage(postIdForShare: string, idDialog:string) {
    this.spinner.show()
    let newMessage: IMessage = {
      idAuthor: this.currentUser.id,
      inDialog: idDialog,
      nikname: this.currentUser.nikname,
      date: new Date(),
      content: postIdForShare,
      type: 'post'
    }
    this.dialogService.sendMessage(newMessage).then(() => {
      this.firestore.collection('dialogs-preview').doc(idDialog).update({
        'lastActive': new Date()
      }).then(() => {
        this.spinner.hide()
        this.selectedUserForSendPost = []
        this.modalRef.hide()
      })
    })
  }
}
