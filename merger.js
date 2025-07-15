const Parser = require('rss-parser');
const fs = require('fs');

const newsSources = [
  {
    name: "CNBC Business",
    url: "https://www.cnbc.com/id/10001147/device/rss/rss.html",
    prefix: "[CNBC]"
  },
  {
    name: "NYTimes Business",
    url: "https://rss.nytimes.com/services/xml/rss/nyt/Business.xml",
    prefix: "[NYT]"
  }
];

const parser = new Parser({
  timeout: 10000,
  headers: { 'User-Agent': 'Mozilla/5.0' }
});

async function generateFeed() {
  const allItems = [];
  
  await Promise.all(newsSources.map(async (source) => {
    try {
      const feed = await parser.parseURL(source.url);
      feed.items.forEach(item => {
        allItems.push({
          title: `${source.prefix} ${item.title}`,
          link: item.link,
          pubDate: item.pubDate ? new Date(item.pubDate) : new Date(),
          description: item.content || item.description || ''
        });
      });
    } catch (err) {
      console.error(`Failed ${source.name}: ${err.message}`);
    }
  }));

  allItems.sort((a, b) => b.pubDate - a.pubDate);

  const rssFeed = buildRss(allItems);
  fs.writeFileSync('./docs/merged-feed.rss', rssFeed);
}

function buildRss(items) {
  return `<?xml version="1.0"?>
<rss version="2.0">
<channel>
  <title>Merged Business News</title>
  <link>https://your-username.github.io/my-merged-newsletters/</link>
  <description>Combined RSS feed</description>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
  ${items.map(item => `
  <item>
    <title>${escapeXml(item.title)}</title>
    <link>${escapeXml(item.link)}</link>
    <guid>${escapeXml(item.link)}</guid>
    <pubDate>${item.pubDate.toUTCString()}</pubDate>
    <description>${escapeXml(item.description)}</description>
  </item>`).join('')}
</channel>
</rss>`;
}

function escapeXml(unsafe) {
  return unsafe?.replace(/[<>&'"]/g, c => 
    ({ '<':'&lt;', '>':'&gt;', '&':'&amp;', '\'':'&apos;', '"':'&quot;' }[c]));
}

generateFeed();