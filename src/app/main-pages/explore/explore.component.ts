import { AngularFirestore } from '@angular/fire/firestore';
import { IPost } from './../../shared/interfaces/post.interface';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-explore',
  templateUrl: './explore.component.html',
  styleUrls: ['./explore.component.scss']
})
export class ExploreComponent implements OnInit {
  gotRes: firebase.firestore.Query<firebase.firestore.DocumentData>
  posts:IPost[] | any = []
  @ViewChild('bottom_content') bottomContent: ElementRef;
  lastVisible: 0 | firebase.firestore.QueryDocumentSnapshot<firebase.firestore.DocumentData> = 0 // for upload a portion data
  blockUpload:boolean = true // block the loading of new posts
  amountLoadingData:number = 15; //number of upload post
  showPreloader:boolean = false
  
  constructor(private firestore: AngularFirestore) { }

  ngOnInit(): void {
    this.posts = []
    this.loadTopPosts()
  };

  onScroll() {
    if (this.bottomContent.nativeElement.offsetTop + 40 <= window.scrollY + window.innerHeight) {
      if (!this.blockUpload) {
        this.loadTopPosts()
      }
    }
  }

  loadTopPosts(){
    this.blockUpload = true
    this.showPreloader = true
    if (this.lastVisible == 0) {
      this.gotRes = this.firestore.collection('posts').ref.orderBy('likesCount', 'desc').limit(this.amountLoadingData)
      this.amountLoadingData = 6
    } else {
      this.gotRes = this.firestore.collection('posts').ref.orderBy('likesCount', 'desc').startAfter(this.lastVisible).limit(this.amountLoadingData)
    }
    this.gotRes.onSnapshot(doc => {
      this.lastVisible = doc.docs[doc.docs.length-1];
      doc.forEach( postDoc => {
        let post = postDoc.data()
        post.likesCount = post.likes.length
        post.commentsCount = post.comments.length
        post.multiplePhotos = post.photos.length
        const isExistInList = this.posts.findIndex( p => p.idPost == post.idPost)
        isExistInList != -1
                        ? this.posts.splice(isExistInList, 1, post)
                        : this.posts.push(post)
      })
      if (doc.docs.length < this.amountLoadingData) { //if uploaded a not full portion posts -> don`t upload any posts
        this.blockUpload = true 
      } else {
        this.blockUpload = false
      }
      this.showPreloader = false
    })
  };
}
