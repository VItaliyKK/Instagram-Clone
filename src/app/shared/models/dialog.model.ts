import { IMessage } from './../interfaces/message.interface';
import { IDialog } from './../interfaces/dialog.interface';

export class Dialog implements IDialog {
    constructor(
        public idDialog: string,
        public type: string,
        public users: string[]
    ) { }
}