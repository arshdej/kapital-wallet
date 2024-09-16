import {
  Badge,
  Box,
  Button,
  Divider,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stat,
  StatArrow,
  StatHelpText,
  StatLabel,
  StatNumber,
  Text,
  Tooltip,
  useColorModeValue,
  useToast,
  VStack,
} from "@chakra-ui/react";
import {
  formatCurrency,
  formatDateToMonthDay,
  formatExchangeRate,
} from "@kapital/utils/src/helpers/formatter";
import { Close, Order, TbdexHttpClient } from "@tbdex/http-client";
import { Web5 } from "@web5/api/browser";
import React, { useState } from "react";
import { InfoIcon } from "../../components/Icons";

interface QuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  exchange: any;
  customerDid: any;
  web5: Web5;

  onExchangeComplete: () => void;
}

const QuoteModal: React.FC<QuoteModalProps> = ({
  isOpen,
  onClose,
  exchange,
  customerDid,
  web5,
  onExchangeComplete,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  const handlePlaceOrder = async () => {
    setIsLoading(true);
    try {
      const order = Order.create({
        metadata: {
          from: customerDid.uri,
          to: exchange.offering.metadata.from,
          exchangeId: exchange.exchangeId,
          protocol: "1.0",
        },
      });

      await order.sign(customerDid);
      await TbdexHttpClient.submitOrder(order);

      // Poll for close message
      let attempts = 0;
      const maxAttempts = 30;
      const delay = 2000;
      let closeMessage = null;

      while (!closeMessage && attempts < maxAttempts) {
        const updatedExchange = await TbdexHttpClient.getExchange({
          exchangeId: exchange.exchangeId,
          pfiDid: exchange.offering.metadata.from,
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
        const exchangeRecord = records.find(
          (record) => record.id === exchange.recordId
        );
        if (exchangeRecord) {
          const exchangeData = JSON.parse(await exchangeRecord.data.text());
          exchangeData.order = order;
          exchangeData.close = closeMessage;
          exchangeData.status = closeMessage.data.success
            ? "completed"
            : "failed";
          await exchangeRecord.update({ data: JSON.stringify(exchangeData) });
        }
      }

      if (closeMessage.data.success) {
        toast({
          title: "Exchange Complete",
          description: `Successfully exchanged ${exchange.offering.data.payin.currencyCode} to ${exchange.offering.data.payout.currencyCode}.`,
          status: "success",
          duration: 5000,
          isClosable: true,
        });
        onExchangeComplete();
        onClose();
      } else {
        toast({
          title: "Exchange Failed",
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

  if (!exchange || !exchange.quote) {
    return null;
  }

  const { quote, offering } = exchange;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent bg={bgColor}>
        <ModalHeader>Quote Details</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Box
            borderWidth="1px"
            borderRadius="lg"
            p={4}
            borderColor={borderColor}
          >
            <VStack spacing={4} align="stretch">
              <HStack justify="space-between">
                <Stat>
                  <StatLabel>You'll Send</StatLabel>
                  <StatNumber>
                    {formatCurrency(
                      quote.data.payin?.amount,
                      offering.data.payin.currencyCode
                    )}
                  </StatNumber>
                  <StatHelpText>
                    {offering.data.payin.currencyCode}
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
                      offering.data.payout.currencyCode
                    )}
                  </StatNumber>
                  <StatHelpText>
                    {offering.data.payout.currencyCode}
                  </StatHelpText>
                </Stat>
              </HStack>

              <Divider />

              <HStack justify="space-between">
                <Box>
                  <Text fontWeight="semibold">Exchange Rate</Text>
                  <Text>
                    1 {offering.data.payin.currencyCode} ={" "}
                    {formatExchangeRate(
                      Number(quote.data.payout.amount) /
                        Number(quote.data.payin?.amount)
                    )}{" "}
                    {offering.data.payout.currencyCode}
                  </Text>
                </Box>
                <Box>
                  <Text fontWeight="semibold">Fee</Text>
                  <Text>
                    {formatCurrency(
                      quote.data.fee ?? 0,
                      offering.data.payin.currencyCode
                    )}
                  </Text>
                </Box>
              </HStack>

              <Divider />

              <HStack justify="space-between">
                <Text fontWeight="semibold">Quote Expires On</Text>
                <Tooltip
                  label={
                    formatDateToMonthDay(new Date(quote.data.expiresAt))
                      .datetime
                  }
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
                    This quote is valid for a limited time. Please confirm your
                    order before it expires.
                  </Text>
                </HStack>
              </Box>
            </VStack>
          </Box>
        </ModalBody>
        <ModalFooter>
          <Button
            colorScheme="green"
            onClick={handlePlaceOrder}
            isLoading={isLoading}
          >
            Confirm and Place Order
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default QuoteModal;
