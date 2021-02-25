import { getModelForClass, prop as Property } from "@typegoose/typegoose";
import { ObjectId } from "mongodb";
import { Ref } from "../types";
import { Field, ObjectType } from "type-graphql";
import { User } from "./User";
import { Post } from "./Post";

@ObjectType()
export class Updoot {
  @Field()
  readonly _id: ObjectId;

  @Field()
  @Property()
  value: number;

  @Field()
  @Property({ required: true })
  userId: string;

  @Field(() => User)
  @Property({ ref: User, required: true })
  creator: Ref<User>;

  @Field()
  @Property({ required: true })
  postId: string;

  @Field(() => Post)
  @Property({ ref: Post, required: true })
  post: Ref<Post>;
}

export const UpdootModel = getModelForClass(Updoot);
