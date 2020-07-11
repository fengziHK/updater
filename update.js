!function(){"use strict";function e(e){return e&&"object"==typeof e&&"default"in e?e.default:e}var t=e(require("node-fetch")),a=e(require("ipfs-http-client")),r=e(require("ipfs-unixfs-importer")),s=require("stream"),o=require("@octokit/rest"),i=require("@octokit/plugin-retry");require("crypto");var n=e(require("p-queue"));const c=e=>!!e.success;let l,h=0;const d=async e=>l&&h<=200?(h++,l):(h=0,l=await(async e=>Object.entries(await e).map(([e,t])=>`${e}=${t}`).join("; "))((async e=>{const a=(await t("https://lihkg.com/",{headers:{Host:"lihkg.com",Referer:"https://lihkg.com/","User-Agent":e,Accept:"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8","Accept-Language":"en-US","Accept-Encoding":"gzip, deflate, br"}})).headers.raw()["set-cookie"];return Object.fromEntries(a.map(e=>{const t=e.match(/^(\w+)=(.+?);/);return[t[1],t[2]]}))})(e)),l),m="Mozilla/5.0 Gecko/20100101 Firefox/71.0",p=2e4;class u{static async fetchAPIResponse(e){const a=await d(m),r=await t(e,{headers:{Referer:"https://lihkg.com/","User-Agent":m,Cookie:a}});if(!r.ok)throw console.error(await r.text()),new Error(`${e} ${r.status} ${r.statusText}`);const s=await r.json();if(!c(s))throw new Error(`${e} ${s.error_code} ${s.error_message}`);return s}static async fetchThreadDetail(e,t=1,a="reply_time"){const r=`${this.ENDPOINT}/thread/${e}/page/${t}?order=${a}`;return(await this.fetchAPIResponse(r)).response}static async fetchFullThread(e){const t=await this.fetchThreadDetail(e,1),{total_page:a,item_data:r}=t;for(let t=0;t<a-2;t++){const a=await this.fetchThreadDetail(e,t+2);r.push(...a.item_data)}return t.page=void 0,t}static async fetchUser(e){const t=`${this.ENDPOINT}/user/${e}/profile`;return(await this.fetchAPIResponse(t)).response.user}static async fetchLatestThreads(e=1,t=1){const a=`${this.ENDPOINT}/thread/latest?cat_id=${t}&page=${e}&count=60&type=now`;return(await this.fetchAPIResponse(a)).response}}u.ENDPOINT="https://lihkg.com/api_v2";const f=u.fetchFullThread.bind(u);u.fetchUser.bind(u);class w{static formatTime(e){return new Date(1e3*e)}static formatReply(e){return{pid:e.post_id,tid:+e.thread_id,uid:+e.user.user_id,like:+e.like_count,dislike:+e.dislike_count,score:+e.vote_score,quote:e.quote&&this.formatReply(e.quote),citedBy:+e.no_of_quote,replyTime:this.formatTime(e.reply_time),msg:e.msg}}static formatThread(e){return{tid:+e.thread_id,cid:+e.cat_id,subCid:+e.sub_cat_id,title:e.title,createTime:this.formatTime(e.create_time),updateTime:this.formatTime(e.last_reply_time),uid:+e.user_id,like:+e.like_count,dislike:+e.dislike_count,uniUserReply:+e.no_of_uni_user_reply,remark:e.remark&&e.remark.notice}}static formatThreadDetail(e){return{...this.formatThread(e),replies:e.item_data.map(e=>this.formatReply(e)),pinned:e.pinned_post&&this.formatReply(e.pinned_post)}}static formatThreadInfo(e){return{...this.formatThread(e),lastReplyTime:this.formatTime(e.last_reply_time),lastReplyUid:+e.last_reply_user_id}}static formatThreadMinInfo(e){return{tid:+e.thread_id,cid:+e.cat_id,uid:+e.user_id,title:e.title,score:+e.like_count-+e.dislike_count,replied:e.last_reply_time,pages:+e.total_page}}static formatUserInfo(e){return{uid:+e.user_id,name:e.nickname,gender:e.gender,level:+e.level,levelName:e.level_name,createTime:this.formatTime(e.create_time)}}}const g={put(){}},_=a("https://ipfs.infura.io:5001/"),y=/https?:\/\/(?:www\.)?na\.cx\/i\/(\w+\.\w+)/g;const T=async e=>{const a=await async function(e,a=!1){const r=await t(e,{headers:{Referer:"https://lihkg.com/","User-Agent":m,Cookie:await d(m)},timeout:p});if(!r.ok)throw new Error(`${e} ${r.status} ${r.statusText}`);return a?r.body:await r.buffer()}(e,!0),o=a.pipe(new s.PassThrough),i=a.pipe(new s.PassThrough),n=(async e=>{try{let t;for await(const a of _.add(e,{pin:!0}))t=a.cid;return t}catch(e){console.error(e.name,":",e.message)}})(o),c=await(async e=>{const t=[{content:e}];let a;for await(const e of r(t,g,{onlyHash:!0}))a=e.cid;return a})(i);return n.then(t=>{t&&c&&t.equals(c)?console.log(`uploaded ${e} : ${c}`):console.error(`upload ${e} error: cid mismatches`)}),c.toString()},$=process.env.AUTH_TOKEN;if(!$)throw new Error("AUTH_TOKEN is undefined");const k=new(o.Octokit.plugin(i.retry))({auth:$}),b="lihkg-boy",q="thread-test",R="master",E=e=>{return+e.toString().slice(-1)[0]};class O{constructor(){this.threads={}}add(e,t){const a=E(e);this.threads[a]||(this.threads[a]={}),this.threads[a][e]=t}async commit(e=R){const t=(await k.git.getTree({owner:b,repo:q,tree_sha:e})).data.tree,a={};for(const[e,r]of Object.entries(this.threads)){console.log("subtree",e);const s=t[+e];if(s.path!=e)throw new Error(`tree invalid: ${JSON.stringify(s)}`);const o=s.sha,i=Object.entries(r).map(([e,t])=>({path:`${e}.json`,content:t,mode:"100644"})),n=(await k.git.createTree({owner:b,repo:q,tree:i,base_tree:o})).data.sha;a[e]=n,console.log("updated subtree",e,n)}console.log("updating the root tree");const r=[];t.forEach(e=>{r[e.path]={path:e.path,mode:e.mode,sha:e.sha}}),Object.entries(a).map(([e,t])=>{r[e]={path:e,sha:t,mode:"040000"}}),console.log(r);const s=(await k.git.createTree({owner:b,repo:q,tree:r.filter(Boolean)})).data.sha;return console.log("updated root tree",s),s}}const v=async e=>{const t=await f(e),a=w.formatThreadDetail(t);return await(e=>Promise.all(e.replies.map(e=>{const t=[...e.msg.matchAll(y)];return Promise.all(t.map(async t=>{const[a,r]=t;try{const t=await T(a);e.msg=e.msg.replace(a,`https://ipfs.infura.io/ipfs/${t}?filename=${r}`)}catch(e){console.error(e)}}))})))(a),JSON.stringify(a)};(async(e=10)=>{const t=await(async(e=15)=>{const t=new Set,a=t=>+new Date-+t>6e4*e;for(let e=1;;e++)try{const{items:r}=await u.fetchLatestThreads(e),s=r.map(e=>[+e.thread_id,w.formatTime(e.last_reply_time)]);if(s.forEach(([e,r])=>{a(r)||t.add(e)}),s.some(([,e])=>a(e)))break}catch(e){console.error(e);break}return[...t].reverse()})(),a=t.length;console.log(a,t);const r=new n({concurrency:e});let s=0;const o=new O;for(let e=0;e<a;e++){const i=t[e];r.add(async()=>{console.log(`update ${i}.json ${e+1}/${a}`);try{const e=await v(i);o.add(i,e),s++}catch(e){console.error(e.name+" "+e.message)}})}await r.onIdle();const i=await o.commit();await(async(e,t,a=R)=>{const r=`heads/${a}`,s=(await k.git.getRef({owner:b,repo:q,ref:r})).data.object.sha;console.log("old commit",s);const o=await k.git.createCommit({owner:b,repo:q,tree:e,message:t,parents:[s],author:{email:"lihkg@github.com",name:"lihkg"}}),i=o.data.sha;o.data.tree=void 0,console.log("new commit",o.data),await k.git.updateRef({owner:b,repo:q,ref:r,sha:i})})(i,`${(new Date).toISOString()} update\n${t.join(",")}`),console.log(`${s}/${a} success`)})()}();
