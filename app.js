(function(){
'use strict';
var DATA=window.__COUNTIES__||[];
var stage=document.getElementById('stage');
var svg=document.getElementById('nemap');
var tip=document.getElementById('tip');
var selEl=document.getElementById('selbody');
var opEl=document.getElementById('oplist');
var searchEl=document.getElementById('q');
var measure='score', selected=null;
var GROUPS=Array.prototype.slice.call(svg.querySelectorAll('.cty'));
var G={}; GROUPS.forEach(function(el){
  G[el.getAttribute('data-i')]=el;
  var d=DATA[+el.getAttribute('data-i')];
  if(d&&d.n)el.setAttribute('aria-label',d.n+' County');
});
function nf(n){return (n||0).toLocaleString('en-US');}
function slug(s){return s.toLowerCase().replace(/[^a-z0-9]+/g,'-');}
var MET={score:{g:function(d){return d.wx?d.wx.score:0;},dir:1},
 hail:{g:function(d){return d.wx?d.wx.hail_events:0;},dir:1},
 wind:{g:function(d){return d.wx?d.wx.wind_events:0;},dir:1},
 age:{g:function(d){return d.wx?d.wx.medyear:0;},dir:-1},
 pop:{g:function(d){return d.pop;},dir:1}};
var BINS={};
Object.keys(MET).forEach(function(m){
  var v=DATA.map(MET[m].g).filter(function(x){return x>0;}).sort(function(a,b){return a-b;});
  var lo=v[0],hi=v[v.length-1],e=[];
  for(var i=1;i<6;i++)e.push(lo+(hi-lo)*i/6);
  BINS[m]=e;
});
function bin(m,d){
  var val=MET[m].g(d);
  if(!val)return 0;
  var e=BINS[m],b=0;while(b<5&&val>=e[b])b++;
  return MET[m].dir>0?b:(5-b);
}
function paint(m){
  measure=m;
  GROUPS.forEach(function(el){
    var d=DATA[+el.getAttribute('data-i')];
    var b=bin(m,d);
    el.setAttribute('class','cty b'+b+(b>=4?' dark-lbl':''));
  });
  ['score','hail','wind','age','pop'].forEach(function(k){
    var l=document.getElementById('leg_'+k);
    if(l)l.style.display=(k===m)?'':'none';
  });
  document.querySelectorAll('#meas button').forEach(function(b){
    b.setAttribute('aria-pressed',b.getAttribute('data-m')===m?'true':'false');
  });
}
function place(e){var r=stage.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top,hw=tip.offsetWidth/2;
  x=Math.max(hw+6,Math.min(r.width-hw-6,x));tip.style.left=x+'px';tip.style.top=(y-8)+'px';}
function row(a,b){return '<div class="tr"><span>'+a+'</span><b>'+b+'</b></div>';}
function showTip(e,d){
  var w=d.wx;
  tip.innerHTML='<p class="tn">'+d.n+' County</p>'+(w?
    row('Opportunity',w.score+' / 10 (# '+w.rk+')')+row('Hail events 10yr',w.hail_events)+row('Wind events 10yr',w.wind_events)+row('Median built',w.medyear):
    row('Population',nf(d.pop)));
  place(e);tip.classList.add('on');
}
function hideTip(){tip.classList.remove('on');}
function bar(l,v){return '<div class="brow"><span class="bl">'+l+'</span><span class="bt"><i style="width:'+(v*10).toFixed(0)+'%"></i></span></div>';}
function select(i){
  selected=i;
  GROUPS.forEach(function(el){el.classList.toggle('sel',el.getAttribute('data-i')===String(i));});
  var d=DATA[i],w=d.wx;
  if(history.replaceState)history.replaceState(null,'','#'+slug(d.n));
  var h='<p class="sel-name">'+d.n+' County</p>';
  if(w)h+='<div class="scorebadge"><b>'+w.score+'</b><span>OPPORTUNITY / 10 &middot; RANK '+w.rk+'</span></div>';
  h+='<div class="wxgrid">'+
    '<div class="c"><span class="k">Population</span><span class="v">'+nf(d.pop)+'</span></div>'+
    '<div class="c"><span class="k">Housing units</span><span class="v">'+nf(d.hu)+'</span></div>';
  if(w){
    h+='<div class="c"><span class="k">Hail events 10yr</span><span class="v">'+w.hail_events+'</span></div>'+
       '<div class="c"><span class="k">Wind events 10yr</span><span class="v">'+w.wind_events+'</span></div>'+
       '<div class="c"><span class="k">Largest hail</span><span class="v">'+w.hail_max+'<small> in</small></span></div>'+
       '<div class="c"><span class="k">Median year built</span><span class="v">'+w.medyear+'</span></div>'+
       '<div class="c"><span class="k">Roofing firms</span><span class="v">'+(w.roofers||'none')+'</span></div>'+
       '<div class="c"><span class="k">Firms / 10k units</span><span class="v">'+w.rd+'</span></div>';
  }
  h+='</div>';
  if(w)h+='<div class="bars">'+bar('Storm volume',w.c_hail)+bar('Roof age',w.c_age)+bar('Market size',w.c_size)+bar('Wind',w.c_wind)+bar('Low competition',w.c_comp)+'</div>';
  selEl.innerHTML=h;
  document.querySelectorAll('table.data tbody tr[data-i]').forEach(function(tr){tr.classList.toggle('hl',tr.getAttribute('data-i')===String(i));});
  renderZips(d);
}
function chipHTML(z,d){
  var pct=Math.round(z[1]*100);
  var cls=z[1]>=0.999?'zfull':(z[1]>=0.5?'zmost':'zpart');
  var t=z[1]>=0.999?('Entirely in '+d.n+' County'):(pct+'% of this ZIP is in '+d.n+' County');
  return '<span class="chip '+cls+'" title="'+t+'">'+z[0]+(z[1]>=0.999?'':' <i>'+pct+'%</i>')+'</span>';
}
function countyURL(d){return location.href.split('#')[0]+'#'+slug(d.n);}
function countyFromHash(){
  var h=(location.hash||'').replace(/^#/,'').toLowerCase();
  if(!h)return null;
  for(var i=0;i<DATA.length;i++){if(slug(DATA[i].n)===h||DATA[i].n.toLowerCase()===h)return i;}
  return null;
}
function renderZips(d){
  var el=document.getElementById('zips');
  var forEl=document.getElementById('zipfor');
  if(forEl)forEl.textContent=d.n+' County';
  if(!d.zips||!d.zips.length){el.innerHTML='<p class="sel-empty">No ZIPs mapped.</p>';return;}
  var full=d.zips.filter(function(z){return z[1]>=0.999;}).length;
  var part=d.zips.length-full;
  el.innerHTML='<div class="zbar"><p class="znote"><b>'+d.zips.length+'</b> ZIPs &middot; '+full+' entirely in county'+(part?(' &middot; '+part+' shared'):'')+'</p><span class="ztools"><button type="button" id="zipcopy">Copy</button><button type="button" id="zipdl">CSV</button><button type="button" id="ziplink">Link</button></span></div><div class="chips">'+d.zips.map(function(z){return chipHTML(z,d);}).join('')+'</div>'+(part?'<p class="zlegend"><span class="dot zfull"></span>whole &middot; <span class="dot zmost"></span>most &middot; <span class="dot zpart"></span>part</p>':'');
  document.getElementById('zipcopy').onclick=function(){copyText(d.zips.map(function(z){return z[0];}).join(', '),this);};
  document.getElementById('zipdl').onclick=function(){downloadCounty(d);};
  document.getElementById('ziplink').onclick=function(){copyText(countyURL(d),this);};
}
function copyText(t,btn){
  var done=function(){var o=btn.textContent;btn.textContent='Copied';btn.classList.add('ok');setTimeout(function(){btn.textContent=o;btn.classList.remove('ok');},1500);};
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(done,function(){legacy(t,done);});}else legacy(t,done);
}
function legacy(t,cb){var a=document.createElement('textarea');a.value=t;a.style.position='fixed';a.style.top='-9999px';document.body.appendChild(a);a.select();try{document.execCommand('copy');cb();}catch(e){}document.body.removeChild(a);}
function csv(name,rows){
  var c=rows.map(function(r){return r.map(function(x){return /[,"\n]/.test(x)?('"'+String(x).replace(/"/g,'""')+'"'):x;}).join(',');}).join('\r\n');
  var a=document.createElement('a');a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(c);a.download=name;document.body.appendChild(a);a.click();document.body.removeChild(a);
}
function downloadCounty(d){
  var rows=[['ZIP Code','County','County FIPS','Portion of ZIP in County']];
  d.zips.forEach(function(z){rows.push([z[0],d.n+' County',d.f,Math.round(z[1]*100)+'%']);});
  csv('Murray-'+d.n+'-County-ZIPs.csv',rows);
}
function renderOp(){
  if(!opEl)return;
  var arr=DATA.filter(function(d){return d.wx;}).slice().sort(function(a,b){return b.wx.score-a.wx.score;}).slice(0,10);
  opEl.innerHTML=arr.map(function(d){
    var w=d.wx;
    return '<button data-i="'+DATA.indexOf(d)+'"><span class="sc">'+w.score+'</span><span class="nm">'+d.n+'</span>'+
      '<span class="sub">'+w.hail_events+' hail &middot; '+(2024-w.medyear)+'yr roofs &middot; '+(w.roofers||0)+' firms</span>'+
      '<span class="bar"><i style="width:'+(w.score*10).toFixed(0)+'%"></i></span></button>';
  }).join('');
}
function renderTable(){
  var tb=document.querySelector('table.data tbody');
  if(!tb)return;
  var arr=DATA.slice().sort(function(a,b){return (b.wx?b.wx.score:0)-(a.wx?a.wx.score:0);});
  tb.innerHTML=arr.map(function(d){var w=d.wx||{};
    return '<tr data-i="'+DATA.indexOf(d)+'"><td>'+(w.rk||'')+'</td><td>'+d.n+'</td><td>'+(w.score||'')+'</td><td>'+(w.hail_events||0)+'</td><td>'+(w.wind_events||0)+'</td><td>'+(w.hail_max||'')+'</td><td>'+(w.medyear||'')+'</td><td>'+nf(d.hu)+'</td><td>'+(w.roofers||'-')+'</td></tr>';}).join('');
  document.querySelectorAll('table.data tbody tr[data-i]').forEach(function(tr){
    tr.addEventListener('click',function(){select(+tr.getAttribute('data-i'));var el=G[tr.getAttribute('data-i')];if(el&&el.scrollIntoView)el.scrollIntoView({block:'center',behavior:'smooth'});});
  });
}
svg.addEventListener('mouseover',function(e){var g=e.target.closest('.cty');if(!g||g.classList.contains('dim'))return;showTip(e,DATA[+g.getAttribute('data-i')]);});
svg.addEventListener('mousemove',function(e){var g=e.target.closest('.cty');if(!g)return;place(e);});
svg.addEventListener('mouseout',function(e){if(!e.relatedTarget||!e.relatedTarget.closest('.cty'))hideTip();});
svg.addEventListener('click',function(e){var g=e.target.closest('.cty');if(!g)return;select(+g.getAttribute('data-i'));});
svg.addEventListener('keydown',function(e){var g=e.target.closest('.cty');if(!g)return;if(e.key==='Enter'||e.key===' '){e.preventDefault();select(+g.getAttribute('data-i'));}});
document.querySelectorAll('#meas button').forEach(function(b){b.addEventListener('click',function(){paint(b.getAttribute('data-m'));});});
searchEl.addEventListener('input',function(){
  var q=this.value.trim().toLowerCase();
  GROUPS.forEach(function(el){var d=DATA[+el.getAttribute('data-i')];el.classList.toggle('dim',!!q&&d.n.toLowerCase().indexOf(q)<0);});
});
if(opEl)opEl.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;select(+b.getAttribute('data-i'));});
window.addEventListener('hashchange',function(){var i=countyFromHash();if(i!=null)select(i);});
renderOp();renderTable();paint('score');
var s=countyFromHash();select(s!=null?s:0);
})();
