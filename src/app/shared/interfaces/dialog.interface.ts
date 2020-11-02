import { IMessage } from './message.interface';

export interface IDialog {
    idDialog: string;
    type: string;
    users: string[];
}