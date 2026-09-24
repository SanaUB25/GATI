import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import fs from 'node:fs/promises';
import path from 'node:path';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { env } from '../src/config/env.js';
import { User } from '../src/models/User.js';
import { MaintenanceTask } from '../src/models/MaintenanceTask.js';
import { Asset, CorridorAvailability, DatasetImport, DepartmentResource, GoodsForecast, Network, Scenario, Station, Train } from '../src/models/RailwayData.js';

const headers = {
  'maintenance_jobs.csv': ['id','section','department','duration','earliest_start','latest_end','priority','committed','defect_type','season','severity','urgency','overdue','weather_factor'],
  'network.csv': ['section_id','from_station','to_station','single_line','capacity'], 'stations.csv': ['station_id','name'], 'trains.csv': ['id','route','departure','arrival','priority','rake_id'], 'scenarios.csv': ['scenario_id','train_delay','maintenance_overrun','traffic_factor','asset_risk'],
  'coa_availability.csv': ['coa_id','date','section_id','corridor','start_min','end_min','availability_status','capacity','possession_type','allowed_departments'], 'goods_forecast.csv': ['forecast_id','date','section_id','start_min','end_min','expected_goods_trains','traffic_intensity','confidence','capacity_demand'], 'asset_master.csv': ['asset_id','asset_type','department','section_id','criticality','importance','current_availability','failure_impact'], 'department_resources.csv': ['resource_id','department','resource_type','capacity']
};
function parseCsv(text) { const rows=[]; let row=[], value='', quoted=false; for(let i=0;i<text.length;i+=1){const c=text[i]; if(c==='"'){if(quoted&&text[i+1]==='"'){value+='"';i+=1}else quoted=!quoted;}else if(c===','&&!quoted){row.push(value);value='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i+=1;row.push(value);if(row.some(Boolean))rows.push(row);row=[];value='';}else value+=c;} if(value||row.length){row.push(value);rows.push(row);}return rows; }
async function read(name){const rows=parseCsv(await fs.readFile(path.join(env.dataDir,name),'utf8'));if(!rows.length||rows[0].join(',')!==headers[name].join(','))throw new Error(`${name} has unexpected headers`);return rows.slice(1).map(r=>Object.fromEntries(rows[0].map((h,i)=>[h,r[i]])));}
const n = value => Number(value); const departments={Engineering:'ENGINEERING',Signalling:'SNT',Traction:'TRD'};
async function upsert(Model, docs, key){if(!docs.length)return {inserted:0,updated:0,unchanged:0};const result=await Model.bulkWrite(docs.map(doc=>({updateOne:{filter:{[key]:doc[key]},update:{$set:doc},upsert:true}})),{ordered:false});return {inserted:result.upsertedCount,updated:result.modifiedCount,unchanged:docs.length-result.upsertedCount-result.modifiedCount};}
try {
  const data=Object.fromEntries(await Promise.all(Object.keys(headers).map(async name=>[name,await read(name)]))); await connectDatabase();
  await User.updateOne({email:'control@railvista.local'},{$setOnInsert:{name:'Control Officer',passwordHash:await bcrypt.hash('password123',12),role:'CONTROL_OFFICER'}},{upsert:true});
  const networkIds=new Set(data['network.csv'].map(x=>x.section_id));
  for(const row of [...data['maintenance_jobs.csv'],...data['coa_availability.csv'],...data['goods_forecast.csv'],...data['asset_master.csv']]) if(!networkIds.has(row.section||row.section_id)) throw new Error(`Unknown network section ${row.section||row.section_id}`);
  const counts={};
  counts.stations=await upsert(Station,data['stations.csv'].map(x=>({stationId:x.station_id,name:x.name})),'stationId');
  counts.network=await upsert(Network,data['network.csv'].map(x=>({sectionId:x.section_id,fromStationId:x.from_station,toStationId:x.to_station,singleLine:x.single_line==='True',capacity:n(x.capacity)})),'sectionId');
  counts.trains=await upsert(Train,data['trains.csv'].map(x=>({trainId:x.id,route:x.route.split(','),departureMin:n(x.departure),arrivalMin:n(x.arrival),priority:x.priority,rakeId:x.rake_id})),'trainId');
  counts.scenarios=await upsert(Scenario,data['scenarios.csv'].map(x=>({scenarioId:x.scenario_id,trainDelay:n(x.train_delay),maintenanceOverrun:n(x.maintenance_overrun),trafficFactor:n(x.traffic_factor),assetRisk:n(x.asset_risk),failureProbability:n(x.asset_risk),emergencyEvent:n(x.asset_risk)>=.75})),'scenarioId');
  counts.coa=await upsert(CorridorAvailability,data['coa_availability.csv'].map(x=>({coaId:x.coa_id,date:new Date(`${x.date}T00:00:00Z`),sectionId:x.section_id,corridorId:x.corridor,startMin:n(x.start_min),endMin:n(x.end_min),availabilityStatus:x.availability_status,capacity:n(x.capacity),possessionType:x.possession_type,allowedDepartments:x.allowed_departments.split('|')})),'coaId');
  counts.goodsForecast=await upsert(GoodsForecast,data['goods_forecast.csv'].map(x=>({forecastId:x.forecast_id,date:new Date(`${x.date}T00:00:00Z`),sectionId:x.section_id,startMin:n(x.start_min),endMin:n(x.end_min),expectedGoodsTrains:n(x.expected_goods_trains),trafficIntensity:x.traffic_intensity,confidence:n(x.confidence),capacityDemand:n(x.capacity_demand)})),'forecastId');
  counts.assets=await upsert(Asset,data['asset_master.csv'].map(x=>({assetId:x.asset_id,assetType:x.asset_type,department:x.department,sectionId:x.section_id,criticality:n(x.criticality),importance:n(x.importance),currentAvailability:n(x.current_availability),failureImpact:n(x.failure_impact)})),'assetId');
  counts.resources=await upsert(DepartmentResource,data['department_resources.csv'].map(x=>({resourceId:x.resource_id,department:x.department,resourceType:x.resource_type,capacity:n(x.capacity)})),'resourceId');
  counts.maintenance=await upsert(MaintenanceTask,data['maintenance_jobs.csv'].map(x=>({sourceId:x.id,sourceSystem:x.department==='Engineering'?'TMS':x.department==='Signalling'?'SMMS':'TDMS',department:departments[x.department],corridorId:'NDLS-KKDE',assetId:x.section,sectionId:x.section,defectType:x.defect_type,durationMin:n(x.duration),dueAt:new Date('2026-10-01T00:00:00Z'),severity:n(x.severity),criticality:n(x.urgency),urgency:n(x.urgency),resources:[departments[x.department]],status:'OPEN',windowEarliestMin:n(x.earliest_start),windowLatestMin:n(x.latest_end),weatherFactor:n(x.weather_factor),season:x.season,overdueDays:x.overdue==='True'?30:0,assetImportance:x.section==='S02'||x.section==='S04'?5:3,availabilityImpact:n(x.urgency),priorityScore:undefined})),'sourceId');
  await DatasetImport.create({status:'COMPLETED',counts}); console.log('Seed completed:',JSON.stringify(counts));
} catch(error) { if(mongoose.connection.readyState)await DatasetImport.create({status:'FAILED',detail:error.message});console.error(`Seed failed: ${error.message}`);process.exitCode=1; } finally { await disconnectDatabase(); }
