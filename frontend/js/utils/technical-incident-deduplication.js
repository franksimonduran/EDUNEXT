export function createIncidentFingerprint(incident){
  return `${incident.category}:${incident.rule}:${incident.severity}`;
}

export function isDuplicateIncident(incident,existingIncidents){
  const fp=createIncidentFingerprint(incident);
  return existingIncidents.some(existing=>createIncidentFingerprint(existing)===fp);
}

export function deduplicateIncidents(incidents){
  const seen=new Set();
  const unique=[];
  for(const inc of incidents){
    const fp=createIncidentFingerprint(inc);
    if(!seen.has(fp)){
      seen.add(fp);
      unique.push(inc);
    }
  }
  return unique;
}

export function mergeIncidentCounts(newIncidents,existingIncidents){
  const existingMap=new Map();
  for(const inc of existingIncidents){
    const fp=createIncidentFingerprint(inc);
    existingMap.set(fp,inc);
  }
  
  for(const inc of newIncidents){
    const fp=createIncidentFingerprint(inc);
    if(existingMap.has(fp)){
      const existing=existingMap.get(fp);
      existing.count=(existing.count||1)+1;
      existing.lastDetectedAt=Date.now();
      if(existing.status==='resolved') existing.status='reopened';
    }else{
      existingMap.set(createIncidentFingerprint(inc),{...inc,count:1});
    }
  }
  
  return Array.from(existingMap.values());
}

export function getIncidentTrends(incidents,windowMs=7*24*60*60*1000){
  const now=Date.now();
  const cutoff=now-windowMs;
  const recent=incidents.filter(i=>i.detectedAt>=cutoff);
  const older=incidents.filter(i=>i.detectedAt<cutoff);
  
  return {
    recent:recent.length,
    older:older.length,
    new:recent.filter(i=>!older.some(o=>o.category===i.category && o.rule===i.rule && o.severity===i.severity)).length,
    recurring:recent.filter(i=>older.some(o=>o.category===i.category && o.rule===i.rule && o.severity===i.severity)).length,
  };
}

export function groupIncidentsByCategory(incidents){
  const groups={};
  for(const inc of incidents){
    if(!groups[inc.category]) groups[inc.category]=[];
    groups[inc.category].push(inc);
  }
  return groups;
}