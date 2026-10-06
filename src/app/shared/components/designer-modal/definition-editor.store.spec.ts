import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { form, required } from '@angular/forms/signals';
import { NzModalService } from 'ng-zorro-antd/modal';
import { of } from 'rxjs';
import {
  DefinitionEditorConfig,
  DefinitionEditorStore,
  DefinitionRecord,
} from './definition-editor.store';

interface Rec extends DefinitionRecord {
  key: string;
}
interface Form {
  key: string;
  name: string;
  version: number;
  status: string;
}

const row: Rec = { id: 'p1', key: 'K-1', name: 'Order', version: 3, status: 'DRAFT' };

describe('DefinitionEditorStore', () => {
  let confirm: ReturnType<typeof vi.fn>;
  let designerDirty: boolean;
  let config: DefinitionEditorConfig<Rec, Form>;
  let store: DefinitionEditorStore<Rec, Form>;

  beforeEach(() => {
    confirm = vi.fn();
    designerDirty = false;
    TestBed.configureTestingModule({
      providers: [{ provide: NzModalService, useValue: { confirm } }],
    });

    TestBed.runInInjectionContext(() => {
      const formModel = signal<Form>({ key: '', name: '', version: 1, status: 'DRAFT' });
      const formTree = form(formModel, (s) => required(s.name));
      config = {
        formModel,
        form: formTree,
        keyField: 'key',
        entityLabel: 'Quy trình',
        designer: () => ({ hasChanges: () => designerDirty, onSave: vi.fn() }),
        createDefaults: () => ({ key: 'NEW-01', name: 'Mới', version: 1, status: 'DRAFT' }),
        toForm: (r) => ({
          key: r.key,
          name: r.name ?? '',
          version: r.version ?? 1,
          status: r.status ?? 'DRAFT',
        }),
        load: vi.fn(() => of(row)),
        create: vi.fn(() => of({})),
        update: vi.fn(() => of({})),
        remove: vi.fn(() => of(null)),
        publish: vi.fn(() => of(null)),
      };
      store = new DefinitionEditorStore(config);
    });
  });

  it('opens a row in view mode and loads its detail', () => {
    store.openView(row);
    expect(store.isOpen()).toBe(true);
    expect(store.mode()).toBe('view');
    expect(config.load).toHaveBeenCalledWith('p1');
    expect(config.formModel().name).toBe('Order');
  });

  it('closes without confirmation when nothing changed', () => {
    store.openEdit(row);
    store.requestClose();
    expect(confirm).not.toHaveBeenCalled();
    expect(store.isOpen()).toBe(false);
  });

  it('asks for confirmation when a form field changed', () => {
    store.openEdit(row);
    config.formModel.update((f) => ({ ...f, name: 'Order v2' }));
    store.requestClose();
    expect(confirm).toHaveBeenCalledOnce();
    expect(store.isOpen()).toBe(true);
  });

  it('asks for confirmation when only the designer changed', () => {
    store.openEdit(row);
    designerDirty = true;
    expect(store.hasUnsavedChanges()).toBe(true);
  });

  it('ignores the key field outside create mode and the server-managed version', () => {
    store.openEdit(row);
    config.formModel.update((f) => ({ ...f, key: 'OTHER', version: 99 }));
    expect(store.hasUnsavedChanges()).toBe(false);
  });

  it('counts the key field in create mode', () => {
    store.openCreate();
    config.formModel.update((f) => ({ ...f, key: 'CUSTOM-KEY' }));
    expect(store.hasUnsavedChanges()).toBe(true);
  });

  it('never reports changes in view mode', () => {
    store.openView(row);
    designerDirty = true;
    expect(store.hasUnsavedChanges()).toBe(false);
  });

  it('re-fetches the record when publish returns an empty body', () => {
    store.openView(row);
    (config.load as ReturnType<typeof vi.fn>).mockClear();
    store.publishSelected();
    expect(config.publish).toHaveBeenCalledWith(row);
    expect(config.load).toHaveBeenCalledWith('p1');
    expect(store.isDeploying()).toBe(false);
  });

  it('closes after deleting the selected record', () => {
    store.openEdit(row);
    store.removeSelected();
    expect(config.remove).toHaveBeenCalledWith('p1');
    expect(store.isOpen()).toBe(false);
  });
});
