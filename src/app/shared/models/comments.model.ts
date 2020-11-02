import { IComment } from './../interfaces/comment.interface';

export class Comment implements IComment {
    constructor(
        public idComment:string,
        public idUser:string,
        public postBy: string,
        public idPinPost: string,
        public date: Date,
        public text: string,
        public userPhoto: string
    ) {}
}