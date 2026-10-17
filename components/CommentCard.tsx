"use client";
import {useState} from "react";
import {Bookmark,MessageCircle,MoreHorizontal,Repeat2,Share2,BarChart3} from "lucide-react";
import LikeBurst from "@/components/LikeBurst";
import type {Profile} from "@/lib/demo";
import {shortCount,timeAgo} from "@/lib/demo";

export type ThreadComment={
 id:string; post_id:string; author_id:string; body:string; created_at:string; parent_comment_id?:string|null;
};
type Props={
 comment:ThreadComment; author:Profile; depth?:number; childCount:number;
 liked:boolean; reposted:boolean; bookmarked:boolean;
 likeCount:number; repostCount:number; viewCount?:number;
 onProfile:(id:string)=>void;
 onReply:(comment:ThreadComment)=>void;
 onLike:(comment:ThreadComment)=>void;
 onRepost:(comment:ThreadComment)=>void;
 onBookmark:(comment:ThreadComment)=>void;
 onShare:(comment:ThreadComment)=>void;
 onMute:(id:string)=>void;
 children?:React.ReactNode;
};
export default function CommentCard({comment,author,depth=0,childCount,liked,reposted,bookmarked,likeCount,repostCount,viewCount,onProfile,onReply,onLike,onRepost,onBookmark,onShare,onMute,children}:Props){
 const [moreOpen,setMoreOpen]=useState(false);
 const initials=author.display_name.split(" ").slice(0,2).map(w=>w[0]||"").join("").toUpperCase();
 return <article className={"comment-card "+(depth?"comment-card-nested":"")} id={"comment-"+comment.id}>
  <div className="comment-card-avatar">
   <button onClick={()=>onProfile(author.id)} aria-label={"Open "+author.display_name+" profile"}>
    {author.avatar_url?<img src={author.avatar_url} alt=""/>:<span>{initials}</span>}
   </button>
  </div>
  <div className="comment-card-content">
   <header className="comment-card-header">
    <button onClick={()=>onProfile(author.id)} className="comment-card-name"><strong>{author.display_name}</strong><span>@{author.username} · {timeAgo(comment.created_at)}</span></button>
    <div className="comment-card-more">
      <button className="comment-card-more-button" aria-label="More comment options" aria-expanded={moreOpen} onClick={()=>setMoreOpen(v=>!v)}><MoreHorizontal size={17}/></button>
      {moreOpen&&<div className="comment-card-options" role="group" aria-label="Comment options">
        <button onClick={()=>{onShare(comment);setMoreOpen(false);}}>Copy comment link</button>
        <button onClick={()=>{onMute(author.id);setMoreOpen(false);}}>Mute this account</button>
      </div>}
    </div>
   </header>
   <p className="comment-card-text">{comment.body}</p>
   <nav className="comment-card-actions" aria-label={"Actions for "+author.display_name+" comment"}>
     <button title="Reply" aria-label={"Reply to comment ("+childCount+")"} onClick={()=>onReply(comment)}><MessageCircle size={18}/>{childCount>0&&<span>{shortCount(childCount)}</span>}</button>
     <button title="Repost" className={reposted?"is-active":""} aria-label={reposted?"Undo comment repost":"Repost comment"} onClick={()=>onRepost(comment)}><Repeat2 size={18}/>{repostCount>0&&<span>{shortCount(repostCount)}</span>}</button>
     <button title="Like" className={liked?"is-active comment-like-action":"comment-like-action"} aria-label={liked?"Unlike comment":"Like comment"} onClick={()=>onLike(comment)}><LikeBurst liked={liked} size={18}/>{likeCount>0&&<span>{shortCount(likeCount)}</span>}</button>
     {viewCount!==undefined&&<span className="comment-card-demo-views" title="Fictional demo views" aria-label={shortCount(viewCount)+" sample views"}><BarChart3 size={17}/><span>{shortCount(viewCount)}</span></span>}
     <button title="Bookmark" className={bookmarked?"is-active":""} aria-label={bookmarked?"Remove comment bookmark":"Bookmark comment"} onClick={()=>onBookmark(comment)}><Bookmark size={18} fill={bookmarked?"currentColor":"none"}/></button>
     <button title="Share" aria-label="Share comment" onClick={()=>onShare(comment)}><Share2 size={18}/></button>
   </nav>
   {children}
  </div>
 </article>;
}
