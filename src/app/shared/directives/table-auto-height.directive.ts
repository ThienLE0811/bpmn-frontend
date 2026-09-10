import {
  Directive,
  ElementRef,
  inject,
  input,
  numberAttribute,
  booleanAttribute,
  output,
  signal,
  AfterViewInit,
  OnDestroy,
  Renderer2,
  NgZone,
} from '@angular/core';

/**
 * Directive tự động tính toán chiều cao tối đa cho table (hoặc nz-table),
 * đảm bảo toàn bộ table + header + pagination nằm vừa vặn hoàn hảo trong Viewport / Container (.app-content),
 * triệt tiêu hoàn toàn thanh cuộn dọc ngoài cùng trên mọi màn hình (BPMN, DMN, Users, Operate).
 */
@Directive({
  selector: '[appTableAutoHeight]',
  standalone: true,
  exportAs: 'appTableAutoHeight',
})
export class TableAutoHeightDirective implements AfterViewInit, OnDestroy {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);
  private ngZone = inject(NgZone);

  /** Khoảng cách bù trừ bổ sung nếu muốn (px, mặc định 0) */
  readonly extraOffset = input<number, unknown>(0, { transform: numberAttribute });

  /** Chiều cao tối thiểu của vùng bảng cuộn (px, mặc định 80) */
  readonly minHeight = input<number, unknown>(80, { transform: numberAttribute });

  /** Giới hạn chiều cao tối đa nếu muốn (px) */
  readonly maxHeight = input<number | undefined, unknown>(undefined, {
    transform: (v: unknown) => (v !== undefined && v !== null && v !== '' ? numberAttribute(v) : undefined),
  });

  /** Tự động phát hiện và trừ chiều cao của .app-footer nếu không nằm trong .app-content */
  readonly includeFooter = input<boolean, unknown>(true, { transform: booleanAttribute });

  /** Tự động áp dụng sticky header cho các thẻ th */
  readonly autoStickyHeader = input<boolean, unknown>(true, { transform: booleanAttribute });

  /** Bù trừ thủ công thêm (px) */
  readonly manualOffset = input<number, unknown>(0, { transform: numberAttribute });

  /** Event phát ra chiều cao được tính toán */
  readonly heightChange = output<number>();

  /** Signal lưu chiều cao hiện tại */
  readonly currentHeight = signal<number>(300);

  private resizeObserver?: ResizeObserver;
  private mutationObserver?: MutationObserver;
  private windowResizeListener?: () => void;
  private animationTimer?: ReturnType<typeof setTimeout>;
  private rafId?: number;
  private lastComputedHeight = -1;

  ngAfterViewInit(): void {
    this.ngZone.runOutsideAngular(() => {
      // 1. Tính toán lần đầu sau khi view render
      this.scheduleRecalculate();

      // 2. Lắng nghe window resize
      this.windowResizeListener = () => {
        this.scheduleRecalculate();
      };
      window.addEventListener('resize', this.windowResizeListener, { passive: true });

      // 3. ResizeObserver theo dõi .app-content và các khối liên quan
      if (typeof ResizeObserver !== 'undefined') {
        const host = this.el.nativeElement as HTMLElement;
        const appContent = host.closest('.app-content') || host.closest('.main-content') || host.parentElement;

        if (appContent) {
          this.resizeObserver = new ResizeObserver(() => {
            this.scheduleRecalculate();
          });
          this.resizeObserver.observe(appContent);
        }

        // Theo dõi thêm toolbar nếu có
        const card = host.closest('.table-card') || host.closest('.table-container');
        if (card) {
          const toolbar = card.querySelector('.table-toolbar') || card.querySelector('.filter-toolbar');
          if (toolbar) this.resizeObserver?.observe(toolbar);
        }
      }

      // 4. MutationObserver theo dõi DOM (toggle stats, filter panels, data load)
      if (typeof MutationObserver !== 'undefined') {
        const host = this.el.nativeElement as HTMLElement;
        const observeTarget = host.closest('.app-content') || host.closest('.main-content') || host.parentElement || document.body;
        if (observeTarget) {
          this.mutationObserver = new MutationObserver((mutations) => {
            let shouldRecalculate = false;
            for (const m of mutations) {
              if (
                m.type === 'attributes' &&
                m.attributeName === 'style' &&
                (m.target === host ||
                  (m.target as HTMLElement).classList?.contains('ant-table-content') ||
                  (m.target as HTMLElement).classList?.contains('ant-table-body'))
              ) {
                continue;
              }
              shouldRecalculate = true;
              break;
            }

            if (shouldRecalculate) {
              this.scheduleRecalculate();
              // Panel trượt mở rộng thường có animation 250ms -> tính lại ngay sau khi hoàn tất animation
              clearTimeout(this.animationTimer);
              this.animationTimer = setTimeout(() => {
                this.scheduleRecalculate();
              }, 280);
            }
          });

          this.mutationObserver.observe(observeTarget, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class'],
          });
        }
      }
    });
  }

  ngOnDestroy(): void {
    if (this.windowResizeListener) {
      window.removeEventListener('resize', this.windowResizeListener);
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }
    if (this.animationTimer) {
      clearTimeout(this.animationTimer);
    }
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
  }

  /**
   * Lên lịch tính toán chiều cao thông qua requestAnimationFrame để tối ưu hiệu năng 60fps
   */
  scheduleRecalculate(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
    this.rafId = requestAnimationFrame(() => {
      this.recalculate();
    });
  }

  /**
   * Phương thức tính toán và cập nhật style cho container bảng
   */
  recalculate(): void {
    const host = this.el.nativeElement as HTMLElement;
    if (!host || !host.isConnected) return;

    // Tìm vùng cuộn của bảng: ưu tiên .ant-table-body (khi dùng nzScroll) hoặc .ant-table-content (mặc định)
    const scrollContainer = (
      host.querySelector('.ant-table-body') ||
      host.querySelector('.ant-table-content') ||
      host
    ) as HTMLElement;

    if (!scrollContainer) return;

    // Tìm container cha cuộn chính của ứng dụng (.app-content)
    const appContent = host.closest('.app-content') as HTMLElement | null;
    const isInsideAppContent = !!appContent;

    // Nếu appContent đang bị trôi cuộn xuống một chút, lấy giá trị scrollTop để bù trừ
    const appContentScrollTop = appContent ? appContent.scrollTop : (window.scrollY || window.pageYOffset || 0);

    // Chiều cao hiển thị thực tế của khu vực content (giữa header và footer)
    const visibleHeight = appContent
      ? appContent.clientHeight
      : (document.documentElement.clientHeight || window.innerHeight);

    // Vị trí của scrollContainer so với đỉnh của khu vực content
    const appContentRect = appContent ? appContent.getBoundingClientRect() : { top: 0 };
    const containerRect = scrollContainer.getBoundingClientRect();
    const containerTop = (containerRect.top - appContentRect.top) + appContentScrollTop;

    if (containerTop <= 0 && containerRect.height === 0) return;

    // 1. Đo chiều cao pagination
    let paginationHeight = 0;
    const paginationEl = (
      host.querySelector('.ant-table-pagination') ||
      host.querySelector('.ant-pagination') ||
      host.querySelector('nz-pagination') ||
      host.parentElement?.querySelector('.ant-table-pagination') ||
      host.parentElement?.querySelector('.ant-pagination')
    ) as HTMLElement | null;

    if (paginationEl && paginationEl.offsetParent !== null && paginationEl.offsetHeight > 0) {
      const pagStyle = window.getComputedStyle(paginationEl);
      const marginTop = parseFloat(pagStyle.marginTop) || 0;
      const marginBottom = parseFloat(pagStyle.marginBottom) || 0;
      paginationHeight = paginationEl.offsetHeight + marginTop + marginBottom;
    } else {
      paginationHeight = 56;
    }

    // 2. Đo khoảng cách bên trong card dưới scrollContainer (padding đáy parent element + border card)
    let cardBottomSpace = 0;
    const parentEl = host.parentElement;
    if (parentEl) {
      const parentStyle = window.getComputedStyle(parentEl);
      cardBottomSpace += parseFloat(parentStyle.paddingBottom) || 0;
    }
    const cardEl = (host.closest('.table-card') || host.closest('.table-container')) as HTMLElement | null;
    if (cardEl) {
      const cardStyle = window.getComputedStyle(cardEl);
      cardBottomSpace += parseFloat(cardStyle.borderBottomWidth) || 0;
    }

    // 3. Đo lề đáy của layout trang (.users-list-layout, .bpmn-list-layout, .dmn-list-layout, .operate-page)
    let layoutBottomPadding = 0;
    const layoutContainer = (
      host.closest('.users-list-layout') ||
      host.closest('.bpmn-list-layout') ||
      host.closest('.dmn-list-layout') ||
      host.closest('.operate-page') ||
      (appContent ? appContent.firstElementChild : null)
    ) as HTMLElement | null;

    if (layoutContainer) {
      const layoutStyle = window.getComputedStyle(layoutContainer);
      layoutBottomPadding = parseFloat(layoutStyle.paddingBottom) || 0;
    }
    if (layoutBottomPadding === 0) {
      layoutBottomPadding = 24;
    }

    // 4. Nếu không nằm trong app-content (fallback độc lập), cần đo footer
    let footerHeight = 0;
    if (!isInsideAppContent && this.includeFooter()) {
      const footerEl = document.querySelector('.app-footer') as HTMLElement | null;
      if (footerEl && footerEl.offsetHeight > 0) {
        const footerStyle = window.getComputedStyle(footerEl);
        footerHeight = footerEl.offsetHeight + (parseFloat(footerStyle.marginTop) || 0) + (parseFloat(footerStyle.marginBottom) || 0);
      }
    }

    // 5. Buffer an toàn (16px) đảm bảo tổng chiều cao luôn nhỏ hơn visibleHeight
    const safetyBuffer = 16;

    const totalBottomGap =
      paginationHeight +
      cardBottomSpace +
      layoutBottomPadding +
      footerHeight +
      this.extraOffset() +
      this.manualOffset() +
      safetyBuffer;

    const available = visibleHeight - containerTop - totalBottomGap;
    // Bảng co giãn linh hoạt theo available, không bao giờ ép tăng vượt quá available
    let computedHeight = Math.max(60, Math.floor(available));

    const maxH = this.maxHeight();
    if (maxH !== undefined && maxH > 0 && computedHeight > maxH) {
      computedHeight = maxH;
    }

    // Tránh re-render style liên tục nếu giá trị chênh lệch dưới 1px
    if (Math.abs(this.lastComputedHeight - computedHeight) < 1) {
      return;
    }
    this.lastComputedHeight = computedHeight;

    // Cập nhật style trực tiếp lên scrollContainer
    this.renderer.setStyle(scrollContainer, 'max-height', `${computedHeight}px`);
    this.renderer.setStyle(scrollContainer, 'overflow-y', 'auto');
    this.renderer.setStyle(scrollContainer, 'overflow-x', 'auto');

    // Ghim tiêu đề cột thead nếu được bật
    if (this.autoStickyHeader()) {
      const thElements = scrollContainer.querySelectorAll<HTMLElement>('.ant-table-thead > tr > th');
      thElements.forEach((th) => {
        this.renderer.setStyle(th, 'position', 'sticky');
        this.renderer.setStyle(th, 'top', '0');
        this.renderer.setStyle(th, 'z-index', '2');
      });
    }

    // Đưa scroll của appContent về 0 ngay lập tức nếu từng bị trôi
    if (appContent && appContent.scrollTop > 0) {
      appContent.scrollTop = 0;
    }
    if (window.scrollY > 0) {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }

    // Thông báo ra ngoài
    this.ngZone.run(() => {
      this.currentHeight.set(computedHeight);
      this.heightChange.emit(computedHeight);
    });
  }
}
