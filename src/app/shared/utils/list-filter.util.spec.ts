import { createListFilter } from './list-filter.util';

describe('createListFilter', () => {
  const defaults = { search: '', status: 'ALL', version: '' as string | number | null };

  it('starts unfiltered', () => {
    const filter = createListFilter(defaults);
    expect(filter.activeCount()).toBe(0);
    expect(filter.isFiltered()).toBe(false);
  });

  it('counts fields that differ from their default', () => {
    const filter = createListFilter(defaults);
    filter.patch({ search: 'order', status: 'DRAFT' });
    expect(filter.activeCount()).toBe(2);
    expect(filter.isFiltered()).toBe(true);
  });

  it('ignores whitespace-only strings and null', () => {
    const filter = createListFilter(defaults);
    filter.patch({ search: '   ', version: null });
    expect(filter.activeCount()).toBe(0);
  });

  it('treats a numeric value as active', () => {
    const filter = createListFilter(defaults);
    filter.patch({ version: 2 });
    expect(filter.activeCount()).toBe(1);
  });

  it('reset restores the defaults without sharing the object', () => {
    const filter = createListFilter(defaults);
    filter.patch({ status: 'PUBLISHED' });
    filter.reset();
    expect(filter.model()).toEqual(defaults);
    expect(filter.model()).not.toBe(defaults);
  });
});
