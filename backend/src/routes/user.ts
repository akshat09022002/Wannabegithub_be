import { Hono, MiddlewareHandler } from "hono";
import { getSignedCookie, setSignedCookie } from 'hono/cookie'
import cookieParser from "cookie-parser";
import { createTransport } from "nodemailer";
import bcrypt from 'bcryptjs';
import axios from 'axios'
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { UserSignupSchema } from "@hitemup09/wannabegit";
import { decode,sign,verify } from 'hono/jwt'



export const userRouter = new Hono<{
  Bindings: {
    HASH_PASSWORD: string,
    DATABASE_URL: string,
    GOOGLE_CLIENT_ID: string,
    GOOGLE_CLIENT_SECRET: string
    BACKEND_API: string
    MAIL_API: string
    JWT_SECRET: string
  },
  Variables: {

  }
}>();

type userDetails =
  {
    firstName: string
    lastName: string
    email: string
    password: string
  }

type loginDetails = {
  email: string,
  password: string,
}

userRouter.get("/auth/google", async (c) => {
  const GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
  const responseType = 'code';
  const scope = encodeURIComponent("https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email");
  const accessType = 'offline';

  const authUrl = `${GOOGLE_AUTH_ENDPOINT}?response_type=${responseType}&client_id=${encodeURIComponent(c.env.GOOGLE_CLIENT_ID)}&redirect_uri=${encodeURIComponent(`${c.env.BACKEND_API}/api/v1/user/auth/google/callback`)}&scope=${scope}&access_type=${accessType}`;
  return c.redirect(authUrl);
});

userRouter.get('/auth/google/callback', async (c) => {
  const url = new URL(c.req.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return c.text("Authorization code not found", 400);
  }

  const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';

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

  const tokenData: any = await tokenResponse.json();
  console.log(tokenData);
  if (!tokenData.access_token) {
    return c.text("failed to obtain access token", 400);
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


userRouter.post("/signup", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const body = await getSignedCookie(c,c.env.HASH_PASSWORD,"credentials");
    const user_otp= await c.req.json();

    if(!body || !user_otp){
      await setSignedCookie(c,"credentials","",c.env.HASH_PASSWORD);
      return c.json({
        "msg":"Server Error"
      },422);
    }

    

    const parsed_body=JSON.parse(body).credentials;
    const parsed_otp=JSON.parse(body).otp;

    console.log(String(user_otp.otp));
    console.log(String(parsed_otp));

    const response = UserSignupSchema.safeParse(parsed_body);
    if (!response.success) {
      await setSignedCookie(c,"credentials","",c.env.HASH_PASSWORD);
      return c.json({ "msg": "invalid credentials" }, 500);
    }

    if(String(user_otp.otp)==String(parsed_otp)){

    const saltRounds = 10;


    const hashPassword = await bcrypt.hash(parsed_body.password, saltRounds)


    const credentials = {
      firstName: parsed_body.firstName,
      lastName: parsed_body.lastName,
      email: parsed_body.email,
      password: hashPassword
    }

    const exists = await prisma.userLogin.findFirst({
      where: {
        email: credentials.email
      }
    })

    if (exists) {
      await setSignedCookie(c,"credentials","",c.env.HASH_PASSWORD);
      return c.json({ "msg": "User already exists" }, 409)
    }

    const user= await prisma.userLogin.create({
      data: {
        firstName: credentials.firstName,
        lastName: credentials.lastName,
        email: credentials.email,
        password: credentials.password,

      }
    })

    console.log(user);
  }else{
    return c.json({
      "msg":"invalid otp",
    })
  }

    await setSignedCookie(c,"credentials","",c.env.HASH_PASSWORD);

    return c.json({
      "msg": "signup successful",
    }, 200);

  } catch (err) {
    await setSignedCookie(c,"credentials","",c.env.HASH_PASSWORD);
    return c.json({
      "msg": "Server Error"
    },500)
  }



});


userRouter.post('/verify_email', async (c) => {

  try {
    const body = await c.req.json();

    const otpgen= Math.floor(Math.random()*700000 + 100000);

    

    const response = await fetch('https://api.elasticemail.com/v4/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-ElasticEmail-ApiKey': c.env.MAIL_API 
      },
      body: JSON.stringify({
        "Recipients": [{
          "Email": body.email,
        }],
        "Content": {
          "From": "Wannabegithub<noreply@onepunchdev.com>",
          "Body": [{
            "ContentType": "HTML",
            "Content": `<p>This is you otp to login securely on wannagegithub : <b>OTP: ${otpgen}</b><p>`,
            "Charset": "utf-8"
          }],
          "Subject": "hello from onepunch dev"
        }
      }
      )
    });

   const result=await setSignedCookie(c,"credentials",JSON.stringify({credentials:body,otp:otpgen}),c.env.HASH_PASSWORD);
    // console.log(result);
    return c.json({
      "msg":"cookie set"
    },200)

  } catch (err) {
    return c.json({ "msg": "Internal Server Error" },404);
  }

});



// userRouter.get('/signin',async(c)=>{
//   const body=c.req.json();

//   // const credentials= bod


// });


