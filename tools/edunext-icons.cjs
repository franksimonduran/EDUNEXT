// Dependency-free rasterization of the provisional E/next mark. No downloads.
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
function crc32(bytes){let crc=0xffffffff;for(const byte of bytes){crc^=byte;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return (crc^0xffffffff)>>>0;}
function chunk(type,bytes){const name=Buffer.from(type),len=Buffer.alloc(4),crc=Buffer.alloc(4);len.writeUInt32BE(bytes.length);crc.writeUInt32BE(crc32(Buffer.concat([name,bytes])));return Buffer.concat([len,name,bytes,crc]);}
function png(size){
 const pixels=Buffer.alloc((size*4+1)*size);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const a=(x+.5)*48/size,b=(y+.5)*48/size;
  const e=(a>=12&&a<17&&b>=12&&b<36)||(a>=17&&a<29&&((b>=12&&b<17)||(b>=31&&b<36)))||(a>=17&&a<27&&b>=22&&b<27);
  const arrow=b>=17&&b<=31&&Math.abs(a-(37-Math.abs(b-24)))<2;
  const offset=y*(size*4+1)+1+x*4;pixels.set(e||arrow?[255,255,255,255]:[37,99,235,255],offset);
 }
 const header=Buffer.alloc(13);header.writeUInt32BE(size);header.writeUInt32BE(size,4);header[8]=8;header[9]=6;
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',zlib.deflateSync(pixels)),chunk('IEND',Buffer.alloc(0))]);
}
if(require.main===module)for(const size of [192,512]){const target=path.resolve(__dirname,`../frontend/assets/images/branding/edunext-${size}.png`),bytes=png(size);if(fs.existsSync(target)){if(!fs.readFileSync(target).equals(bytes))throw new Error('Refusing to overwrite modified icon');}else fs.writeFileSync(target,bytes,{flag:'wx'});console.log('Verified provisional icon '+size);}
module.exports={png};
