"use client";

import {useEffect,useRef,useState} from "react";
import {Heart} from "lucide-react";

/**
 * Decorative feedback only: the parent button keeps its existing onClick and
 * backend logic. Fire when a like changes false -> true, never on initial mount.
 * Reduced-motion users see a static heart instead of moving particles.
 */
export default function LikeBurst({liked,size=18}:{liked:boolean;size?:number}){
  const previous=useRef(liked);
  const [burst,setBurst]=useState(0);
  useEffect(()=>{
    if(liked&&!previous.current)setBurst(n=>n+1);
    previous.current=liked;
  },[liked]);
  return <span className={"like-burst"+(liked?" like-burst-liked":"")} aria-hidden="true">
    <Heart key={burst>0&&liked?"heart-"+burst:"heart-rest"} className={burst>0&&liked?"like-burst-heart like-burst-pop":"like-burst-heart"} size={size} fill={liked?"currentColor":"none"}/>
    {burst>0&&liked&&<span key={"particles-"+burst} className="like-burst-particles" aria-hidden="true">
      {Array.from({length:12},(_,i)=><span key={i} className="like-burst-particle"><Heart size={i%3===0?11:8} strokeWidth={1} fill="currentColor"/></span>)}
    </span>}
  </span>;
}
