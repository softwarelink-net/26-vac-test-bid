<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:sm="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html lang="zh-CN">
      <head>
        <meta charset="UTF-8"/>
        <title>XML Sitemap · 26-vac-test-bid</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 2rem; color: #0f172a; background: #f8fafc; }
          h1 { font-size: 1.5rem; margin: 0 0 .5rem; }
          p { color: #64748b; }
          table { width: 100%; border-collapse: collapse; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,.08); }
          th, td { text-align: left; padding: .75rem 1rem; border-bottom: 1px solid #e2e8f0; font-size: .925rem; }
          th { background: #0f172a; color: #fff; }
          a { color: #0369a1; }
          .meta { margin-bottom: 1.25rem; }
          code { background: #e2e8f0; padding: .1rem .35rem; border-radius: 4px; }
        </style>
      </head>
      <body>
        <h1>XML Sitemap</h1>
        <div class="meta">
          <p>这是谷歌可抓取的标准 Sitemap（XML）。下方为浏览器可读视图；搜索引擎读取的是原始 XML 节点。</p>
          <p>共 <strong><xsl:value-of select="count(sm:urlset/sm:url)"/></strong> 条 URL · 协议：<code>sitemaps.org/0.9</code></p>
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>URL (loc)</th>
              <th>lastmod</th>
              <th>image</th>
            </tr>
          </thead>
          <tbody>
            <xsl:for-each select="sm:urlset/sm:url">
              <tr>
                <td><xsl:value-of select="position()"/></td>
                <td><a href="{sm:loc}"><xsl:value-of select="sm:loc"/></a></td>
                <td><xsl:value-of select="sm:lastmod"/></td>
                <td>
                  <xsl:if test="image:image/image:loc">
                    <a href="{image:image/image:loc}"><xsl:value-of select="image:image/image:title"/></a>
                  </xsl:if>
                </td>
              </tr>
            </xsl:for-each>
          </tbody>
        </table>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
