async function test() {
  const res = await fetch('https://www.youtube.com/watch?v=_ZPpU7774DQ', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept-Language': 'fr-FR,fr;q=0.9',
    }
  });
  const html = await res.text();
  const m = html.match(/"commentsHeaderRenderer":\s*\{\s*"countText":\s*\{[^}]*"text":\s*"([^"]+)"/);
  console.log('Comments header match:', m ? m[1] : 'not found');
  const allComments = [...html.matchAll(/"text":\s*"([0-9\s\u00a0]+)"/g)];
  console.log('Numeric text matches count:', allComments.length);
}
test();
