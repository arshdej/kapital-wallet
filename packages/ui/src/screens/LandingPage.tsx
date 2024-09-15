import {
  Box,
  Button,
  Container,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  HStack,
  Input,
  Link,
  SimpleGrid,
  Text,
  useColorModeValue,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { Account } from "@kapital/utils/src/Account";
import { AppDispatch } from "@kapital/utils/src/store";
import { setAccount } from "@kapital/utils/src/store/slices/accountSlice";
import { WalletClient } from "@kapital/utils/src/WalletClient";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

// Custom SVG icons
const GlobeIcon: React.FC<{ boxSize: number }> = ({ boxSize }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={boxSize}
    height={boxSize}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="2" y1="12" x2="22" y2="12"></line>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
  </svg>
);

const ShieldIcon: React.FC<{ boxSize: number }> = ({ boxSize }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={boxSize}
    height={boxSize}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
  </svg>
);

const ZapIcon: React.FC<{ boxSize: number }> = ({ boxSize }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={boxSize}
    height={boxSize}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
  </svg>
);

interface FeatureProps {
  icon: React.FC<{ boxSize: number }>;
  title: string;
  description: string;
}

const Feature: React.FC<FeatureProps> = ({
  icon: Icon,
  title,
  description,
}) => (
  <VStack
    align="center"
    p={6}
    bg={useColorModeValue("white", "gray.800")}
    rounded="lg"
    shadow="md"
    transition="all 0.3s"
    _hover={{ transform: "translateY(-5px)", shadow: "lg" }}
  >
    <Box color="purple.500">
      <Icon boxSize={12} />
    </Box>
    <Heading as="h3" size="md" mt={4} textAlign="center">
      {title}
    </Heading>
    <Text
      fontSize="sm"
      textAlign="center"
      color={useColorModeValue("gray.600", "gray.400")}
    >
      {description}
    </Text>
  </VStack>
);

const LandingPage: React.FC = () => {
  const [walletExists, setWalletExists] = useState<boolean>(false);
  const [walletIsLoading, setWalletIsLoading] = useState<boolean>(false);
  const [isLoadingWallet, setIsLoadingWallet] = useState<boolean>(false);
  const [isCreatingWallet, setIsCreatingWallet] = useState<boolean>(false);
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const [isWalletLoaded, setIsWalletLoaded] = useState<boolean>(false);
  const dispatch = useDispatch<AppDispatch>();

  const toast = useToast();

  useEffect(() => {
    const checkWalletExists = async () => {
      const walletData = localStorage.getItem("encryptedDid");
      if (walletData) {
        setWalletExists(true);
      }
    };
    checkWalletExists();
  }, []);

  const bgGradient = useColorModeValue(
    "linear(to-br, purple.600, blue.500)",
    "linear(to-br, purple.900, blue.800)"
  );

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setPasswordError("");
  };

  const handleConfirmPasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setConfirmPassword(e.target.value);
    setPasswordError("");
  };

  const handleCreateWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters long");
      return;
    }

    setIsCreatingWallet(true);
    setWalletIsLoading(true);
    try {
      const account = await Account.create(password);

      // Initialize WalletClient
      const client = new WalletClient(account);
      await client.initialize();

      // Save account DID
      localStorage.setItem("accountDid", account.getDid());

      toast({
        title: "Wallet Created",
        description: `Your wallet has been created successfully. Your DID is: ${account.getDid()}`,
        status: "success",
        duration: 9000,
        isClosable: true,
      });

      setIsWalletLoaded(true);
      dispatch(setAccount(account));
    } catch (error) {
      toast({
        title: "Error",
        description:
          "There was an error creating your wallet. Please try again.",
        status: "error",
        duration: 9000,
        isClosable: true,
      });
    } finally {
      setIsCreatingWallet(false);
      setWalletIsLoading(false);
    }
  };

  const handleImportWallet = async (exportedData: string, password: string) => {
    try {
      const account = await Account.import(exportedData, password);
      if (account) {
        // Unlock the account
        await account.unlock(password);

        // Initialize WalletClient
        const client = new WalletClient(account);
        await client.initialize();

        toast({
          title: "Wallet Imported",
          description: `Your wallet has been imported successfully. Your DID is: ${account.getDid()}`,
          status: "success",
          duration: 9000,
          isClosable: true,
        });

        setIsWalletLoaded(true);
        dispatch(setAccount(account));
      } else {
        throw new Error("Failed to import wallet");
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          "There was an error importing your wallet. Please check your exported data and password.",
        status: "error",
        duration: 9000,
        isClosable: true,
      });
    }
  };

  const handleExportWallet = async (account: Account, password: string) => {
    try {
      const exportedData = await account.export(password);
      if (exportedData) {
        // In a real application, you'd want to provide a secure way to save this data,
        // such as downloading an encrypted file or using a secure backup service.
        console.log("Exported wallet data:", exportedData);
        toast({
          title: "Wallet Exported",
          description:
            "Your wallet has been exported successfully. Please store the exported data securely.",
          status: "success",
          duration: 9000,
          isClosable: true,
        });
      } else {
        throw new Error("Failed to export wallet");
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          "There was an error exporting your wallet. Please check your password and try again.",
        status: "error",
        duration: 9000,
        isClosable: true,
      });
    }
  };

  const loadWallet = async (password: string) => {
    setWalletIsLoading(true);
    let errMsg = "";
    try {
      if (!password) {
        errMsg = "Input your password";
        throw new Error(errMsg);
      }
      const accountDid = localStorage.getItem("encryptedDid");
      if (!accountDid) {
        errMsg = "No wallet data found";
        throw new Error(errMsg);
      }

      const account = await Account.loadWallet(password);
      dispatch(setAccount(account));
      setIsWalletLoaded(true);
    } catch (error) {
      toast({
        title: "Error",
        description:
          errMsg ||
          "Failed to load the wallet. Please check your password and try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setWalletIsLoading(false);
    }
  };

  const handleLoadWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    await loadWallet(password);
  };

  if (isWalletLoaded) {
    return (
      <Box minH="100vh" bgGradient={bgGradient}>
        <Container maxW="container.xl" py={16}>
          <VStack spacing={8} align="stretch">
            <Heading as="h1" size="2xl" color="white" textAlign="center">
              Welcome to Kapital
            </Heading>
            <Text fontSize="xl" color="white" textAlign="center">
              Your wallet is loaded and ready to use.
            </Text>
            {/* Add your main app components here */}
          </VStack>
        </Container>
      </Box>
    );
  }

  if (
    isCreatingWallet ||
    (walletExists && isLoadingWallet && !isWalletLoaded)
  ) {
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
              {walletExists ? "Load Your Wallet" : "Create Your Wallet"}
            </Heading>
            <form
              onSubmit={walletExists ? handleLoadWallet : handleCreateWallet}
              style={{ width: "100%" }}
            >
              <VStack spacing={4} width="100%">
                <FormControl isInvalid={!!passwordError}>
                  <FormLabel htmlFor="password">Password</FormLabel>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={handlePasswordChange}
                    placeholder="Enter your password"
                  />
                </FormControl>
                {!walletExists && (
                  <FormControl isInvalid={!!passwordError}>
                    <FormLabel htmlFor="confirmPassword">
                      Confirm Password
                    </FormLabel>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={handleConfirmPasswordChange}
                      placeholder="Confirm your password"
                    />
                    <FormErrorMessage>{passwordError}</FormErrorMessage>
                  </FormControl>
                )}
                <Button
                  type="submit"
                  colorScheme="purple"
                  size="lg"
                  width="100%"
                  isLoading={walletIsLoading}
                >
                  {walletExists ? "Load Wallet" : "Create Wallet"}
                </Button>
              </VStack>
            </form>
          </VStack>
        </Container>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bgGradient={bgGradient}>
      <Box maxW="container.xl" px="1rem" margin="0 auto">
        <Flex
          as="header"
          py={6}
          justifyContent="space-between"
          alignItems="center"
        >
          <Heading as="h1" size="xl" color="white">
            Kapital
          </Heading>
          <HStack spacing={4}>
            <Link
              href="#features"
              color="white"
              _hover={{ color: "purple.200" }}
            >
              Features
            </Link>
            <Link href="#about" color="white" _hover={{ color: "purple.200" }}>
              About
            </Link>
          </HStack>
        </Flex>

        <VStack as="main" spacing={16} py={16}>
          <VStack spacing={4} textAlign="center">
            <Heading as="h2" size="3xl" color="white">
              Welcome to Kapital
            </Heading>
            <Text fontSize="xl" color="purple.100">
              Seamless Cross-Border Wallet Transactions
            </Text>
            <HStack spacing={4} mt={8}>
              <Button
                size="lg"
                colorScheme="whiteAlpha"
                onClick={() => {
                  setIsCreatingWallet(true);
                }}
              >
                Create New Wallet
              </Button>
              {walletExists && (
                <Button
                  size="lg"
                  variant="outline"
                  colorScheme="whiteAlpha"
                  onClick={() => setIsLoadingWallet(true)}
                >
                  Load Existing Wallet
                </Button>
              )}
            </HStack>
          </VStack>

          <SimpleGrid
            id="features"
            columns={{ base: 1, md: 3 }}
            spacing={8}
            w="full"
          >
            <Feature
              icon={GlobeIcon}
              title="Cross-Border Transactions"
              description="Convert and transfer funds between multiple currencies with ease."
            />
            <Feature
              icon={ShieldIcon}
              title="Secure Identity Verification"
              description="Manage your decentralized identity (DID) and verifiable credentials securely."
            />
            <Feature
              icon={ZapIcon}
              title="Tokenized Assets"
              description="Support for collateralized assets as digital tokens for flexible financial operations."
            />
          </SimpleGrid>

          <Box
            id="about"
            bg={useColorModeValue("white", "gray.800")}
            rounded="lg"
            shadow="xl"
            p={8}
            w="full"
          >
            <Heading
              as="h2"
              size="xl"
              color={useColorModeValue("purple.600", "purple.300")}
              mb={4}
            >
              About Kapital
            </Heading>
            <Text color={useColorModeValue("gray.700", "gray.300")} mb={4}>
              Kapital is a decentralized wallet application that leverages the
              tbDEX protocol to facilitate fast and compliant cross-border
              transactions. Our vision is to empower users to transfer funds
              across borders without the limitations of traditional financial
              intermediaries.
            </Text>
            <Text color={useColorModeValue("gray.700", "gray.300")} mb={4}>
              With Kapital, you can enjoy:
            </Text>
            <VStack align="start" spacing={2} pl={4} mb={4}>
              <Text color={useColorModeValue("gray.700", "gray.300")}>
                • Faster settlements and reduced transaction costs
              </Text>
              <Text color={useColorModeValue("gray.700", "gray.300")}>
                • Seamless currency exchanges across neighboring countries
              </Text>
              <Text color={useColorModeValue("gray.700", "gray.300")}>
                • Enhanced financial inclusion and innovative financial
                solutions
              </Text>
            </VStack>
            <Link
              href="#"
              color="purple.500"
              fontWeight="semibold"
              display="inline-flex"
              alignItems="center"
            >
              Learn more about our vision
            </Link>
          </Box>
        </VStack>
      </Box>

      <Box
        as="footer"
        bg={useColorModeValue("purple.800", "purple.900")}
        color="white"
        py={8}
      >
        <Container maxW="container.xl" textAlign="center">
          <Text>&copy; 2024 Kapital. All rights reserved.</Text>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;
