import { IActivity } from './../interfaces/activity.interface';


export class Activity implements IActivity{
    constructor(
        public date: Date,
        public type: 'following' | 'like' | 'comment',
        public fromUser:string,
        public forUser:string,
        public pinPost: string = '',
        public nikname: string = '',
        public profilePhoto: string = '',
        public idComment: string = ''
    ) { }
}