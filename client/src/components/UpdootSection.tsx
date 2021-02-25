import { ChevronUpIcon, ChevronDownIcon } from "@chakra-ui/icons";
import { Flex, IconButton } from "@chakra-ui/react";
import React, { useState } from "react";
import {
  PostSnippetFragment,
  useVoteMutation,
  // PostVotesDocument,
  PostsDocument,
} from "../generated/graphql";

interface UpdootSectionProps {
  post: PostSnippetFragment;
}

export const UpdootSection: React.FC<UpdootSectionProps> = ({ post }) => {
  const [loadingState, setLoadingState] = useState<
    "updoot-loading" | "downdoot-loading" | "not-loading"
  >("not-loading");
  const [vote, {}] = useVoteMutation({
    // TODO having trouble updating after a vote
    //Trial 1
    // refetchQueries: [
    //   {
    //     query: PostsDocument,
    //   },
    // ],
    //Trial 2
    // update: (store, { data }) => {
    //   const voteData = store.readQuery<PostVotesQuery>({
    //     query: PostVotesDocument
    //   })
    //   store.writeQuery<PostVotesQuery>({
    //     query: PostVotesDocument,
    //     data: {
    //       // votes: [...voteData?.posts, data?.vote]
    //       posts: [...voteData!.posts.posts, data?.vote]
    //     }
    //   })
    // }
  });
  return (
    <Flex direction="column" justifyContent="center" alignItems="center" mr={4}>
      <IconButton
        onClick={async () => {
          setLoadingState("updoot-loading");
          await vote({
            variables: {
              postId: post._id,
              value: 1,
            },
          });
          setLoadingState("not-loading");
        }}
        isLoading={loadingState === "updoot-loading"}
        aria-label="Upvote"
        icon={<ChevronUpIcon />}
      />
      {post.points}
      <IconButton
        onClick={async () => {
          setLoadingState("downdoot-loading");
          await vote({
            variables: {
              postId: post._id,
              value: -1,
            },
          });
          setLoadingState("not-loading");
        }}
        isLoading={loadingState === "downdoot-loading"}
        aria-label="DownVote"
        icon={<ChevronDownIcon />}
      />
    </Flex>
  );
};
