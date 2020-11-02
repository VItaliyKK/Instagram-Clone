import { IPost } from './../../../shared/interfaces/post.interface';
import { ProfileService } from './../../../shared/services/profile.service';
import { Post } from './../../../shared/models/post.model';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireStorage } from '@angular/fire/storage';
import { ContentWrapperService } from './../../../shared/services/content-wrapper.service';
import { Component, ElementRef, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router, ActivatedRoute, Event, NavigationEnd } from '@angular/router';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { NgxSpinnerService } from 'ngx-spinner';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-posts',
  templateUrl: './posts.component.html',
  styleUrls: ['./posts.component.scss']
}) 
export class PostsComponent implements OnInit {
  gotRes:any
  viewAuthUser: boolean = false
  posts: any[] = []
  imgsArr: string[] = []
  description: string = ''
  location: string = ''
  id: string
  modalRef: BsModalRef;
  postsEmpty: boolean = false;
  storageListener: Subscription
  @ViewChild('bottom_content') bottomContent: ElementRef;
  lastVisible: any = 0 // для підгрузки даних порціями
  blockUpload: boolean = true //блокувати підгрузку нових постів
  amountLoadingData: number = 9; //к-сть підгрузки постів
  showPreloader:boolean = false
  postsListener:any 

  constructor(private storage: AngularFireStorage,
              private firestore: AngularFirestore,
              private profileServ: ProfileService,
              private contentService: ContentWrapperService,
              private spinner: NgxSpinnerService,
              private router: Router,
              private activeRoute: ActivatedRoute, 
              private modalService: BsModalService) {
    this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationEnd) {
        let urlNow = this.router.routerState.snapshot.url
        let urlParams = urlNow.split('/');
        let newUserId = this.activeRoute.snapshot.paramMap.get('id')
        // urlParams.length == 4 --> ''/profile/posts/:id --> для того щоб при відкриванні post-details не підгружались дані user
        if (this.id != newUserId && urlParams.length == 4) {
          this.id = newUserId
          this.viewAuthUser = this.profileServ.checkIfViewAuthUserProfile(this.id)
          this.getContent('posts', this.id)
        }
      }
    });
  }

  ngOnInit(): void {
  };

  ngOnDestroy(){
    if (this.postsListener){
      this.postsListener()
    }
    if (this.storageListener){
      this.storageListener.unsubscribe()
    }
  };

  onScroll() { //відслідкувати bottom контенту для підгрузки Activities
    console.log(this.bottomContent.nativeElement.offsetTop + 54 <= window.scrollY + window.innerHeight);
    if (this.bottomContent.nativeElement.offsetTop + 54 <= window.scrollY + window.innerHeight) {
      if (!this.blockUpload) {
        console.log(`Підгрузити наступні ${this.amountLoadingData} постів`)
        this.getContent('posts', this.id)
      }
    }
  }

  openModal(template: TemplateRef<any>): void {
    this.modalRef = this.modalService.show(template, {backdrop: 'static', keyboard: false});
  };

  getContent(type: string, userID: string): void {
    this.showPreloader = true
    this.blockUpload = true
    this.gotRes = this.contentService.getContentByTypeAndID(type, userID, this.amountLoadingData, this.lastVisible)
    if (this.lastVisible == 0) {
      this.amountLoadingData = 6
    }
    this.postsListener = this.gotRes.onSnapshot( collection => {
      if (collection.empty){
        this.postsEmpty = true
        this.showPreloader = false
      } else {
        this.postsEmpty = false
        this.lastVisible = collection.docs[collection.docs.length - 1];
        collection.forEach(document => {
          const data = document.data();
          const isExistInList = this.posts.findIndex(p => p.idPost == data.idPost)
          isExistInList != -1
              ? this.posts.splice(isExistInList, 1, data)
              : this.posts.push(data)
        })
        if (collection.docs.length < this.amountLoadingData){
          this.blockUpload = true
        } else {
          this.blockUpload =  false
        }
        console.log('this.posts', this.posts)
        this.showPreloader = false
      }
    })
  };

  uploadNewPostPhoto(e) {
    if (e.target.files.length <= 5 && e.target.files.length > 0) { //якщо завантажено не більше 5 фото
      this.spinner.show()
      let arrPhotos: File[] = Array.from(e.target.files)
      arrPhotos.forEach( el => {
        const type = el.type.slice(el.type.indexOf('/') + 1);
        const randomName = this.firestore.createId()
        const filePath = `posts/${randomName}.${type}`;
        this.storage.upload(filePath, el).then(image => {
          this.storageListener =  this.storage.ref(`posts/${image.metadata.name}`).getDownloadURL().subscribe(url => {
            this.imgsArr.push(url)
          })
          this.spinner.hide()
        })
      })
    }
  };

  addPost() {
    if (this.imgsArr.length != 0) {
      this.spinner.show()
      let localUs = JSON.parse(localStorage.getItem('authUser'))
      let futureDocPostId = this.firestore.createId()
      let newPost = new Post(localUs.id, futureDocPostId, localUs.nikname, new Date(), this.description, this.location, [], this.imgsArr, [], localUs.profilePhoto,[],0)
      this.contentService.addNewPost(newPost, futureDocPostId).then(() => {
        this.spinner.hide()
        this.resetAddPostForm()
      });
    }
  }

  resetAddPostForm() {
    this.imgsArr.length = 0
    this.description = ''
    this.location = ''
    this.modalRef.hide();
  }
  //отримати дані при hover на пост
  getLikesAndCommentsCounts(type: string, index: number): number {
    if (type == 'likes') {
      return this.posts[index].likes.length
    } else if (type == 'comments') {
      return this.posts[index].comments.length
    }
  }

  postHasOnePhoto(post:IPost):boolean{
    return post.photos.length < 2
  }
}
