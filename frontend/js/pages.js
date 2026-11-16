/* ===== Afro Glow – customer pages (runs the script for the current page) ===== */
const PG={};
let cMethod='collect',cAddr='',cCode='';
const promoCard=p=>`<div class="card promo"><h3>${esc(p.title)}</h3><p class="sub" style="margin:4px 0">${esc(p.desc)}</p><span class="code">${p.code}</span><br><button class="btn sm out" onclick="copyCode('${p.code}')">Copy code</button> <a class="btn sm" href="cart.html">Use in cart</a></div>`;
function copyCode(c){sessionStorage.promo=c;(navigator.clipboard?navigator.clipboard.writeText(c):Promise.reject()).then(()=>toast('Code '+c+' copied – it will be ready in your cart'),()=>toast('Code '+c+' saved for your cart'))}

/* HOME */
PG.index=()=>{const fav=FAV.map(n=>DB.products.find(p=>p.name===n)).filter(Boolean);
 $('#page').innerHTML=`<div class="hero"><img src="images/logo.jpg" class="hero-logo" alt="Afro Glow"><h1>${esc(SHOP.slogan)}</h1><p>Weaves, braiding hair, hair care, accessories, nails and beauty, all in one place.</p><a class="btn y" href="menu.html">Shop the menu</a><a class="btn ghost" href="promotions.html">See promotions</a></div>
 <div class="sec"><h2>Shop by category</h2><p class="sub">Everything you need for your next look</p><div class="cats">${CATS.map(([c,e])=>`<a class="card cat-t" href="menu.html?cat=${encodeURIComponent(c)}"><span>${e}</span>${esc(c)}</a>`).join('')}</div></div>
 <div class="sec"><h2>Customer favourites</h2><p class="sub">Our most loved picks</p><div class="grid">${fav.map(pcard).join('')}</div></div>
 <div class="sec"><h2>Current promotions</h2><p class="sub">Copy a code and use it at checkout</p><div class="grid">${PROMOS.map(promoCard).join('')}</div></div>
 <div class="sec card" style="text-align:center;padding:32px"><h2>Earn points with every order ⭐</h2><p class="sub">1 point for every R${PTS_PER} you spend. Swap points for vouchers.</p><a class="btn" href="rewards.html">Loyalty rewards</a> ${me?'':'<a class="btn y" href="signup.html">Create account</a>'}</div>`};

/* MENU */
PG.menu=()=>{let cat=new URLSearchParams(location.search).get('cat')||'All',q='';
 $('#page').innerHTML=`<div class="pagehead"><h1>Menu</h1><p>${DB.products.length} products across ${CATS.length} categories</p></div><input id="q" placeholder="Search products…" style="max-width:360px"><div class="chips" id="chips"></div><div class="grid" id="grid"></div>`;
 const draw=()=>{$('#chips').innerHTML=['All',...CATS.map(c=>c[0])].map(c=>`<div class="chip ${c===cat?'on':''}" data-c="${esc(c)}">${esc(c)}</div>`).join('');
  $('#grid').innerHTML=DB.products.filter(p=>(cat==='All'||p.cat===cat)&&p.name.toLowerCase().includes(q)).map(pcard).join('')||'<p class="sub">No products found.</p>'};
 $('#q').oninput=e=>{q=e.target.value.toLowerCase();draw()};$('#chips').onclick=e=>{if(e.target.dataset.c){cat=e.target.dataset.c;draw()}};draw()};

/* CART & CHECKOUT */
PG.cart=()=>{cCode=cCode||sessionStorage.promo||'';drawCart()};
function drawCart(){const ids=Object.keys(cart);
 if(!ids.length){$('#page').innerHTML=`<div class="card" style="text-align:center;padding:48px"><div style="font-size:58px">🛍️</div><h2>Your cart is empty</h2><p class="sub">Find something you love.</p><a class="btn" href="menu.html">Go to the menu</a></div>`;return}
 const q=quote(cartSub(),cMethod,cCode);
 $('#page').innerHTML=`<h2 class="t" style="margin-bottom:12px">Your cart</h2><div class="two"><div class="card">${ids.map(id=>{const p=P(id);return`<div class="line"><span style="font-size:32px">${p.em}</span><span class="nm">${esc(p.name)}<br><small>${R(p.price)} each</small></span><span class="qty"><button onclick="setQty(${id},${cart[id]-1})">−</button><b>${cart[id]}</b><button onclick="setQty(${id},${cart[id]+1})">+</button></span><b style="min-width:76px;text-align:right">${R(p.price*cart[id])}</b><button class="btn sm out" onclick="setQty(${id},0)">✕</button></div>`}).join('')}<p style="margin-top:12px"><a href="menu.html" style="color:var(--bl);font-weight:600">← Keep shopping</a></p></div>
 <form class="card" onsubmit="placeOrder(event)"><h3>Checkout</h3><label>Collect or deliver?</label><select onchange="cMethod=this.value;drawCart()"><option value="collect" ${cMethod==='collect'?'selected':''}>Collect in store (free)</option><option value="delivery" ${cMethod==='delivery'?'selected':''}>Delivery (${R(DELIV)}, free over ${R(FREE)})</option></select>
 ${cMethod==='delivery'?`<label>Delivery address</label><textarea rows="2" oninput="cAddr=this.value">${esc(cAddr)}</textarea>`:''}
 <label>Promo code or voucher</label><div class="row" style="margin:0"><input id="pc" value="${esc(cCode)}" placeholder="e.g. GLOW10"><button type="button" class="btn sm" onclick="cCode=$('#pc').value.trim();sessionStorage.promo=cCode;drawCart()">Apply</button></div>
 <div class="${q.err?'err':'sub'}" style="min-height:18px;margin:4px 0">${q.err?esc(q.err):q.label?'✅ '+esc(q.label)+' applied':''}</div>
 <div class="tot"><span>Subtotal</span><span>${R(q.sub)}</span></div>${q.disc?`<div class="tot"><span>Discount</span><span>−${R(q.disc)}</span></div>`:''}<div class="tot"><span>Delivery</span><span>${R(q.fee)}</span></div><div class="tot big"><span>Total</span><span>${R(q.total)}</span></div>
 <p style="font-size:12px;color:var(--mut)">Pay on collection or delivery. You earn ${Math.floor(q.total/PTS_PER)} loyalty points when your order is collected.</p><button class="btn y" style="width:100%">${me?'Place order':'Log in to order'}</button></form></div>`}
const placeOrder=T(e=>{e.preventDefault();if(!me)return need('cart.html');if(isStaff())throw Error('Staff accounts cannot place customer orders. Use the Till in the Staff Portal.');
 const q=quote(cartSub(),cMethod,cCode);if(q.err)throw Error(q.err);if(cMethod==='delivery'&&cAddr.trim().length<6)throw Error('Enter a delivery address.');
 const s=makeSale({items:cart,channel:'online',by:'online',cust:me.email,method:cMethod,addr:cMethod==='delivery'?cAddr.trim():'',fee:q.fee,disc:q.disc,coupon:q.code});
 const cp=(U().coupons||[]).find(c=>c.code===q.code&&!c.used);if(cp){cp.used=true;save()}
 cart={};saveCart();cCode='';sessionStorage.removeItem('promo');layout();toast('Order #'+s.id+' placed! Pay on collection/delivery 🎉');go('account.html')});

/* PROMOTIONS */
PG.promotions=()=>{$('#page').innerHTML=`<div class="pagehead"><h1>Promotions</h1><p>Save on your next order. Copy a code, then paste it at checkout.</p></div><div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(280px,1fr))">${PROMOS.map(promoCard).join('')}</div>
 <div class="sec two"><div class="card"><h3>🚚 Free delivery over ${R(FREE)}</h3><p class="sub" style="margin:4px 0 0">Orders of ${R(FREE)} or more are delivered free. No code needed.</p></div><div class="card"><h3>⭐ Loyalty vouchers</h3><p class="sub" style="margin:4px 0 8px">Earn points on every order and swap them for vouchers.</p><a class="btn sm" href="rewards.html">See rewards</a></div></div>`};

/* LOYALTY REWARDS */
PG.rewards=()=>{const u=me&&me.role==='customer'?U():null;
 const how=`<div class="info"><div class="card"><span>🛍️</span><b>Shop</b>Order online or in store.</div><div class="card"><span>⭐</span><b>Earn</b>1 point for every R${PTS_PER} you spend, added when your order is collected.</div><div class="card"><span>🎁</span><b>Redeem</b>Swap points for vouchers and use them at checkout.</div></div>`;
 if(!u){$('#page').innerHTML=`<div class="pagehead"><h1>Loyalty Rewards</h1><p>Every order brings you closer to a reward.</p></div>${how}<div class="card" style="text-align:center;padding:30px">${isStaff()?'<p class="sub">Loyalty points are for customer accounts. At the Till, enter a customer email to give them points.</p>':'<h3>Join to start earning</h3><p class="sub">Log in or create an account to see your points.</p><a class="btn" href="login.html" onclick="sessionStorage.next=\'rewards.html\'">Log in</a> <a class="btn y" href="signup.html" onclick="sessionStorage.next=\'rewards.html\'">Sign up</a>'}</div>`;return}
 const t=tierOf(u.earned||0),vs=(u.coupons||[]).filter(c=>!c.used);
 $('#page').innerHTML=`<div class="pagehead"><h1>Loyalty Rewards</h1><p>Hi ${esc(u.name.split(' ')[0])}, here is your balance.</p></div>
 <div class="card" style="margin-bottom:18px"><div class="row" style="justify-content:space-between"><div><span class="sub">Points balance</span><div style="font-size:34px;font-weight:700">${u.points||0} ⭐</div></div><span class="tag" style="font-size:15px">${t.name} member</span></div>
 <div class="prog"><i style="width:${t.pct}%"></i></div><small class="sub">${t.next?`${t.need} more points to reach ${t.next}`:'You have reached our top tier 🎉'}</small></div>${how}
 <h2 class="t" style="margin-bottom:10px">Redeem points</h2><div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(210px,1fr))">${REWARDS.map((r,i)=>`<div class="card"><h3>${r.name}</h3><p class="sub" style="margin:2px 0 10px">${r.pts} points</p><button class="btn sm ${(u.points||0)>=r.pts?'y':''}" ${(u.points||0)>=r.pts?'':'disabled'} onclick="redeem(${i})">Redeem</button></div>`).join('')}</div>
 <h2 class="t" style="margin:26px 0 10px">My vouchers</h2>${vs.map(c=>`<div class="card" style="margin-bottom:8px"><span class="code">${c.code}</span> <b>${R(c.off)} off</b> <a class="btn sm" href="cart.html" onclick="sessionStorage.promo='${c.code}'">Use in cart</a></div>`).join('')||'<p class="sub">No vouchers yet. Redeem points above.</p>'}`};
const redeem=T(i=>{const u=U(),r=REWARDS[i];if(!u||me.role!=='customer')throw Error('Log in with a customer account first.');if((u.points||0)<r.pts)throw Error('Not enough points yet.');
 u.points-=r.pts;const code='RWD-'+Math.random().toString(36).slice(2,8).toUpperCase();(u.coupons=u.coupons||[]).push({code,off:r.off,used:false,t:Date.now()});save();toast('Voucher '+code+' added 🎁');PG.rewards()});

/* ACCOUNT */
PG.account=()=>{if(!me)return need('account.html');if(isStaff())return location.replace('staff.html');
 const u=U(),os=DB.sales.filter(s=>s.cust===me.email).reverse(),t=tierOf(u.earned||0);
 $('#page').innerHTML=`<div class="pagehead"><h1>My account</h1><p>${esc(u.name)} · ${esc(u.email)} · ${esc(u.phone)}</p></div>
 <div class="two" style="margin-bottom:18px"><div class="card"><span class="sub">Loyalty points</span><div style="font-size:30px;font-weight:700">${u.points||0} ⭐ <span class="tag">${t.name}</span></div><a class="btn sm" href="rewards.html">Redeem rewards</a></div><div class="card"><span class="sub">Unused vouchers</span><div style="font-size:30px;font-weight:700">${(u.coupons||[]).filter(c=>!c.used).length} 🎁</div><a class="btn sm" href="rewards.html">View vouchers</a></div></div>
 <h2 class="t">My orders</h2>${os.map(o=>`<div class="card" style="margin-top:10px"><div class="row" style="justify-content:space-between"><b>Order #${o.id}</b><span class="tag ${o.status==='collected'?'ok':o.status==='pending'?'go':'low'}">${o.status==='collected'?'Completed':o.status==='pending'?'Pending':'Cancelled'}</span></div>
 <small>${dt(o.t)} · ${o.method==='delivery'?'Delivery to '+esc(o.addr):o.method==='collect'?'Collect in store':'In store'}</small><div style="margin:6px 0">${o.items.map(i=>`${esc(i.name)} × ${i.qty}`).join('<br>')}</div><b>Total ${R(o.total)}</b>${o.disc?` <small>(saved ${R(o.disc)})</small>`:''}${o.pts?` <span class="tag ok">+${o.pts} pts</span>`:''}</div>`).join('')||'<p class="sub" style="margin-top:8px">No orders yet. <a href="menu.html" style="color:var(--bl);font-weight:600">Start shopping</a></p>'}`};

/* LOGIN / SIGN UP */
PG.login=()=>{if(me)return location.replace(isStaff()?'staff.html':'index.html');if(!ownerExists())$('#owner-note').innerHTML='Shop owner? <a href="signup.html?role=owner" style="color:var(--bl);font-weight:600">Set up the owner account first</a>'};
PG.signup=()=>{if(me)return location.replace(isStaff()?'staff.html':'index.html');
 if(wantsOwner()){$('#su-title').textContent='Create owner account 👑';$('#su-sub').textContent='This first account becomes the shop owner and opens the Staff Portal. Staff accounts are added later from Team.'}};
function togglePw(b){const i=b.previousElementSibling;i.type=i.type==='password'?'text':'password'}

/* CONTACT & SUPPORT FORMS */
const sendMsg=T((e,type)=>{e.preventDefault();const f=e.target.elements,v=n=>f[n]?f[n].value.trim():'';
 if(v('name').length<2)throw Error('Enter your name.');if(!/^\S+@\S+\.\S+$/.test(v('email')))throw Error('Enter a valid email.');if(v('text').length<5)throw Error('Please write a short message.');
 DB.msgs.push({id:Date.now()+Math.floor(Math.random()*999),t:Date.now(),type,name:v('name'),email:v('email').toLowerCase(),topic:v('topic'),order:v('order'),text:v('text'),status:'open'});save();e.target.reset();
 toast(type==='support'?'Ticket sent. We will reply by email 💜':'Message sent. We will be in touch 💜')});
const prefill=()=>{if(me){const f=document.forms[0];if(f&&f.elements.name)f.elements.name.value=me.name;if(f&&f.elements.email)f.elements.email.value=me.email}};
if(PG[document.body.dataset.page])PG[document.body.dataset.page]();if(['contact','support'].includes(document.body.dataset.page))prefill();
