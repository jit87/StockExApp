import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'transforNumber',
  standalone: true
})
export class TransforNumberPipe implements PipeTransform {

  transform(value: number | any, ...args: unknown[]): unknown {
    return value.toFixed(2);
  }

}
