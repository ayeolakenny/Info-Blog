import { Box, Button } from "@chakra-ui/react";
import { Formik, Form } from "formik";
import React, { useState } from "react";
import { InputField } from "../components/InputField";
import { Wrapper } from "../components/Wrapper";
import { useAccountConfirmationMutation } from "../generated/graphql";

const AccountConfirmation: React.FC<{}> = ({}) => {
  const [complete, setComplete] = useState<Boolean>(false);
  const [forgotPassword, {}] = useAccountConfirmationMutation();
  return (
    <Wrapper variant="small">
      <Formik
        initialValues={{ email: "" }}
        onSubmit={async (values) => {
          await forgotPassword({
            variables: values,
          });
          setComplete(true);
        }}
      >
        {({ isSubmitting }) =>
          complete ? (
            <Box>
              if an account with that email exists, we sent you an email
            </Box>
          ) : (
            <Form>
              <InputField
                name="email"
                placeholder="email"
                label="Email"
                type="email"
              />
              <Button
                mt={4}
                isLoading={isSubmitting}
                type="submit"
                colorScheme="teal"
              >
                request token
              </Button>
            </Form>
          )
        }
      </Formik>
    </Wrapper>
  );
};

export default AccountConfirmation;
