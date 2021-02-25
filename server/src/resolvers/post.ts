import { Post, PostModel } from "../entities/Post";
import {
  Arg,
  Ctx,
  FieldResolver,
  Int,
  Mutation,
  Query,
  Resolver,
  Root,
  UseMiddleware,
} from "type-graphql";
import { isAuth } from "../middleware/isAuth";
import { PaginatedPosts, PostInput } from "./types/post-types";
import { MyContext } from "../types";
import { User, UserModel } from "../entities/User";
import { ObjectIdScalar } from "../object-id.scalar";
import { ObjectId } from "mongodb";
import { UpdootModel } from "../entities/Updoot";

@Resolver(Post)
export class PostResolver {
  //get all votes
  // @Query(() => [Updoot])
  // async updoot(): Promise<[Updoot] | undefined | null> {
  //   return UpdootModel.find({});
  // }

  //vote posts
  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async vote(
    @Arg("postId", () => ObjectIdScalar) postId: ObjectId,
    @Arg("value", () => Int) value: number,
    @Ctx() { req }: MyContext
  ) {
    const isUpdoot = value !== -1;
    const { userId } = req.session;
    const realValue = isUpdoot ? 1 : -1;

    const isVoted = await UpdootModel.findOne({ postId, userId });

    if (isVoted && isVoted.value !== realValue) {
      //user has voted on this post before or are changing their vote
      const updoot = await UpdootModel.findOne({ postId, userId });
      updoot.value = realValue;
      await updoot.save();

      const post = await PostModel.findById(postId);
      // const newPoint = 2 * realValue;
      // post.points = post.points + newPoint;
      post.points = realValue;
      post.updatedAt = new Date();
      await post.save();
    } else if (!isVoted) {
      //has not voted before
      const updoot = new UpdootModel({
        userId,
        postId,
        value: realValue,
        post: postId,
        creator: userId,
      });
      await updoot.save();
      const post = await PostModel.findById(postId);
      post.points = post.points + realValue;
      post.updatedAt = new Date();
      await post.save();
      return true;
    }
    return false;
  }

  //create a post
  @Mutation(() => Post)
  @UseMiddleware(isAuth)
  async createPost(
    @Arg("input") input: PostInput,
    @Ctx() { req }: MyContext
  ): Promise<Post> {
    const post = new PostModel({
      title: input.title,
      text: input.text,
      creatorId: req.session.userId,
      creator: req.session.userId,
    } as Post);

    await post.save();
    return post;
  }

  //view all posts
  @Query(() => PaginatedPosts)
  async posts(
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null
  ): Promise<PaginatedPosts> {
    const realLimit = Math.min(50, limit);
    const realLimitPlusOne = realLimit + 1;
    if (cursor) {
      const posts = await PostModel.find({
        createdAt: { $lt: new Date(cursor) },
      })
        .sort({ createdAt: "DESC" })
        .limit(realLimitPlusOne);

      return {
        posts: posts.slice(0, realLimit),
        hasMore: posts.length === realLimitPlusOne,
      };
    }

    const posts = await PostModel.find({})
      .sort({ createdAt: "DESC" })
      .limit(realLimitPlusOne);

    return {
      posts: posts.slice(0, realLimit),
      hasMore: posts.length === realLimitPlusOne,
    };
  }

  //view a post
  @Query(() => Post)
  async post(
    @Arg("id", () => ObjectIdScalar) id: ObjectId
  ): Promise<Post | undefined | null> {
    return PostModel.findOne(id);
  }

  //update post
  @Mutation(() => Post, { nullable: true })
  async updatePost(
    @Arg("id", () => ObjectIdScalar) id: ObjectId,
    @Arg("title", () => String) title: string
  ): Promise<Post | undefined | null> {
    const post = await PostModel.findOne(id);
    if (!post) return null;
    if (typeof title !== undefined) {
      post.title = title;
      post.updatedAt = new Date();
      await post.save();
    }
    return post;
  }

  @Mutation(() => Boolean)
  async deletePost(
    @Arg("id", () => ObjectIdScalar) id: ObjectId
  ): Promise<boolean> {
    await PostModel.deleteOne({ _id: id });
    return true;
  }

  @FieldResolver()
  async creator(@Root() post: Post): Promise<User> {
    return await UserModel.findById(post.creator);
  }

  @FieldResolver(() => String)
  textSnippet(@Root() post: Post) {
    return post.text.slice(0, 50);
  }
}
