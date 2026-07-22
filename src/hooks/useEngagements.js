import { useCallback,useEffect,useState } from 'react';
import { base44 } from '@/api/base44Client';
export default function useEngagements(){
 const [items,setItems]=useState([]),[loading,setLoading]=useState(true);
 const load=useCallback(async()=>{setLoading(true);setItems(await base44.entities.Engagement.list('speaking_date'));setLoading(false)},[]);
 useEffect(()=>{load();const off=base44.entities.Engagement.subscribe(load);return off},[load]);
 const save=async(item)=>{const {id,created_date,updated_date,created_by_id,...fields}=item;const data={...fields,latitude:fields.latitude===''?null:Number(fields.latitude),longitude:fields.longitude===''?null:Number(fields.longitude)};id?await base44.entities.Engagement.update(id,data):await base44.entities.Engagement.create(data);await load()};
 const remove=async(id)=>{await base44.entities.Engagement.delete(id);await load()};
 return {items,loading,save,remove,load};
}