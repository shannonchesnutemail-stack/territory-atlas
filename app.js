(function(){
'use strict';
var DATA=window.__COUNTIES__||[];
var ZG=window.__ZIPGEO__||{};
var Z=ZG.z||{};
var svg=document.getElementById('nemap');
var stage=document.getElementById('stage');
var tip=document.getElementById('tip');
var selEl=document.getElementById('selbody');
var pickEl=document.getElementById('picklist');
var cntEl=document.getElementById('selcount');
var searchEl=document.getElementById('q');
var layer='all', selMode='county', selected=null;
var sel={counties:{},zips:{}};
var LAYERS=['all','storm','pop','hu','inc'];
var GROUPS=Array.prototype.slice.call(svg.querySelectorAll('.cty'));
var G={}; GROUPS.forEach(function(el){G[el.getAttribute('data-i')]=el;});
function nf(n){return (n||0).toLocaleString('en-US');}
function slug(s){return s.toLowerCase().replace(/[^a-z0-9]+/g,'-');}
function sd(d){return d.sd||{};}
function zrec(z){return Z[z]||{};}
function band(days){ if(days==null) return 0; if(days<=21) return 2; if(days<=60) return 1; return 0; }
var zg=document.createElementNS('http://www.w3.org/2000/svg','g');
zg.setAttribute('id','ziplayer');
Object.keys(Z).forEach(function(z){
  var p=document.createElementNS('http://www.w3.org/2000/svg','path');
  p.setAttribute('d',Z[z].d||'');
  var b=band(Z[z].dd);
  p.setAttribute('class','zip '+(b===2?'R':(b===1?'O':'N')));
  p.setAttribute('data-z',z);
  zg.appendChild(p);
});
svg.appendChild(zg);
GROUPS.forEach(function(g){var t=g.querySelectorAll('.cty-name,.cty-pop');for(var i=0;i<t.length;i++){var el=t[i].parentNode===g?t[i]:t[i].parentNode;el.setAttribute('data-lift','1');svg.appendChild(el);}});
var ZP=Array.prototype.slice.call(svg.querySelectorAll('.zip'));
var ZM={}; ZP.forEach(function(el){ZM[el.getAttribute('data-z')]=el;});
function paint(){
  var showZip=(layer==='all'||layer==='storm');
  Object.keys(ZM).forEach(function(z){
    var b=band(zrec(z).dd);
    ZM[z].setAttribute('class','zip '+(b===2?'R':(b===1?'O':'N'))+(sel.zips[z]?' pk':''));
    ZM[z].style.display=showZip?'':'none';
  });
  GROUPS.forEach(function(el){
    var d=DATA[+el.getAttribute('data-i')]; var cls='cty';
    if(layer==='all'){cls+=' b'+bindAll(d);} else if(layer==='storm'){cls+=' b'+bin('storm',d);} else cls+=' b'+bin(layer,d);
    if(sel.counties[d.n])cls+=' pk';
    el.setAttribute('class',cls);
  });
  LAYERS.forEach(function(k){var l=document.getElementById('leg_'+k);if(l)l.style.display=(k===layer)?'':'none';});
  document.querySelectorAll('#meas button').forEach(function(b){b.setAttribute('aria-pressed',b.getAttribute('data-m')===layer?'true':'false');});
  document.querySelectorAll('#smode button').forEach(function(b){b.setAttribute('aria-pressed',b.getAttribute('data-s')===selMode?'true':'false');});
}
function val(m,d){var s=sd(d); if(m==='pop')return d.pop; if(m==='hu')return d.hu; if(m==='inc')return s.inc||0; if(m==='storm')return (s.hq||0)+(s.wq||0); return 0;}
var BINS={};
['pop','hu','inc','storm'].forEach(function(m){var v=DATA.map(function(d){return val(m,d);}).sort(function(a,b){return a-b;});BINS[m]=[1,2,3,4,5].map(function(i){return v[Math.floor(v.length*i/6)];});});
function bin(m,d){var x=val(m,d),e=BINS[m],b=0;while(b<5&&x>=e[b])b++;return b;}
function bindAll(d){var c=0;['pop','hu','inc','storm'].forEach(function(m){if(bin(m,d)>=3)c++;});return [0,1,3,4,5][c];}
function place(e){var r=stage.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top,hw=tip.offsetWidth/2;x=Math.max(hw+6,Math.min(r.width-hw-6,x));tip.style.left=x+'px';tip.style.top=(y-8)+'px';}
function row(a,b){return '<div class="tr"><span>'+a+'</span><b>'+b+'</b></div>';}
function showTip(e,html){tip.innerHTML=html;place(e);tip.classList.add('on');}
function hideTip(){tip.classList.remove('on');}
function bandTxt(days){ if(days==null) return '<b style="color:#9aa">no recent storm</b>'; if(days<=21) return '<b style="color:#ff5252">RED '+days+'d</b>'; if(days<=60) return '<b style="color:#ffa733">ORANGE '+days+'d</b>'; return days+'d ago'; }
function toggleCounty(name){ if(sel.counties[name]) delete sel.counties[name]; else sel.counties[name]=1; pickHTML(); paint(); }
function toggleZip(z){ if(sel.zips[z]) delete sel.zips[z]; else sel.zips[z]=1; pickHTML(); paint(); }
function clearSel(){ sel={counties:{},zips:{}}; pickHTML(); paint(); }
function selCount(){ return Object.keys(sel.counties).length+Object.keys(sel.zips).length; }
var COST={postcard:0.55,geofence:2.50,digital:1.20,doorhanger:1.10};
var ROOF_RATE=0.055;
var CONV={postcard:0.008,geofence:0.021,digital:0.014,doorhanger:0.012};
var AVG_TICKET=15000, MARGIN=0.30;
function statsOf(){
  var cty=Object.keys(sel.counties), zips=Object.keys(sel.zips);
  var houses=0,inc=[],dmg=0,hail=0,wind=0,n=0;
  DATA.forEach(function(d){ if(cty.indexOf(d.n)>=0){houses+=d.hu; if(sd(d).inc)inc.push(sd(d).inc); dmg+=sd(d).dmg||0; hail+=sd(d).hq||0; wind+=sd(d).wq||0; n++;} });
  var zipHouses=0;
  zips.forEach(function(z){ zipHouses+=(Z[z]&&Z[z].hu)||0; });
  var avgInc=inc.length?Math.round(inc.reduce(function(a,b){return a+b;},0)/inc.length):0;
  return {cty:cty,zips:zips,houses:houses,zipHouses:Math.round(zipHouses),inc:avgInc,dmg:dmg,hail:hail,wind:wind,n:n};
}
function roiCalc(campaign){
  var s=statsOf();
  var homes=s.houses;
  if(s.zips.length>0) homes=s.zipHouses;
  if(!homes) return null;
  var contacts=homes;
  var rate=CONV[campaign]||0.01;
  var leads=Math.round(contacts*rate);
  var jobs=Math.round(leads*0.35);
  var rev=jobs*AVG_TICKET;
  var cost=Math.round(contacts*COST[campaign]);
  var profit=Math.round(rev*MARGIN-cost);
  var roas=cost? +(rev/cost).toFixed(2):0;
  var cpl=leads? Math.round(cost/leads):0;
  return {homes:homes,contacts:contacts,leads:leads,jobs:jobs,rev:rev,cost:cost,profit:profit,roas:roas,cpl:cpl,campaign:campaign};
}
function renderROI(){
  var el=document.getElementById('roibox'); if(!el)return;
  var s=statsOf();
  if(!s.n&&!s.zips.length){el.innerHTML='<p class="opnote">Select counties or ZIPs to model a campaign.</p>';return;}
  var rows=['postcard','digital','geofence','doorhanger'].map(function(c){var r=roiCalc(c); if(!r)return '';
    var name={postcard:'Postcard',digital:'Digital',geofence:'Geofencing',doorhanger:'Door hangers'}[c];
    return '<tr><td>'+name+'</td><td>'+nf(r.contacts)+'</td><td>'+nf(r.leads)+'</td><td>'+nf(r.jobs)+'</td><td>$'+nf(r.cost)+'</td><td>$'+nf(r.rev)+'</td><td><b>$'+nf(r.profit)+'</b></td><td>'+r.roas+'x</td><td>$'+nf(r.cpl)+'</td></tr>';}).join('');
  el.innerHTML='<table class="roi"><thead><tr><th>Channel</th><th>Homes</th><th>Leads</th><th>Jobs</th><th>Cost</th><th>Revenue</th><th>Profit</th><th>ROAS</th><th>CPL</th></tr></thead><tbody>'+rows+'</tbody></table>';
}
function copyBlueprint(){
  var s=statsOf();
  var payload={source:'murray-territory-atlas',generated:new Date().toISOString(),thresholds:{hail_in:1,wind_mph:60,red_days:21,orange_days:60},area:{counties:s.cty,zips:s.zips,housing_units:s.houses,zip_housing_units:s.zipHouses,avg_income:s.inc,qual_hail:s.hail,qual_wind:s.wind,recorded_damage_usd:s.dmg},models:['postcard','digital','geofence','doorhanger'].map(function(c){return roiCalc(c);}).filter(Boolean),assumptions:{avg_ticket:AVG_TICKET,margin:MARGIN,roof_event_rate:ROOF_RATE,conversion:CONV,cost_per_home:COST}};
  var t=JSON.stringify(payload,null,1);
  var b=document.getElementById('roibp');
  var done=function(){if(b){b.textContent='Blueprint copied';setTimeout(function(){b.textContent='Build ROI Blueprint';},1800);}};
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(done,function(){});}else done();
  try{window.open('https://murray-roi-calculator.vercel.app/?from=atlas','_blank');}catch(e){}
}
function copyZipList(){
  var z=Object.keys(sel.zips);
  if(!z.length){var s=statsOf(); z=[]; DATA.forEach(function(d){ if(s.cty.indexOf(d.n)>=0&&d.zips)d.zips.forEach(function(x){z.push(x[0]);}); });}
  z=Array.from(new Set(z)).sort();
  var b=document.getElementById('zipcopy2');
  var t=z.join(', ');
  var done=function(){if(b){b.textContent='Copied '+z.length;setTimeout(function(){b.textContent='Copy ZIP list ('+z.length+')';},1600);}};
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(done,function(){done();});}else done();
}
svg.addEventListener('mouseover',function(e){
  var zp=e.target.closest('.zip');
  if(zp){var z=zp.getAttribute('data-z'),r=zrec(z);
    showTip(e,'<p class="tn">ZIP '+z+' <small>'+(r.c||'')+'</small></p>'+row('Status',bandTxt(r.dd))+row('Qual hail (1"+)',(r.hh||0))+row('Qual wind (60+)',(r.hw||0))+row('Housing units',nf(r.hu)));return;}
  var g=e.target.closest('.cty'); if(!g)return; var d=DATA[+g.getAttribute('data-i')],s=sd(d);
  showTip(e,'<p class="tn">'+d.n+' County</p>'+row('Status',bandTxt(s.days))+row('Qual storms',(s.hq||0)+(s.wq||0))+row('Housing units',nf(d.hu))+row('Median income','$'+nf(s.inc)));
});
svg.addEventListener('mousemove',function(e){ if(e.target.closest('.zip')||e.target.closest('.cty')) place(e); });
svg.addEventListener('mouseout',function(e){ if(!e.relatedTarget||(!e.relatedTarget.closest('.zip')&&!e.relatedTarget.closest('.cty'))) hideTip(); });
svg.addEventListener('click',function(e){
  var zp=e.target.closest('.zip');
  if(zp&&selMode==='zip'){ toggleZip(zp.getAttribute('data-z')); return; }
  var g=e.target.closest('.cty'); if(!g)return;
  if(selMode==='county'){ toggleCounty(DATA[+g.getAttribute('data-i')].n); return; }
  select(+g.getAttribute('data-i'));
});
document.querySelectorAll('#meas button').forEach(function(b){b.addEventListener('click',function(){layer=b.getAttribute('data-m');paint();});});
document.querySelectorAll('#smode button').forEach(function(b){b.addEventListener('click',function(){selMode=b.getAttribute('data-s');pickHTML();paint();});});
if(pickEl)pickEl.addEventListener('click',function(e){var r=e.target.closest('.row'); if(!r)return;
  if(r.getAttribute('data-c')) toggleCounty(r.getAttribute('data-c')); else toggleZip(r.getAttribute('data-z'));
  renderROI();
});
if(searchEl)searchEl.addEventListener('input',function(){var q=this.value.trim().toLowerCase();
  GROUPS.forEach(function(el){var d=DATA[+el.getAttribute('data-i')];el.style.opacity=(!q||d.n.toLowerCase().indexOf(q)>=0)?'':'0.15';});
  document.querySelectorAll('#picklist .row').forEach(function(r){var t=r.textContent.toLowerCase();r.style.display=(!q||t.indexOf(q)>=0)?'':'none';});});
var cb=document.getElementById('clearSel'); if(cb)cb.addEventListener('click',function(){clearSel();renderROI();});
var zp2=document.getElementById('zipcopy2'); if(zp2)zp2.addEventListener('click',copyZipList);
var rb=document.getElementById('roibp'); if(rb)rb.addEventListener('click',function(){if(!selCount())return;copyBlueprint();});
function pickHTML(){
  var h='';
  if(selMode==='county'){
    var arr=DATA.slice().sort(function(a,b){return (sd(b).days==null?1e9:sd(b).days)-(sd(a).days==null?1e9:sd(a).days);});
    h=arr.map(function(d){var s=sd(d);
      return '<div class="row'+(sel.counties[d.n]?' on':'')+'" data-c="'+d.n+'"><span class="cb">'+(sel.counties[d.n]?'x':'')+'</span><span class="nm">'+d.n+'</span>'+(s.days!=null?(s.days<=21?'<span class="rd">RED '+s.days+'d</span>':(s.days<=60?'<span class="or">ORNG '+s.days+'d</span>':'<span class="st">'+s.days+'d</span>')):'<span class="st"></span>')+'</div>';
    }).join('');
  } else {
    var zs=Object.keys(Z).filter(function(z){return Z[z].dd!=null;}).sort(function(a,b){return Z[a].dd-Z[b].dd;});
    h=zs.slice(0,200).map(function(z){var r=Z[z];
      return '<div class="row'+(sel.zips[z]?' on':'')+'" data-z="'+z+'"><span class="cb">'+(sel.zips[z]?'x':'')+'</span><span class="nm">'+z+' <small>'+(r.c||'')+'</small></span>'+(r.dd<=21?'<span class="rd">RED '+r.dd+'d</span>':(r.dd<=60?'<span class="or">ORNG '+r.dd+'d</span>':'<span class="st">'+r.dd+'d</span>'))+'</div>';
    }).join('');
  }
  if(pickEl)pickEl.innerHTML=h;
  if(cntEl)cntEl.textContent=selCount()+' selected';
}
function select(i){ selected=i; GROUPS.forEach(function(el){el.classList.toggle('sel',el.getAttribute('data-i')===String(i));});
  var d=DATA[i],s=sd(d);
  if(history.replaceState)history.replaceState(null,'','#'+slug(d.n));
  var h='<p class="sel-name">'+d.n+' County</p>';
  if(s.days!=null&&s.days<=21)h+='<div class="scorebadge" style="background:linear-gradient(180deg,#c81f1f,#8e1414)"><b>'+s.days+'</b><span>DAYS SINCE QUALIFYING STORM</span></div>';
  else if(s.days!=null&&s.days<=60)h+='<div class="scorebadge" style="background:linear-gradient(180deg,#c47a12,#8a5409)"><b>'+s.days+'</b><span>DAYS SINCE QUALIFYING STORM</span></div>';
  else h+='<div class="sel-rank">Last qualifying storm: '+(s.last||'none on record')+'</div>';
  h+='<div class="wxgrid">'+
    '<div class="c"><span class="k">Population</span><span class="v">'+nf(d.pop)+'</span></div>'+
    '<div class="c"><span class="k">Housing units</span><span class="v">'+nf(d.hu)+'</span></div>'+
    '<div class="c"><span class="k">Median income</span><span class="v">$'+nf(s.inc)+'</span></div>'+
    '<div class="c"><span class="k">Qual hail (1"+)</span><span class="v">'+(s.hq||0)+'</span></div>'+
    '<div class="c"><span class="k">Qual wind (60+)</span><span class="v">'+(s.wq||0)+'</span></div>'+
    '<div class="c"><span class="k">Minor events</span><span class="v">'+((s.hm||0)+(s.wm||0))+'</span></div></div>';
  selEl.innerHTML=h;
}
window.addEventListener('hashchange',function(){});
pickHTML(); paint(); renderROI();
})();
