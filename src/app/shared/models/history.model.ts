import { IPost } from '../interfaces/post.interface';
import { IHistory } from '../interfaces/history.interface';

export class History implements IHistory {
    constructor(
        public id: number,
        public postBy: string,
        public date: Date,
        public urlPhoto: string
    ) {}
}