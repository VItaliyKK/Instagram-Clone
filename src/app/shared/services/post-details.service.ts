import { Subject } from 'rxjs';
import { DirectService } from './direct.service';
import { IUser } from './../interfaces/user.interface';
import { NgxSpinnerService } from 'ngx-spinner';
import { AngularFireStorage } from '@angular/fire/storage';
import { IPost } from './../interfaces/post.interface';
import { IComment } from './../interfaces/comment.interface';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/firestore';
import * as firebase from 'firebase/app';

@Injectable({
  providedIn: 'root'
})
export class PostDetailsService {
  feedDialogCreated: Subject<any> = new Subject<any>()

  constructor(private router: Router,
              private directService: DirectService,
              private spinner: NgxSpinnerService,
              private firestore: AngularFirestore,
              private storage: AngularFireStorage) { }

  getIdPostThroughUrl(): string {
    let urlNow = this.router.routerState.snapshot.url
    let urlParans = urlNow.split('/');
    return urlParans[urlParans.length - 1]
  };
  
  getPostDataThroughIdPost(idPost: string) {
    return this.firestore.collection('posts').ref.where('idPost', '==', idPost)
  };
  
  getCommentsForActivePost(idPost: string) {
    return this.firestore.collection('comments').ref.where('idPinPost', '==', idPost).orderBy('date')
  };
  
  addNewComment(newComment: IComment): Promise<void> {
    return this.firestore.collection('comments').doc(newComment.idComment).set(Object.assign({}, newComment))
      .then(() => {
        this.firestore.collection('posts').doc(newComment.idPinPost).update({
          'comments': firebase.firestore.FieldValue.arrayUnion(newComment.idComment)
        })
      })
  };
  
  deleteComment(idComment: string, idPost: string): Promise<void> {
    return this.firestore.collection('comments').doc(idComment).delete().then(() => {
      this.firestore.collection('posts').doc(idPost).update({
        'comments': firebase.firestore.FieldValue.arrayRemove(idComment)
      })
    })
  };
  
  addOrRemoveLike(idPost: string, userWhoLiked: string, likesLength: number, action: boolean): Promise<void> {
    return this.firestore.collection('posts').doc(idPost).update({
      'likes': action
        ? firebase.firestore.FieldValue.arrayUnion(userWhoLiked)
        : firebase.firestore.FieldValue.arrayRemove(userWhoLiked),
      'likesCount': action
        ? likesLength + 1
        : likesLength - 1
    })
  };
  
  deletePost(Post: IPost): Promise<void> {
    //delete link in firestore/user/posts
    return this.firestore.collection('users').doc(Post.id).update({
      'posts': firebase.firestore.FieldValue.arrayRemove(Post.idPost)
    }).then(() => {
      //delete all comments to post
      Post.comments.forEach((c, i) => {
        this.firestore.collection('comments').doc(Post.comments[i]).delete()
      })
    }).then(() => {
      // delete post from firestore/posts
      this.firestore.collection('posts').doc(Post.idPost).delete().then(() => {
      })
    }).then(() => {
      //delete all photos from storage
      Post.photos.forEach(photo => {
        this.storage.ref(`posts/${photo}.jpeg`).delete().subscribe(() => {
        })
      })
    })
  };

  addOrRemoveSavedPost(postId: string, action: boolean) {
    const authUserId = JSON.parse(localStorage.getItem('authUser')).id
    this.firestore.collection('posts').doc(postId).update({
      'saved': action 
        ? firebase.firestore.FieldValue.arrayUnion(authUserId)
        : firebase.firestore.FieldValue.arrayRemove(authUserId)
    }).then(() => {
      this.firestore.collection('users').doc(authUserId).update({
        'saved': action 
          ? firebase.firestore.FieldValue.arrayUnion(postId)
          : firebase.firestore.FieldValue.arrayRemove(postId)
      })
    })
  };

  sendPost(userId: IUser[]) {
    this.spinner.show()
    let searchDialogs = []
    this.firestore.collection('dialogs-preview').ref.where('users', 'array-contains', JSON.parse(localStorage.getItem('authUser')).id)
      .get().then(doc => {
        if (!doc.empty) { // if authUser already has at least 1 dialog
          doc.forEach(obj => {
            searchDialogs.push(obj.data())
          })

          let includeUser = false
          searchDialogs.forEach( dialogPreview => {
            if (dialogPreview.type == 'private') {
              let include = dialogPreview.users.findIndex((usId) => usId == userId[0].id)
              if (include != -1) {
                includeUser = true
                this.feedDialogCreated.next(dialogPreview.idDialogPreview)
              }
            }
          })
          if (!includeUser) {
            this.directService.createDialog([JSON.parse(localStorage.getItem('authUser')), userId[0]], false)
          }
        } else {
          this.directService.createDialog([JSON.parse(localStorage.getItem('authUser')), userId[0]], false)
        }
      })
  };
}
