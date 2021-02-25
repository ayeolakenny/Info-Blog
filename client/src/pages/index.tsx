import {
  Box,
  Flex,
  Heading,
  Link,
  Stack,
  Text,
  Button,
} from "@chakra-ui/react";
import { usePostsQuery } from "../generated/graphql";
import NextLink from "next/link";
import { Layout } from "../components/Layout";
import { UpdootSection } from "../components/UpdootSection";

const Index = () => {
  const { data, loading } = usePostsQuery({
    variables: {
      limit: 15,
    },
  });

  if (!loading && !data) return <div>You got query failed for some reason</div>;

  return (
    <Layout>
      <Flex align="center">
        <Heading>InfoBlog</Heading>
        <NextLink href="/create-post">
          <Link ml="auto">create post</Link>
        </NextLink>
      </Flex>
      <br />
      {!data && loading ? (
        <div>loading...</div>
      ) : (
        <Stack spacing={8}>
          {data!.posts.posts.map((post) => (
            <Flex key={post._id} p={5} shadow="md" borderWidth="1px">
              <UpdootSection post={post} />
              <Box>
                <Heading fontSize="xl">{post.title}</Heading>
                <Text>Posted by {post.creator.username}</Text>
                <Text mt={4}>{post.textSnippet}</Text>
              </Box>
            </Flex>
          ))}
        </Stack>
      )}
      {data && data.posts.hasMore ? (
        <Flex>
          <Button isLoading={loading} m="auto" my={8}>
            load more
          </Button>
        </Flex>
      ) : null}
    </Layout>
  );
};

export default Index;
