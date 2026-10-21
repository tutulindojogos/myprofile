// Gera games.json a partir da Steam Web API. Precisa de STEAM_API_KEY e STEAM_ID (veja README).
import {writeFileSync} from 'node:fs';
const {STEAM_API_KEY:key,STEAM_ID:id}=process.env;
if(!key||!id){console.error('Faltam STEAM_API_KEY / STEAM_ID');process.exit(1)}
const api=(p,q)=>fetch('https://api.steampowered.com/'+p+'?key='+key+'&steamid='+id+'&format=json&'+q).then(r=>{if(!r.ok)throw new Error(p+' '+r.status);return r.json()});
const [own,rec,sum]=await Promise.all([
 api('IPlayerService/GetOwnedGames/v1/','include_appinfo=1&include_played_free_games=1'),
 api('IPlayerService/GetRecentlyPlayedGames/v1/','count=3'),
 fetch('https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key='+key+'&steamids='+id).then(r=>r.json())]);
const all=(own.response.games||[]).filter(g=>g.playtime_forever>0).sort((a,b)=>b.playtime_forever-a.playtime_forever);
const p=sum.response.players[0]||{};
writeFileSync('games.json',JSON.stringify({updated:new Date().toISOString(),total:own.response.game_count||all.length,now:p.gameextrainfo||null,
 games:all.slice(0,12).map(g=>({appid:g.appid,name:g.name,hours:Math.round(g.playtime_forever/60)})),
 recent:(rec.response.games||[]).map(g=>({appid:g.appid,name:g.name,hours2w:Math.round(g.playtime_2weeks/60)}))},null,1));
console.log('games.json ok');
