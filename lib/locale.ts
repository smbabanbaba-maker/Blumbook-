export type AppLanguage="en"|"ha";
const copy = {
 "Home":["Home","Gida"],"Explore":["Explore","Bincika"],"Notifications":["Notifications","Sanarwa"],"Messages":["Messages","Saƙonni"],
 "Communities":["Communities","Ƙungiyoyi"],"Bookmarks":["Bookmarks","Ajiye"],"Profile":["Profile","Bayanan kai"],"Settings":["Settings","Saituna"],
 "Creator Studio":["Creator Studio","Ɗakin masu ƙirƙira"],"Help Center":["Help Center","Cibiyar taimako"],
 "For you":["For you","Domin kai"],"Following":["Following","Waɗanda nake bi"],"Post":["Post","Wallafa"],
 "What’s happening?":["What's happening?","Me ke faruwa?"],"Search Blumbook":["Search Blumbook","Bincika Blumbook"],
 "People":["People","Mutane"],"Trending now":["Trending now","Abin da ke tashe"],"Who to follow":["Who to follow","Wa za ka bi"],
 "Your saved posts":["Your saved posts","Abubuwan da ka ajiye"],"Create post":["Create post","Rubuta saƙo"],"Edit profile":["Edit profile","Gyara bayanan kai"],
 "Your account":["Your account","Asusunka"],"Privacy and safety":["Privacy and safety","Sirri da tsaro"],
 "Appearance":["Appearance","Kamanni"],"Dark":["Dark","Baƙi"],"Light":["Light","Fari"],
 "Language":["Language","Harshe"],"Join":["Join","Shiga"],"Joined":["Joined","An shiga"],
 "Sign up":["Sign up","Yi rajista"],"Log in":["Log in","Shiga asusu"],"Log out":["Log out","Fita"],
 "Talk. Share. Bloom.":["Talk. Share. Bloom.","Yi magana. Raba. Bunƙasa."],
 "Posts":["Posts","Wallafe-wallafe"],"Replies":["Replies","Amsoshi"],
 "Save":["Save","Ajiye"],"Create account":["Create account","Buɗe asusu"],
 "Explore new ideas":["Explore new ideas","Binciko sabbin ra'ayoyi"],
 "Share your story":["Share your story","Raba labarinka"]
} as const;
export function translate(key:keyof typeof copy,language:AppLanguage){
 const [english,hausa]=copy[key];return language==="ha"?hausa:english;
}
