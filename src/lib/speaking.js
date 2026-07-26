export const TYPES=['Presentation(s)','Workshop','Training','Booth','Vision-Casting'];
export const STATUSES=['Planning','Confirmed','Completed'];
export const asArray=(v)=>Array.isArray(v)?v:v?[v]:[];
export const PROGRESS=['Not Started','In Progress','Ready to Deploy','Deploying'];
export const TIMEZONES=[
  {value:'America/New_York',label:'Eastern (ET)'},
  {value:'America/Chicago',label:'Central (CT)'},
  {value:'America/Denver',label:'Mountain (MT)'},
  {value:'America/Los_Angeles',label:'Pacific (PT)'},
  {value:'America/Anchorage',label:'Alaska (AKT)'},
  {value:'Pacific/Honolulu',label:'Hawaii (HST)'},
  {value:'Europe/London',label:'London (GMT/BST)'},
  {value:'Europe/Paris',label:'Central Europe (CET)'},
  {value:'Asia/Jerusalem',label:'Jerusalem (IST)'},
  {value:'Asia/Dubai',label:'Dubai (GST)'},
  {value:'Asia/Manila',label:'Manila (PHT)'},
  {value:'Asia/Tokyo',label:'Tokyo (JST)'},
  {value:'Australia/Sydney',label:'Sydney (AEST)'},
  {value:'UTC',label:'UTC'}
];
export const detectTimezone=()=>{try{return Intl.DateTimeFormat().resolvedOptions().timeZone||'America/New_York'}catch(e){return'America/New_York'}};
export const EMPTY={title:'',description:'',presentation_description:'',presentation_type:[],start_date:'',deploy_date:'',speaking_date:'',end_date:'',start_time:'',end_time:'',timezone:detectTimezone(),status:'Planning',progress:'Not Started',speaker_name:'Marshall McKenzie',speaker_bio:'',speaker_photo:'',address:'',latitude:'',longitude:'',notes:'',attachments:[]};
export const formatDate=(d)=>d?new Date(`${d}T00:00:00`).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}):'Date not set';
export const formatTime=(t)=>{if(!t)return '';const[h,m]=t.split(':').map(Number);const p=h>=12?'PM':'AM';const h12=h%12||12;return `${h12}:${String(m).padStart(2,'0')} ${p}`};
export const statusTone={Planning:'bg-[#FBF0D0] text-[#8A6A00]',Confirmed:'bg-[#E8EBF2] text-[#1B2A4B]',Completed:'bg-[#E8EAF0] text-[#5A6781]'};export const eventTone={Personal:'bg-[#EDE3F8] text-[#5B2DA0]',Work:'bg-[#DCEAF5] text-[#1B4A6B]'};
export const daysUntil=(d)=>Math.ceil((new Date(`${d}T00:00:00`)-new Date().setHours(0,0,0,0))/86400000);