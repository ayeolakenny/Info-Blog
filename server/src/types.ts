import { ObjectId } from "mongodb";
import { Request, Response } from "express";
import { Redis } from "ioredis";

export type Ref<T> = T | ObjectId;

export type MyContext = {
  req: Request & {
    session: {
      userId?: any;
    };
  };
  res: Response & {
    session: {
      userId?: any;
    };
  };
  redis: Redis;
};
