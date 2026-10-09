import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector: 'app-json-form-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, NzIconModule],
  templateUrl: './json-form-editor.component.html',
  styleUrl: './json-form-editor.component.scss',
})
export class JsonFormEditorComponent {
  readonly jsonText = input<string>('{}');
  readonly jsonError = input<string | null>(null);
  readonly readOnly = input<boolean>(false);

  readonly textChange = output<string>();
  readonly formatRequested = output<void>();
  readonly clearRequested = output<void>();
  readonly copyRequested = output<void>();
}
