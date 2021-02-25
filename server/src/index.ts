import "reflect-metadata";
import { connect } from "mongoose";
import { ObjectId } from "mongodb";
import * as path from "path";
import { buildSchema } from "type-graphql";
import { ApolloServer } from "apollo-server-express";
import express from "express";
import Redis from "ioredis";
import session from "express-session";
import connectRedis from "connect-redis";

import { TypegooseMiddleware } from "./typegoose-middleware";
import { ObjectIdScalar } from "./object-id.scalar";
import { HelloResolver } from "./resolvers/me";
import { UserResolver } from "./resolvers/user";
import { COOKIE_NAME, __prod__ } from "./constants";
import { PostResolver } from "./resolvers/post";
import cors from "cors";

// replace with your values if needed
const database = "infoblog";
const MONGO_DB_URL = `mongodb://localhost:27017/${database}`;

const main = async () => {
  try {
    const app = express();

    // create mongoose connection
    const mongoose = await connect(MONGO_DB_URL);
    mongoose.connection.on("open", () => console.log("DB CONNECTED!"));

    //session connection
    const RedisStore = connectRedis(session);
    const redis = new Redis();

    app.use(
      session({
        name: COOKIE_NAME,
        store: new RedisStore({
          client: redis,
          disableTouch: true,
        }),
        cookie: {
          maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
          httpOnly: true,
          sameSite: "lax", // csrf
          secure: __prod__, //cookie only works in https
        },
        saveUninitialized: false,
        secret: "qwertyuiopasdfghjkl",
        resave: false,
      })
    );

    app.use(
      cors({
        origin: "http://localhost:3000",
        credentials: true,
      })
    );

    const apolloServer = new ApolloServer({
      // build TypeGraphQL executable schema
      schema: await buildSchema({
        resolvers: [HelloResolver, UserResolver, PostResolver],
        emitSchemaFile: path.resolve(__dirname, "schema.gql"),
        // use document converting middleware
        globalMiddlewares: [TypegooseMiddleware],
        // use ObjectId scalar mapping
        scalarsMap: [{ type: ObjectId, scalar: ObjectIdScalar }],
        validate: false,
      }),
      context: ({ req, res }) => ({ req, res, redis }),
    });

    apolloServer.applyMiddleware({ app, cors: false });

    // Start the server
    app.listen(4000, () => console.log("Server started on localhost:4000"));
  } catch (err) {
    console.error(err);
  }
};

main().catch((err) => console.log(err));
