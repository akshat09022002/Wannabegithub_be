import { Hono } from 'hono'
import { userRouter } from './routes/user'
import { cors } from 'hono/cors'


const app = new Hono()

app.route("api/v1/user",userRouter);
app.use('/api/*', cors());

export default app