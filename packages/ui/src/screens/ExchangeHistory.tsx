import {
  Badge,
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  HStack,
  Spinner,
  Text,
  useDisclosure,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { Web5 } from "@web5/api/browser";
import React, { useEffect, useMemo, useState } from "react";
import { CalendarIcon, ExchangeIcon, MoneyIcon } from "../components/Icons";
import useWindowSize from "../hooks/useWindowSize";

interface ExchangeHistoryProps {
  web5: Web5;
  onContinueExchange: (exchangeData: any) => void;
  statusFilter: string;
  searchTerm: string;
}

const ExchangeHistory: React.FC<ExchangeHistoryProps> = ({
  web5,
  onContinueExchange,
  statusFilter,
  searchTerm,
}) => {
  const [exchanges, setExchanges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedExchange, setSelectedExchange] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  useEffect(() => {
    fetchExchangeHistory();
  }, []);

  const fetchExchangeHistory = async () => {
    setIsLoading(true);
    try {
      const { records } = await web5.dwn.records.query({
        message: {
          filter: {
            schema: "https://example.com/exchangeData",
            dataFormat: "application/json",
          },
        },
      });

      const exchangeData = await Promise.all(
        records.map(async (record) => {
          const data = JSON.parse(await record.data.text());
          return { ...data, recordId: record.id };
        })
      );

      setExchanges(exchangeData);
    } catch (error) {
      console.error("Error fetching exchange history:", error);
      toast({
        title: "Error",
        description: "Failed to fetch exchange history. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredExchanges = useMemo(() => {
    return exchanges
      .filter((exchange) => {
        const matchesStatus =
          statusFilter === "all" || exchange.status === statusFilter;
        const matchesSearch = exchange.exchangeId
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
      })
      .sort((a, b) => {
        const dateA = new Date(a.rfq.metadata.createdAt);
        const dateB = new Date(b.rfq.metadata.createdAt);
        return dateB.getTime() - dateA.getTime(); // Sort in descending order (recent first)
      });
  }, [exchanges, statusFilter, searchTerm]);

  const handleExchangeClick = (exchange: any) => {
    setSelectedExchange(exchange);
    onOpen();
  };

  const handleContinueExchange = (exchange: any) => {
    if (exchange.status !== "completed" && exchange.status !== "failed") {
      const now = new Date();
      const expiresAt = new Date(exchange.quote.data.expiresAt);
      if (now < expiresAt) {
        onContinueExchange(exchange);
        onClose();
      } else {
        toast({
          title: "Exchange Expired",
          description:
            "This exchange has expired. Please start a new exchange.",
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "green";
      case "failed":
        return "red";
      case "quoted":
        return "yellow";
      default:
        return "blue";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });
  };

  const { width } = useWindowSize();

  return (
    <Box>
      {isLoading ? (
        <Box textAlign="center" py={10}>
          <Spinner size="xl" />
          <Text mt={4}>Loading exchange history...</Text>
        </Box>
      ) : (
        <VStack spacing={4} align="stretch">
          {filteredExchanges.length === 0 ? (
            <Text>No exchanges found matching the current filters.</Text>
          ) : (
            filteredExchanges.map((exchange) => (
              <Box
                key={exchange.recordId}
                p={4}
                borderWidth={1}
                borderRadius="md"
                boxShadow="sm"
                cursor="pointer"
                onClick={() => handleExchangeClick(exchange)}
                _hover={{ boxShadow: "md", bg: "gray.50" }}
                transition="all 0.2s"
              >
                <Flex justify="space-between" align="center">
                  <VStack align="start" spacing={2}>
                    <HStack>
                      <Badge
                        colorScheme={getStatusColor(exchange.status)}
                        fontSize="sm"
                        px={2}
                        py={1}
                      >
                        {exchange.status.charAt(0).toUpperCase() +
                          exchange.status.slice(1)}
                      </Badge>
                      <Text fontWeight="semibold" fontSize="md">
                        ID:{" "}
                        {Number(width) < 520
                          ? `${exchange.exchangeId.slice(0, 8)}...`
                          : exchange.exchangeId}
                      </Text>
                    </HStack>
                    <HStack spacing={4}>
                      <HStack>
                        <ExchangeIcon color="blue.500" />
                        <Text fontSize="sm">
                          {exchange?.offering?.data?.payin?.currencyCode} →{" "}
                          {exchange?.offering?.data?.payout?.currencyCode}
                        </Text>
                      </HStack>
                      <HStack>
                        <MoneyIcon color="green.500" />
                        <Text fontSize="sm">
                          {exchange?.rfq?.data?.payin?.amount}{" "}
                          {exchange?.offering?.data?.payin?.currencyCode}
                        </Text>
                      </HStack>
                    </HStack>
                    <HStack>
                      <CalendarIcon color="purple.500" />
                      <Text fontSize="xs" color="gray.600">
                        {formatDate(exchange.rfq.metadata.createdAt)}
                      </Text>
                    </HStack>
                  </VStack>
                  <ExchangeIcon color="gray.400" />
                </Flex>
              </Box>
            ))
          )}
        </VStack>
      )}

      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Exchange Details</DrawerHeader>
          <DrawerBody>
            {selectedExchange && (
              <VStack spacing={4} align="stretch">
                <Box>
                  <Text fontWeight="semibold">Exchange ID</Text>
                  <Text>{selectedExchange.exchangeId}</Text>
                </Box>
                <Box>
                  <Text fontWeight="semibold">Status</Text>
                  <Badge colorScheme={getStatusColor(selectedExchange.status)}>
                    {selectedExchange.status.charAt(0).toUpperCase() +
                      selectedExchange.status.slice(1)}
                  </Badge>
                </Box>
                <Box>
                  <Text fontWeight="semibold">From</Text>
                  <Text>
                    {selectedExchange.rfq.data.payin.kind} (
                    {selectedExchange.offering.data.payin.currencyCode})
                  </Text>
                </Box>
                <Box>
                  <Text fontWeight="semibold">To</Text>
                  <Text>
                    {selectedExchange.rfq.data.payout.kind} (
                    {selectedExchange.offering.data.payout.currencyCode})
                  </Text>
                </Box>
                <Box>
                  <Text fontWeight="semibold">Amount</Text>
                  <Text>
                    {selectedExchange.rfq.data.payin.amount}{" "}
                    {selectedExchange.offering.data.payin.currencyCode}
                  </Text>
                </Box>
                <Box>
                  <Text fontWeight="semibold">Expected Payout</Text>
                  <Text>
                    {selectedExchange.quote.data.payout.amount}{" "}
                    {selectedExchange.quote.data.payout.currencyCode}
                  </Text>
                </Box>
                <Box>
                  <Text fontWeight="semibold">Exchange Rate</Text>
                  <Text>
                    1 {selectedExchange.offering.data.payin.currencyCode} ={" "}
                    {selectedExchange.offering.data.payoutUnitsPerPayinUnit}{" "}
                    {selectedExchange.offering.data.payout.currencyCode}
                  </Text>
                </Box>
                <Box>
                  <Text fontWeight="semibold">Created At</Text>
                  <Text>
                    {formatDate(selectedExchange.rfq.metadata.createdAt)}
                  </Text>
                </Box>
                {selectedExchange.status !== "completed" && (
                  <Box>
                    <Text fontWeight="semibold">Expires At</Text>
                    <Text>
                      {formatDate(selectedExchange.quote.data.expiresAt)}
                    </Text>
                  </Box>
                )}
                {selectedExchange.status !== "completed" &&
                  selectedExchange.status !== "failed" && (
                    <Button
                      colorScheme="blue"
                      onClick={() => handleContinueExchange(selectedExchange)}
                    >
                      Continue Exchange
                    </Button>
                  )}
              </VStack>
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

export default ExchangeHistory;
