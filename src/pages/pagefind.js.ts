export function GET() {
  return new Response('export const search = () => {return {results: []}}', {
    headers: { 'Content-Type': 'text/javascript; charset=utf-8' },
  });
}
