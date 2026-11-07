import {lazy,Suspense,useEffect} from 'react';
import {Routes,Route,Navigate,Link,useLocation} from 'react-router-dom';
import './admin.css';
import pages from './routes.json';
const Page0=lazy(()=>import('./pages/admin.ads'));
const Page1=lazy(()=>import('./pages/admin.analytics.articles'));
const Page2=lazy(()=>import('./pages/admin.analytics.categories'));
const Page3=lazy(()=>import('./pages/admin.analytics.referrers'));
const Page4=lazy(()=>import('./pages/admin.analytics.reporters'));
const Page5=lazy(()=>import('./pages/admin.analytics'));
const Page6=lazy(()=>import('./pages/admin.articles'));
const Page7=lazy(()=>import('./pages/admin.articles_.$slug.edit'));
const Page8=lazy(()=>import('./pages/admin.articles_.new'));
const Page9=lazy(()=>import('./pages/admin.articles_.pending'));
const Page10=lazy(()=>import('./pages/admin.categories'));
const Page11=lazy(()=>import('./pages/admin.facebook'));
const Page12=lazy(()=>import('./pages/admin.login'));
const Page13=lazy(()=>import('./pages/admin.signup'));
const Page14=lazy(()=>import('./pages/admin.users'));
const Page15=lazy(()=>import('./pages/admin.verify-otp'));
export default function AdminApp(){
 const location=useLocation();
 useEffect(()=>{document.title=pages.find(page=>new RegExp('^'+page.path.replace(':slug','[^/]+')+'$').test(location.pathname))?.title||'Diganta News Admin';},[location.pathname]);
 useEffect(()=>{document.body.classList.add('admin-mode');const robots=document.createElement('meta');robots.name='robots';robots.content='noindex,nofollow';document.head.append(robots);return()=>{document.body.classList.remove('admin-mode');robots.remove();};},[]);
 return <div className="admin-root"><Suspense fallback={<p className="p-8" role="status">লোড হচ্ছে…</p>}><Routes>
 <Route index element={<Navigate to="/admin/articles" replace/>}/>
 <Route path="dashboard" element={<Navigate to="/admin/articles" replace/>}/>
 <Route path="ads" element={<Page0/>}/>
<Route path="analytics/articles" element={<Page1/>}/>
<Route path="analytics/categories" element={<Page2/>}/>
<Route path="analytics/referrers" element={<Page3/>}/>
<Route path="analytics/reporters" element={<Page4/>}/>
<Route path="analytics" element={<Page5/>}/>
<Route path="articles" element={<Page6/>}/>
<Route path="articles/:slug/edit" element={<Page7/>}/>
<Route path="articles/new" element={<Page8/>}/>
<Route path="articles/pending" element={<Page9/>}/>
<Route path="categories" element={<Page10/>}/>
<Route path="facebook" element={<Page11/>}/>
<Route path="login" element={<Page12/>}/>
<Route path="signup" element={<Page13/>}/>
<Route path="users" element={<Page14/>}/>
<Route path="verify-otp" element={<Page15/>}/>
 <Route path="*" element={<div className="p-8"><h1>পাতাটি পাওয়া যায়নি</h1><Link to="/admin/articles">অ্যাডমিনে ফিরুন</Link></div>}/>
 </Routes></Suspense></div>;
}
