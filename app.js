/* Territory Atlas - interactions */
(function(){
'use strict';
var DATA=window.__COUNTIES__||[];
var stage=document.getElementById('stage');
var svg=document.getElementById('nemap');
if(!svg&&window.__MAP__&&stage){stage.insertAdjacentHTML('afterbegin',window.__MAP__);svg=document.getElementById('nemap');}
var tip=document.getElementById('tip');
var listEl=document.getElementById('ranklist');
var selEl=document.getElementById('selbody');
var searchEl=document.getElementById('q');
var sortBy='pop', selected=null;
var GROUPS=Array.prototype.slice.call(svg.querySelectorAll('.cty'));
var G={}; GROUPS.forEach(function(el){
  G[el.getAttribute('data-i')]=el;
  var d=DATA[+el.getAttribute('data-i')];
  if(d&&d.n)el.setAttribute('aria-label',d.n+' County, population '+d.pop.toLocaleString('en-US'));
});
function nf(n){return n.toLocaleString('en-US');}
function row(k,v){return '<div class="tr"><span>'+k+'</span><b>'+v+'</b></div>';}
function kv(k,v){return '<div class="r"><span class="k">'+k+'</span><span class="v">'+v+'</span></div>';}
function slug(s){return s.toLowerCase().replace(/[^a-z0-9]+/g,'-');}
function place(e){var r=stage.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top,hw=tip.offsetWidth/2;
  x=Math.max(hw+6,Math.min(r.width-hw-6,x)); tip.style.left=x+'px'; tip.style.top=(y-8)+'px';}
function showTip(e,d){
  tip.innerHTML='<p class="tn">'+d.n+' County</p>'+row('Population',nf(d.pop))+row('Housing units',nf(d.hu))+
    row('Land area',nf(d.area)+' sq mi')+row('People / sq mi',nf(Math.round(d.dens)));
  place(e); tip.classList.add('on');
}
function hideTip(){tip.classList.remove('on');}
function select(i){
  selected=i;
  GROUPS.forEach(function(el){el.classList.toggle('sel',el.getAttribute('data-i')===String(i));});
  var d=DATA[i];
  if(history.replaceState)history.replaceState(null,'','#'+slug(d.n));
  selEl.innerHTML='<p class="sel-name">'+d.n+' County</p><p class="sel-rank">Population rank '+d.rank+' of 93</p>'+
    '<div class="kv">'+kv('Population',nf(d.pop))+kv('Housing units',nf(d.hu))+
    kv('Land area',nf(d.area)+' sq mi')+kv('Density',nf(Math.round(d.dens))+' <small>/ sq mi</small>')+'</div>';
  document.querySelectorAll('#ranklist button').forEach(function(b){b.classList.toggle('on',b.getAttribute('data-i')===String(i));});
  document.querySelectorAll('table.data tbody tr[data-i]').forEach(function(tr){tr.classList.toggle('hl',tr.getAttribute('data-i')===String(i));});
  renderZips(d);
}
svg.addEventListener('mouseover',function(e){var g=e.target.closest('.cty');if(!g||g.classList.contains('dim'))return;showTip(e,DATA[+g.getAttribute('data-i')]);});
svg.addEventListener('mousemove',function(e){var g=e.target.closest('.cty');if(!g)return;place(e);});
svg.addEventListener('mouseout',function(e){if(!e.relatedTarget||!e.relatedTarget.closest('.cty'))hideTip();});
svg.addEventListener('click',function(e){var g=e.target.closest('.cty');if(!g)return;select(+g.getAttribute('data-i'));});
svg.addEventListener('keydown',function(e){var g=e.target.closest('.cty');if(!g)return;if(e.key==='Enter'||e.key===' '){e.preventDefault();select(+g.getAttribute('data-i'));}});
var MAXP=DATA.reduce(function(m,d){return Math.max(m,d.pop);},0);
function renderList(){
  var arr=DATA.slice().sort(function(a,b){return sortBy==='pop'?(b.pop-a.pop):a.n.localeCompare(b.n);});
  listEl.innerHTML=arr.map(function(d){
    var w=Math.max(3,(Math.log10(d.pop)/Math.log10(MAXP))*100);
    return '<button data-i="'+DATA.indexOf(d)+'" data-name="'+d.n.toLowerCase()+'"><span class="rk">'+(sortBy==='pop'?d.rank:'')+'</span><span class="nm">'+d.n+'</span><span class="pp">'+nf(d.pop)+'</span><span class="bar"><i style="width:'+w.toFixed(1)+'%"></i></span></button>';
  }).join('');
}
renderList();
listEl.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;select(+b.getAttribute('data-i'));});
searchEl.addEventListener('input',function(){
  var q=this.value.trim().toLowerCase();
  GROUPS.forEach(function(el){var d=DATA[+el.getAttribute('data-i')];el.classList.toggle('dim',!!q&&d.n.toLowerCase().indexOf(q)<0);});
  document.querySelectorAll('#ranklist button').forEach(function(b){b.style.display=(!q||b.getAttribute('data-name').indexOf(q)>-1)?'':'none';});
});
document.querySelectorAll('[data-sort]').forEach(function(b){
  b.addEventListener('click',function(){
    sortBy=b.getAttribute('data-sort');
    document.querySelectorAll('[data-sort]').forEach(function(x){x.setAttribute('aria-pressed',x===b?'true':'false');});
    renderList();
    if(selected!=null)document.querySelectorAll('#ranklist button').forEach(function(x){x.classList.toggle('on',x.getAttribute('data-i')===String(selected));});
  });
});
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
  if(!d.zips||!d.zips.length){el.innerHTML='<p class="sel-empty">No ZIPs mapped for this county.</p>';return;}
  var full=d.zips.filter(function(z){return z[1]>=0.999;}).length;
  var part=d.zips.length-full;
  var h='<div class="zbar"><p class="znote"><b>'+d.zips.length+'</b> ZIPs - '+full+' entirely in '+d.n+' County'+
    (part?(' - '+part+' shared with neighbors'):'')+'</p><span class="ztools">'+
    '<button type="button" id="zipcopy">Copy</button>'+
    '<button type="button" id="zipdl">CSV</button>'+
    '<button type="button" id="ziplink">Link</button></span></div>'+
    '<div class="chips">'+d.zips.map(function(z){return chipHTML(z,d);}).join('')+'</div>'+
    (part?'<p class="zlegend"><span class="dot zfull"></span>whole - <span class="dot zmost"></span>most - <span class="dot zpart"></span>part</p>':'');
  el.innerHTML=h;
  document.getElementById('zipcopy').onclick=function(){copyText(d.zips.map(function(z){return z[0];}).join(', '),this);};
  document.getElementById('zipdl').onclick=function(){downloadCounty(d);};
  document.getElementById('ziplink').onclick=function(){copyText(countyURL(d),this);};
}
window.addEventListener('hashchange',function(){var i=countyFromHash();if(i!=null)select(i);});
function copyText(text,btn){
  var done=function(){var o=btn.textContent;btn.textContent='Copied';btn.classList.add('ok');
    setTimeout(function(){btn.textContent=o;btn.classList.remove('ok');},1500);};
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(done,function(){legacyCopy(text,done);});
  } else legacyCopy(text,done);
}
function legacyCopy(text,cb){
  var ta=document.createElement('textarea');ta.value=text;
  ta.style.position='fixed';ta.style.top='-9999px';document.body.appendChild(ta);
  ta.select();try{document.execCommand('copy');cb();}catch(e){}
  document.body.removeChild(ta);
}
function csvDownload(name,rows){
  var csv=rows.map(function(r){return r.map(function(c){return /[,"\n]/.test(c)?('"'+String(c).replace(/"/g,'""')+'"'):c;}).join(',');}).join('\r\n');
  var a=document.createElement('a');
  a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv);
  a.download=name;document.body.appendChild(a);a.click();document.body.removeChild(a);
}
function downloadCounty(d){
  var rows=[['ZIP Code','County','County FIPS','Portion of ZIP in County','County Population Rank']];
  d.zips.forEach(function(z){rows.push([z[0],d.n+' County',d.f,Math.round(z[1]*100)+'%',d.rank]);});
  csvDownload('Murray-'+d.n+'-County-ZIPs.csv',rows);
}
function downloadAll(){
  var rows=[['County','County FIPS','ZIP Code','Portion of ZIP in County']];
  DATA.slice().sort(function(a,b){return a.n.localeCompare(b.n);}).forEach(function(d){
    (d.zips||[]).forEach(function(z){rows.push([d.n+' County',d.f,z[0],Math.round(z[1]*100)+'%']);});
  });
  csvDownload('Murray-All-Counties-ZIPs.csv',rows);
}
function renderTable(){
  var tb=document.querySelector('table.data tbody');
  if(!tb)return;
  var arr=DATA.slice().sort(function(a,b){return b.pop-a.pop;});
  tb.innerHTML=arr.map(function(d){
    return '<tr data-i="'+DATA.indexOf(d)+'"><td>'+d.rank+'</td><td>'+d.n+'</td><td>'+nf(d.pop)+
      '</td><td>'+nf(d.hu)+'</td><td>'+nf(Math.round(d.area))+'</td><td>'+nf(Math.round(d.dens))+'</td></tr>';
  }).join('');
  document.querySelectorAll('table.data tbody tr[data-i]').forEach(function(tr){
    tr.addEventListener('click',function(){select(+tr.getAttribute('data-i'));
      var el=G[tr.getAttribute('data-i')]; if(el&&el.scrollIntoView)el.scrollIntoView({block:'center',behavior:'smooth'});});
  });
}
renderTable();
var dl=document.getElementById('dlall');
if(dl)dl.onclick=downloadAll;
var startI=countyFromHash();
select(startI!=null?startI:0);
})();
