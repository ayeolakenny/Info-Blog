import { User, UserModel } from "../entities/User";
import { Arg, Ctx, Mutation, Query, Resolver } from "type-graphql";
import { UsernamePasswordInput, UserResponse } from "./types/user-types";
import { validateRegister } from "../utils/validateRegister";
import argon2 from "argon2";
import { v4 } from "uuid";
import { MyContext } from "../types";
import {
  CONFIRM_USER_PREFIX,
  COOKIE_NAME,
  FORGET_PASSWORD_PREFIX,
} from "../constants";
import { sendEmail } from "../utils/sendEmail";
import { redis } from "../redis";

@Resolver(() => User)
export class UserResolver {
  // @FieldResolver(() => String)
  // email(@Root() user: User, @Ctx() { req }: MyContext) {
  //   //current user you can show them their email
  //   if (req.session.userId === user._id) return user.email;

  //   //hide email if its not for the current user
  //   return "";
  // }

  //get current logged in user
  @Query(() => User, { nullable: true })
  async me(@Ctx() { req }: MyContext) {
    if (!req.session.userId) return null; //not logged in

    const user = await UserModel.findById(req.session.userId);

    return user;
  }

  //create a user
  @Mutation(() => UserResponse)
  async register(
    @Arg("options") options: UsernamePasswordInput,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    const errors: any = validateRegister(options);
    if (errors) return { errors };

    // validation to check if username or email has been taken
    const checkEmailTaken = await UserModel.findOne({ email: options.email });
    const checkUsernameTaken = await UserModel.findOne({
      username: options.username,
    });
    if (checkEmailTaken) {
      return {
        errors: [
          {
            field: "email",
            message: "Email has been taken by another user",
          },
        ],
      };
    } else if (checkUsernameTaken) {
      return {
        errors: [
          {
            field: "username",
            message: "Username already taken",
          },
        ],
      };
    }

    const hashedPassword = await argon2.hash(options.password);
    const user = new UserModel({
      username: options.username,
      email: options.email,
      password: hashedPassword,
    });

    try {
      const token = v4();

      await redis.set(
        CONFIRM_USER_PREFIX + token,
        user._id as any,
        "ex",
        60 * 60 * 24
      ); // 1 day
      await sendEmail(
        options.email,
        `<a href="http://localhost:3000/confirm-account/${token}">confirm account</a>`
      );
      await user.save();
    } catch (err) {
      //duplicate username error
      if (err.code === 11000) {
        return {
          errors: [
            {
              field: "username",
              message: "Username already taken",
            },
          ],
        };
      }
    }

    //set cookie on user and keep them logged in
    req.session.userId = user.id;

    return { errors, user };
  }

  //login a user
  @Mutation(() => UserResponse)
  async login(
    @Arg("usernameOrEmail") usernameOrEmail: string,
    @Arg("password") password: string,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    const user = await UserModel.findOne(
      usernameOrEmail.includes("@")
        ? { email: usernameOrEmail }
        : { username: usernameOrEmail }
    );
    if (!user) {
      return {
        errors: [
          {
            field: "usernameOrEmail",
            message: "that username dosen't exist",
          },
        ],
      };
    }
    if (user.confirmed === false) {
      return {
        errors: [
          {
            field: "usernameOrEmail",
            message: "Pls confirm your account",
          },
        ],
      };
    }
    const valid = await argon2.verify(user.password, password);
    if (!valid) {
      return {
        errors: [
          {
            field: "password",
            message: "incorrect password",
          },
        ],
      };
    }

    req.session.userId = user.id;

    return {
      user,
    };
  }

  //logout a user
  @Mutation(() => Boolean)
  logout(@Ctx() { req, res }: MyContext) {
    return new Promise((resolve) =>
      req.session.destroy((err) => {
        res.clearCookie(COOKIE_NAME);
        if (err) {
          console.log(err);
          resolve(false);
          return;
        }
        resolve(true);
      })
    );
  }

  //forgot password
  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg("email") email: string,
    @Ctx() { redis }: MyContext
  ) {
    const user = await UserModel.findOne({ email });
    if (!user) return true;

    const token = v4();

    await redis.set(
      FORGET_PASSWORD_PREFIX + token,
      user._id as any,
      "ex",
      1000 * 60 * 60 * 24 * 3
    ); // 3 days

    await sendEmail(
      email,
      `<a href="http://localhost:3000/change-password/${token}">reset password</a>`
    );

    return true;
  }

  //change password
  @Mutation(() => UserResponse)
  async changePassword(
    @Arg("token") token: string,
    @Arg("newPassword") newPassword: string,
    @Ctx() { redis, req }: MyContext
  ): Promise<UserResponse> {
    if (newPassword.length <= 2) {
      return {
        errors: [
          {
            field: "newPassword",
            message: "length must be greater than 2",
          },
        ],
      };
    }

    const key = FORGET_PASSWORD_PREFIX + token;
    const userId = await redis.get(key);

    if (!userId) {
      return {
        errors: [
          {
            field: "token",
            message: "token expired",
          },
        ],
      };
    }

    const user = await UserModel.findById(userId);

    if (!user) {
      return {
        errors: [
          {
            field: "token",
            message: "user no longer exists",
          },
        ],
      };
    }

    user.password = await argon2.hash(newPassword);
    user.updatedAt = new Date();
    await user.save();

    await redis.del(key);

    // log user in when password change is successful
    req.session.userId = user._id;

    return { user };
  }

  //request another token to confirm user
  @Mutation(() => Boolean)
  async accountConfirmation(
    @Arg("email") email: string,
    @Ctx() { redis }: MyContext
  ) {
    const user = await UserModel.findOne({ email });

    if (!user) return true;

    const token = v4();

    await redis.set(
      CONFIRM_USER_PREFIX + token,
      user._id as any,
      "ex",
      1000 * 60 * 60 * 24 * 3
    ); // 3 days

    await sendEmail(
      user.email,
      `<a href="http://localhost:3000/confirm-account/${token}">confirm-account</a>`
    );

    return true;
  }

  //confirm user
  @Mutation(() => UserResponse)
  async confirmUser(
    @Arg("token") token: string,
    @Ctx() { redis, req }: MyContext
  ): Promise<UserResponse> {
    const key = CONFIRM_USER_PREFIX + token;
    const userId = await redis.get(key);

    if (!userId) {
      return {
        errors: [
          {
            field: "token",
            message: "token expired",
          },
        ],
      };
    }

    const user = await UserModel.findById(userId);

    if (!user) {
      return {
        errors: [
          {
            field: "token",
            message: "user no longer exists",
          },
        ],
      };
    }

    user.confirmed = true;
    user.updatedAt = new Date();

    await user.save();
    await redis.del(key);

    // log user in when password change is successful
    req.session.userId = user._id;
    return { user };
  }
}
