"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ADMIN_ROLES } from "@/domain/constants";

export function TeamCreateForm() {
  const router = useRouter(); const [email,setEmail]=useState(""); const [displayName,setDisplayName]=useState(""); const [password,setPassword]=useState(""); const [role,setRole]=useState("AUDITOR"); const [message,setMessage]=useState<string|null>(null);
  async function create(){ setMessage(null); const response=await fetch("/api/admin/team",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({email,displayName,password,role})}); const data=await response.json() as {error?:string}; setMessage(response.ok?"Admin created.":data.error||"Unable to create admin."); if(response.ok){setEmail("");setDisplayName("");setPassword("");router.refresh();}}
  return <section className="rounded-[24px] border border-slate-200 bg-white p-5"><h2 className="font-medium text-slate-950">Add team member</h2><div className="mt-4 grid gap-3 lg:grid-cols-4"><input value={displayName} onChange={(e)=>setDisplayName(e.target.value)} placeholder="Display name" className="h-11 rounded-xl border border-slate-200 px-3 text-sm"/><input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="Email" className="h-11 rounded-xl border border-slate-200 px-3 text-sm"/><input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Initial password (12+ chars)" className="h-11 rounded-xl border border-slate-200 px-3 text-sm"/><select value={role} onChange={(e)=>setRole(e.target.value)} className="h-11 rounded-xl border border-slate-200 px-3 text-sm">{ADMIN_ROLES.map((item)=><option key={item}>{item}</option>)}</select></div><div className="mt-4 flex items-center gap-3"><button type="button" onClick={create} disabled={!email||!displayName||password.length<12} className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-40">Create admin</button>{message?<span className="text-sm text-slate-500">{message}</span>:null}</div></section>;
}
