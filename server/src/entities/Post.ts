import { getModelForClass, prop as Property } from "@typegoose/typegoose";
import { ObjectId } from "mongodb";
import { Ref } from "../types";
import { Field, ObjectType } from "type-graphql";
import { User } from "./User";

@ObjectType()
export class Post {
  @Field()
  readonly _id: ObjectId;

  @Field()
  @Property({ required: true })
  title: string;

  @Field()
  @Property({ required: true })
  text: string;

  @Field()
  @Property({ default: 0, required: true })
  points: number;

  // @Field(() => Int, { nullable: true })
  // voteStatus: number | null;

  @Field()
  @Property({ required: true })
  creatorId: string;

  @Field(() => User)
  @Property({ ref: User, required: true })
  creator: Ref<User>;

  @Field()
  @Property({ default: new Date(), required: true })
  createdAt: Date;

  @Field()
  @Property({ default: new Date(), required: true })
  updatedAt: Date;
}

export const PostModel = getModelForClass(Post);
