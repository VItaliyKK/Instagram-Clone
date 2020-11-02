import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-tagged',
  templateUrl: './tagged.component.html',
  styleUrls: ['./tagged.component.scss']
})
export class TaggedComponent implements OnInit {
  taggeds:any[] = []
  postsEmpty:boolean = true;

  constructor() { }

  ngOnInit(): void {
    this.taggeds.length < 1 ? this.postsEmpty = true : this.postsEmpty = false
  }

}
