import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
export function middleware(request:NextRequest){if(request.nextUrl.pathname.startsWith("/admin")&&request.nextUrl.pathname!=="/admin/login"&&!request.cookies.get("yanglin_admin")){return NextResponse.redirect(new URL("/admin/login",request.url));}return NextResponse.next();}
export const config={matcher:["/admin/:path*"]};
