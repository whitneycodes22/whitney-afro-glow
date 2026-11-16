/* ===== Afro Glow – Staff Portal (only staff and owner accounts can open staff.html) ===== */
const ok=isStaff();if(!ok)location.replace(me?'index.html':'login.html');
let till={},tCat='All',tQ='',tPay='cash',tTend='',tCust='',repDay=today();

/* ---- reports ---- */
function rep(d,who){
 const S=DB.sales.filter(s=>s.status==='collected'&&day(s.paidAt)===d&&(!who||s.by===who)),sum=(a,f)=>a.reduce((x,y)=>x+f(y),0);
 const pay={cash:0,card:0,eft:0};S.forEach(s=>pay[s.pay]=(pay[s.pay]||0)+s.total);
 const total=sum(S,s=>s.total),cogs=sum(S,s=>sum(s.items,i=>i.cost*i.qty)),ex=DB.money.filter(m=>day(m.t)===d),exp=sum(ex,m=>m.amt),mv=DB.moves.filter(m=>day(m.t)===d),by={};
 S.forEach(s=>{by[s.by]=by[s.by]||{n:0,t:0};by[s.by].n++;by[s.by].t+=s.total});
 return{S,total,count:S.length,units:sum(S,s=>sum(s.items,i=>i.qty)),pay,profit:total-cogs,exp,ex,net:total-exp,inn:sum(mv.filter(m=>m.type==='in'),m=>m.qty),out:sum(mv.filter(m=>m.type==='out'),m=>m.qty),by}}
function waReport(){
 const who=isOwner()?null:me.name,r=rep(repDay,who);let num=(DB.wa||SHOP.whatsapp||'').replace(/\D/g,'');
 if(!num||/^270+$/.test(num)){num=(prompt("Owner's WhatsApp number with country code, e.g. 27821234567")||'').replace(/\D/g,'');if(!num)return;DB.wa=num;save()}
 const L=[`*Afro Glow report - ${repDay}*`,who?`Staff: ${who}`:'',`Sales: ${r.count} (${R(r.total)})`,`Cash ${R(r.pay.cash)} | Card ${R(r.pay.card)} | EFT ${R(r.pay.eft)}`,`Units sold: ${r.units}`];
 if(!who)L.push(`Expenses: ${R(r.exp)}`,`Net: ${R(r.net)}`,`Gross profit: ${R(r.profit)}`,...Object.entries(r.by).map(([n,v])=>`${n}: ${v.n} sales, ${R(v.t)}`));
 const low=DB.products.filter(p=>p.stock<=LOW);if(low.length)L.push('Low stock: '+low.map(p=>`${p.name} (${p.stock})`).join(', '));
 window.open('https://wa.me/'+num+'?text='+encodeURIComponent(L.filter(Boolean).join('\n')),'_blank')}
function dl(name,text,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click()}
const csv=()=>{const r=rep(repDay,isOwner()?null:me.name);dl(`afroglow-sales-${repDay}.csv`,'Sale,Time,Staff,Payment,Total,Items\n'+r.S.map(s=>[s.id,tm(s.paidAt),s.by,s.pay,s.total,'"'+s.items.map(i=>i.name+' x'+i.qty).join('; ')+'"'].join(',')).join('\n'),'text/csv')};

/* ---- receipt ---- */
function receipt(id){const s=findSale(id);if(!s)return;const m=document.createElement('div');m.className='modal';
 m.innerHTML=`<div class="card rc"><div style="text-align:center"><img src="images/logo.jpg" style="width:70px;height:70px;border-radius:50%"><br><b style="font-size:18px">AFRO GLOW</b><br><i>${esc(SHOP.slogan)}</i><br>${esc(SHOP.address)}</div><hr>
 Receipt #${s.id}<br>${dt(s.paidAt||s.t)}<br>Served by: ${esc(s.by)}<br>Payment: ${s.pay?s.pay.toUpperCase():'-'}${s.status==='pending'?'<br><b>PENDING - NOT PAID</b>':''}<hr>
 <table>${s.items.map(i=>`<tr><td>${esc(i.name)}<br>${i.qty} x ${R(i.price)}</td><td style="text-align:right">${R(i.qty*i.price)}</td></tr>`).join('')}${s.disc?`<tr><td>Discount${s.coupon?' ('+esc(s.coupon)+')':''}</td><td style="text-align:right">-${R(s.disc)}</td></tr>`:''}${s.fee?`<tr><td>Delivery</td><td style="text-align:right">${R(s.fee)}</td></tr>`:''}</table><hr>
 <table><tr><td><b>TOTAL</b></td><td style="text-align:right"><b>${R(s.total)}</b></td></tr>${s.tendered?`<tr><td>Cash given</td><td style="text-align:right">${R(s.tendered)}</td></tr><tr><td>Change</td><td style="text-align:right">${R(s.tendered-s.total)}</td></tr>`:''}</table>${s.pts?`<hr>Loyalty points earned: ${s.pts}`:''}<hr>
 <div style="text-align:center">Thank you for shopping with us!</div>
 <div class="row noprint"><button class="btn sm" onclick="print()">🖨 Print</button><button class="btn sm out" onclick="this.closest('.modal').remove()">Close</button></div></div>`;document.body.appendChild(m)}

/* ---- till ---- */
const tillTotal=()=>Object.entries(till).reduce((s,[id,q])=>s+P(id).price*q,0);
function tAdd(id){const p=P(id);if((till[id]||0)>=p.stock)return toast('No more stock');till[id]=(till[id]||0)+1;tillCart()}
function tSet(id,q){if(q<=0)delete till[id];else till[id]=Math.min(q,P(id).stock);tillCart()}
function tillGrid(){$('#tchips').innerHTML=['All',...CATS.map(c=>c[0])].map(c=>`<div class="chip ${c===tCat?'on':''}" data-c="${esc(c)}">${esc(c)}</div>`).join('');
 const q=tQ.toLowerCase();$('#tgrid').innerHTML=DB.products.filter(p=>(tCat==='All'||p.cat===tCat)&&p.name.toLowerCase().includes(q)).map(p=>`<button class="tile" ${p.stock<1||p.price<=0?'disabled':''} onclick="tAdd(${p.id})"><span class="em">${p.em}</span><b>${esc(p.name)}</b>${p.price>0?R(p.price):'No price'}<br><small style="color:${p.stock<=LOW?'var(--bad)':'var(--mut)'}">${p.stock} left</small></button>`).join('')}
function tillCart(){const t=tillTotal(),ids=Object.keys(till);
 $('#tcart').innerHTML=`<h3>Current sale</h3>${ids.map(id=>`<div class="line"><span class="nm">${esc(P(id).name)}<br><small>${R(P(id).price)}</small></span><span class="qty"><button onclick="tSet(${id},${till[id]-1})">−</button><b>${till[id]}</b><button onclick="tSet(${id},${till[id]+1})">+</button></span><b>${R(P(id).price*till[id])}</b></div>`).join('')||'<p class="sub">Tap products to add them.</p>'}
 <div class="tot big"><span>Total</span><span>${R(t)}</span></div>
 <label>Customer email (optional, to give loyalty points)</label><input type="email" value="${esc(tCust)}" oninput="tCust=this.value">
 <label>Payment</label><select onchange="tPay=this.value;tillCart()"><option value="cash" ${tPay==='cash'?'selected':''}>Cash</option><option value="card" ${tPay==='card'?'selected':''}>Card</option><option value="eft" ${tPay==='eft'?'selected':''}>EFT</option></select>
 ${tPay==='cash'?`<label>Cash received</label><input type="number" min="0" value="${tTend}" oninput="tTend=this.value;$('#chg').textContent=R(Math.max(0,tTend-${t}))"><div class="tot"><span>Change</span><b id="chg">${R(Math.max(0,tTend-t))}</b></div>`:''}
 <div class="row"><button class="btn y" style="flex:1" onclick="completeSale()" ${ids.length?'':'disabled'}>Complete sale</button><button class="btn sm out" onclick="till={};tTend='';tillCart()">Clear</button></div>`}
const completeSale=T(()=>{const t=tillTotal();if(tPay==='cash'&&tTend!==''&&+tTend<t)throw Error('Cash received is less than the total');
 const em=tCust.trim().toLowerCase();if(em&&!DB.users.some(u=>u.email===em&&u.role==='customer'))throw Error('No customer account with that email');
 const s=makeSale({items:till,channel:'till',pay:tPay,by:me.name,cust:em,tendered:tPay==='cash'&&tTend!==''?+tTend:0});award(s);save();till={};tTend='';tCust='';tillCart();tillGrid();toast('Sale #'+s.id+' done ✅');receipt(s.id)});

/* ---- online orders ---- */
function collect(id){const s=findSale(id),pay=$('#pay'+id).value;s.status='collected';s.pay=pay;s.paidAt=Date.now();s.by=me.name;award(s);save();render();receipt(id)}
function cancelOrder(id){if(!confirm('Cancel this order and return the stock?'))return;const s=findSale(id);
 s.items.forEach(l=>{const p=P(l.pid);if(p){p.stock+=l.qty;DB.moves.push({t:Date.now(),pid:p.id,name:p.name,type:'return',qty:l.qty,by:me.name})}});
 const u=DB.users.find(x=>x.email===s.cust),cp=u&&s.coupon&&(u.coupons||[]).find(c=>c.code===s.coupon);if(cp)cp.used=false;s.status='cancelled';save();render()}

/* ---- stock ---- */
const stk=T((id,type)=>{const p=P(id),q=Number($('#q'+id).value);if(!Number.isInteger(q)||q<(type==='set'?0:1))throw Error('Enter a valid quantity');
 if(type==='in'){p.stock+=q;if($('#rc').checked&&p.cost>0)DB.money.push({t:Date.now(),amt:p.cost*q,note:`Stock in: ${p.name} x${q}`,by:me.name})}
 else if(type==='out'){if(q>p.stock)throw Error('Not enough stock');p.stock-=q}else{DB.moves.push({t:Date.now(),pid:id,name:p.name,type:'adjust',qty:q-p.stock,by:me.name});p.stock=q;save();return render()}
 DB.moves.push({t:Date.now(),pid:id,name:p.name,type,qty:q,by:me.name});save();render()});
const addProd=T(()=>{const g=i=>$('#'+i).value.trim();if(!g('np')||!g('npp'))throw Error('Name and price needed');const id=DB.nextP++;
 DB.products.push({id,name:g('np'),cat:g('nc')||'General',em:g('ne')||'🛍️',price:+g('npp'),cost:+g('npc')||0,stock:+g('nps')||0});save();render()});
const editP=T((id,k,v)=>{P(id)[k]=Math.max(0,+v);save();toast('Saved')});
const delProd=id=>confirm('Delete this product?')&&(DB.products=DB.products.filter(p=>p.id!==id),delete cart[id],saveCart(),save(),render());
const addExp=T(()=>{const a=+$('#ea').value;if(!(a>0))throw Error('Enter an amount');DB.money.push({t:Date.now(),amt:a,note:$('#en').value.trim()||'Expense',by:me.name});save();render()});

/* ---- team (owner) ---- */
const addStaff=T(async()=>{const n=$('#sn').value.trim(),em=$('#se').value.trim().toLowerCase(),p=$('#sp').value;
 if(n.length<2)throw Error('Name needed');if(!/^\S+@\S+\.\S+$/.test(em))throw Error('Enter a valid email');if(p.length<8)throw Error('Password needs 8+ characters');
 if(DB.users.some(u=>u.email===em))throw Error('That email is already registered');if(DB.users.some(u=>u.role!=='customer'&&u.name.toLowerCase()===n.toLowerCase()))throw Error('A staff member with that name exists');
 const salt=mkSalt();DB.users.push({id:DB.nextU++,role:'staff',name:n,email:em,phone:'',salt,hash:await hashPw(p,salt),points:0,earned:0,coupons:[],created:Date.now()});save();render();toast('Staff added. They log in on the Login page.')});
const resetPw=T(async id=>{const p=prompt('New password (8+ characters)');if(!p)return;if(p.length<8)throw Error('Password too short');const u=DB.users.find(x=>x.id===id);u.salt=mkSalt();u.hash=await hashPw(p,u.salt);save();toast('Password changed')});
const delStaff=id=>confirm('Remove this staff member?')&&(DB.users=DB.users.filter(u=>u.id!==id),save(),render());
const restore=T(f=>{const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(r.result);if(!d.products)throw 0;localStorage[KEY]=r.result;location.reload()}catch{toast('That file is not a valid backup')}};r.readAsText(f.files[0])});

/* ---- inbox ---- */
const msgDone=id=>{const m=DB.msgs.find(x=>x.id===id);m.status=m.status==='open'?'done':'open';save();render()};
const msgDel=id=>confirm('Delete this message?')&&(DB.msgs=DB.msgs.filter(m=>m.id!==id),save(),render());

/* ---- tabs ---- */
const stat=(l,v)=>`<div class="card stat"><span>${l}</span><b>${v}</b></div>`;
const tabs={
till:()=>`<h2 class="t">Till</h2><p class="sub">Tap a product to add it to the sale.</p><div class="two"><div><input placeholder="Search products…" value="${esc(tQ)}" oninput="tQ=this.value;tillGrid()"><div class="chips" id="tchips"></div><div class="grid sm" id="tgrid"></div></div><div class="card" id="tcart"></div></div>`,
orders:()=>{const os=DB.sales.filter(s=>s.status==='pending').reverse();return`<h2 class="t">Online orders</h2><p class="sub">Stock is held for pending orders. Mark collected when the customer pays (they earn points), or cancel to return the stock.</p>${os.map(o=>{const c=DB.users.find(u=>u.email===o.cust)||{};return`<div class="card" style="margin-bottom:10px"><b>Order #${o.id}</b> · ${dt(o.t)} · ${esc(c.name||o.cust)} <small>${esc(c.phone||'')}</small>
 <div><small>${o.method==='delivery'?'Delivery: '+esc(o.addr):'Collect in store'}${o.coupon?' · Code '+esc(o.coupon):''}</small></div><div style="margin:6px 0">${o.items.map(i=>`${esc(i.name)} × ${i.qty}`).join(', ')}</div>
 <div class="row"><b>${R(o.total)}</b><select id="pay${o.id}" style="max-width:110px"><option value="cash">Cash</option><option value="card">Card</option><option value="eft">EFT</option></select><button class="btn sm y" onclick="collect(${o.id})">Collected &amp; paid</button><button class="btn sm pk" onclick="cancelOrder(${o.id})">Cancel</button></div></div>`}).join('')||'<p class="card sub">No pending orders 🎉</p>'}`},
stock:()=>`<h2 class="t">Stock</h2><label style="display:flex;gap:8px;align-items:center;font-weight:400"><input type="checkbox" id="rc" checked style="width:auto"> When receiving stock, record the cost as money out</label>
 <div class="card wrap" style="margin-top:10px"><table><tr><th>Item</th><th>In stock</th><th>Qty</th><th></th>${isOwner()?'<th>Price</th><th>Cost</th><th></th>':''}</tr>${DB.products.map(p=>`<tr><td>${p.em} ${esc(p.name)}</td><td><span class="tag ${p.stock<=LOW?'low':''}">${p.stock}</span></td><td><input id="q${p.id}" type="number" min="0" style="width:72px"></td>
 <td style="white-space:nowrap"><button class="btn sm" onclick="stk(${p.id},'in')">Receive</button> <button class="btn sm pk" onclick="stk(${p.id},'out')">Write-off</button> <button class="btn sm y" onclick="stk(${p.id},'set')">Set count</button></td>
 ${isOwner()?`<td><input type="number" value="${p.price}" style="width:80px" onchange="editP(${p.id},'price',this.value)"></td><td><input type="number" value="${p.cost}" style="width:80px" onchange="editP(${p.id},'cost',this.value)"></td><td><button class="btn sm out" onclick="delProd(${p.id})">✕</button></td>`:''}</tr>`).join('')}</table></div>
 ${isOwner()?`<div class="card" style="margin-top:14px"><h3>Add product</h3><div class="row"><input id="np" placeholder="Name"><input id="nc" placeholder="Category" list="cl"><datalist id="cl">${CATS.map(c=>`<option>${esc(c[0])}</option>`).join('')}</datalist><input id="ne" placeholder="Emoji" style="max-width:80px"><input id="npp" type="number" placeholder="Price"><input id="npc" type="number" placeholder="Cost"><input id="nps" type="number" placeholder="Stock"><button class="btn sm" onclick="addProd()">Add</button></div></div>`:''}`,
dash:()=>{const own=isOwner(),who=own?null:me.name;if(!own)repDay=today();const r=rep(repDay,who),low=DB.products.filter(p=>p.stock<=LOW);
 const week=[...Array(7)].map((_,i)=>{const d=day(Date.now()-(6-i)*864e5);return[d.slice(5),rep(d).total]}),mx=Math.max(1,...week.map(w=>w[1]));
 return`<h2 class="t">${own?'Business dashboard':'My day'}</h2>${own?`<div class="row"><b>Date:</b><input type="date" value="${repDay}" onchange="repDay=this.value;render()" style="max-width:180px"></div>`:`<p class="sub">${esc(me.name)} · ${repDay}</p>`}
 <div class="stats">${stat('Total sales',R(r.total))}${stat('Number of sales',r.count)}${stat('Units sold',r.units)}${stat('Cash',R(r.pay.cash))}${stat('Card',R(r.pay.card))}${stat('EFT',R(r.pay.eft))}${own?stat('Expenses (money out)',R(r.exp))+stat('Net cash',R(r.net))+stat('Gross profit',R(r.profit)):''}${stat('Stock in / out',r.inn+' / '+r.out)}${stat('Pending orders',pending())}</div>
 <div class="row"><button class="btn y" onclick="waReport()">📲 Send report on WhatsApp</button><button class="btn sm out" onclick="csv()">⬇ Sales CSV</button></div>
 ${own?`<div class="two" style="margin-top:14px"><div class="card"><h3>Last 7 days</h3><div class="bars">${week.map(([d,t])=>`<div><small>${t?'R'+Math.round(t):''}</small><i style="height:${Math.round(t/mx*100)}px"></i>${d}</div>`).join('')}</div></div>
 <div class="card"><h3>Sales by staff</h3><table>${Object.entries(r.by).map(([n,v])=>`<tr><td>${esc(n)}</td><td>${v.n} sales</td><td>${R(v.t)}</td></tr>`).join('')||'<tr><td class="sub">No sales</td></tr>'}</table></div></div>`:''}
 <div class="card" style="margin-top:14px"><h3>Sales</h3><div class="wrap"><table><tr><th>#</th><th>Time</th><th>Staff</th><th>Pay</th><th>Total</th><th></th></tr>${r.S.slice().reverse().map(s=>`<tr><td>${s.id}</td><td>${tm(s.paidAt)}</td><td>${esc(s.by)}</td><td>${s.pay}</td><td>${R(s.total)}</td><td><button class="btn sm out" onclick="receipt(${s.id})">Receipt</button></td></tr>`).join('')||'<tr><td colspan="6" class="sub">No sales yet</td></tr>'}</table></div></div>
 ${low.length?`<div class="card" style="margin-top:14px"><h3>⚠ Low stock (${low.length})</h3>${low.map(p=>`${esc(p.name)}: <b>${p.stock}</b>`).join(' · ')}</div>`:''}
 ${own?`<div class="card" style="margin-top:14px"><h3>Money out</h3><div class="row"><input id="ea" type="number" placeholder="Amount (R)"><input id="en" placeholder="What for? (rent, transport…)"><button class="btn sm" onclick="addExp()">Save expense</button></div>
 <table>${r.ex.map(m=>`<tr><td>${tm(m.t)}</td><td>${esc(m.note)}</td><td>${R(m.amt)}</td><td>${esc(m.by)}</td></tr>`).join('')}</table></div>
 <div class="card" style="margin-top:14px"><h3>Settings &amp; backup</h3><div class="row"><input placeholder="Owner WhatsApp (e.g. 27821234567)" value="${esc(DB.wa)}" onchange="DB.wa=this.value;save();toast('Saved')"></div>
 <div class="row"><button class="btn sm out" onclick="dl('afroglow-backup-'+today()+'.json',JSON.stringify(DB),'application/json')">⬇ Download backup</button><label class="btn sm out" style="margin:0">⬆ Restore backup<input type="file" accept=".json" hidden onchange="restore(this)"></label></div></div>`:''}`},
inbox:()=>{const ms=DB.msgs.slice().reverse();return`<h2 class="t">Inbox</h2><p class="sub">Messages from the Contact and Support pages.</p>${ms.map(m=>`<div class="card" style="margin-bottom:10px"><div class="row" style="justify-content:space-between"><b>${esc(m.name)}</b><span><span class="tag ${m.type==='support'?'low':''}">${m.type}</span> <span class="tag ${m.status==='open'?'go':'ok'}">${m.status}</span></span></div>
 <small>${dt(m.t)} · ${esc(m.email)}${m.order?' · Order #'+esc(m.order):''}${m.topic?' · '+esc(m.topic):''}</small><p style="margin:6px 0">${esc(m.text)}</p>
 <div class="row"><a class="btn sm" href="mailto:${esc(m.email)}?subject=Afro%20Glow">Reply by email</a><button class="btn sm y" onclick="msgDone(${m.id})">${m.status==='open'?'Mark done':'Reopen'}</button><button class="btn sm out" onclick="msgDel(${m.id})">Delete</button></div></div>`).join('')||'<p class="card sub">No messages yet 🎉</p>'}`},
team:()=>`<h2 class="t">Team</h2><p class="sub">Staff log in on the normal Login page and are taken straight to this portal.</p><div class="card"><div class="row"><input id="sn" placeholder="Name"><input id="se" type="email" placeholder="Email"><input id="sp" type="password" placeholder="Password (8+ characters)"><button class="btn sm" onclick="addStaff()">Add staff</button></div>
 <div class="wrap"><table>${DB.users.filter(u=>u.role==='staff').map(u=>`<tr><td>${esc(u.name)}</td><td>${esc(u.email)}</td><td>${rep(today(),u.name).count} sales today</td><td><button class="btn sm out" onclick="resetPw(${u.id})">Reset password</button> <button class="btn sm pk" onclick="delStaff(${u.id})">Remove</button></td></tr>`).join('')||'<tr><td class="sub">No staff yet</td></tr>'}</table></div></div>`};
const TABS=[['till','🧾 Till'],['orders','Orders'],['stock','Stock'],['dash',isOwner()?'Dashboard':'My day'],['inbox','Inbox'],['team','Team']];
function show(){let r=location.hash.slice(1)||'till';if(!tabs[r]||(r==='team'&&!isOwner()))r='till';
 const n={orders:pending(),inbox:DB.msgs.filter(m=>m.status==='open').length};
 $('#page').innerHTML=`<div class="pagehead"><h1>Staff Portal</h1><p>Signed in as ${esc(me.name)} (${me.role})</p></div><div class="subnav">${TABS.filter(t=>t[0]!=='team'||isOwner()).map(([k,l])=>`<a href="#${k}" class="${r===k?'on':''}">${l}${n[k]?`<span class="cnt">${n[k]}</span>`:''}</a>`).join('')}</div><div id="tab">${tabs[r]()}</div>`;
 if(r==='till'){tillGrid();tillCart();$('#tchips').onclick=e=>{if(e.target.dataset.c){tCat=e.target.dataset.c;tillGrid()}}}}
const render=()=>{const y=scrollY;show();scrollTo(0,y)};
if(ok){addEventListener('hashchange',()=>{show();scrollTo(0,0)});show()}
