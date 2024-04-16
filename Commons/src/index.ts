import zod from 'zod';


export const UserSignupSchema = zod.object({
    email: zod.string().email({message: "Invalid Email"}),
    password: zod.string().min(6).regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
    .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" }),
    firstName: zod.string().min(1,{message:"First name cannot be empty"}),
    lastName: zod.string().optional()
});

export const UserLoginSchema = zod.object({
    email: zod.string().email({"message":"Invalid Email"}),
    password: zod.string()
});

export type UserSignupType= zod.infer<typeof UserSignupSchema>;
export type UserLoginType= zod.infer<typeof UserLoginSchema>;

