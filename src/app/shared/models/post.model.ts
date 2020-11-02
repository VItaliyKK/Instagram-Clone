import { IPost } from './../interfaces/post.interface';

export class Post implements IPost {
    constructor(
        public id: string,
        public idPost: string,
        public postBy: string,
        public date: Date,
        public description: string,
        public location: string,
        public likes: string[],
        public photos: string[],
        public comments: string[],
        public profilePhoto: string,
        public saved: string[],
        public likesCount: number = likes.length
    ) {}
}