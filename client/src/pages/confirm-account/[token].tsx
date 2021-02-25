import { Box, Button, Link } from "@chakra-ui/react";
import { NextPage } from "next";
import React, { useState } from "react";
import { Wrapper } from "../../components/Wrapper";
import { useRouter } from "next/router";
import { useConfirmAccountMutation } from "../../generated/graphql";
import NextLink from "next/link";
// import NextLink from "next/link";

const ChangePassword: NextPage<{ token: string }> = () => {
  const [confirmUser, {}] = useConfirmAccountMutation();
  const router = useRouter();
  console.log(router.query);
  const [tokenError, setTokenError] = useState("");

  const handleConfirmation = async () => {
    const response = await confirmUser({
      variables: {
        token: typeof router.query.token === "string" ? router.query.token : "",
      },
    });
    if (response.data?.confirmUser.errors) {
      setTokenError(response.data.confirmUser.errors[0].message);
    } else if (response.data?.confirmUser.user) {
      router.push("/");
    }
  };
  return (
    <Wrapper variant="small">
      {tokenError ? (
        <div>
          <Box mb={8} fontSize={30} color="red">
            Oops!, {tokenError}
          </Box>
          <NextLink href="/account-confirmation">
            <Link>click here to get a new one</Link>
          </NextLink>
        </div>
      ) : null}
      <Button onClick={handleConfirmation}>Confirm Your Account</Button>
    </Wrapper>
  );
};

export default ChangePassword;
