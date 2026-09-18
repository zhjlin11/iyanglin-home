"use client";

import { FormEvent, useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { CalendarDays, ChevronLeft, Clock3, Copy, Filter, KeyRound, LockKeyhole, LogOut, MoreHorizontal, Plus, RotateCcw, Search, Shield, Smartphone, Unlink, UserCheck, Users, X } from "lucide-react";

type WxState = "UNBOUND" | "BOUND" | "FOLLOWING" | "UNFOLLOWED";
type UserRow = {
  id: string; username: string; nickname?: string | null; avatar?: string | null; wechatAvatar?: string | null; wechatNickname?: string | null; phone?: string | null;
  role: string; status: string; createdAt: string; lastLoginAt?: string | null; lastActiveAt?: string | null; lastLoginProvider?: string | null; registrationSource?: string | null;
  loginProviders: string[]; wechat: { bound: boolean; subscribed: boolean; state: WxState; subscribeAt?: string | null; unsubscribeAt?: string | null };
};
type Detail = UserRow & {
  wechatOpenId?: string | null; wechatUnionId?: string | null;
  authAccounts?: { provider: string; providerAccountId?: string | null; lastLoginAt?: string | null }[];
  wechatAccounts?: { openId?: string | null; unionId?: string | null; nickname?: string | null; lastSyncAt?: string | null }[];
  loginLogs?: { provider: string; success: boolean; createdAt: string }[];
};
type Stats = { total:number; active:number; locked:number; todayNew:number; wechatUsers:number; phoneUsers:number; boundWechat:number };

const sources: Record<string,{label:string;color:string;bg:string}> = {
  WECHAT:{label:"微信注册",color:"#0f766e",bg:"#ecfdf5"}, PHONE:{label:"手机号注册",color:"#2563eb",bg:"#eff6ff"},
  PASSWORD:{label:"密码注册",color:"#475569",bg:"#f1f5f9"}, ADMIN:{label:"管理员创建",color:"#7c3aed",bg:"#f5f3ff"},
  IMPORT:{label:"历史导入",color:"#64748b",bg:"#f1f5f9"},
};
const providers: Record<string,string> = { WECHAT:"微信", PHONE:"手机", PASSWORD:"密码", ADMIN:"管理员" };
const roles: Record<string,string> = { USER:"普通会员", ADMIN:"管理员", EDITOR:"运营编辑", REVIEWER:"审核员" };

function fmt(value?:string|null, short=false) {
  if (!value) return "暂未登录";
  return new Date(value).toLocaleString("zh-CN", short ? {month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"} : {year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"});
}
function profile(user:UserRow) {
  const nickname = user.nickname && user.nickname !== "杨林网老用户" ? user.nickname : user.wechatNickname || user.username || "未命名用户";
  return { nickname, avatar:user.avatar || user.wechatAvatar || "", id:"#"+user.id.slice(-6), initial:nickname.slice(0,1).toUpperCase() };
}
function source(user:UserRow) {
  if (user.registrationSource && sources[user.registrationSource]) {
    return sources[user.registrationSource];
  }
  if (user.wechat?.bound || user.username?.startsWith("wx_")) {
    return sources.WECHAT;
  }
  if (user.phone) {
    return sources.PHONE;
  }
  return sources.IMPORT;
}
function wxText(user:UserRow) {
  if(user.wechat.state==="FOLLOWING") return "已绑定 · 已关注";
  if(user.wechat.state==="UNFOLLOWED") return "已取消关注";
  if(user.wechat.state==="BOUND") return "已绑定 · 未关注";
  return "未绑定微信";
}
function wxColor(state:WxState) { return state==="FOLLOWING"?"#15803d":state==="UNFOLLOWED"?"#c2410c":state==="BOUND"?"#64748b":"#94a3b8"; }

export default function UsersPage() {
  const [users,setUsers]=useState<UserRow[]>([]);
  const [stats,setStats]=useState<Stats>({total:0,active:0,locked:0,todayNew:0,wechatUsers:0,phoneUsers:0,boundWechat:0});
  const [loading,setLoading]=useState(true);
  const [query,setQuery]=useState(""); const [status,setStatus]=useState("ALL"); const [quick,setQuick]=useState("ALL");
  const [registrationSource,setRegistrationSource]=useState("ALL"); const [wechatStatus,setWechatStatus]=useState("ALL"); const [role,setRole]=useState("ALL"); const [sort,setSort]=useState("CREATED_DESC");
  const [page,setPage]=useState(1); const [pages,setPages]=useState(1); const [availableSources,setAvailableSources]=useState<string[]>([]);
  const [manage,setManage]=useState(false); const [drawer,setDrawer]=useState<Detail|null>(null); const [detailLoading,setDetailLoading]=useState(false);
  const [menu,setMenu]=useState<UserRow|null>(null); const [mobileMenu,setMobileMenu]=useState<UserRow|null>(null); const [sheet,setSheet]=useState(false); const [notice,setNotice]=useState(""); const [error,setError]=useState("");
  const [passwordUser,setPasswordUser]=useState<UserRow|null>(null); const [newPassword,setNewPassword]=useState("");
  const [createOpen,setCreateOpen]=useState(false);

  const load=async(target=page)=>{
    setLoading(true);
    const p=new URLSearchParams({page:String(target),limit:"20",search:query,status,role,registrationSource,wechatStatus,quick,sort});
    try {
      const response=await fetch("/api/users?"+p.toString());
      if(!response.ok) throw new Error(response.status===403?"AUTH":"LOAD");
      const data=await response.json();
      setUsers(data.users||[]); setStats(data.stats||{}); setPages(data.pagination?.totalPages||1); setAvailableSources(data.availableFilters?.registrationSources||[]); setManage(Boolean(data.permissions?.canManageUsers)); setError("");
    } catch(e) { setError(e instanceof Error && e.message==="AUTH"?"登录已过期，请重新登录":"用户列表加载失败"); }
    finally { setLoading(false); }
  };
  useEffect(()=>{load(page);},[page,status,quick,registrationSource,wechatStatus,role,sort]);
  const search=(e:FormEvent)=>{e.preventDefault();setPage(1);load(1);};
  const clear=()=>{setQuery("");setStatus("ALL");setQuick("ALL");setRegistrationSource("ALL");setWechatStatus("ALL");setRole("ALL");setSort("CREATED_DESC");setPage(1);};
  const detail=async(user:UserRow)=>{
    setMenu(null);setDrawer(user);setDetailLoading(true);
    try {
      const r=await fetch("/api/users/"+user.id);
      if(!r.ok)throw new Error();
      const d=await r.json();
      // The list owns the presentation-only source and WeChat state; retain it
      // when merging the canonical detail payload returned by the existing API.
      setDrawer({...user,...d.user,wechat:d.user.wechat||user.wechat,loginProviders:d.user.loginProviders||user.loginProviders});
    } catch {setError("用户详情加载失败");} finally{setDetailLoading(false);}
  };
  const action=async(user:UserRow,kind:"TOGGLE_STATUS"|"LOGOUT_ALL")=>{
    const isLock=kind==="TOGGLE_STATUS" && user.status!=="DISABLED";
    if(!window.confirm(isLock?"确认锁定此账号吗？锁定后会退出所有设备。":"确认将此用户退出所有设备吗？"))return;
    const r=await fetch("/api/admin/users",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId:user.id,action:kind,status:kind==="TOGGLE_STATUS"?(user.status==="DISABLED"?"ACTIVE":"DISABLED"):undefined})});
    if(r.ok){setNotice(kind==="LOGOUT_ALL"?"已退出该用户的全部设备":user.status==="DISABLED"?"账号已恢复正常":"账号已锁定");setMenu(null);setMobileMenu(null);load();}else setError("操作未完成，请检查管理员权限");
  };
  const unbind=async(user:UserRow)=>{
    if(!window.confirm("确认解绑微信吗？解绑后该微信不能继续登录此账号。"))return;
    const r=await fetch("/api/users/"+user.id,{method:"DELETE"});
    if(r.ok){setNotice("微信已解绑");setDrawer(null);setMenu(null);load();}else{const d=await r.json().catch(()=>({}));setError(d.error||"微信解绑失败");}
  };
  const resetPassword=async()=>{
    if(!passwordUser||newPassword.length<6){setError("新密码至少需要 6 位");return;}
    const r=await fetch("/api/admin/users",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId:passwordUser.id,action:"RESET_PASSWORD",newPassword})});
    if(r.ok){setNotice("密码已重置，用户原设备登录已失效");setPasswordUser(null);setNewPassword("");}else setError("密码重置失败");
  };
  const createAdmin=async(e:FormEvent<HTMLFormElement>)=>{
    e.preventDefault(); const form=new FormData(e.currentTarget);
    const r=await fetch("/api/users",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:form.get("username"),password:form.get("password"),role:form.get("role")})});
    if(r.ok){setCreateOpen(false);setNotice("管理员账号已创建");load(1);}else{const d=await r.json().catch(()=>({}));setError(d.error||"创建失败");}
  };
  const quickTabs=[["ALL","全部 "+stats.total],["ACTIVE","正常 "+stats.active],["DISABLED","已锁定 "+stats.locked],["TODAY","今日新增 "+stats.todayNew]];

  return <AdminLayout title="用户管理" subtitle="管理网站会员、微信用户及账号状态" actionButton={manage?<button className="usr-primary" onClick={()=>setCreateOpen(true)}><Plus size={16}/>新建管理员</button>:undefined}>
    <style jsx global>{'.usr{color:#172033}.usr-card{background:#fff;border:1px solid #e5ebf2;border-radius:12px;box-shadow:0 1px 2px rgba(15,23,42,.03)}.usr-primary{border:0;background:#0f766e;color:#fff;border-radius:9px;padding:9px 13px;font-size:13px;font-weight:700;display:inline-flex;align-items:center;gap:6px;cursor:pointer}.usr-input{border:1px solid #d7e0ea;border-radius:8px;background:#fff;color:#334155;padding:8px 10px;font-size:13px;min-height:36px}.usr-tabs{display:flex;gap:4px;padding:4px;background:#f1f5f9;border-radius:10px;width:max-content}.usr-tabs button{border:0;background:transparent;border-radius:7px;padding:7px 11px;color:#64748b;font-size:13px;font-weight:650;cursor:pointer}.usr-tabs .on{background:#fff;color:#0f172a;box-shadow:0 1px 3px rgba(15,23,42,.12)}.usr-table{width:100%;border-collapse:collapse;table-layout:fixed}.usr-table th{position:sticky;top:0;z-index:1;background:#f8fafc;color:#64748b;font-size:12px;text-align:left;padding:12px 14px;border-bottom:1px solid #e2e8f0}.usr-table td{padding:13px 14px;border-bottom:1px solid #edf2f7;vertical-align:middle}.usr-table tr{height:76px}.usr-table tr:hover{background:#fbfdff}.usr-tag{display:inline-flex;border-radius:99px;padding:3px 8px;font-size:11px;font-weight:700}.usr-avatar{width:38px;height:38px;border-radius:50%;object-fit:cover;background:#e2e8f0}.usr-fallback{width:38px;height:38px;border-radius:50%;background:#e0f2fe;color:#0369a1;display:grid;place-items:center;font-size:14px;font-weight:800}.usr-button{border:1px solid #cbd5e1;background:#fff;border-radius:7px;padding:6px 10px;font-weight:700;font-size:12px;color:#334155;cursor:pointer}.usr-more{width:30px;height:30px;border:0;border-radius:7px;background:transparent;color:#475569;cursor:pointer}.usr-more:hover{background:#f1f5f9}.usr-menu{position:absolute;right:0;top:35px;width:160px;background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:5px;box-shadow:0 12px 24px rgba(15,23,42,.16);z-index:5}.usr-menu button{width:100%;border:0;background:#fff;text-align:left;border-radius:7px;padding:8px 9px;font-size:12px;color:#334155;cursor:pointer}.usr-menu button:hover{background:#f8fafc}.usr-menu .danger{color:#b91c1c}.usr-skeleton{height:76px;background:linear-gradient(90deg,#fff,#f1f5f9,#fff);background-size:200% 100%;animation:us 1.2s infinite}@keyframes us{to{background-position:-200% 0}}.usr-mobile{display:none}.usr-mask{position:fixed;inset:0;background:rgba(15,23,42,.42);z-index:900;display:flex;align-items:flex-end}.usr-drawer{position:fixed;right:0;top:0;height:100%;width:min(540px,100%);background:#fff;overflow:auto;box-shadow:-12px 0 30px rgba(15,23,42,.15)}@media(max-width:767px){.usr-desktop{display:none}.usr-mobile{display:block}.usr-stats{grid-template-columns:repeat(2,1fr)!important}.usr-toolbar{display:none!important}.usr-tabs{width:100%;overflow-x:auto}.usr-tabs button{white-space:nowrap}.usr-chips{display:flex;gap:8px;overflow-x:auto;padding:0 0 10px}.usr-chips button{flex:none;border:1px solid #dbe4ed;background:#fff;border-radius:99px;padding:7px 11px;font-size:12px;color:#475569}.usr-row{padding:14px;margin-bottom:10px}.usr-row-actions{display:grid;grid-template-columns:1fr 42px;gap:8px;margin-top:13px}.usr-drawer{width:100%;box-shadow:none}.usr-primary{padding:8px 10px;font-size:12px}}'}</style>
    <section className="usr">
      {(notice||error)&&<div style={{marginBottom:12,padding:"10px 12px",borderRadius:9,fontSize:13,background:error?"#fef2f2":"#ecfdf5",color:error?"#b91c1c":"#047857",border:"1px solid "+(error?"#fecaca":"#a7f3d0")}}>{error||notice}<button onClick={()=>{setError("");setNotice("");}} style={{float:"right",border:0,background:"transparent",cursor:"pointer"}}><X size={15}/></button></div>}
      <div className="usr-stats" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:14}}>
        {[[Users,"总用户",stats.total,"#0f172a"],[Smartphone,"微信用户",stats.wechatUsers,"#0f766e"],[UserCheck,"手机用户",stats.phoneUsers,"#2563eb"],[Shield,"已绑定微信",stats.boundWechat,"#7c3aed"]].map(([Icon,label,value,color])=>{const C=Icon as typeof Users;return <div className="usr-card" style={{padding:"13px 14px"}} key={String(label)}><div style={{display:"flex",justifyContent:"space-between",color:"#64748b",fontSize:12,fontWeight:700}}><span>{String(label)}</span><C size={16} color={String(color)}/></div><strong style={{display:"block",marginTop:6,fontSize:23,color:String(color)}}>{Number(value||0).toLocaleString()}</strong></div>})}
      </div>
      <div className="usr-tabs" style={{marginBottom:12}}>{quickTabs.map(([key,label])=><button key={key} className={(key==="TODAY"?quick==="TODAY":status===key&&quick!=="TODAY")?"on":""} onClick={()=>{if(key==="TODAY"){setQuick("TODAY");setStatus("ALL");}else{setQuick("ALL");setStatus(key);}setPage(1);}}>{label}</button>)}</div>
      <div className="usr-mobile usr-chips">{[["全部",()=>{setQuick("ALL");setWechatStatus("ALL");}],["微信",()=>setRegistrationSource("WECHAT")],["手机",()=>setRegistrationSource("PHONE")],["已绑定",()=>setWechatStatus("BOUND")],["已锁定",()=>setStatus("DISABLED")]].map(([label,run])=><button key={String(label)} onClick={()=>{(run as ()=>void)();setPage(1);}}>{String(label)}</button>)}<button onClick={()=>setSheet(true)}><Filter size={14} style={{verticalAlign:"-2px",marginRight:4}}/>筛选</button></div>
      <div className="usr-card usr-toolbar" style={{padding:12,marginBottom:14,display:"grid",gridTemplateColumns:"minmax(220px,1.4fr) repeat(4,minmax(120px,1fr))",gap:8}}>
        <form onSubmit={search} style={{position:"relative"}}><Search size={16} style={{position:"absolute",left:10,top:10,color:"#94a3b8"}}/><input className="usr-input" style={{width:"100%",paddingLeft:32,boxSizing:"border-box"}} placeholder="搜索用户、手机号、OpenID" value={query} onChange={e=>setQuery(e.target.value)}/></form>
        <Select value={registrationSource} set={v=>{setRegistrationSource(v);setPage(1);}} items={[["ALL","全部来源"],...availableSources.map(x=>[x,sources[x]?.label||x])]} />
        <Select value={wechatStatus} set={v=>{setWechatStatus(v);setPage(1);}} items={[["ALL","全部微信状态"],["BOUND","已绑定微信"],["UNBOUND","未绑定微信"],["FOLLOWING","已关注公众号"],["UNFOLLOWED","已取消关注"]]} />
        <Select value={role} set={v=>{setRole(v);setPage(1);}} items={[["ALL","全部会员"],["USER","普通会员"],["ADMIN","管理员"],["EDITOR","运营编辑"],["REVIEWER","审核员"]]} />
        <Select value={sort} set={setSort} items={[["CREATED_DESC","最近注册"],["LOGIN_DESC","最近登录"]]} />
      </div>
      <div className="usr-card usr-desktop" style={{overflow:"auto",maxHeight:"calc(100vh - 360px)"}}><table className="usr-table"><colgroup><col style={{width:"29%"}}/><col style={{width:"18%"}}/><col style={{width:"18%"}}/><col style={{width:"18%"}}/><col style={{width:"8%"}}/><col style={{width:"9%"}}/></colgroup><thead><tr><th>用户</th><th>账号来源</th><th>会员 / 微信</th><th>时间</th><th>状态</th><th style={{textAlign:"right"}}>操作</th></tr></thead><tbody>{loading?Array.from({length:7}).map((_,i)=><tr key={i}><td colSpan={6} className="usr-skeleton"/></tr>):users.length===0?<tr><td colSpan={6} style={{textAlign:"center",padding:"64px 0",color:"#94a3b8"}}>暂无符合条件的用户<br/><button className="usr-button" style={{marginTop:12}} onClick={clear}>清除筛选</button></td></tr>:users.map(u=><DesktopRow key={u.id} user={u} detail={detail} menu={menu} setMenu={setMenu} manage={manage} action={action} unbind={unbind} password={setPasswordUser}/>)}</tbody></table></div>
      <div className="usr-mobile">{loading?Array.from({length:5}).map((_,i)=><div key={i} className="usr-card usr-skeleton" style={{marginBottom:10}}/>):users.length===0?<div className="usr-card" style={{padding:32,textAlign:"center",color:"#94a3b8"}}>暂无符合条件的用户<br/><button className="usr-button" style={{marginTop:12}} onClick={clear}>清除筛选</button></div>:users.map(u=><MobileRow key={u.id} user={u} detail={detail} setMenu={setMobileMenu}/>)}</div>
      {pages>1&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 4px",fontSize:12,color:"#64748b"}}><span>第 {page} / {pages} 页</span><div style={{display:"flex",gap:8}}><button className="usr-button" disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>上一页</button><button className="usr-button" disabled={page>=pages} onClick={()=>setPage(p=>Math.min(pages,p+1))}>下一页</button></div></div>}
    </section>
    {mobileMenu&&<Menu user={mobileMenu} manage={manage} close={()=>setMobileMenu(null)} detail={detail} action={action} unbind={unbind} password={setPasswordUser}/>}
    {drawer&&<Drawer user={drawer} loading={detailLoading} manage={manage} close={()=>setDrawer(null)} action={action} unbind={unbind} password={setPasswordUser}/>}
    {sheet&&<Sheet source={registrationSource} setSource={setRegistrationSource} wx={wechatStatus} setWx={setWechatStatus} role={role} setRole={setRole} available={availableSources} clear={clear} close={()=>setSheet(false)} apply={()=>{setPage(1);setSheet(false);load(1);}}/>}
    {passwordUser&&<PasswordModal user={passwordUser} value={newPassword} set={setNewPassword} close={()=>setPasswordUser(null)} save={resetPassword}/>}
    {createOpen&&<CreateModal close={()=>setCreateOpen(false)} save={createAdmin}/>}
  </AdminLayout>;
}

function Select({value,set,items}:{value:string;set:(v:string)=>void;items:string[][]}){return <select className="usr-input" value={value} onChange={e=>set(e.target.value)}>{items.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select>}
function Avatar({user}:{user:UserRow}){const p=profile(user);return p.avatar?<img className="usr-avatar" src={p.avatar} alt="" referrerPolicy="no-referrer"/>:<div className="usr-fallback">{p.initial}</div>}
function Badge({status}:{status:string}){const locked=status==="DISABLED";return <span className="usr-tag" style={{background:locked?"#fff7ed":"#f0fdf4",color:locked?"#c2410c":"#15803d"}}>{locked?"已锁定":"正常"}</span>}
function DesktopRow({user,detail,menu,setMenu,manage,action,unbind,password}:{user:UserRow;detail:(u:UserRow)=>void;menu:UserRow|null;setMenu:(u:UserRow|null)=>void;manage:boolean;action:(u:UserRow,k:"TOGGLE_STATUS"|"LOGOUT_ALL")=>void;unbind:(u:UserRow)=>void;password:(u:UserRow)=>void}){const p=profile(user),s=source(user);return <tr><td><div style={{display:"flex",alignItems:"center",gap:10}}><Avatar user={user}/><div style={{minWidth:0}}><strong style={{display:"block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.nickname}</strong><span style={{fontSize:11,color:"#94a3b8"}}>{p.id} · {user.phone?user.phone.slice(0,3)+"****"+user.phone.slice(-4):user.username}</span></div></div></td><td><span className="usr-tag" style={{background:s.bg,color:s.color}}>{s.label}</span><div style={{fontSize:11,color:"#64748b",marginTop:5}}>登录方式：{user.loginProviders.map(x=>providers[x]||x).join(" + ")||"未识别"}</div></td><td><span className="usr-tag" style={{background:"#f1f5f9",color:"#475569"}}>{roles[user.role]||user.role}</span><div style={{fontSize:12,marginTop:5,color:wxColor(user.wechat.state)}}>{wxText(user)}</div></td><td style={{fontSize:12,color:"#64748b",lineHeight:1.7}}>注册：{fmt(user.createdAt,true)}<br/>最近：{user.lastLoginAt?(providers[user.lastLoginProvider||""]||"")+" · "+fmt(user.lastLoginAt,true):"暂未登录"}</td><td><Badge status={user.status}/></td><td style={{textAlign:"right",position:"relative"}}><button className="usr-button" onClick={()=>detail(user)}>详情</button><button className="usr-more" onClick={()=>setMenu(menu?.id===user.id?null:user)}><MoreHorizontal size={18}/></button>{menu?.id===user.id&&<InlineMenu user={user} manage={manage} detail={detail} action={action} unbind={unbind} password={password}/>}</td></tr>}
function MobileRow({user,detail,setMenu}:{user:UserRow;detail:(u:UserRow)=>void;setMenu:(u:UserRow)=>void}){const p=profile(user),s=source(user);return <article className="usr-card usr-row"><div style={{display:"flex",alignItems:"center",gap:10}}><Avatar user={user}/><div style={{flex:1,minWidth:0}}><strong>{p.nickname}</strong><div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>{p.id} · {user.phone?user.phone.slice(0,3)+"****"+user.phone.slice(-4):user.username}</div></div><Badge status={user.status}/></div><div style={{display:"flex",gap:6,marginTop:12}}><span className="usr-tag" style={{background:s.bg,color:s.color}}>{s.label}</span><span className="usr-tag" style={{background:"#f1f5f9",color:"#475569"}}>{roles[user.role]||user.role}</span></div><div style={{fontSize:12,color:wxColor(user.wechat.state),marginTop:10}}>微信：{wxText(user)}</div><div style={{display:"grid",gap:4,fontSize:12,color:"#64748b",marginTop:8}}><span>注册：{fmt(user.createdAt,true)}</span><span>最近：{user.lastLoginAt?(providers[user.lastLoginProvider||""]||"")+" · "+fmt(user.lastLoginAt,true):"暂未登录"}</span></div><div className="usr-row-actions"><button className="usr-button" onClick={()=>detail(user)}>查看详情</button><button className="usr-button" onClick={()=>setMenu(user)}><MoreHorizontal size={17}/></button></div></article>}
function InlineMenu({user,manage,detail,action,unbind,password}:{user:UserRow;manage:boolean;detail:(u:UserRow)=>void;action:(u:UserRow,k:"TOGGLE_STATUS"|"LOGOUT_ALL")=>void;unbind:(u:UserRow)=>void;password:(u:UserRow)=>void}){return <div className="usr-menu"><button onClick={()=>detail(user)}>查看登录记录</button>{manage&&<><button onClick={()=>password(user)}>修改密码</button><button className="danger" onClick={()=>action(user,"TOGGLE_STATUS")}>{user.status==="DISABLED"?"恢复账号":"锁定账号"}</button><button className="danger" onClick={()=>action(user,"LOGOUT_ALL")}>踢出设备</button>{user.wechat.bound&&<button className="danger" onClick={()=>unbind(user)}>解绑微信</button>}</>}</div>}
function Menu({user,manage,close,detail,action,unbind,password}:{user:UserRow;manage:boolean;close:()=>void;detail:(u:UserRow)=>void;action:(u:UserRow,k:"TOGGLE_STATUS"|"LOGOUT_ALL")=>void;unbind:(u:UserRow)=>void;password:(u:UserRow)=>void}){return <div style={{position:"fixed",inset:0,zIndex:800}} onClick={close}><div className="usr-menu" style={{position:"fixed",right:16,top:148}} onClick={e=>e.stopPropagation()}><InlineMenu user={user} manage={manage} detail={detail} action={action} unbind={unbind} password={password}/></div></div>}
function Drawer({user,loading,manage,close,action,unbind,password}:{user:Detail;loading:boolean;manage:boolean;close:()=>void;action:(u:UserRow,k:"TOGGLE_STATUS"|"LOGOUT_ALL")=>void;unbind:(u:UserRow)=>void;password:(u:UserRow)=>void}){const p=profile(user),account=(x:string)=>Boolean(user.authAccounts?.some(a=>a.provider===x)||(x==="WECHAT"&&user.wechat.bound)||(x==="PHONE"&&user.phone)),wx=user.wechatAccounts?.[0];const copy=(x?:string|null)=>x&&navigator.clipboard?.writeText(x);return <div className="usr-mask" onClick={close}><aside className="usr-drawer" onClick={e=>e.stopPropagation()}><div style={{padding:"18px 20px",borderBottom:"1px solid #e2e8f0",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:"#fff",zIndex:2}}><div style={{display:"flex",alignItems:"center",gap:8}}><button className="usr-more" onClick={close}><ChevronLeft size={21}/></button><strong>用户详情</strong></div><button className="usr-more" onClick={close}><X size={18}/></button></div><div style={{padding:20}}><div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18}}><Avatar user={user}/><div><strong style={{fontSize:17}}>{p.nickname}</strong><div style={{fontSize:12,color:"#64748b",marginTop:4}}>{p.id} · {user.phone||"未绑定手机"}</div></div><div style={{marginLeft:"auto"}}><Badge status={user.status}/></div></div>{loading?<div className="usr-skeleton"/>:<div style={{display:"grid",gap:12}}><Section title="基本资料"><Line label="账号" value={user.username}/><Line label="手机号" value={user.phone||"未绑定"}/><Line label="会员类型" value={roles[user.role]||user.role}/><Line label="账号状态" value={user.status==="DISABLED"?"已锁定":"正常"}/></Section><Section title="登录方式"><Line label="微信" value={account("WECHAT")?"已绑定":"未绑定"}/><Line label="手机号" value={account("PHONE")?(user.phone||"已绑定"):"未绑定"}/><Line label="密码" value={account("PASSWORD")?"已设置":"未设置"}/></Section><Section title="微信信息"><Line label="绑定状态" value={user.wechat.bound?"已绑定":"未绑定"}/><Line label="公众号状态" value={wxText(user)}/><Line label="OpenID" value={wx?.openId||user.wechatOpenId||"未提供"} copy={()=>copy(wx?.openId||user.wechatOpenId)}/><Line label="UnionID" value={wx?.unionId||user.wechatUnionId||"未提供"} copy={()=>copy(wx?.unionId||user.wechatUnionId)}/><Line label="微信昵称" value={wx?.nickname||user.wechatNickname||"微信资料未授权"}/><Line label="关注时间" value={fmt(user.wechat.subscribeAt)}/><Line label="资料同步" value={fmt(wx?.lastSyncAt)}/></Section><Section title="时间信息"><Line label="注册时间" value={fmt(user.createdAt)}/><Line label="最近登录" value={user.lastLoginAt?(providers[user.lastLoginProvider||""]||"")+" · "+fmt(user.lastLoginAt):"暂未登录"}/><Line label="最近活跃" value={fmt(user.lastActiveAt)}/></Section><Section title="最近活动">{user.loginLogs?.length?user.loginLogs.slice(0,4).map((x,i)=><div key={i} style={{fontSize:12,color:"#64748b",padding:"5px 0"}}>{providers[x.provider]||x.provider} · {fmt(x.createdAt)} · {x.success?"成功":"失败"}</div>):<span style={{fontSize:12,color:"#94a3b8"}}>暂无登录记录</span>}</Section>{manage&&<Section title="安全操作"><div style={{display:"grid",gap:8}}><button className="usr-button" onClick={()=>password(user)}><KeyRound size={15} style={{verticalAlign:"-3px",marginRight:6}}/>重置密码</button><button className="usr-button" style={{color:"#b45309",borderColor:"#fed7aa"}} onClick={()=>action(user,"TOGGLE_STATUS")}><LockKeyhole size={15} style={{verticalAlign:"-3px",marginRight:6}}/>{user.status==="DISABLED"?"恢复账号":"锁定账号"}</button><button className="usr-button" style={{color:"#b91c1c",borderColor:"#fecaca"}} onClick={()=>action(user,"LOGOUT_ALL")}><LogOut size={15} style={{verticalAlign:"-3px",marginRight:6}}/>踢出设备</button>{user.wechat.bound&&<button className="usr-button" style={{color:"#b91c1c",borderColor:"#fecaca"}} onClick={()=>unbind(user)}><Unlink size={15} style={{verticalAlign:"-3px",marginRight:6}}/>解绑微信</button>}</div></Section>}</div>}</div></aside></div>}
function Section({title,children}:{title:string;children:React.ReactNode}){return <section className="usr-card" style={{padding:14}}><strong style={{fontSize:13}}>{title}</strong><div style={{marginTop:9}}>{children}</div></section>}
function Line({label,value,copy}:{label:string;value:string;copy?:()=>void}){return <div style={{display:"flex",gap:12,padding:"5px 0",fontSize:12}}><span style={{width:72,color:"#94a3b8",flexShrink:0}}>{label}</span><span style={{color:"#334155",wordBreak:"break-all"}}>{value}</span>{copy&&<button onClick={copy} style={{border:0,background:"transparent",color:"#0f766e",cursor:"pointer"}}><Copy size={13}/></button>}</div>}
function Sheet({source,setSource,wx,setWx,role,setRole,available,clear,close,apply}:{source:string;setSource:(x:string)=>void;wx:string;setWx:(x:string)=>void;role:string;setRole:(x:string)=>void;available:string[];clear:()=>void;close:()=>void;apply:()=>void}){const group=(name:string,value:string,set:(x:string)=>void,items:string[][])=><section style={{marginTop:18}}><strong style={{fontSize:13}}>{name}</strong><div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:10}}>{items.map(([v,l])=><button key={v} onClick={()=>set(v)} className="usr-button" style={{background:value===v?"#ecfdf5":"#fff",borderColor:value===v?"#5eead4":"#dbe4ed",color:value===v?"#0f766e":"#475569"}}>{l}</button>)}</div></section>;return <div className="usr-mask" onClick={close}><div className="usr-card" style={{width:"100%",borderRadius:"20px 20px 0 0",padding:"12px 16px 24px",maxHeight:"88vh",overflow:"auto"}} onClick={e=>e.stopPropagation()}><div style={{width:34,height:4,borderRadius:9,background:"#cbd5e1",margin:"0 auto 16px"}}/><div style={{display:"flex",justifyContent:"space-between"}}><strong>筛选用户</strong><button className="usr-more" onClick={close}><X size={18}/></button></div>{group("账号来源",source,setSource,[["ALL","全部"],...available.map(x=>[x,sources[x]?.label||x])])}{group("微信状态",wx,setWx,[["ALL","全部"],["BOUND","已绑定"],["UNBOUND","未绑定"],["FOLLOWING","已关注"],["UNFOLLOWED","已取消关注"]])}{group("会员类型",role,setRole,[["ALL","全部会员"],["USER","普通会员"],["ADMIN","管理员"],["EDITOR","运营编辑"],["REVIEWER","审核员"]])}<div style={{display:"grid",gridTemplateColumns:"1fr 2fr",gap:10,marginTop:24}}><button className="usr-button" onClick={()=>{clear();close();}}><RotateCcw size={15} style={{verticalAlign:"-3px",marginRight:5}}/>重置</button><button className="usr-primary" style={{justifyContent:"center"}} onClick={apply}>查看结果</button></div></div></div>}
function PasswordModal({user,value,set,close,save}:{user:UserRow;value:string;set:(x:string)=>void;close:()=>void;save:()=>void}){return <div className="usr-mask" style={{alignItems:"center",justifyContent:"center",padding:16}} onClick={close}><div className="usr-card" style={{width:"100%",maxWidth:420,padding:18}} onClick={e=>e.stopPropagation()}><div style={{display:"flex",justifyContent:"space-between"}}><strong>重置密码</strong><button className="usr-more" onClick={close}><X size={18}/></button></div><p style={{fontSize:12,color:"#64748b"}}>重置后会退出「{profile(user).nickname}」的所有设备。</p><input className="usr-input" type="password" minLength={6} placeholder="至少 6 位新密码" value={value} onChange={e=>set(e.target.value)} style={{width:"100%",boxSizing:"border-box"}}/><button className="usr-primary" style={{width:"100%",justifyContent:"center",marginTop:16}} onClick={save}>确认重置</button></div></div>}
function CreateModal({close,save}:{close:()=>void;save:(e:FormEvent<HTMLFormElement>)=>void}){return <div className="usr-mask" style={{alignItems:"center",justifyContent:"center",padding:16}} onClick={close}><form className="usr-card" style={{width:"100%",maxWidth:420,padding:18}} onClick={e=>e.stopPropagation()} onSubmit={save}><div style={{display:"flex",justifyContent:"space-between"}}><strong>新建管理员</strong><button type="button" className="usr-more" onClick={close}><X size={18}/></button></div><input className="usr-input" name="username" required placeholder="登录账号" style={{width:"100%",boxSizing:"border-box",marginTop:14}}/><input className="usr-input" name="password" required type="password" minLength={6} placeholder="至少 6 位密码" style={{width:"100%",boxSizing:"border-box",marginTop:10}}/><select className="usr-input" name="role" defaultValue="EDITOR" style={{width:"100%",marginTop:10}}><option value="EDITOR">运营编辑</option><option value="REVIEWER">内容审核员</option><option value="ADMIN">管理员</option></select><button className="usr-primary" type="submit" style={{width:"100%",justifyContent:"center",marginTop:16}}>创建管理员</button></form></div>}

