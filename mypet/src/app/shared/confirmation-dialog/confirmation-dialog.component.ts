import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirmation-dialog.component.html',
  styleUrls: ['./confirmation-dialog.component.scss']
})
export class ConfirmationDialogComponent {
  @Input() title: string = 'Confirm Delete';
  @Input() message: string = 'Are you sure you want to delete this item?';
  @Input() confirmButtonText: string = 'Delete';
  @Input() cancelButtonText: string = 'Cancel';
  @Input() confirmButtonColor: string = '#4f46e5';
  @Input() isDeleting: boolean = false;
  
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  onConfirm() {
    this.confirmed.emit();
  }

  onCancel() {
    this.cancelled.emit();
  }
}