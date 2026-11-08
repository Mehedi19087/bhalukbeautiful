import {test,afterEach} from 'node:test';
import assert from 'node:assert/strict';
import {apiFetch,setTokens,clearTokens,authApi,categoriesApi,articlesApi,usersApi,adsApi,analyticsApi,facebookApi} from '../src/lib/api-client.ts';

const originalFetch=globalThis.fetch;
const values=new Map();
globalThis.window={location:{href:''}};
globalThis.localStorage={getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};
afterEach(()=>{globalThis.fetch=originalFetch;clearTokens();window.location.href='';});
const response=(status,body)=>({status,ok:status>=200&&status<300,statusText:'',text:async()=>body===null?'':JSON.stringify(body)});

test('admin reads send Diganta portal and bearer token to the matching routes',async()=>{
 setTokens('test-access');
 const calls=[];
 globalThis.fetch=async(url,opts)=>{calls.push({url,opts});return response(200,[]);};
 await articlesApi.editorList('PENDING');await usersApi.list();await adsApi.adminList();await analyticsApi.overview();await facebookApi.getPages();
 assert.deepEqual(calls.map(c=>new URL(c.url).pathname),['/api/news/editor/articles/','/api/accounts/users/','/api/news/ads/','/api/news/analytics/overview/','/api/news/facebook/pages/']);
 for(const {opts} of calls){assert.equal(opts.headers['X-Tenant-Slug'],'digontonews');assert.equal(opts.headers.Authorization,'Bearer test-access');}
});

test('expired access tokens refresh once and retry with the new token',async()=>{
 setTokens('expired','refresh');let count=0;
 globalThis.fetch=async(url,opts)=>{
  count++;
  if(url.endsWith('/token/refresh/')){assert.deepEqual(JSON.parse(opts.body),{refresh:'refresh'});assert.equal(opts.headers['X-Tenant-Slug'],'digontonews');return response(200,{access:'renewed',refresh:'rotated'});}
  return opts.headers.Authorization==='Bearer renewed'?response(200,[]):response(401,{});
 };
 assert.deepEqual(await usersApi.list(),[]);assert.equal(count,3);assert.equal(values.get('dgn_refresh_token'),'rotated');
});

test('failed refresh clears the session and sends the reader to login',async()=>{
 setTokens('expired','invalid');values.set('dgn_admin_session','{}');
 globalThis.fetch=async()=>response(401,{});
 await assert.rejects(usersApi.list());assert.equal(values.size,0);assert.equal(window.location.href,'/admin/login');
});

test('uploads keep FormData and do not set a JSON content type',async()=>{
 setTokens('access');const form=new FormData();form.append('title','Test');
 globalThis.fetch=async(url,opts)=>{assert.equal(opts.body,form);assert.equal(opts.method,'POST');assert.equal(opts.headers['Content-Type'],undefined);return response(201,{slug:'test'});};
 assert.deepEqual(await articlesApi.createWithImage(form),{slug:'test'});
});

test('category and user writes preserve the backend request fields',async()=>{
 setTokens('access');const calls=[];
 globalThis.fetch=async(url,opts)=>{calls.push({url,opts});return response(200,{});};
 await categoriesApi.create({name:'খেলা',slug:'sports'});await usersApi.updateRole(4,'EDITOR');
 assert.deepEqual(JSON.parse(calls[0].opts.body),{name:'খেলা',slug:'sports'});
 assert.equal(calls[1].opts.method,'PATCH');assert.deepEqual(JSON.parse(calls[1].opts.body),{role:'EDITOR'});
});

test('empty delete responses succeed and validation errors show field messages',async()=>{
 globalThis.fetch=async()=>response(204,null);assert.equal(await categoriesApi.remove('sports'),null);
 globalThis.fetch=async()=>response(400,{name:['This field is required.']});
 await assert.rejects(categoriesApi.create({name:''}),/This field is required/);
});

test('staff signup sends only email, password and role for the current portal without a session',async()=>{
 setTokens('existing-session');
 const controller=new AbortController();
 globalThis.fetch=async(url,opts)=>{
  assert.equal(new URL(url).pathname,'/api/accounts/staff/signup/');
  assert.equal(opts.method,'POST');
  assert.equal(opts.headers['X-Tenant-Slug'],'digontonews');
  assert.equal(opts.headers.Authorization,undefined);
  assert.equal(opts.signal,controller.signal);
  assert.deepEqual(JSON.parse(opts.body),{email:'staff@example.com',password:'LongPassword123!',role:'REPORTER'});
  return response(201,{message:'Pending owner approval.'});
 };
 assert.deepEqual(await authApi.signupStaff('staff@example.com','LongPassword123!','REPORTER',controller.signal),{message:'Pending owner approval.'});
 assert.equal(values.get('dgn_access_token'),'existing-session');
});

test('pending requests and approval use authenticated portal routes',async()=>{
 setTokens('owner-access');
 const calls=[];
 globalThis.fetch=async(url,opts)=>{
  calls.push({url,opts});
  return response(200,url.endsWith('/pending/')?[{id:9,is_pending_approval:true}]:{id:9,is_active:true,is_pending_approval:false});
 };
 assert.deepEqual(await usersApi.pending(),[{id:9,is_pending_approval:true}]);
 assert.deepEqual(await usersApi.approve(9),{id:9,is_active:true,is_pending_approval:false});
 assert.deepEqual(calls.map(call=>new URL(call.url).pathname),['/api/accounts/users/pending/','/api/accounts/users/9/approve/']);
 assert.equal(calls[1].opts.method,'POST');
 for(const {opts} of calls){assert.equal(opts.headers.Authorization,'Bearer owner-access');assert.equal(opts.headers['X-Tenant-Slug'],'digontonews');}
});
