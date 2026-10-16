export type Profile = {
  id: string; username: string; display_name: string; bio: string;
  verified?: boolean; avatar_url?: string | null; location?: string;
  headline?: string; skills?: string[]; portfolio_url?: string;
};
export type Post = {
  id: string; author_id: string; body: string; image_url: string | null;
  created_at: string; likes: number; reposts: number; replies: number;
  views: number; liked?: boolean; bookmarked?: boolean; reposted?: boolean;
};
export type Notice = { id: string; kind: "like" | "follow" | "reply" | "repost"; person: string; text: string; time: string };
export const DEMO_ME: Profile = {
  id: "demo-me", username: "yourname", display_name: "Your Name",
  bio: "Building meaningful connections, one story at a time. ✨",
  location: "Your world",
};
export const DEMO_PEOPLE: Profile[] = [
  { id: "amina", username: "aminacreates", display_name: "Amina Yusuf", bio: "Creative storyteller • Art & technology 🎨", verified: true },
  { id: "daniel", username: "danielkim", display_name: "Daniel Kim", bio: "Designer. Builder. Exploring new ideas." },
  { id: "zara", username: "zaralawal", display_name: "Zara Lawal", bio: "Digital creator | Learning every day ✨", verified: true },
  { id: "ibrahim", username: "ibrahimmusa", display_name: "Ibrahim Musa", bio: "Software engineer and tech enthusiast." },
  { id: "sarah", username: "sarahchen", display_name: "Sarah Chen", bio: "Educator • Learning for everyone.", verified: true },
  { id: "alex", username: "alexj", display_name: "Alex Johnson", bio: "Let's build a brighter community together." },
];
export const DEMO_POSTS: Post[] = [
  { id:"p1", author_id:"amina", body:"The future belongs to the curious. 🌍✨\n\nA single conversation can spark a new idea, a friendship, or a whole new opportunity. What are you learning today? #KeepGrowing", image_url:"https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=1100&q=80", created_at:new Date(Date.now()-1000*60*40).toISOString(), likes:1248, reposts:186, replies:92, views:24300 },
  { id:"p2", author_id:"daniel", body:"Small steps create big changes. Working on something new and remembering that consistency always wins. 🚀\n\nWhat are you building this week?", image_url:null, created_at:new Date(Date.now()-1000*60*180).toISOString(), likes:324, reposts:29, replies:41, views:5200 },
  { id:"p3", author_id:"zara", body:"There is so much beauty in connecting with people from different backgrounds. Different perspectives make us stronger. 💙 #BetterTogether", image_url:"https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1100&q=80", created_at:new Date(Date.now()-1000*60*410).toISOString(), likes:2084, reposts:311, replies:138, views:47800 },
  { id:"p4", author_id:"ibrahim", body:"Imagine a place where ideas travel farther than borders. That's the community I want to be part of. 🌐", image_url:null, created_at:new Date(Date.now()-1000*60*780).toISOString(), likes:719, reposts:64, replies:85, views:10300 },
];
export const TRENDS = [
  { category:"Technology · Trending", tag:"#FutureOfWork", posts:"125K posts" },
  { category:"Technology · Trending", tag:"#TechInAfrica", posts:"89K posts" },
  { category:"Community · Trending", tag:"#BetterTogether", posts:"72K posts" },
  { category:"Creators · Trending", tag:"#BlumbookCreators", posts:"46K posts" },
  { category:"Learning · Trending", tag:"#DigitalSkills", posts:"25K posts" },
];
export const DEMO_NOTICES: Notice[] = [
  { id:"n1", kind:"like", person:"Amina Yusuf", text:"liked your latest post", time:"2m" },
  { id:"n2", kind:"follow", person:"Ibrahim Musa", text:"started following you", time:"15m" },
  { id:"n3", kind:"reply", person:"Zara Lawal", text:"replied: Love this perspective! 💙", time:"1h" },
  { id:"n4", kind:"repost", person:"Sarah Chen", text:"reposted your story", time:"3h" },
];
export const COMMUNITIES = [
  { title:"Tech Innovators", members:"25K members", description:"Technology, AI, products and the future.", icon:"💠" },
  { title:"Creators Hub", members:"18K members", description:"A home for creators and storytellers.", icon:"🎨" },
  { title:"Study Together", members:"42K members", description:"Learn, share resources and grow.", icon:"📚" },
  { title:"Travel & Adventure", members:"13K members", description:"Explore the world with curious minds.", icon:"🌄" },
];
export function shortCount(n: number) {
  return n >= 1000000 ? (n / 1000000).toFixed(1) + "M" : n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(".0", "") + "K" : String(n);
}
export function timeAgo(value: string) {
  const mins = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (mins < 60) return String(mins) + "m";
  if (mins < 1440) return String(Math.floor(mins / 60)) + "h";
  return String(Math.floor(mins / 1440)) + "d";
}
