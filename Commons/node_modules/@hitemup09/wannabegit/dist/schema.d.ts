import zod from 'zod';
export declare const UserSignupSchema: zod.ZodObject<{
    email: zod.ZodString;
    password: zod.ZodString;
    firstName: zod.ZodString;
    lastName: zod.ZodOptional<zod.ZodString>;
}, "strip", zod.ZodTypeAny, {
    email: string;
    password: string;
    firstName: string;
    lastName?: string | undefined;
}, {
    email: string;
    password: string;
    firstName: string;
    lastName?: string | undefined;
}>;
export declare const UserLoginSchema: zod.ZodObject<{
    email: zod.ZodString;
    password: zod.ZodString;
}, "strip", zod.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export type UserSignupType = zod.infer<typeof UserSignupSchema>;
export type UserLoginType = zod.infer<typeof UserLoginSchema>;
