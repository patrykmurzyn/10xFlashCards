import { z } from "zod";

export const uuidSchema = z.string().regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    { message: "Invalid UUID format." },
);

export type UUID = z.infer<typeof uuidSchema>;
