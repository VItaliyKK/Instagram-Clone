import { IUser } from './../../shared/interfaces/user.interface';
import { DirectService } from './../../shared/services/direct.service';
import { DialogService } from './../../shared/services/dialog.service';
import { IMessage } from './../../shared/interfaces/message.interface';
import { Activity } from './../../shared/models/activity.model';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { AngularFirestore } from '@angular/fire/firestore';
import { Comment } from './../../shared/models/comments.model';
import { ProfileService } from './../../shared/services/profile.service';
import { IPost } from './../../shared/interfaces/post.interface';
import { PostDetailsService } from './../../shared/services/post-details.service';
import { Component, ElementRef, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { IComment } from 'src/app/shared/interfaces/comment.interface';

@Component({
  selector: 'app-post-details',
  templateUrl: './post-details.component.html',
  styleUrls: ['./post-details.component.scss']
})
export class PostDetailsComponent implements OnInit {
  gotRes:any
  currentPost: IPost | any = {};
  photosPost: string[] = []
  loadingComments: boolean = false
  commentTextarea: string = ''
  //slide-show
  postPhotosLength: number = 1;
  activePhotoPost: number = 1;
  firstPhotoPostActive: boolean = true
  lastPhotoPostActive: boolean = false
  comments: IComment[] | firebase.firestore.DocumentData = []
  modalRef: BsModalRef;
  viewAuthUserPost: boolean = false;
  @ViewChild('postDetails') postDetails: ElementRef;
  scrollPhotoWidth: number = 600
  postIdForShare:string = ''
  selectedUserForSendPost: any[] = []
  foundUsers: IUser[] | any = []
  searchInput: string = ''
  disabledCreateDialog: boolean = true

  constructor(private router: Router,
              private spinner: NgxSpinnerService,
              private firestore: AngularFirestore,
              private directService: DirectService,
              private dialogService: DialogService,
              private profileServ: ProfileService,
              private modalService: BsModalService,
              private postDetailsService: PostDetailsService,
              private activeRoute: ActivatedRoute
  ) { }

  ngOnInit(): void {
    let newIdPost = this.activeRoute.snapshot.paramMap.get('idPost')
    if (this.currentPost.id != newIdPost) {
      this.currentPost.id = newIdPost;
      this.loadFullInfoPost()
    }
  };
  
  ngOnDestroy(){
    !this.gotRes || this.gotRes()
  };

  ngAfterViewInit() { //отримати width контенту
    if (this.postDetails.nativeElement.offsetWidth <= 650) {
      this.scrollPhotoWidth = this.postDetails.nativeElement.offsetWidth 
    } else if (this.postDetails.nativeElement.offsetWidth <= 800) {
      this.scrollPhotoWidth = 400
    } else if (this.postDetails.nativeElement.offsetWidth <= 975) {
      this.scrollPhotoWidth = 500
    } else {
      this.scrollPhotoWidth = 600
    }
  }

  onResizeWindow(e){
    if (e.target.innerWidth <= 650) {
      this.scrollPhotoWidth = this.postDetails.nativeElement.offsetWidth
    } else if (e.target.innerWidth <= 800) {
      this.scrollPhotoWidth = 400
    } else if (e.target.innerWidth <= 975) {
      this.scrollPhotoWidth = 500
    } else {
      this.scrollPhotoWidth = 600
    }
  }
  //get post info
  loadFullInfoPost():void{
    this.spinner.show()
    this.gotRes = this.postDetailsService.getPostDataThroughIdPost(this.currentPost.id).onSnapshot(
      collection => {
        this.spinner.hide()
        if (collection.docs.length == 0) {
          this.router.navigateByUrl(`/not-exist`)
        } else {
          collection.forEach(post => {
          this.currentPost = post.data();
          this.postPhotosLength = this.currentPost.photos.length
          this.photosPost = this.currentPost.photos
          this.viewAuthUserPost = this.currentPost.id == JSON.parse(localStorage.getItem('authUser')).id
          this.currentPost.isLiked = this.currentPost.likes.includes(JSON.parse(localStorage.getItem('authUser')).id)
          this.currentPost.isSaved = this.currentPost.saved.includes(JSON.parse(localStorage.getItem('authUser')).id)
          if (this.currentPost.comments.length != 0) {
            this.loadingComments = true  
            this.postDetailsService.getCommentsForActivePost(this.currentPost.idPost)
            .onSnapshot( collection => {
              this.loadingComments = false
              this.comments.length = 0
              collection.forEach( (data) => {
                this.comments.push(data.data())
              })
            })
          }
          })
        }
      }
    )
  };

  openModal(template: TemplateRef<any>): void {
    this.modalRef = this.modalService.show(template);
  }

  //close PostDetailsComponent
  closePostDetailsComponent() {
    let urlNow = this.router.routerState.snapshot.url
    if (urlNow.includes('saved')){
      this.router.navigateByUrl(`profile/saved/${JSON.parse(localStorage.getItem('authUser')).id}`)
    } else {
      let urlParams = urlNow.split('/');
      urlParams.splice(urlParams.length-1, 1)
      this.router.navigateByUrl(urlParams.join('/'))
    }
  }
  // adding / deleting like 
  addOrRemoveLike(){
    this.spinner.show()
    if(this.currentPost.isLiked){ // if 'like' already have
      this.postDetailsService.addOrRemoveLike(this.currentPost.idPost, JSON.parse(localStorage.getItem('authUser')).id, this.currentPost.likesCount, false)
      .then( () => {
        this.profileServ.deleteActivity(JSON.parse(localStorage.getItem('authUser')).id, this.currentPost.id, 'like', this.currentPost.idPost)
        this.currentPost.isLiked = false
        this.spinner.hide()
      })
    } else { // if 'like' has not yet
      this.postDetailsService.addOrRemoveLike(this.currentPost.idPost, JSON.parse(localStorage.getItem('authUser')).id, this.currentPost.likesCount, true)
        .then( () => {
          let newAction = new Activity(new Date(), 'like', JSON.parse(localStorage.getItem('authUser')).id, this.currentPost.id, this.currentPost.idPost)
          this.profileServ.addActivity(newAction)
          this.currentPost.isLiked = true
          this.spinner.hide()
        })
    }
  };
  // adding new comment
  addNewComment(){
    if (this.commentTextarea != '') {
      this.spinner.show()
      const localData = JSON.parse(localStorage.getItem('authUser'))
      const idComment = this.firestore.createId()
      const newComment = new Comment(idComment,localData.id , localData.nikname, this.currentPost.idPost, new Date(), this.commentTextarea, localData.profilePhoto)
      this.postDetailsService.addNewComment(newComment).then( () => {
        let newAction = new Activity(new Date(), 'comment', JSON.parse(localStorage.getItem('authUser')).id, this.currentPost.id, this.currentPost.idPost,'','',idComment)
        this.profileServ.addActivity(newAction)
        this.spinner.hide()
        this.commentTextarea = ''
      })
    }
  };
  // delete selected comment
  deleteComment(idComment:string, idPost: string){
    this.postDetailsService.deleteComment(idComment, idPost).then( () => {
      this.profileServ.deleteActivity(JSON.parse(localStorage.getItem('authUser')).id, this.currentPost.id, 'comment', this.currentPost.idPost,idComment)
    })
  };
  // check if comment belongs to an authorized user
  checkIfViewOwnerComment(idUserComment:string):boolean{
    return idUserComment == JSON.parse(localStorage.getItem('authUser')).id
  };
  //delete current post
  deleteCurrentPost(){
    this.spinner.show()
    this.postDetailsService.deletePost(this.currentPost).then(()=>{
      this.spinner.hide()
      this.modalRef.hide()
      this.closePostDetailsComponent()
    })
  };
  // adding post in 'saved' list
  addOrRemoveSavedPost(){
    if (this.currentPost.isSaved){
      this.postDetailsService.addOrRemoveSavedPost(this.currentPost.idPost, false)
    } else {
      this.postDetailsService.addOrRemoveSavedPost(this.currentPost.idPost, true)
    }
  };

  postHasOnePhoto():boolean{
    return this.photosPost.length < 2
  };

  sharePostProcess(templ: TemplateRef<any>, postID: string) {
    this.openModal(templ)
    this.postIdForShare = postID
    this.directService.feedDialogCreated.subscribe(idDialog => {
      this.sendMessage(this.postIdForShare, idDialog)
    })
    this.postDetailsService.feedDialogCreated.subscribe(idDialog => {
      this.sendMessage(this.postIdForShare, idDialog)
    })
  };

  sendMessage(postIdForShare: string, idDialog:string) {
    this.spinner.show()
    let newMessage: IMessage = {
      idAuthor: JSON.parse(localStorage.getItem('authUser')).id,
      inDialog: idDialog,
      nikname: JSON.parse(localStorage.getItem('authUser')).nikname,
      date: new Date(),
      content: postIdForShare,
      type: 'post'
    }
    this.dialogService.sendMessage(newMessage).then(() => {
      this.firestore.collection('dialogs-preview').doc(idDialog).update({
        'lastActive': new Date()
      }).then(() => {
        this.selectedUserForSendPost = []
        this.modalRef.hide()
        this.spinner.hide()
      })
    })
  };

  searchingUser() {
    if (this.searchInput != '') {
      this.firestore.collection("users").ref.orderBy('nikname').startAt(this.searchInput).endAt(this.searchInput + '\uf8ff').limit(10)
        .onSnapshot(doc => {
          this.foundUsers.length = 0
          doc.forEach(el => {
            this.foundUsers.push(el.data())
          })
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
    if (us.nikname != JSON.parse(localStorage.getItem('authUser')).nikname) {
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

  sendPost() {
    this.postDetailsService.sendPost([...this.selectedUserForSendPost])
  }
}
