import { auth } from "@/lib/world/auth";
import { NextRequest, NextResponse } from "next/server";
import { sameOrigin } from "@/lib/security";
// Registration is only invoked server-side after atomically redeeming an invitation.
const allowed=new Set(["sign-in/email","sign-out","get-session"]);
async function handle(req:NextRequest){const endpoint=req.nextUrl.pathname.replace("/api/auth/","");if(!allowed.has(endpoint))return NextResponse.json({error:"This little world is invite-only."},{status:403});if(req.method!=="GET"&&!sameOrigin(req,true))return NextResponse.json({error:"Unauthorized"},{status:403});return auth.handler(req);}
export const GET=handle;
export const POST=handle;
