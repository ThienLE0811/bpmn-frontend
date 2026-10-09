import { Provider } from '@angular/core';
import { of, Subject } from 'rxjs';
import { NzIconService } from 'ng-zorro-antd/icon';

export function provideTestIcons(): Provider {
  const dummySvg = () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 1024 1024');
    return svg;
  };

  return {
    provide: NzIconService,
    useValue: {
      getRenderedContent: () => of(dummySvg()),
      createIconfontIcon: () => dummySvg(),
      normalizeSvgElement: () => {},
      addIcon: () => {},
      addIconLiteral: () => {},
      configUpdated$: new Subject(),
      _disableDynamicLoading: true,
      _svgDefinitions: new Map(),
    },
  };
}
