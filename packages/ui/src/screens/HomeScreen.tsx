import {
  Box,
  Button,
  Container,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  Heading,
  IconButton,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  useColorModeValue,
  useDisclosure,
  useToast,
  VStack,
} from "@chakra-ui/react";

import { useDispatch, useSelector } from "react-redux";
import {
  CloseIcon,
  CredentialIcon,
  LogoutIcon,
  MenuIcon,
  SettingsIcon,
  TransactionIcon,
} from "../components/Icons";

import { AppDispatch } from "@kapital/utils/src/store";
import { lockAccount } from "@kapital/utils/src/store/slices/accountSlice";
import { RootState } from "@kapital/utils/src/types";
import { Currency } from "@kapital/utils/src/types/currency";
import { fetchCredentialsFromDWN } from "@kapital/utils/src/web5/credentials";
import { Offering } from "@tbdex/http-client";
import React, { useEffect, useRef, useState } from "react";
import { LandingPageScreen } from "..";
import CustomSpinner from "../components/Spinner";
import { ConversionPath, useSupportedCurrencies } from "../hooks/useOfferings";
import usePartialState from "../hooks/usePartialState";
import OfferingsDisplay from "./OfferingsDisplay";
import SendMoneyComponent from "./SendMoneyComponent";
import UnlockScreen from "./UnlockScreen";
import CredentialDrawer from "./drawers/CredentialDrawer";
import CredentialModal, { Credential } from "./modals/CredentialModal";
import OfferingModal from "./modals/OfferingModal";

interface Transaction {
  id: number;
  date: string;
  amount: number;
  currency: string;
  type: string;
  details: string;
}

const HomeScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { baseCurrencies, pairCurrencies } = useSupportedCurrencies();

  const [sendPayload, setSendPayload] = usePartialState({
    isLoadingOfferings: false,
    showOfferings: false,
    conversionPaths: [] as ConversionPath[],
    baseCurrency: baseCurrencies.includes("NGN")
      ? "NGN"
      : (baseCurrencies[0] as Currency),
    pairCurrency: pairCurrencies.includes("GHS")
      ? "GHS"
      : (pairCurrencies[0] as Currency),
    baseAmount: 0,
    pairAmount: 0,
    currencyRoute: [] as string[],
  });

  const baseCurrency = sendPayload.baseCurrency;
  const pairCurrency = sendPayload.pairCurrency;

  const [page, setPage] = useState<number>(1);
  const { account, isLocked } = useSelector(
    (state: RootState) => state.account
  );
  const [selectedOffering, setSelectedOffering] = useState<Offering[] | null>(
    null
  );
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [requiredCredentials, setRequiredCredentials] = useState<Credential[]>(
    []
  );
  const [amount, setAmount] = useState<string>("");

  const [selectedCredentials, setSelectedCredentials] = useState<
    { id: string; jwt: string; payload?: any }[]
  >([]);

  const observer = useRef<IntersectionObserver | null>(null);
  const lastOfferingElementRef = useRef<HTMLTableRowElement | null>(null);

  const {
    isOpen: isOfferingModalOpen,
    onOpen: onOfferingModalOpen,
    onClose: onOfferingModalClose,
  } = useDisclosure();
  const {
    isOpen: isTransactionDrawerOpen,
    onOpen: onTransactionDrawerOpen,
    onClose: onTransactionDrawerClose,
  } = useDisclosure();
  const {
    isOpen: isCredentialModalOpen,
    onOpen: onCredentialModalOpen,
    onClose: onCredentialModalClose,
  } = useDisclosure();

  const {
    isOpen: isCredentialDrawerOpen,
    onOpen: onCredentialDrawerOpen,
    onClose: onCredentialDrawerClose,
  } = useDisclosure();

  const handleViewCredentials = () => {
    onCredentialDrawerOpen();
  };

  const toast = useToast();
  const bgGradient = useColorModeValue(
    "linear(to-br, purple.600, blue.500)",
    "linear(to-br, purple.900, blue.800)"
  );

  useEffect(() => {
    fetchTransactions();
    fetchCredentials();
  }, [page]);

  const fetchTransactions = () => {
    // TODO: abstract this into a hook called useTransactions
  };

  const fetchCredentials = () => {
    // TODO: abstract this into a hook called useCredentials
  };

  useEffect(() => {
    observer.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 1 }
    );

    if (lastOfferingElementRef.current) {
      observer.current.observe(lastOfferingElementRef.current);
    }

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, []);

  const handleLogout = () => {
    account?.lock?.();
    dispatch(lockAccount());
  };

  const handleOfferingSelect = async (
    offerings: Offering[],
    currencyRoute: string[]
  ) => {
    console.log({ offerings });
    setSelectedOffering(offerings);
    setSendPayload({ currencyRoute: currencyRoute || [] });
    const requiredCredentials = offerings.flatMap(
      (offering) =>
        offering.data.requiredClaims?.input_descriptors?.map((desc) => ({
          id: desc.id,
          schema: desc?.constraints?.fields?.find?.((field) =>
            field?.path?.[0]?.includes("credentialSchema.id")
          )?.filter?.const,
          issuer: desc?.constraints?.fields?.find?.((field) =>
            field?.path?.[0]?.includes("issuer")
          )?.filter?.const,
        })) || []
    );

    // Remove duplicates
    const uniqueCredentials = Array.from(
      new Set(requiredCredentials.map((cred) => JSON.stringify(cred)))
    ).map((str) => JSON.parse(str));

    setRequiredCredentials(uniqueCredentials);

    // Check if user already has the required credentials in DWN
    const existingCredentials = await fetchCredentialsFromDWN(
      account?.getWeb5(),
      account?.getDid() || "",
      uniqueCredentials
    );
    setSelectedCredentials(existingCredentials);

    if (existingCredentials.length < uniqueCredentials.length) {
      onCredentialModalOpen();
    } else {
      onCredentialModalOpen();
      // onOfferingModalOpen();
    }
  };

  const handleExchange = () => {
    // Implement exchange logic here
    toast({
      title: "Exchange Successful",
      description: `Exchanged ${amount} ${baseCurrency} to ${pairCurrency}`,
      status: "success",
      duration: 3000,
      isClosable: true,
    });
    setAmount("");
    setSelectedOffering(null);
    onOfferingModalClose();
  };

  const handleExchangeComplete = () => {
    // Refresh transactions or update state as needed
    fetchTransactions();
    setSendPayload({ showOfferings: false, baseAmount: 0, pairAmount: 0 });
  };

  const handleCredentialSubmit = () => {
    if (
      selectedCredentials &&
      selectedCredentials?.length === requiredCredentials.length
    ) {
      onCredentialModalClose();
      if (selectedOffering) onOfferingModalOpen();
    } else {
      toast({
        title: "Error",
        description: "Please provide all required credentials",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (!account) {
    return <LandingPageScreen />;
  }

  if (isLocked) {
    return <UnlockScreen />;
  }

  if (account?.isLocked()) {
    return <UnlockScreen />;
  }

  return (
    <Box minH="100vh" bgGradient={bgGradient}>
      <Container maxW="container.xl" py={4}>
        <VStack spacing={4} align="stretch">
          {/* Nav and Menu Area */}
          <Flex justifyContent="space-between" alignItems="center">
            <Heading as="h1" size="lg" color="white">
              Kapital Wallet
            </Heading>
            <Menu>
              <MenuButton
                as={Button}
                rightIcon={<MenuIcon />}
                bg="white"
                color="gray.800"
                fontWeight="medium"
                _hover={{ bg: "gray.100" }}
                _active={{ bg: "gray.200" }}
                transition="all 0.2s"
                px={4}
                py={2}
              >
                Menu
              </MenuButton>
              <MenuList
                border="1px"
                borderColor="gray.200"
                boxShadow="md"
                borderRadius="md"
                p={2}
              >
                <MenuItem
                  icon={<CredentialIcon color="purple.500" />}
                  onClick={handleViewCredentials}
                  _hover={{ bg: "purple.50" }}
                  borderRadius="md"
                  mb={1}
                >
                  View Credentials
                </MenuItem>
                <MenuItem
                  icon={<TransactionIcon color="blue.500" />}
                  onClick={onTransactionDrawerOpen}
                  _hover={{ bg: "blue.50" }}
                  borderRadius="md"
                  mb={1}
                >
                  Transactions
                </MenuItem>
                <MenuItem
                  icon={<LogoutIcon color="red.500" />}
                  onClick={handleLogout}
                  _hover={{ bg: "red.50" }}
                  borderRadius="md"
                >
                  Logout
                </MenuItem>
              </MenuList>
            </Menu>
          </Flex>
          <Box bg="white" p={6} borderRadius="md" boxShadow="xl">
            <Flex justifyContent="space-between" alignItems="center" mb={4}>
              <Box as="h2"></Box>
              <Heading as="h2" size="lg">
                Send Money
              </Heading>
              <VStack justify="center" alignItems="center">
                <IconButton
                  icon={<SettingsIcon />}
                  aria-label="Settings"
                  variant="ghost"
                  rounded="full"
                />
              </VStack>
            </Flex>

            <Flex justifyContent="space-between" alignItems="center">
              <SendMoneyComponent
                isLoadingOfferings={sendPayload.isLoadingOfferings!}
                sendPayload={sendPayload}
                setSendPayload={setSendPayload}
                baseCurrencies={baseCurrencies}
                pairCurrencies={pairCurrencies}
              />
            </Flex>
          </Box>

          {sendPayload?.showOfferings && (
            <Box bg="white" p={4} borderRadius="md" boxShadow="xl">
              <Flex justifyContent="space-between" alignItems="center" mb={4}>
                <Box as="h2"></Box>
                <Heading as="h2" size="md">
                  Exchange Offerings
                </Heading>
                <VStack justify="center" alignItems="center">
                  {!sendPayload.isLoadingOfferings && (
                    <IconButton
                      icon={<CloseIcon />}
                      aria-label="Close"
                      variant="ghost"
                      rounded="full"
                      onClick={() => setSendPayload({ showOfferings: false })}
                    />
                  )}
                </VStack>
              </Flex>
              <Box my={2}>
                {sendPayload?.isLoadingOfferings ? (
                  <CustomSpinner />
                ) : (
                  <Box>
                    <OfferingsDisplay
                      conversionPaths={sendPayload.conversionPaths || []}
                      baseAmount={sendPayload.baseAmount}
                      pairAmount={sendPayload.pairAmount}
                      handleOfferingSelect={handleOfferingSelect}
                    />
                  </Box>
                )}
              </Box>
            </Box>
          )}

          <Box bg="white" p={4} borderRadius="md" boxShadow="xl">
            <Heading as="h2" size="md" mb={2}>
              Recent Transactions
            </Heading>
            {/* TODO: SHOW Recent transaction/exchanges and their status, allow to click for details */}
          </Box>
        </VStack>
      </Container>

      {/* Offering Modal */}
      <Modal isOpen={isOfferingModalOpen} onClose={onOfferingModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Exchange Currency</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              {(selectedOffering || [])?.map((offering, index) => (
                <Box key={offering.metadata.id}>
                  <Text>
                    Step {index + 1}: Exchange{" "}
                    {offering.data.payin.currencyCode} to{" "}
                    {offering.data.payout.currencyCode} using{" "}
                    {offering.metadata.from}
                  </Text>
                  <Text>Rate: {offering.data.payoutUnitsPerPayinUnit}</Text>
                </Box>
              ))}
              {/* TODO: Fix this. in step 0, it is fine. but subsequent steps should use amount converted from last step */}
              <Input
                placeholder="Amount to exchange"
                value={sendPayload.baseAmount}
                onChange={(e) =>
                  setSendPayload({ baseAmount: Number(e.target.value) })
                }
                type="number"
              />
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleExchange}>
              Confirm Exchange
            </Button>
            <Button variant="ghost" onClick={onOfferingModalClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Credential Modal */}
      <CredentialModal
        isOpen={isCredentialModalOpen}
        onClose={onCredentialModalClose}
        requiredCredentials={requiredCredentials}
        selectedCredentials={selectedCredentials}
        setSelectedCredentials={setSelectedCredentials}
        onSubmit={handleCredentialSubmit}
        userDid={account?.getDid() || ""}
      />

      {/* Credentials Drawer */}
      <CredentialDrawer
        isOpen={isCredentialDrawerOpen}
        onClose={onCredentialDrawerClose}
        web5={account?.getWeb5()}
        userDid={account?.getDid() || ""}
      />

      {/* Offering Modal */}
      <OfferingModal
        isOpen={isOfferingModalOpen}
        onClose={onOfferingModalClose}
        selectedOfferings={selectedOffering || []}
        baseAmount={sendPayload.baseAmount || 0}
        baseCurrency={sendPayload.baseCurrency!}
        pairCurrency={sendPayload.pairCurrency!}
        onExchangeComplete={handleExchangeComplete}
        customerDid={account.getConnectedDid()}
        web5={account.getWeb5()}
        verifiableCredentials={selectedCredentials}
        currencyRoute={sendPayload.currencyRoute || []}
      />

      {/* Transaction Drawer */}
      <Drawer
        isOpen={isTransactionDrawerOpen}
        placement="right"
        onClose={onTransactionDrawerClose}
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Transaction Details</DrawerHeader>
          <DrawerBody>
            {selectedTransaction ? (
              <VStack align="stretch" spacing={4}>
                <Box>
                  <Text fontWeight="bold">Date:</Text>
                  <Text>{selectedTransaction.date}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Amount:</Text>
                  <Text>
                    {selectedTransaction.amount} {selectedTransaction.currency}
                  </Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Type:</Text>
                  <Text>{selectedTransaction.type}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Details:</Text>
                  <Text>{selectedTransaction.details}</Text>
                </Box>
              </VStack>
            ) : (
              <Text>Select a transaction to view details</Text>
            )}
          </DrawerBody>
          <DrawerFooter>
            <Button variant="outline" mr={3} onClick={onTransactionDrawerClose}>
              Close
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

export default HomeScreen;
