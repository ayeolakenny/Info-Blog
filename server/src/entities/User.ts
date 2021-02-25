import { getModelForClass, prop as Property } from "@typegoose/typegoose";
import { ObjectId } from "mongodb";
import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class User {
  @Field()
  readonly _id: ObjectId;

  @Field()
  @Property({ required: true, unique: true })
  username: string;

  @Field()
  @Property({ required: true, unique: true })
  email: string;

  @Property({ required: true })
  password: string;

  @Field()
  @Property({ default: false, required: true })
  confirmed: boolean;

  @Field()
  @Property({ default: new Date(), required: true })
  createdAt: Date;

  @Field()
  @Property({ default: new Date(), required: true })
  updatedAt: Date;
}

export const UserModel = getModelForClass(User);
