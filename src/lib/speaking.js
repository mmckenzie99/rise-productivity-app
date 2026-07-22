export const TYPES=['Workshop','Sermon','Series','Training','Evangelistic','Vision-Casting'];
export const STATUSES=['Planning','Confirmed','Completed'];
export const PROGRESS=['Not Started','In Progress','Ready to Deploy'];
export const EMPTY={title:'',description:'',presentation_type:'',start_date:'',speaking_date:'',start_time:'',end_time:'',status:'Planning',progress:'Not Started',speaker_name:'Marshall McKenzie',speaker_bio:'',speaker_photo:'',address:'',latitude:'',longitude:'',notes:'',attachments:[]};
export const formatDate=(d)=>d?new Date(`${d}T00:00:00`).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}):'Date not set';
export const statusTone={Planning:'bg-[#F3E4C7] text-[#7A5A22]',Confirmed:'bg-[#DCE9E4] text-[#2C4E46]',Completed:'bg-[#E4E0D4] text-[#5B5548]'};
export const daysUntil=(d)=>Math.ceil((new Date(`${d}T00:00:00`)-new Date().setHours(0,0,0,0))/86400000);