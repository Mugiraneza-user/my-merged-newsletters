import Parser from 'rss-parser';
import fs from 'fs';

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

const parser = new Parser();

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
  
  const rssFeed = `<?xml version="1.0"?>
<rss version="2.0">
<channel>
  <title>Merged Newsletters</title>
  <link>https://github.com/yourusername/my-merged-newsletters</link>
  <description>Combined RSS feed</description>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
  ${allItems.map(item => `
  <item>
    <title>${item.title.replace(/[<>&]/g, '')}</title>
    <link>${item.link}</link>
    <guid>${item.link}</guid>
    <pubDate>${item.pubDate.toUTCString()}</pubDate>
    <description>${(item.description || '').replace(/[<>&]/g, '')}</description>
  </item>`).join('')}
</channel>
</rss>`;

  fs.writeFileSync('./docs/merged-feed.rss', rssFeed);
}

await generateFeed();