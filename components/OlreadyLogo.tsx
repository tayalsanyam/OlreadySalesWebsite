import Image from 'next/image';
import {brandAssets} from '@/lib/brand-assets';

type Props={
 variant?:'wordmark'|'mark';
 tagline?:string;
 className?:string;
 priority?:boolean;
 /** Visual context for sizing and alignment. */
 placement?:'header'|'footer'|'admin'|'loading';
};

export function OlreadyLogo({variant='wordmark',tagline,className='',priority,placement}:Props){
 if(variant==='mark'){
  return <Image className={`olready-logo olready-logo--mark ${placement?`olready-logo--${placement}`:''} ${className}`.trim()} src={brandAssets.mark} alt="OLREADY" width={placement==='loading'?88:56} height={placement==='loading'?88:56} priority={priority}/>;
 }
 const src=placement==='footer'?brandAssets.wordmarkFull:brandAssets.wordmark;
 return <span className={`olready-logo olready-logo--wordmark ${placement?`olready-logo--${placement}`:''} ${className}`.trim()}>
  <span className="olready-logo__wordmark-wrap"><Image className="olready-logo__wordmark" src={src} alt="OLREADY" width={320} height={placement==='footer'?56:53} priority={priority}/></span>
  {tagline?<small className="olready-logo__tagline">{tagline}</small>:null}
 </span>;
}
