export interface XmlStats {
  lines: number;
  chars: number;
  sizeKb: string;
  elements: number;
}

/** Trả về thông báo lỗi nếu XML không hợp lệ, `null` nếu có thể nạp vào modeler. */
export function validateBpmnXml(xml: string): string | null {
  if (!xml) {
    return 'Nội dung XML đang để trống.';
  }

  // Step 1: Kiểm tra cú pháp XML chuẩn bằng DOMParser
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const parserError = doc.querySelector('parsererror');
  if (parserError) {
    const msg = parserError.textContent || 'Lỗi cú pháp XML';
    return msg.replace(/Location:.*$/, '').trim();
  }

  // Step 2: Kiểm tra cấu trúc thẻ BPMN cơ bản
  if (!xml.includes('definitions') && !xml.includes('process')) {
    return 'XML thiếu cấu trúc tiêu chuẩn BPMN 2.0 (phải chứa thẻ <definitions> hoặc <process>).';
  }
  return null;
}

export function computeXmlStats(text: string): XmlStats {
  const elementMatches =
    text.match(/<bpmn:[a-zA-Z]+/g) ||
    text.match(/<[a-zA-Z]+Task|<[a-zA-Z]+Gateway|<[a-zA-Z]+Event/g) ||
    [];
  return {
    lines: text ? text.split('\n').length : 0,
    chars: text.length,
    sizeKb: (new Blob([text]).size / 1024).toFixed(1),
    elements: elementMatches.length,
  };
}

/** Fallback formatter dùng khi modeler không xuất được XML (VD: XML hiện tại đang lỗi). */
export function beautifyXml(xml: string): string {
  let formatted = '';
  let indent = '';
  const tab = '  ';
  const cleaned = xml.replace(/>\s*</g, '><').trim();
  cleaned
    .split(/(?=<)|(?<=>)/)
    .filter(Boolean)
    .forEach((part) => {
      if (part.startsWith('</')) {
        indent = indent.substring(tab.length);
        formatted += indent + part + '\n';
      } else if (
        part.startsWith('<') &&
        !part.startsWith('<?') &&
        !part.startsWith('<!') &&
        !part.endsWith('/>')
      ) {
        formatted += indent + part + '\n';
        indent += tab;
      } else if (part.startsWith('<')) {
        formatted += indent + part + '\n';
      } else {
        const trimmed = part.trim();
        if (trimmed) {
          formatted = formatted.trimEnd() + trimmed + '\n';
        }
      }
    });
  return formatted.trim();
}

export function downloadFile(content: string, fileName: string, contentType: string): void {
  const a = document.createElement('a');
  const blob = new Blob([content], { type: contentType });
  a.href = URL.createObjectURL(blob);
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(a.href);
}
