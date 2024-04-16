import { Hono } from 'hono'
import { userRouter } from './routes/user'
import { cors } from 'hono/cors'


const app = new Hono()

app.use('*',cors({
    origin: "http://localhost:5173",
    credentials:true
}));

app.route("/api/v1/user",userRouter);


export default app