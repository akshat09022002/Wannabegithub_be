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


// userRouter.use(async (_,next)=>{
//   passport.initialize();
// })

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


userRouter.post('/signin', async (c) => {
    // use of :any
    const { firstname, lastname, email, password, confirmPassword }:any = c.json;

    try {
        // Check if already exists

        

        // Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const confirmHashPassword = await bcrypt.hash(confirmPassword, saltRounds);

        if(hashedPassword != confirmHashPassword) {
            // error handling
            throw new HTTPException(400, { message: 'Password doesnt match' })
        }

        // Add user and password along with first and last name
        

    } catch(error) {
        console.error("Error during signup", error);
    }
})



// userRouter.get(
//     "/auth/google",
//     passport.authenticate("google", {         
//       scope: ["email", "profile"],            
//     })
// );

// userRouter.get("/auth/google/homepage",
//     passport.authenticate("google", {
//       successRedirect: "/homepage",
//       failureRedirect: "/signup",
//     })
// );

// passport.use(
//     "google",
//     new GoogleStrategy(
//       {
//         clientID: process.env.GOOGLE_CLIENT_ID,               
//         clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//         callbackURL: "http://localhost:3000/auth/google/homepage",
//         userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
//       },
//       async ( accessToken:string, refreshToken:string, profile, cb) {            
//         try {
//           // console.log(profile);
//           // const result = await db.query("SELECT * FROM users WHERE email = $1", [
//           //   profile.email,
//           // ]);
//           // if (result.rows.length === 0) {
//           //   const newUser = await db.query(
//           //     "INSERT INTO users (email, password) VALUES ($1, $2)",
//           //     [profile.email, "google"]             
//           //   );

//           //   return cb(null, newUser.rows[0]);       
//           //   // console.log(newUser)

//           // } else {
//             // return cb(null, result.rows[0]);
//         //   }
//         } catch (err) {
//           return cb(err);
//         }
//       }
//     )
//   );
//   passport.serializeUser((user, cb) => {
//     cb(null, user);
//   });
  
//   passport.deserializeUser((user, cb) => {
//     cb(null, user);
//   });





//   ///// sessions & cookies    /// 

//   const store = new CookieStore()

//   app.use('*', sessionMiddleware({
//     store,
//     encryptionKey: 'password_at_least_32_characters_long', // Required for CookieStore, recommended for others
//     expireAfterSeconds: 900, // Expire session after 15 minutes of inactivity
//     cookieOptions: {
//       sameSite: 'Lax', // Recommended for basic CSRF protection in modern browsers
//       path: '/', // Required for this library to work properly
//       httpOnly: true, // Recommended to avoid XSS attacks
//     },
//   }))

//   // final handler
//   app.get("/" , (c) => {
//     return c.text("hello hono");
//   })
//   .get('/login', (c) => {
//     const session = c.get('session')
//     session.set('userId', 123)

//     return c.redirect('/')
//   })
//   .get('/logout', (c) => {
//     // setCookie(c,
//     //   name:'cokkie_name',
//     //   value:'cookie_value',
//     //   opt:{httpOnly: true}
//     // )
//     c.get('session').deleteSession()
//     return c.redirect('/')
//   })

// // // // // // cookies & session ki need kyun hai

// // const userId = session.get('userId')