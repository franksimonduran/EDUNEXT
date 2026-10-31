// Inspect rendered text, including content below the fold. No runtime app mutations.
module.exports = async function auditReadability(cdp) {
  return cdp.evaluate(`(() => {
    const minimum = parseFloat(getComputedStyle(document.documentElement).fontSize) * .875;
    const tiny = [], sizes = [], walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const text = node.textContent.trim(), el = node.parentElement;
      if (!text || !el || el.closest('script,style,svg,noscript,.sr-only,[hidden]')) continue;
      const style = getComputedStyle(el), rect = el.getBoundingClientRect();
      if (style.visibility !== 'visible' || style.display === 'none' || rect.width <= 1 || rect.height <= 1 || rect.right <= 0 || rect.left >= innerWidth) continue;
      const fontSize = parseFloat(style.fontSize);
      sizes.push(fontSize);
      if (fontSize < minimum - .1) tiny.push({tag:el.tagName,className:el.className,parentClass:el.parentElement?.className,text:text.slice(0,100),fontSize});
    }
    return {minimum,smallest:sizes.length?Math.min(...sizes):null,smallTextCount:tiny.length,smallText:tiny};
  })()`);
};
