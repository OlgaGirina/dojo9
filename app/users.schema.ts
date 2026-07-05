// schemas/user.schema.ts

import { z } from "zod";

export const UserSchema = z.object({
  id: z.number(),
  email: z.string(),
  password: z.string(),
  name: z.string(),
  role: z.enum(["customer", "admin"]),
  avatar: z.string(),
});

export const UsersSchema = z.array(UserSchema);

export type User = z.infer<typeof UserSchema>;
