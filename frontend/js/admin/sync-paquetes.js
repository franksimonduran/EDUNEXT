import {adminShell,installAdminUserRoutes} from './admin-shell.js';
import {listOfflinePackages,getPackageDetail,getPackageStats,verifyPackageResources,checkPackageDependencies} from '../services/admin-offline-packages.service.js';
import {offlinePackageCard,packageDetailPanel,packageFilters,packageStatsGrid} from '../components/admin-offline-package.js';
import {at,esc} from '../components/admin-dashboard-ui.js';

const {root,open}=adminShell('Paquetes Educativos Offline','packages');
installAdminUserRoutes();

let allPackages=[];

async function load(){
  await loadPackages();
  renderStats();
  bindFilters();
}

async function loadPackages(){
  allPackages=await listOfflinePackages({});
  const grid=root.querySelector('#packages-grid');
  grid.innerHTML=allPackages.map(offlinePackageCard).join('');
  root.querySelector('#pkg-count').textContent=`${allPackages.length} paquetes`;
  root.querySelector('#pkg-filters').outerHTML=packageFilters(allPackages);
  root.querySelector('#pkg-stats').innerHTML=packageStatsGrid(await getPackageStats());
  bindCardActions();
}

function renderStats(){
  root.querySelector('#pkg-stats').innerHTML=packageStatsGrid({total:allPackages.length});
}

function bindCardActions(){
  root.querySelector('#packages-grid').onclick=async e=>{
    const btn=e.target.closest('[data-action]');
    if(!btn) return;
    const action=btn.dataset.action;
    const pkgId=btn.dataset.pkg;
    if(action==='detail'){
      const pkg=await getPackageDetail(pkgId);
      const check=await verifyPackageResources(pkg);
      open('Detalle de Paquete',packageDetailPanel(pkg,check));
    }else if(action==='verify'){
      const pkg=await getPackageDetail(pkgId);
      const check=await verifyPackageResources(pkg);
      open('Verificación de presencia local',packageDetailPanel(pkg,check));
    }else if(action==='deps'){
      const deps=await checkPackageDependencies(pkgId);
      open('Dependencias',`<p>${deps.ok?'Sin dependencias faltantes conocidas':'Dependencias faltantes: '+esc(deps.missing.join(', '))}</p>`);
    }
  };
}

function bindFilters(){
  const form=root.querySelector('#pkg-filters');
  form.onsubmit=e=>{e.preventDefault();filterPackages(new FormData(form));};
  form.onreset=()=>setTimeout(()=>renderGrid(allPackages),0);
}

function filterPackages(fd){
  const f=Object.fromEntries(fd);
  let filtered=allPackages;
  if(f.course) filtered=filtered.filter(p=>p.course===f.course);
  if(f.grade) filtered=filtered.filter(p=>String(p.grade)===String(f.grade));
  if(f.status) filtered=filtered.filter(p=>p.localStatus===f.status);
  if(f.q){
    const q=f.q.toLowerCase();
    filtered=filtered.filter(p=>p.name.toLowerCase().includes(q)||p.id.toLowerCase().includes(q));
  }
  renderGrid(filtered);
}

function renderGrid(packages){
  const grid=root.querySelector('#packages-grid');
  grid.innerHTML=packages.map(p=>`<article class="package-card" data-pkg="${p.id}"><header><h3>${p.name}</h3><span class="pkg-status" style="background:${({preparado:'#3b82f6',descargado:'#10b981',verificado:'#8b5cf6',incompleto:'#f59e0b','version-diferente':'#ef4444','sin-verificar':'#6b7280'})[p.localStatus]||'#6b7280'}">${p.localStatus}</span></header><dl><dt>Curso</dt><dd>${p.course}</dd><dt>Grado</dt><dd>${p.grade}º</dd><dt>Versión</dt><dd>${p.version}</dd><dt>Lecciones</dt><dd>${p.lessonsIncluded}</dd><dt>Recursos</dt><dd>${p.resourcesTotal} (${p.requiredResources} obligatorios)</dd><dt>Estado</dt><dd>${p.localStatus}</dd></dl><div class="pkg-actions"><button class="button-secondary" data-action="detail" data-pkg="${p.id}">Detalle</button><button class="button-secondary" data-action="verify" data-pkg="${p.id}">Verificar</button></div></article>`).join('');
  root.querySelector('#pkg-count').textContent=`${packages.length} paquetes`;
}

load();
