(function(){
'use strict';
var DATA=window.__COUNTIES__||[];
var stage=document.getElementById('stage');
var svg=document.getElementById('nemap');
var tip=document.getElementById('tip');
var selEl=document.getElementById('selbody');
var pickEl=document.getElementById('picklist');
var cntEl=document.getElementById('selcount');
var searchEl=document.getElementById('q');
var layer='all', selected=null, picked={};
var LAYERS=['all','storm','pop','hu','inc'];
var GROUPS=Array.prototype.slice.call(svg.querySelectorAll('.cty'));
var G={}; GROUPS.forEach(function(el){G[el.getAttribute('data-i')]=el;});
function nf(n){return (n||0).toLocaleString('en-US');}
function slug(s){return s.toLowerCase().replace(/[^a-z0-9]+/g,'-');}
function sd(d){return d.sd||{};}
function val(m,d){var s=sd(d);
  if(m==='pop')return d.pop;
  if(m==='hu')return d.hu;
  if(m==='inc')return s.inc||0;
  if(m==='storm')return (s.hq||0)+(s.wq||0);
  return 0;}
var BINS={};
['pop','hu','inc','storm'].forEach(function(m){
  var v=DATA.map(function(d){return val(m,d);}).sort(function(a,b){return a-b;});
  BINS[m]=[1,2,3,4,5].map(function(i){return v[Math.floor(v.length*i/6)];});
});
function bin(m,d){var x=val(m,d),e=BINS[m],b=0;while(b<5&&x>=e[b])b++;return b;}
function binAll(d){var s=0;['pop','hu','inc','storm'].forEach(function(m){if(bin(m,d)>=3)s++;});return s;}
function colorOf(d){ if(sd(d).recent) return 'red'; if(layer==='all'){return 'b'+[0,1,3,4,5][binAll(d)];} return 'b'+bin(layer,d); }
function paint(){
  GROUPS.forEach(function(el){
    var d=DATA[+el.getAttribute('data-i')];
    var c=colorOf(d), s=sd(d).recent;
    var dark=(!s && c!=='red' && parseInt(c.replace('b',''),10)>=4);
    el.setAttribute('class','cty '+c+(s?' recent':'')+(dark?' dark-lbl':''));
  });
  LAYERS.forEach(function(k){var l=document.getElementById('leg_'+k);if(l)l.style.display=(k===layer)?'':'none';});
  document.querySelectorAll('#meas button').forEach(function(b){b.setAttribute('aria-pressed',b.getAttribute('data-m')===layer?'true':'false');});
}
function place(e){var r=stage.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top,hw=tip.offsetWidth/2;x=Math.max(hw+6,Math.min(r.width-hw-6,x));tip.style.left=x+'px';tip.style.top=(y-8)+'px';}
function row(a,b){return '<div class="tr"><span>'+a+'</span><b>'+b+'</b></div>';}
function showTip(e,d){var s=sd(d);
  tip.innerHTML='<p class="tn">'+d.n+' County</p>'+(s.recent?row('STATUS','STORM '+s.days+'d AGO'):'')+
    row('Qualifying storms',(s.hq||0)+(s.wq||0))+row('Population',nf(d.pop))+row('Housing units',nf(d.hu))+row('Median income','$'+nf(s.inc));
  place(e);tip.classList.add('on');}
function hideTip(){tip.classList.remove('on');}
function select(i){
  selected=i;
  GROUPS.forEach(function(el){el.classList.toggle('sel',el.getAttribute('data-i')===String(i));});
  var d=DATA[i],s=sd(d);
  if(history.replaceState)history.replaceState(null,'','#'+slug(d.n));
  var h='<p class="sel-name">'+d.n+' County</p>';
  if(s.recent)h+='<div class="scorebadge" style="background:linear-gradient(180deg,#c81f1f,#8e1414)"><b>'+s.days+'</b><span>DAYS SINCE 1"+ HAIL / 60MPH+ WIND</span></div>';
  else h+='<div class="sel-rank">Last qualifying storm: '+(s.last||'none on record')+'</div>';
  h+='<div class="wxgrid">'+
    '<div class="c"><span class="k">Population</span><span class="v">'+nf(d.pop)+'</span></div>'+
    '<div class="c"><span class="k">Housing units</span><span class="v">'+nf(d.hu)+'</span></div>'+
    '<div class="c"><span class="k">Median income</span><span class="v">$'+nf(s.inc)+'</span></div>'+
    '<div class="c"><span class="k">Median year built</span><span class="v">'+(s.medyear||'')+'</span></div>'+
    '<div class="c"><span class="k">Qual. hail (1"+)</span><span class="v">'+(s.hq||0)+'</span></div>'+
    '<div class="c"><span class="k">Qual. wind (60+)</span><span class="v">'+(s.wq||0)+'</span></div>'+
    '<div class="c"><span class="k">Largest hail</span><span class="v">'+(s.mxh||0)+'<small> in</small></span></div>'+
    '<div class="c"><span class="k">Minor events</span><span class="v">'+((s.hm||0)+(s.wm||0))+'</span></div>'+
    '<div class="c"><span class="k">Roofing firms</span><span class="v">'+(s.roofers||'none')+'</span></div>'+
    '<div class="c"><span class="k">Recorded damage</span><span class="v">$'+nf(Math.round((s.dmg||0)/1000))+'<small>k</small></span></div>'+
  '</div>';
  var ev=(s.ev||[]).slice(0,6);
  if(ev.length){h+='<div class="evlist"><b>Latest qualifying events</b>'+ev.map(function(e){return '<span>'+(e[0]||'?')+' · '+e[1]+' '+e[2]+(e[1]==='wind'?' mph':'"')+'</span>';}).join('')+'</div>';}
  h+='<button type="button" class="calcbtn" id="roione">Send '+d.n+' to ROI Calculator</button>';
  selEl.innerHTML=h;
  document.getElementById('roione').onclick=function(){copyBlueprint([d.n]);};
  document.querySelectorAll('table.data tbody tr[data-i]').forEach(function(tr){tr.classList.toggle('hl',tr.getAttribute('data-i')===String(i));});
}
function countyFromHash(){var h=(location.hash||'').replace(/^#/,'').toLowerCase();if(!h)return null;for(var i=0;i<DATA.length;i++){if(slug(DATA[i].n)===h||DATA[i].n.toLowerCase()===h)return i;}return null;}
function renderPick(){
  if(!pickEl)return;
  var arr=DATA.slice().sort(function(a,b){return (sd(b).recent?1:0)-(sd(a).recent?1:0)||b.pop-a.pop;});
  pickEl.innerHTML=arr.map(function(d){var s=sd(d),i=DATA.indexOf(d);
    return '<div class="row'+(picked[d.n]?' on':'')+'" data-i="'+i+'"><span class="cb">'+(picked[d.n]?'x':'')+'</span><span class="nm">'+d.n+'</span>'+(s.recent?'<span class="rd">STORM '+s.days+'d</span>':'<span class="st">'+(s.days!=null?s.days+'d':'')+'</span>')+'</div>';}).join('');
  var n=Object.keys(picked).length;
  if(cntEl)cntEl.textContent=n+(n===1?' county':' counties');
}
function renderTable(){
  var tb=document.querySelector('table.data tbody');
  if(!tb)return;
  var arr=DATA.slice().sort(function(a,b){return (sd(b).recent?1:0)-(sd(a).recent?1:0)||(sd(b).days==null?1e9:sd(b).days)-(sd(a).days==null?1e9:sd(a).days)||b.pop-a.pop;});
  tb.innerHTML=arr.map(function(d){var s=sd(d),i=DATA.indexOf(d);
    return '<tr data-i="'+i+'"><td>'+(i+1)+'</td><td>'+d.n+'</td>'+(s.recent?'<td><b class="red">'+s.days+'d</b></td>':'<td></td>')+
      '<td>'+((s.hq||0)+(s.wq||0))+'</td><td>'+(s.hq||0)+'</td><td>'+(s.wq||0)+'</td><td>'+((s.hm||0)+(s.wm||0))+'</td>'+
      '<td>'+nf(d.pop)+'</td><td>'+nf(d.hu)+'</td><td>$'+nf(s.inc)+'</td></tr>';}).join('');
  document.querySelectorAll('table.data tbody tr[data-i]').forEach(function(tr){
    tr.addEventListener('click',function(){select(+tr.getAttribute('data-i'));var el=G[tr.getAttribute('data-i')];if(el&&el.scrollIntoView)el.scrollIntoView({block:'center',behavior:'smooth'});});
  });
}
function copyBlueprint(names){
  var rows=names.map(function(n){var d=DATA.filter(function(x){return x.n===n;})[0];if(!d)return null;var s=sd(d);
    return {county:d.n,state:'NE',pop:d.pop,housing_units:d.hu,median_income:s.inc,median_year_built:s.medyear,qualifying_hail_events:s.hq,qualifying_wind_events:s.wq,minor_events:(s.hm||0)+(s.wm||0),largest_hail_in:s.mxh,recent_storm_days:s.days,last_qualifying_storm:s.last,roofing_firms:s.roofers,recorded_damage_usd:s.dmg,market_index:s.mkt};}).filter(Boolean);
  var payload={source:'murray-territory-atlas',generated:new Date().toISOString(),thresholds:{hail_in:1,wind_mph:60,recent_days:120},counties:rows};
  var t=JSON.stringify(payload,null,1);
  var b=document.getElementById('roibp');
  var done=function(){if(b){var o='Build ROI Blueprint ('+Object.keys(picked).length+')';b.textContent='Blueprint copied';setTimeout(function(){b.textContent=o;},1800);}};
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(done,function(){});}else done();
  try{window.open('https://murray-roi-calculator.vercel.app/?from=atlas','_blank');}catch(e){}
}
function renderBp(){var n=Object.keys(picked).length;var b=document.getElementById('roibp');if(b)b.textContent='Build ROI Blueprint ('+n+')';}
svg.addEventListener('mouseover',function(e){var g=e.target.closest('.cty');if(!g||g.classList.contains('dim'))return;showTip(e,DATA[+g.getAttribute('data-i')]);});
svg.addEventListener('mousemove',function(e){var g=e.target.closest('.cty');if(!g)return;place(e);});
svg.addEventListener('mouseout',function(e){if(!e.relatedTarget||!e.relatedTarget.closest('.cty'))hideTip();});
svg.addEventListener('click',function(e){var g=e.target.closest('.cty');if(!g)return;select(+g.getAttribute('data-i'));});
svg.addEventListener('keydown',function(e){var g=e.target.closest('.cty');if(!g)return;if(e.key==='Enter'||e.key===' '){e.preventDefault();select(+g.getAttribute('data-i'));}});
document.querySelectorAll('#meas button').forEach(function(b){b.addEventListener('click',function(){layer=b.getAttribute('data-m');paint();});});
searchEl.addEventListener('input',function(){var q=this.value.trim().toLowerCase();GROUPS.forEach(function(el){var d=DATA[+el.getAttribute('data-i')];el.classList.toggle('dim',!!q&&d.n.toLowerCase().indexOf(q)<0);});});
if(pickEl)pickEl.addEventListener('click',function(e){var r=e.target.closest('.row');if(!r)return;var d=DATA[+r.getAttribute('data-i')];picked[d.n]=!picked[d.n];if(!picked[d.n])delete picked[d.n];select(+r.getAttribute('data-i'));renderPick();renderBp();});
var bp=document.getElementById('roibp');
if(bp)bp.addEventListener('click',function(){var names=Object.keys(picked);if(!names.length)return;copyBlueprint(names);});
window.addEventListener('hashchange',function(){var i=countyFromHash();if(i!=null)select(i);});
renderPick();renderTable();paint();renderBp();
var s=countyFromHash();select(s!=null?s:0);
})();
