import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL || "postgresql://placeholder:placeholder@ep-placeholder.us-east-2.aws.neon.tech/neondb?sslmode=require");
export const db = drizzle(sql, { schema });
