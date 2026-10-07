// Auth.js sign-in routes for the staging gate. The proxy 404s these in production.
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
