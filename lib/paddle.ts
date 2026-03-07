import { Paddle, Environment } from '@paddle/paddle-node-sdk';

const isSandbox = process.env.PADDLE_API_KEY?.includes('sdbx');

export const paddle = new Paddle(process.env.PADDLE_API_KEY!, {
  environment: isSandbox ? Environment.sandbox : Environment.production
});
