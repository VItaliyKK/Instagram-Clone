import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'convertDate'
})
export class ConvertDatePipe implements PipeTransform {

  transform(value: number): Date {
    let convertDate = new Date(value*1000)
    return convertDate;
  }

}
