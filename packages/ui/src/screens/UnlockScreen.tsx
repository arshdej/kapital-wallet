import {
  Box,
  Button,
  Container,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  Text,
  useColorModeValue,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { Account } from "@kapital/utils/src/Account";
import { AppDispatch } from "@kapital/utils/src/store";
import { unlockAccount } from "@kapital/utils/src/store/slices/accountSlice";
import { RootState } from "@kapital/utils/src/types";
import React, { FormEvent, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

const UnlockScreen: React.FC = () => {
  const [password, setPassword] = useState<string>("");
  const [isUnlocking, setIsUnlocking] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();
  const account = useSelector(
    (state: RootState) => state.account.account
  ) as Account | null;

  const bgGradient = useColorModeValue(
    "linear(to-br, purple.600, blue.500)",
    "linear(to-br, purple.900, blue.800)"
  );

  const handleUnlock = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUnlocking(true);
    setError("");

    try {
      if (!account) {
        throw new Error("No account found");
      }
      const unlocked = await account.unlock(password);
      if (unlocked) {
        dispatch(unlockAccount());
        toast({
          title: "Account Unlocked",
          description: "Your account has been successfully unlocked.",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      } else {
        throw new Error("Invalid password");
      }
    } catch (_error) {
      setError("Invalid password. Please try again.");
      toast({
        title: "Error",
        description:
          "Failed to unlock the account. Please check your password and try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
    <Box minH="100vh" bgGradient={bgGradient}>
      <Container maxW="container.sm" py={16}>
        <VStack
          spacing={8}
          bg={useColorModeValue("white", "gray.800")}
          p={8}
          borderRadius="md"
          boxShadow="xl"
        >
          <Heading
            as="h2"
            size="xl"
            textAlign="center"
            color={useColorModeValue("purple.600", "purple.300")}
          >
            Unlock Your Wallet
          </Heading>
          <Text
            textAlign="center"
            color={useColorModeValue("gray.600", "gray.400")}
          >
            Enter your password to access your wallet
          </Text>
          <form onSubmit={handleUnlock} style={{ width: "100%" }}>
            <VStack spacing={4} width="100%">
              <FormControl isInvalid={!!error}>
                <FormLabel htmlFor="password">Password</FormLabel>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                />
                <FormErrorMessage>{error}</FormErrorMessage>
              </FormControl>
              <Button
                type="submit"
                colorScheme="purple"
                size="lg"
                width="100%"
                isLoading={isUnlocking}
              >
                Unlock Wallet
              </Button>
            </VStack>
          </form>
        </VStack>
      </Container>
    </Box>
  );
};

export default UnlockScreen;
