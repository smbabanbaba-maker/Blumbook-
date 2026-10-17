"use client";
import {BriefcaseBusiness,CalendarClock,Camera,Feather,ImagePlus,Radio,Video,Vote,X} from "lucide-react";
type Action="post"|"photo"|"video"|"poll"|"story"|"live"|"opportunity"|"schedule";
const items:{id:Action;title:string;detail:string;Icon:typeof Feather}[]=[
 {id:"post",title:"Write a post",detail:"Say what's on your mind",Icon:Feather},
 {id:"photo",title:"Photo",detail:"Share an image",Icon:ImagePlus},
 {id:"video",title:"Video / Clip",detail:"Upload a short video",Icon:Video},
 {id:"poll",title:"Poll",detail:"Ask your community",Icon:Vote},
 {id:"story",title:"Story",detail:"Share a 24-hour moment",Icon:Camera},
 {id:"opportunity",title:"Opportunity",detail:"Find collaborators",Icon:BriefcaseBusiness},
 {id:"live",title:"Go Live",detail:"Host a broadcast",Icon:Radio},
 {id:"schedule",title:"Schedule post",detail:"Prepare content ahead",Icon:CalendarClock}
];
export default function CreateMenu({onClose,onSelect}:{onClose:()=>void;onSelect:(action:Action)=>void}){
 return <div className="creation-shade" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}>
  <section className="creation-panel" role="dialog" aria-modal="true" aria-label="Create on Blumbook">
   <header><div><small>CREATE ON BLUMBOOK</small><h2>What will you share?</h2></div><button onClick={onClose} aria-label="Close creation menu"><X size={22}/></button></header>
   <div className="creation-grid">{items.map(({id,title,detail,Icon})=><button key={id} onClick={()=>onSelect(id)} className="creation-choice"><span className="creation-icon"><Icon size={22}/></span><strong>{title}</strong><small>{detail}</small></button>)}</div>
   <p className="creation-note">Some tools require a connected account or external service. Your posts stay private to this demo until backend setup.</p>
  </section>
 </div>;
}
