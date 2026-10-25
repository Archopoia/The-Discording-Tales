const urls = [
  'https://thediscordingtales.com/',
  'https://www.thediscordingtales.com/',
];
for (const url of urls) {
  const r = await fetch(url, { redirect: 'follow' });
  const t = await r.text();
  const blocks = [...t.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)];
  const types = [];
  for (const b of blocks) {
    try {
      const j = JSON.parse(b[1]);
      const walk = (o) => {
        if (!o || typeof o !== 'object') return;
        if (o['@type']) types.push(o['@type']);
        if (Array.isArray(o)) o.forEach(walk);
        else Object.values(o).forEach(walk);
      };
      walk(j);
    } catch (e) {
      types.push('PARSE_ERROR:' + e.message);
    }
  }
  console.log('\n', url, '-> final', r.url, 'status', r.status);
  console.log(' ld blocks', blocks.length, 'types', JSON.stringify(types));
  console.log(' title', (t.match(/<title>([^<]+)/) || [])[1]);
  console.log(' has Book string', /"@type"\s*:\s*"Book"/.test(t));
}
