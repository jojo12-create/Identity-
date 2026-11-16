import { storage } from 'hatchable';
export const access = 'public';

/* Only owner-approved portfolio assets can be served by this route. */
const ALLOWED = {
  'adrian-rodriguez': { poster:'jpg' },
  'nba-edge': { poster:'jpg' },
  'tandem': { poster:'jpg' },
  'electricien': { poster:'jpg' }
};

export default async function(req,res) {
  if(req.method !== 'GET' && req.method !== 'HEAD') return res.status(405).json({error:'Method not allowed'});
  const slug=String(req.params?.slug || '');
  const project=ALLOWED[slug];
  if(!project) return res.status(404).json({error:'Unknown project'});
  const poster=req.query?.poster === '1';
  const key=poster ? 'portfolio/stills/'+slug+'-real-cover.'+project.poster : 'portfolio/videos/'+slug+'-smooth-v83.mp4';
  let file;
  try {file=await storage.get(key)} catch(e) {return res.status(404).json({error:'Preview unavailable'})}
  if(!file?.buffer) return res.status(404).json({error:'Preview unavailable'});
  const data=Buffer.from(file.buffer);
  res.setHeader('Content-Type',poster?(project.poster==='jpg'?'image/jpeg':'image/png'):'video/mp4');
  res.setHeader('Cache-Control','public, max-age=3600');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Accept-Ranges','bytes');
  const range=(!poster && req.headers?.range) || '';
  if(range) {
    const m=range.match(/^bytes=(\d*)-(\d*)$/);
    if(!m) return res.status(416).send('');
    const suffix=m[1]==='' && m[2]!=='' ? Number(m[2]) : null;
    const start=suffix!==null ? Math.max(0,data.length-suffix) : Math.max(0,Number(m[1]||0));
    const end=suffix!==null ? data.length-1 : m[2]!=='' ? Math.min(data.length-1,Number(m[2])) : data.length-1;
    if(start>=data.length || end<start) {res.setHeader('Content-Range','bytes */'+data.length);return res.status(416).send('')}
    const chunk=data.subarray(start,end+1);
    res.setHeader('Content-Range','bytes '+start+'-'+end+'/'+data.length);
    res.setHeader('Content-Length',String(chunk.length));
    return req.method==='HEAD' ? res.status(206).send('') : res.status(206).send(chunk);
  }
  res.setHeader('Content-Length',String(data.length));
  return req.method==='HEAD' ? res.status(200).send('') : res.status(200).send(data);
}