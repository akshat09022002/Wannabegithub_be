import { Hono, MiddlewareHandler } from "hono";
import bcrypt from 'bcrypt';
import { HTTPException } from 'hono/http-exception'
import passport, { PassportStatic } from 'passport';
import { Strategy } from "passport-local";
// import GoogleStrategy from "passport-google-oauth2";
var GoogleStrategy = require( 'passport-google-oauth2' ).Strategy;
import { setCookie } from "hono/cookie";
import { CookieStore, sessionMiddleware } from "hono-sessions";



export const userRouter = new Hono<{
    Bindings:{
      
    },
    Variables:{

    }
}>();


userRouter.use(async (_,next)=>{
  passport.initialize();
})

type userDetails={
  email: string | "",
  password: string | ""
}


userRouter.get("/signin", async (c) => {
  
	const {email, password} = c.json;
    console.log("email: ", email);
    console.log("password: ", password);

    try {

    } catch(error) {

    }
})


userRouter.post('/signup', async (c) => {
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



userRouter.get(
    "/auth/google",
    passport.authenticate("google", {         
      scope: ["email", "profile"],            
    })
);

userRouter.get("/auth/google/homepage",
    passport.authenticate("google", {
      successRedirect: "/homepage",
      failureRedirect: "/signup",
    })
);

passport.use(
    "google",
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,               
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/homepage",
        userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
      },
      async ( accessToken:string, refreshToken:string, profile, cb) {            
        try {
          // console.log(profile);
          // const result = await db.query("SELECT * FROM users WHERE email = $1", [
          //   profile.email,
          // ]);
          // if (result.rows.length === 0) {
          //   const newUser = await db.query(
          //     "INSERT INTO users (email, password) VALUES ($1, $2)",
          //     [profile.email, "google"]             
          //   );

          //   return cb(null, newUser.rows[0]);       
          //   // console.log(newUser)

          // } else {
            // return cb(null, result.rows[0]);
        //   }
        } catch (err) {
          return cb(err);
        }
      }
    )
  );
  passport.serializeUser((user, cb) => {
    cb(null, user);
  });
  
  passport.deserializeUser((user, cb) => {
    cb(null, user);
  });





  ///// sessions & cookies    /// 

  const store = new CookieStore()

  app.use('*', sessionMiddleware({
    store,
    encryptionKey: 'password_at_least_32_characters_long', // Required for CookieStore, recommended for others
    expireAfterSeconds: 900, // Expire session after 15 minutes of inactivity
    cookieOptions: {
      sameSite: 'Lax', // Recommended for basic CSRF protection in modern browsers
      path: '/', // Required for this library to work properly
      httpOnly: true, // Recommended to avoid XSS attacks
    },
  }))

  // final handler
  app.get("/" , (c) => {
    return c.text("hello hono");
  })
  .get('/login', (c) => {
    const session = c.get('session')
    session.set('userId', 123)

    return c.redirect('/')
  })
  .get('/logout', (c) => {
    // setCookie(c,
    //   name:'cokkie_name',
    //   value:'cookie_value',
    //   opt:{httpOnly: true}
    // )
    c.get('session').deleteSession()
    return c.redirect('/')
  })

// // // // // cookies & session ki need kyun hai

// const userId = session.get('userId')