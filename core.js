(function(root){'use strict';
const SCALE=1000000;
function number(s,label='数值') {s=String(s).trim();if(!/^[+-]?\d+(?:\.\d{1,6})?$/.test(s))throw Error(label+'须为普通十进制数，最多6位小数');let sign=s[0]==='-'?-1:1;s=s.replace(/^[+-]/,'');let[a,b='']=s.split('.');let v=Number(a)*SCALE+Number(b.padEnd(6,'0'));if(!Number.isSafeInteger(v)||v>1e15)throw Error(label+'须在±10亿内');return sign*v;}
function show(v){let s=(v/SCALE).toFixed(6);return s.replace(/0+$/,'').replace(/\.$/,'');}
const sample={version:1,metrics:[{name:'价格',unit:'元',dir:'min',limit:'1300'},{name:'刷新率',unit:'Hz',dir:'max',limit:''},{name:'功耗',unit:'W',dir:'min',limit:''}],data:'A,899,60,18\nB,1099,144,24\nC,1299,165,22\nD,1199,120,28\nE,1499,180,30\nF,1099,144,24'};
function parse(s){if(!s||s.version!==1||!Array.isArray(s.metrics)||s.metrics.length!==3||typeof s.data!=='string')throw Error('备份格式或版本不正确');
let metrics=s.metrics.map((m,i)=>{if(!m||typeof m.name!=='string'||!m.name.trim()||m.name.trim().length>16||typeof m.unit!=='string'||m.unit.length>10||!['min','max'].includes(m.dir)||typeof m.limit!=='string')throw Error('指标'+(i+1)+'名称、单位或方向无效');return {...m,name:m.name.trim(),cap:m.limit.trim()===''?null:number(m.limit,'指标'+(i+1)+'门槛')};});if(new Set(metrics.map(m=>m.name)).size!==3)throw Error('三个指标名称不能重复');
let lines=s.data.trim().split(/\r?\n/);if(!s.data.trim()||lines.length>60)throw Error('请填写1–60行方案');let seen=new Set();
let rows=lines.map((line,i)=>{let cells=line.split(line.includes('\t')?'\t':',').map(x=>x.trim());if(cells.length!==4||!cells[0]||cells[0].length>24)throw Error('第'+(i+1)+'行须为名称和3个数值；名称1–24字');if(seen.has(cells[0]))throw Error('第'+(i+1)+'行名称重复');seen.add(cells[0]);return {name:cells[0],v:cells.slice(1).map((x,j)=>number(x,'第'+(i+1)+'行第'+(j+1)+'指标'))};});return {metrics,rows};}
function solve(s){let {metrics,rows}=parse(s);rows.forEach(r=>{r.violations=metrics.flatMap((m,k)=>m.cap!==null&&(m.dir==='min'?r.v[k]>m.cap:r.v[k]<m.cap)?[k]:[]);r.dominators=[];r.twins=[];});let feasible=rows.filter(r=>!r.violations.length);
for(let b of feasible)for(let a of feasible){if(a===b)continue;let dif=a.v.map((v,k)=>(v-b.v[k])*(metrics[k].dir==='min'?1:-1));if(dif.every(v=>v===0))b.twins.push(a.name);if(dif.every(v=>v<=0)&&dif.some(v=>v<0))b.dominators.push(a.name);}
rows.forEach(r=>r.state=r.violations.length?'越界':r.dominators.length?'被压过':'前沿');return {metrics,rows,feasible:feasible.length,frontier:rows.filter(r=>r.state==='前沿').length,dominated:rows.filter(r=>r.state==='被压过').length,excluded:rows.filter(r=>r.state==='越界').length};}
const api={number,show,sample,parse,solve};root.AppCore=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
