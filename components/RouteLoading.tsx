import {OlreadyLogo} from './OlreadyLogo';

export function RouteLoading({message='Loading'}:{message?:string}){
 return <div className="route-loading" role="status" aria-live="polite" aria-busy="true">
  <div className="route-loading__stage" aria-hidden="true">
   <span className="route-loading__ring"/>
   <span className="route-loading__glow"/>
   <OlreadyLogo variant="mark" placement="loading" className="route-loading__mark" priority/>
  </div>
  <p className="route-loading__message">{message}<span className="route-loading__dots" aria-hidden="true"/></p>
 </div>;
}
