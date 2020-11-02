import { IIgtv } from './../../../shared/interfaces/igtv.interface';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-igtv',
  templateUrl: './igtv.component.html',
  styleUrls: ['./igtv.component.scss']
})
export class IgtvComponent implements OnInit {
  igtvs:IIgtv[] = []
  postsEmpty:boolean = true;
  constructor() { }

  ngOnInit(): void {
    this.igtvs.length < 1 ? this.postsEmpty = true : this.postsEmpty = false
  }

}
