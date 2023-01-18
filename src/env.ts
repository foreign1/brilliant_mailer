import { EnvType, load } from "ts-dotenv";

export type Env = EnvType<typeof schema>;

export const schema = {
  PORT: Number,
  EMAIL_ID: String,
  EMAIL_PASSWORD: String,
  SMTP_SERVICE: String,
};

export let env: Env;

export function loadEnv(): void {
  env = load(schema);
}