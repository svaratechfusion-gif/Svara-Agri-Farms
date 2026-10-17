/**
 * `npm run commerce:status` — prints this environment's commerce set-up
 * (reads .env.local like the database tools). Connects to nothing.
 */
import { logCommerceStatus } from "../commerceStatus";
import { loadLocalEnvFiles } from "./toolingEnv";

loadLocalEnvFiles();
logCommerceStatus(console.log);
