import { Hono, MiddlewareHandler } from "hono";

import bcrypt from 'bcryptjs';
import { HTTPException } from 'hono/http-exception'
import axios from 'axios'
// import passport, { PassportStatic } from 'passport';
// import { Strategy } from "passport-local";
// import GoogleStrategy from "passport-google-oauth2";
// var GoogleStrategy = require( 'passport-google-oauth2' ).Strategy;
import { setCookie } from "hono/cookie";
// import { CookieStore, sessionMiddleware } from "hono-sessions";

import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'



export const userRouter = new Hono<{
    Bindings:{
      HASH_PASSWORD:string,
      DATABASE_URL:string,
      GOOGLE_CLIENT_ID: string, 
      GOOGLE_CLIENT_SECRET: string,
      BACKEND_API:string
    },
    Variables:{

    }
}>();


type userDetails=
  {
  firstName: string
  lastName: string
  email: string
  password: string 
}

type loginDetails={
  email:string,
  password: string,
}

userRouter.get("/auth/google", async (c) => {
  const GOOGLE_AUTH_ENDPOINT= "https://accounts.google.com/o/oauth2/v2/auth";
  const responseType='code';
  const scope= encodeURIComponent("https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email");
  const accessType= 'offline';

  const authUrl= `${GOOGLE_AUTH_ENDPOINT}?response_type=${responseType}&client_id=${encodeURIComponent(c.env.GOOGLE_CLIENT_ID)}&redirect_uri=${encodeURIComponent(`${c.env.BACKEND_API}/api/v1/user/auth/google/callback`)}&scope=${scope}&access_type=${accessType}`;
  return c.redirect(authUrl);
});

userRouter.get('/auth/google/callback',async (c)=>{
  const url= new URL(c.req.url);
  const code= url.searchParams.get('code');

  if(!code){
    return c.text("Authorization code not found",400);
  }

  const GOOGLE_TOKEN_ENDPOINT= 'https://oauth2.googleapis.com/token';

  const tokenResponse = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code: code,
      client_id: c.env.GOOGLE_CLIENT_ID,
      client_secret: c.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${c.env.BACKEND_API}/api/v1/user/auth/google/callback`,
      grant_type: 'authorization_code',
    }),
  });

  const tokenData:any= await tokenResponse.json();
  console.log(tokenData);
  if(!tokenData.access_token){
    return c.text("failed to obtain access token",400);
  }

  return c.text("user account created successfully");
});
  // try {
  //   const saltRounds = 10;
  //   const hashPassword = await bcrypt.hash(userProfile.email, saltRounds); // Use email as password for simplicity
    
  //   await prisma.userLogin.create({
  //     data: {
  //       firstName: userProfile.given_name,
  //       lastName: userProfile.family_name,
  //       email: userProfile.email,
  //       password: hashPassword,
  //     }
  //   });

  //   c.status(200);
  //   return c.json({
  //     "msg": "Signup successful"
  //   });

  // } catch (err) {
  //   console.error(err);
  //   return c.json({
  //     "msg": "Server Error"
  //   });
  // }


userRouter.get("/signup", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  try{
    const body:userDetails= await c.req.json();

    console.log(body);

    const saltRounds=10;
     

    const hashPassword=await bcrypt.hash(body.password,saltRounds)
    console.log(hashPassword);

    await prisma.userLogin.create({
      data:{
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        password: hashPassword
      }
    })

    c.status(200);
    return c.json({
      "msg":"signup successful"
    })
    
    
  }catch(err){
    console.log(err);
    return c.json({
      "msg": "Server Error"
    })
  }
  
	
  
});


