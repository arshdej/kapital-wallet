import {
  Badge,
  Box,
  Button,
  Divider,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Progress,
  Select,
  Stat,
  StatArrow,
  StatHelpText,
  StatLabel,
  StatNumber,
  Text,
  Tooltip,
  useToast,
  VStack,
} from "@chakra-ui/react";
import {
  formatCurrency,
  formatDate,
  formatDateToMonthDay,
  formatExchangeRate,
} from "@kapital/utils/src/helpers/formatter";
import {
  Close,
  DID,
  Offering,
  Order,
  Quote,
  Rfq,
  TbdexHttpClient,
} from "@tbdex/http-client";
import { Web5 } from "@web5/api/browser";
import React, { useEffect, useState } from "react";
import { InfoIcon } from "../../components/Icons";
interface OfferingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedOfferings: Offering[];
  currencyRoute: string[];
  baseAmount: number;
  baseCurrency: string;
  pairCurrency: string;
  onExchangeComplete: () => void;
  customerDid: DID;
  web5: Web5;
  verifiableCredentials: { id: string; jwt: string; payload?: any }[];
}

interface PaymentDetails {
  [key: string]: string;
}

const OfferingModal: React.FC<OfferingModalProps> = ({
  isOpen,
  onClose,
  selectedOfferings,
  baseAmount,
  baseCurrency,
  pairCurrency,
  currencyRoute,
  onExchangeComplete,
  customerDid,
  web5,
  verifiableCredentials,
}) => {
  const [currentOfferingIndex, setCurrentOfferingIndex] = useState(0);
  const [amount, setAmount] = useState(baseAmount);
  const [selectedPayinMethod, setSelectedPayinMethod] = useState("");
  const [selectedPayoutMethod, setSelectedPayoutMethod] = useState("");
  const [payinDetails, setPayinDetails] = useState<PaymentDetails>({});
  const [payoutDetails, setPayoutDetails] = useState<PaymentDetails>({});
  const [quote, setQuote] = useState<Quote | null>(null);
  const [exchangeId, setExchangeId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState("input"); // 'input', 'quote', 'order', 'close'
  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      setCurrentOfferingIndex(0);
      setAmount(baseAmount);
      setSelectedPayinMethod("");
      setSelectedPayoutMethod("");
      setPayinDetails({});
      setPayoutDetails({});
      setQuote(null);
      setExchangeId(null);
      setStep("input");
    }
  }, [isOpen, baseAmount]);

  const currentOffering = selectedOfferings[currentOfferingIndex];

  const handlePaymentMethodChange = (
    type: "payin" | "payout",
    value: string
  ) => {
    if (type === "payin") {
      setSelectedPayinMethod(value);
      setPayinDetails({});
    } else {
      setSelectedPayoutMethod(value);
      setPayoutDetails({});
    }
  };

  const handlePaymentDetailChange = (
    type: "payin" | "payout",
    key: string,
    value: string
  ) => {
    if (type === "payin") {
      setPayinDetails((prev) => ({ ...prev, [key]: value }));
    } else {
      setPayoutDetails((prev) => ({ ...prev, [key]: value }));
    }
  };

  const createRfq = async () => {
    const payload = {
      metadata: {
        to: currentOffering.metadata.from,
        from: customerDid.uri,
        protocol: "1.0",
      },
      data: {
        offeringId: currentOffering.metadata.id,
        payin: {
          kind: selectedPayinMethod,
          amount: amount.toString(),
          paymentDetails: payinDetails,
        },
        payout: {
          kind: selectedPayoutMethod,
          paymentDetails: payoutDetails,
        },
        claims: verifiableCredentials
          .filter((vc) =>
            currentOffering.data.requiredClaims?.input_descriptors?.some(
              (desc) => desc.id === vc.id
              // (desc) => desc.schema === vc.schema && desc.issuer === vc.issuer
            )
          )
          .map((c) => c.jwt),
      },
    };
    const rfq = Rfq.create(payload);

    try {
      rfq.verifyOfferingRequirements(currentOffering);
    } catch (e) {
      console.error("RFQ verification failed:", e);
      throw e;
    }

    await rfq.sign(customerDid);
    return rfq;
  };

  const handleRequestQuote = async () => {
    setIsLoading(true);
    try {
      const rfq = await createRfq();
      const exchange = await TbdexHttpClient.createExchange(rfq);
      console.log({ exchange });
      setExchangeId(rfq.exchangeId);

      // Poll for quote
      let attempts = 0;
      const maxAttempts = 30;
      const delay = 2000;
      let receivedQuote = null;

      while (!receivedQuote && attempts < maxAttempts) {
        const updatedExchange = await TbdexHttpClient.getExchange({
          exchangeId: rfq.exchangeId,
          pfiDid: currentOffering.metadata.from,
          did: customerDid,
        });

        receivedQuote = updatedExchange.find(
          (m) => m instanceof Quote
        ) as Quote;

        if (!receivedQuote) {
          const close = updatedExchange.find((m) => m instanceof Close);
          if (close) {
            // throw new Error("Exchange closed by PFI");
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
        attempts++;
      }

      if (!receivedQuote) {
        throw new Error("Failed to receive quote");
      }
      console.log({ receivedQuote });
      setQuote(receivedQuote);
      setStep("quote");

      // Store exchange data in user's DWN
      await web5.dwn.records.create({
        data: JSON.stringify({
          exchangeId: rfq.exchangeId,
          offering: currentOffering,
          rfq: rfq,
          quote: receivedQuote,
          status: "quoted",
        }),
        message: {
          schema: "https://example.com/exchangeData",
          dataFormat: "application/json",
        },
      });
    } catch (error) {
      console.error("Error requesting quote:", error);
      toast({
        title: "Error",
        description: `Failed to request quote. ${String(error)}`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    setIsLoading(true);
    try {
      const order = Order.create({
        metadata: {
          from: customerDid.uri,
          to: currentOffering.metadata.from,
          exchangeId: exchangeId!,
          protocol: "1.0",
        },
      });

      await order.sign(customerDid);
      await TbdexHttpClient.submitOrder(order);

      setStep("order");

      // Poll for close message
      let attempts = 0;
      const maxAttempts = 30;
      const delay = 2000;
      let closeMessage = null;

      while (!closeMessage && attempts < maxAttempts) {
        const updatedExchange = await TbdexHttpClient.getExchange({
          exchangeId: exchangeId!,
          pfiDid: currentOffering.metadata.from,
          did: customerDid,
        });
        closeMessage = updatedExchange?.find?.(
          (m) => m instanceof Close
        ) as Close;

        if (!closeMessage) {
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
        attempts++;
      }

      if (!closeMessage) {
        throw new Error("Failed to receive close message");
      }

      setStep("close");

      // Update exchange data in user's DWN
      const { records } = await web5.dwn.records.query({
        message: {
          filter: {
            schema: "https://example.com/exchangeData",
            dataFormat: "application/json",
          },
        },
      });

      if (records.length > 0) {
        const exchangeRecord = records[0];
        const exchangeData = JSON.parse(await exchangeRecord.data.text());
        exchangeData.order = order;
        exchangeData.close = closeMessage;
        exchangeData.status = closeMessage.data.success
          ? "completed"
          : "failed";
        await exchangeRecord.update({ data: JSON.stringify(exchangeData) });
      }

      if (closeMessage.data.success) {
        setStep("close");
        toast({
          title: "Exchange Step Complete",
          description: `Successfully exchanged ${
            currencyRoute[currentOfferingIndex]
          } to ${currencyRoute[currentOfferingIndex + 1]}.`,
          status: "success",
          duration: 5000,
          isClosable: true,
        });
        if (currentOfferingIndex < selectedOfferings.length - 1) {
          setCurrentOfferingIndex((prev) => prev + 1);
          setAmount(Number(quote!.data.payout?.amount));
          setStep("input");
        } else {
          onExchangeComplete();
          onClose();
        }
      } else {
        toast({
          title: "Exchange Step Failed",
          description: `Reason: ${closeMessage.data.reason}`,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error("Error placing order:", error);
      toast({
        title: "Error",
        description: "Failed to place order. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          Currency Exchange - Step {currentOfferingIndex + 1}/
          {selectedOfferings.length}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <Box>
              <Text fontWeight="bold">Overall Progress</Text>
              <HStack>
                {currencyRoute.map((currency, index) => (
                  <React.Fragment key={currency}>
                    <Text
                      color={
                        index <= currentOfferingIndex ? "blue.500" : "gray.500"
                      }
                      fontWeight={
                        index === currentOfferingIndex ? "bold" : "normal"
                      }
                    >
                      {currency}
                    </Text>
                    {index < currencyRoute.length - 1 && <Text>→</Text>}
                  </React.Fragment>
                ))}
              </HStack>
              <Progress
                value={
                  (currentOfferingIndex / (selectedOfferings.length - 1)) * 100
                }
              />
            </Box>
            <Divider />

            {step === "input" && (
              <>
                <FormControl>
                  <FormLabel>
                    Amount of {currencyRoute[currentOfferingIndex]} to Exchange
                  </FormLabel>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    isReadOnly={currentOfferingIndex > 0}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>
                    Payin Method (How you'll send{" "}
                    {currencyRoute[currentOfferingIndex]})
                  </FormLabel>
                  <Select
                    value={selectedPayinMethod}
                    onChange={(e) =>
                      handlePaymentMethodChange("payin", e.target.value)
                    }
                  >
                    <option value="">Select a payin method</option>
                    {currentOffering?.data?.payin?.methods.map((method) => (
                      <option key={method.kind} value={method.kind}>
                        {method.kind}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                {selectedPayinMethod &&
                  currentOffering?.data?.payin?.methods.find(
                    (m) => m.kind === selectedPayinMethod
                  )?.requiredPaymentDetails?.properties && (
                    <Box>
                      <Text fontWeight="bold">Payin Details</Text>
                      {Object.entries(
                        currentOffering?.data?.payin?.methods?.find(
                          (m) => m.kind === selectedPayinMethod
                        )!.requiredPaymentDetails!.properties!
                      ).map(([key, value]) => (
                        <FormControl key={key}>
                          <FormLabel>{(value as any).title || key}</FormLabel>
                          <Input
                            value={payinDetails[key] || ""}
                            onChange={(e) =>
                              handlePaymentDetailChange(
                                "payin",
                                key,
                                e.target.value
                              )
                            }
                          />
                        </FormControl>
                      ))}
                    </Box>
                  )}
                <FormControl>
                  <FormLabel>
                    Payout Method (How you'll receive{" "}
                    {currencyRoute[currentOfferingIndex + 1]})
                  </FormLabel>
                  <Select
                    value={selectedPayoutMethod}
                    onChange={(e) =>
                      handlePaymentMethodChange("payout", e.target.value)
                    }
                  >
                    <option value="">Select a payout method</option>
                    {currentOffering?.data?.payout?.methods?.map((method) => (
                      <option key={method.kind} value={method.kind}>
                        {method.kind}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                {selectedPayoutMethod &&
                  currentOffering?.data?.payout?.methods.find(
                    (m) => m.kind === selectedPayoutMethod
                  )?.requiredPaymentDetails?.properties && (
                    <Box>
                      <Text fontWeight="bold">Payout Details</Text>
                      {Object.entries(
                        currentOffering.data.payout.methods.find(
                          (m) => m.kind === selectedPayoutMethod
                        )!.requiredPaymentDetails!.properties!
                      ).map(([key, value]) => (
                        <FormControl key={key}>
                          <FormLabel>{(value as any).title || key}</FormLabel>
                          <Input
                            value={payoutDetails[key] || ""}
                            onChange={(e) =>
                              handlePaymentDetailChange(
                                "payout",
                                key,
                                e.target.value
                              )
                            }
                          />
                        </FormControl>
                      ))}
                    </Box>
                  )}
              </>
            )}
            {step === "quote" && quote && (
              <Box borderWidth="1px" borderRadius="lg" p={4}>
                <VStack spacing={4} align="stretch">
                  <Text fontSize="xl" fontWeight="bold">
                    Quote Details
                  </Text>

                  <HStack justify="space-between">
                    <Stat>
                      <StatLabel>You'll Send</StatLabel>
                      <StatNumber>
                        {formatCurrency(
                          quote.data.payin?.amount,
                          currencyRoute[currentOfferingIndex]
                        )}
                      </StatNumber>
                      <StatHelpText>
                        {currencyRoute[currentOfferingIndex]}
                      </StatHelpText>
                    </Stat>
                    <Stat>
                      <StatArrow type="increase" />
                    </Stat>
                    <Stat>
                      <StatLabel>You'll Receive</StatLabel>
                      <StatNumber>
                        {formatCurrency(
                          quote.data.payout?.amount,
                          currencyRoute[currentOfferingIndex + 1]
                        )}
                      </StatNumber>
                      <StatHelpText>
                        {currencyRoute[currentOfferingIndex + 1]}
                      </StatHelpText>
                    </Stat>
                  </HStack>

                  <Divider />

                  <HStack justify="space-between">
                    <Box>
                      <Text fontWeight="semibold">Exchange Rate</Text>
                      <Text>
                        1 {currencyRoute[currentOfferingIndex]} ={" "}
                        {formatExchangeRate(
                          Number(quote.data.payout.amount) /
                            Number(quote.data.payin?.amount)
                        )}{" "}
                        {currencyRoute[currentOfferingIndex + 1]}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontWeight="semibold">Fee</Text>
                      <Text>
                        {formatCurrency(
                          quote.data.fee ?? 0,
                          currencyRoute[currentOfferingIndex]
                        )}
                      </Text>
                    </Box>
                  </HStack>

                  <Divider />

                  <HStack justify="space-between">
                    <Text fontWeight="semibold">Quote Expires On</Text>
                    <Tooltip
                      label={formatDate(quote.data.expiresAt)}
                      placement="top"
                    >
                      <Badge colorScheme="blue">
                        {
                          formatDateToMonthDay(new Date(quote.data.expiresAt))
                            .datetime
                        }
                      </Badge>
                    </Tooltip>
                  </HStack>

                  <Box bg="gray.100" p={2} borderRadius="md">
                    <HStack>
                      <InfoIcon color="blue.500" />
                      <Text fontSize="sm">
                        This quote is valid for a limited time. Please confirm
                        your order before it expires.
                      </Text>
                    </HStack>
                  </Box>
                </VStack>
              </Box>
            )}
            {step === "order" && (
              <Text>
                Order placed for {currencyRoute[currentOfferingIndex]} to{" "}
                {currencyRoute[currentOfferingIndex + 1]} exchange. Waiting for
                confirmation...
              </Text>
            )}
            {step === "close" && (
              <Text>
                {currentOfferingIndex < selectedOfferings.length - 1
                  ? `Exchange from ${currencyRoute[currentOfferingIndex]} to ${
                      currencyRoute[currentOfferingIndex + 1]
                    } completed. Proceeding to next step.`
                  : "All exchanges completed successfully. You can now close this window."}
              </Text>
            )}
          </VStack>
        </ModalBody>
        <ModalFooter>
          {step === "input" && (
            <Button
              colorScheme="blue"
              onClick={handleRequestQuote}
              isLoading={isLoading}
            >
              Get Quote
            </Button>
          )}
          {step === "quote" && (
            <Button
              colorScheme="green"
              onClick={handlePlaceOrder}
              isLoading={isLoading}
            >
              Confirm and Place Order
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default OfferingModal;
