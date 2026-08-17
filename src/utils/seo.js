export const SEO = {
  title: '2026陕航电气115VAC发电软件测试平台招标公告',
  keywords:
    '陕西航空电气有限责任公司, 115VAC变频交流发电, 软件测试平台, DO-178C, 发电调压软件, 0730-2611010438/01, 航空电气招标, 西安招标',
  description:
    '陕西航空电气有限责任公司发布115VAC变频交流发电软件测试平台采购招标公告，满足DO-178C适航标准需求覆盖，投标截止2026年9月3日。',
}

export function applySeo(partial = {}) {
  const title = partial.title || SEO.title
  document.title = title

  setMeta('name', 'keywords', partial.keywords || SEO.keywords)
  setMeta('name', 'description', partial.description || SEO.description)
  setMeta('property', 'og:type', 'article')
  setMeta('property', 'og:title', title)
  setMeta('property', 'og:description', partial.description || SEO.description)

  let ld = document.querySelector('script[data-seo-ld="1"]')
  if (!ld) {
    ld = document.createElement('script')
    ld.type = 'application/ld+json'
    ld.setAttribute('data-seo-ld', '1')
    document.head.appendChild(ld)
  }
  ld.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'NewsArticle',
        headline: title,
        description: partial.description || SEO.description,
      },
    ],
  })
}

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}
