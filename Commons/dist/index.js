"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserLoginSchema = exports.UserSignupSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.UserSignupSchema = zod_1.default.object({
    email: zod_1.default.string().email({ message: "Invalid Email" }),
    password: zod_1.default.string().min(6).regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
        .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
        .regex(/[0-9]/, { message: "Password must contain at least one number" }),
    firstName: zod_1.default.string().min(1, { message: "First name cannot be empty" }),
    lastName: zod_1.default.string().optional()
});
exports.UserLoginSchema = zod_1.default.object({
    email: zod_1.default.string().email({ "message": "Invalid Email" }),
    password: zod_1.default.string()
});
