import { config } from "dotenv";

config();

export const NODE_URL = process.env.NODE_URL as string;
export const ALIENS = process.env.ALIENS as string;
export const ALIENS_PRIVATE_KEY = process.env.ALIENS_PRIVATE_KEY as string;
export const CREATOR_PRIVATE_KEY = process.env.CREATOR_PRIVATE_KEY as string;
export const REFERRAL_FEE = Number(process.env.REFERRAL_FEE);
export const MINT_PRICE = Number(process.env.MINT_PRICE);