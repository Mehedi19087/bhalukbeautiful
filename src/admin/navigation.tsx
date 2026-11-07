import {useCallback,useMemo} from 'react';
import {Link as RouterLink,useNavigate as useRouterNavigate,useSearchParams,type LinkProps} from 'react-router-dom';

type Destination={to:string;search?:Record<string,string|number|undefined>;params?:Record<string,string>;replace?:boolean};
function destination({to,search,params}:Destination){
  let path=to;
  for(const [key,value] of Object.entries(params||{}))path=path.replace('$'+key,encodeURIComponent(value));
  const query=new URLSearchParams();
  for(const [key,value] of Object.entries(search||{}))if(value!==undefined)query.set(key,String(value));
  return path+(query.size?'?'+query:'');
}
export function Link({to,search,params,...props}:Omit<LinkProps,'to'> & Destination){
  const href=destination({to,search,params});
  return href.startsWith('/admin')?<RouterLink to={href} {...props}/>:<a href={href} {...props}/>;
}
export function useNavigate(){
  const navigate=useRouterNavigate();
  return useCallback((target:Destination)=>navigate(destination(target),{replace:target.replace}),[navigate]);
}
export function useSearch(_options?:unknown){
  const [params]=useSearchParams();
  return useMemo(()=>Object.fromEntries(params),[params]);
}
