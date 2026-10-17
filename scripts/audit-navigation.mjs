import assert from "node:assert/strict";
import fs from "node:fs";
const app=fs.readFileSync(new URL("../components/BlumbookApp.tsx",import.meta.url),"utf8");
const studio=fs.readFileSync(new URL("../components/CreatorStudioPlus.tsx",import.meta.url),"utf8");
const count=(text,regex)=>Array.from(text.matchAll(regex)).length;
const tests={
 "Blum Clips has one canonical destination":count(app,/<BlumClips\b/g)===1&&!app.includes('navigate("videos")'),
 "Live Sessions has one canonical destination":count(app,/<LiveSessions\b/g)===1&&!app.includes('navigate("spaces")'),
 "Bloom Circles mounted once":count(app,/<BloomCircles\b/g)===1,
 "Stories rail mounted once":count(app,/<StoriesRail\b/g)===1,
 "Create menu mounted once":count(app,/<CreateMenu\b/g)===1,
 "Bottom navigation mounted once":count(app,/<nav className=\{"mobile-bottom/g)===1,
 "Avatar opens own profile rather than duplicated menu":app.includes('aria-label="Your profile"'),
 "Feed has no duplicated Community tab":!app.includes('tab === "communities"'),
 "Home has one primary Create flow":!app.includes('className="compose-inline"'),
 "No repeated Home or Explore shortcut rows":!/(className="home-mini-links"|className="home-opportunity-link"|className="explore-mini-tools"|className="explore-feature-links")/.test(app),
 "Mobile drawer keeps four named groups":count(app,/className="simple-drawer-section"/g)===4&&["YOUR SPACE","COMMUNITY & DISCOVERY","CREATOR TOOLS","ACCOUNT & SUPPORT"].every(x=>app.includes(x)),
 "Planner and earnings have their own views":app.includes('view==="planner"')&&app.includes('view==="earnings"'),
 "Privacy opens its real settings panel":app.includes('navigate("settings");setSettingsPanel("privacy");'),
 "Invite friends opens native sharing or copies a URL":app.includes('const inviteFriends=async()=>')&&app.includes('navigator.share')&&app.includes('navigator.clipboard.writeText(url)'),
 "Language chooser is accessible from the drawer":app.includes('className="simple-drawer-language"')&&app.includes('aria-label="Language"'),
 "Creator Studio drafts do not falsely schedule posts":!studio.includes('<input type="date"'),
 "Own profile Edit and Share are not repeated in More":!app.includes('Share profile</button>\n                  {activeProfile.id===me.id'),
};
let failures=0;
for(const [name,ok] of Object.entries(tests)){console.log((ok?"PASS":"FAIL")+" "+name);if(!ok)failures++;}
assert.equal(failures,0,failures+" navigation regression checks failed");
console.log("Navigation regression audit passed ("+Object.keys(tests).length+" checks).");
