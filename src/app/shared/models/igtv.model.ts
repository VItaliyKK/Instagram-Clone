import { IIgtv } from './../interfaces/igtv.interface';

export class Igtv implements IIgtv {
    constructor(
        public id: number,
        public postBy: string,
        public date: Date,
        public urlVideo: string,
    ) {}
}