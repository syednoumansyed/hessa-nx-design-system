import { CommonModule } from '@angular/common';
import { Component, input, OnInit } from '@angular/core';
@Component({
  selector: 'app-student-names',
  templateUrl: './student-names.component.html',
  standalone: true,
  imports: [CommonModule],
})
export class StudentNamesComponent implements OnInit {
  students = input<string[]>([
    'Aly Mohamed Abduljawad',
    'Bin Ali Hassan Mahmoud',
    'Sara Ahmed Saleh',
  ]);

  ngOnInit() {}
}
