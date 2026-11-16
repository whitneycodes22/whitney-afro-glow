/* ===== Afro Glow – shared core (loaded on every page) ===== */
const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const R=n=>'R'+Number(n||0).toFixed(2);
const day=t=>new Date(t).toLocaleDateString('en-CA'),today=()=>day(Date.now());
const tm=t=>new Date(t).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
const dt=t=>new Date(t).toLocaleString([],{dateStyle:'medium',timeStyle:'short'});

/* ---- SHOP SETTINGS: edit these to your real details ---- */
const SHOP={name:'Afro Glow',slogan:'Accessorise Your Glow',phone:'+27 00 000 0000',whatsapp:'27000000000',email:'hello@afroglow.co.za',address:'Durban, KwaZulu-Natal',
 hours:['Mon – Fri: 09:00 – 17:30','Saturday: 09:00 – 15:00','Sunday: Closed']};
const FREE=500,DELIV=50,LOW=5,PTS_PER=10;           // free delivery over R500, delivery fee R50, low-stock level, 1 point per R10
const CATS=[['Weaves & Extensions','💇🏾‍♀️'],['Braiding Hair','🪢'],['Hair Care','🧴'],['Relaxers','💆🏾‍♀️'],['Hair Accessories','🎀'],['Beauty & Cosmetics','💄'],['Nails','💅']];
const FAV=['Curl Pop','Londi London Braid Colour 4','Hair Fertilizer 125ml','Eyelashes 5D'];   // home page favourites (product names)
const PROMOS=[
 {code:'GLOW10',title:'10% off your order',desc:'Get 10% off when you spend R200 or more.',type:'pct',val:10,min:200},
 {code:'WELCOME15',title:'R15 off your first order',desc:'New customers: R15 off orders of R100 or more.',type:'amt',val:15,min:100,first:true},
 {code:'FREESHIP',title:'Free delivery',desc:'We deliver free when you spend R150 or more (delivery orders).',type:'ship',min:150}];
const REWARDS=[{pts:100,off:10,name:'R10 voucher'},{pts:250,off:30,name:'R30 voucher'},{pts:500,off:70,name:'R70 voucher'},{pts:1000,off:150,name:'R150 voucher'}];
const TIERS=[['Bronze',0],['Silver',500],['Gold',1500]];

/* ---- DATABASE (browser storage demo) ---- */
const KEY='afroglow_v3';
const SEED=()=>({products:structuredClone(SEED_PRODUCTS),users:[],sales:[],moves:[],money:[],msgs:[],wa:'',nextSale:1,nextP:SEED_PRODUCTS.length+1,nextU:1});
let DB;try{DB={...SEED(),...JSON.parse(localStorage[KEY]||'{}')}}catch{DB=SEED()}
const save=()=>localStorage[KEY]=JSON.stringify(DB);
const P=id=>DB.products.find(p=>p.id==id);

/* ---- SESSION ---- */
let me=null;try{me=JSON.parse(localStorage.ag_me||'null')}catch{}
if(me&&!DB.users.some(u=>u.id===me.id)){me=null;localStorage.removeItem('ag_me')}
const U=()=>me&&DB.users.find(u=>u.id===me.id);
const isStaff=()=>!!me&&(me.role==='staff'||me.role==='owner'),isOwner=()=>!!me&&me.role==='owner';
const setMe=u=>{me=u?{id:u.id,role:u.role,name:u.name,email:u.email}:null;u?localStorage.ag_me=JSON.stringify(me):localStorage.removeItem('ag_me')};
const toast=m=>{let t=$('#toast');if(!t){t=document.createElement('div');t.id='toast';document.body.appendChild(t)}t.textContent=m;t.classList.add('show');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),2800)};
const T=fn=>async(...a)=>{try{await fn(...a)}catch(e){toast(e.message)}};
const go=url=>setTimeout(()=>location.href=url,700);

/* ---- AUTH: one login page for everyone; your role decides where you land ---- */
async function hashPw(pw,salt){const d=new TextEncoder().encode(salt+pw);
 if(window.crypto&&crypto.subtle){const b=await crypto.subtle.digest('SHA-256',d);return[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}
 return btoa(unescape(encodeURIComponent(salt+pw)))}
const mkSalt=()=>crypto.getRandomValues?[...crypto.getRandomValues(new Uint8Array(8))].join(''):String(Math.random());
let fails=0,lock=0;
async function guard(ok){if(Date.now()<lock)throw Error('Too many attempts. Wait 30 seconds.');if(!ok){if(++fails>=5){lock=Date.now()+30000;fails=0}throw Error('Wrong email or password.')}fails=0}
const ownerExists=()=>DB.users.some(u=>u.role==='owner');
const wantsOwner=()=>new URLSearchParams(location.search).get('role')==='owner'&&!ownerExists();
const landing=u=>u.role==='customer'?(sessionStorage.next||'index.html'):'staff.html';
const doSignup=T(async e=>{e.preventDefault();const f=e.target.elements,v=n=>f[n].value.trim(),email=v('email').toLowerCase();
 if(v('name').length<2)throw Error('Enter your full name.');if(!/^\S+@\S+\.\S+$/.test(email))throw Error('Enter a valid email.');
 if(!/^[0-9+ ]{9,15}$/.test(v('phone')))throw Error('Enter a valid phone number.');
 if(f.pw.value.length<8||!/\d/.test(f.pw.value)||!/[A-Za-z]/.test(f.pw.value))throw Error('Password: 8+ characters, letters and a number.');
 if(f.pw.value!==f.pw2.value)throw Error('Passwords do not match.');if(!f.terms.checked)throw Error('Please accept the terms.');
 if(DB.users.some(u=>u.email===email))throw Error('That email is already registered.');
 const salt=mkSalt(),u={id:DB.nextU++,role:wantsOwner()?'owner':'customer',name:v('name'),email,phone:v('phone'),salt,hash:await hashPw(f.pw.value,salt),points:0,earned:0,coupons:[],created:Date.now()};
 DB.users.push(u);save();setMe(u);toast('Welcome to Afro Glow! 💜');const nx=landing(u);sessionStorage.removeItem('next');go(nx)});
const doLogin=T(async e=>{e.preventDefault();const f=e.target.elements,u=DB.users.find(x=>x.email===f.email.value.trim().toLowerCase());
 await guard(u&&u.hash===await hashPw(f.pw.value,u.salt));setMe(u);toast('Welcome back, '+u.name.split(' ')[0]+'! 💜');const nx=landing(u);sessionStorage.removeItem('next');go(nx)});
const logout=()=>{setMe(null);sessionStorage.clear();toast('Logged out');go('index.html')};
const need=n=>{sessionStorage.next=n;toast('Please log in first');go('login.html')};

/* ---- CART & PRICING ---- */
let cart={};try{cart=JSON.parse(localStorage.ag_cart||'{}')}catch{}
for(const id in cart)if(!P(id))delete cart[id];
const saveCart=()=>localStorage.ag_cart=JSON.stringify(cart);
const cartCount=()=>Object.values(cart).reduce((a,b)=>a+b,0),cartSub=()=>Object.entries(cart).reduce((s,[id,q])=>s+P(id).price*q,0);
function add(id){const p=P(id);if((cart[id]||0)>=p.stock)return toast('No more stock available');cart[id]=(cart[id]||0)+1;saveCart();layout();toast(p.name+' added 🛍️')}
function setQty(id,q){if(q<=0)delete cart[id];else cart[id]=Math.min(q,P(id).stock,20);saveCart();layout();if(typeof drawCart==='function'&&document.body.dataset.page==='cart')drawCart()}
function quote(sub,method,code){
 let fee=method==='delivery'&&sub<FREE?DELIV:0,disc=0,label='',err='';code=(code||'').trim().toUpperCase();
 if(code){const pm=PROMOS.find(p=>p.code===code),u=U(),cp=u&&(u.coupons||[]).find(c=>c.code===code&&!c.used);
  if(pm){if(sub<pm.min)err=`Spend ${R(pm.min)} or more to use ${code}`;
   else if(pm.type==='ship'&&method!=='delivery')err=`${code} only applies to delivery orders`;
   else if(pm.first&&DB.sales.some(s=>me&&s.cust===me.email&&s.status!=='cancelled'))err=`${code} is for first orders only`;
   else{if(pm.type==='pct')disc=sub*pm.val/100;if(pm.type==='amt')disc=pm.val;if(pm.type==='ship')fee=0;label=pm.title}}
  else if(cp){disc=Math.min(cp.off,sub);label='Voucher '+R(cp.off)}
  else err='That code is not valid'}
 disc=Math.round(disc*100)/100;return{sub,fee,disc,total:Math.max(0,sub-disc)+fee,label,err,code:err?'':code}}

/* ---- SALES, STOCK, LOYALTY ---- */
function makeSale(o){
 const lines=[];for(const[id,q]of Object.entries(o.items)){const p=P(id);if(!p)throw Error('Product missing');if(q>p.stock)throw Error(`Only ${p.stock} left of ${p.name}`);lines.push({pid:p.id,name:p.name,qty:q,price:p.price,cost:p.cost})}
 if(!lines.length)throw Error('Cart is empty');const now=Date.now(),fee=o.fee||0,disc=o.disc||0,instore=o.channel==='till';
 lines.forEach(l=>{P(l.pid).stock-=l.qty;DB.moves.push({t:now,pid:l.pid,name:l.name,type:'sale',qty:l.qty,by:o.by})});
 const s={id:DB.nextSale++,t:now,items:lines,fee,disc,coupon:o.coupon||'',total:Math.max(0,lines.reduce((a,l)=>a+l.price*l.qty,0)-disc)+fee,channel:o.channel,status:instore?'collected':'pending',pay:o.pay||'',by:o.by,paidAt:instore?now:null,cust:o.cust||'',method:o.method||'',addr:o.addr||'',tendered:o.tendered||0};
 DB.sales.push(s);save();return s}
const findSale=id=>DB.sales.find(s=>s.id==id);
function award(s){const u=DB.users.find(x=>x.email===s.cust&&x.role==='customer');if(u&&!s.pts){s.pts=Math.floor(s.total/PTS_PER);u.points=(u.points||0)+s.pts;u.earned=(u.earned||0)+s.pts}}
const tierOf=e=>{let i=0;TIERS.forEach((t,k)=>{if(e>=t[1])i=k});const n=TIERS[i+1];return{name:TIERS[i][0],next:n&&n[0],need:n?n[1]-e:0,pct:n?Math.min(100,Math.round((e-TIERS[i][1])/(n[1]-TIERS[i][1])*100)):100}};
const pending=()=>DB.sales.filter(s=>s.status==='pending').length;
const pcard=(p,i)=>`<div class="card pc t${i%4}"><div class="em">${p.em}</div><h3>${esc(p.name)}</h3><div class="cat">${esc(p.cat)}</div><div class="foot"><span class="price">${p.price>0?R(p.price):''}</span>${p.stock<1?'<span class="tag low">Sold out</span>':p.price>0?`<button class="btn sm" onclick="add(${p.id})">Add</button>`:'<span class="tag go">Ask in store</span>'}</div></div>`;

/* ---- LAYOUT: header, navigation and footer are built here, so every page shares them ---- */
function layout(){
 const pg=document.body.dataset.page||'';
 const L=[['index','Home'],['menu','Menu'],['promotions','Promotions'],['rewards','Loyalty Rewards'],['contact','Contact'],['support','Support']];
 const a=(p,l,c='')=>`<a href="${p}.html" class="${pg===p?'on':''} ${c}">${l}</a>`;
 let n=L.map(([p,l])=>a(p,l)).join('')+a('cart','🛍️ Cart'+(cartCount()?`<span class="cnt">${cartCount()}</span>`:''));
 if(me){n+=(isStaff()?a('staff','Staff Portal'):a('account','Hi, '+esc(me.name.split(' ')[0])))+`<button onclick="logout()">Logout</button>`}
 else n+=a('login','Login')+a('signup','Sign up','reg');
 const open=$('#nav')&&$('#nav').classList.contains('open');
 $('#site-header').innerHTML=`<div class="bar"><a href="index.html" class="logo brand"><img src="images/logo.jpg" alt="Afro Glow logo"><span>Afro<i>Glow</i><small>${esc(SHOP.slogan)}</small></span></a><button class="burger" aria-label="Menu" onclick="$('#nav').classList.toggle('open')">☰</button><nav id="nav" class="${open?'open':''}">${n}</nav></div>`;
 $('#site-footer').innerHTML=`<img src="images/logo.jpg" class="flogo" alt="Afro Glow"><br><b>Afro Glow</b> · <i>${esc(SHOP.slogan)}</i><br>${L.map(([p,l])=>`<a href="${p}.html">${l}</a>`).join(' · ')}<br>📍 ${esc(SHOP.address)} · 📞 ${esc(SHOP.phone)} · ✉️ ${esc(SHOP.email)}<br>© ${new Date().getFullYear()} Afro Glow`;
 document.querySelectorAll('[data-shop]').forEach(e=>{const v=SHOP[e.dataset.shop];e.innerHTML=Array.isArray(v)?v.map(esc).join('<br>'):esc(v);if(e.dataset.href)e.href=e.dataset.href.replace(/\{(\w+)\}/g,(_,k)=>String(SHOP[k]).replace(/\s/g,''))})}
layout();
