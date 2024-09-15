import {
  Badge,
  Box,
  Button,
  Divider,
  Flex,
  HStack,
  Text,
  Tooltip,
  useColorModeValue,
  VStack,
  Wrap,
} from "@chakra-ui/react";
import { Offering } from "@tbdex/http-client";
import React from "react";
import {
  ArrowRightIcon,
  ClockIcon,
  ShieldIcon,
  StarIcon,
} from "../components/Icons";
import { ConversionPath } from "../hooks/useOfferings";

const OfferingCard: React.FC<
  ConversionPath & {
    baseAmount?: number;
    pairAmount?: number;
    handleOfferingSelect: (offr: Offering[]) => void;
  }
> = ({
  path,
  pfis,
  offerings = [],
  baseAmount,
  pairAmount,
  handleOfferingSelect,
}) => {
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  const getTotalExchangeRate = (): string => {
    return offerings
      .reduce(
        (acc, offering) =>
          acc * parseFloat(offering.data.payoutUnitsPerPayinUnit),
        1
      )
      .toFixed(4);
  };

  const getEstimatedTime = (): number => {
    const totalTime = offerings.reduce((acc, offering) => {
      const method = offering.data.payout.methods[0];
      return acc + (method.estimatedSettlementTime || 0);
    }, 0);
    return totalTime / 3600; // Convert to hours
  };

  const getKycRequirements = (): boolean => {
    return offerings.some(
      (offering) => offering.data?.requiredClaims?.input_descriptors?.length
    );
  };

  const calculateAmount = (): { amount: string; fee: string } => {
    const rate = parseFloat(getTotalExchangeRate());
    if (baseAmount !== undefined) {
      const finalAmount = baseAmount * rate;
      const fee = baseAmount * 0.01; // Assuming 1% fee, adjust as needed
      return { amount: finalAmount.toFixed(2), fee: fee.toFixed(2) };
    } else if (pairAmount !== undefined) {
      const initialAmount = pairAmount / rate;
      const fee = initialAmount * 0.01; // Assuming 1% fee, adjust as needed
      return { amount: initialAmount.toFixed(2), fee: fee.toFixed(2) };
    }
    return { amount: "0.00", fee: "0.00" };
  };

  const { amount, fee } = calculateAmount();

  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      p={6}
      bg={bgColor}
      borderColor={borderColor}
      boxShadow="lg"
      width="100%"
    >
      <VStack align="stretch" spacing={4}>
        <HStack justify="space-between">
          <Badge colorScheme={path.length === 2 ? "green" : "yellow"}>
            {path.length === 2 ? "Direct" : "Multi-step"}
          </Badge>
          <HStack justify="space-between" gap={4}>
            <Tooltip label="KYC Requirements" placement="top">
              <HStack spacing={2}>
                <ShieldIcon />
                <Text fontSize="sm">
                  {getKycRequirements()
                    ? "(Credentials) Required"
                    : "(Credentials) None"}
                </Text>
              </HStack>
            </Tooltip>
            <Tooltip label="PFI Rating" placement="top">
              <HStack spacing={2}>
                <StarIcon />
                <Text fontSize="sm" fontWeight="bold">
                  4.5
                </Text>
              </HStack>
            </Tooltip>
            <Tooltip label="Estimated Time" placement="top">
              <HStack spacing={2}>
                <ClockIcon />
                <Text fontSize="sm">{getEstimatedTime()} hours</Text>
              </HStack>
            </Tooltip>
          </HStack>
        </HStack>

        <Wrap justify="space-between" fontSize="lg" fontWeight="bold">
          <Text>{path[0]}</Text>
          <VStack alignItems={"flex-end"}>
            <HStack spacing={2}>
              {path.map((currency, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <ArrowRightIcon />}
                  <Text>{currency}</Text>
                </React.Fragment>
              ))}
            </HStack>
            {/* TODO: Format pfi to readable name */}
            <Text fontSize="sm" color="gray.500">
              Via: {pfis.join(" → ")}
            </Text>
          </VStack>
        </Wrap>

        <HStack justify="space-between" spacing={6}>
          <Tooltip label="Exchange Rate" placement="top">
            <HStack spacing={2}>
              <Text fontSize="sm">
                1 {path[0]} = {getTotalExchangeRate()} {path[path.length - 1]}
              </Text>
            </HStack>
          </Tooltip>
        </HStack>

        <Divider mt="1rem" />
        {(baseAmount !== undefined || pairAmount !== undefined) && (
          <VStack align="stretch" spacing={2}>
            <Text fontSize="sm">
              {baseAmount !== undefined ? "You will receive:" : "You will pay:"}
            </Text>
            <Text fontSize="xl" fontWeight="bold">
              {amount}{" "}
              {baseAmount !== undefined ? path[path.length - 1] : path[0]}
            </Text>
            <Text fontSize="xs" color="gray.500">
              Fee: {fee}{" "}
              {baseAmount !== undefined ? path[0] : path[path.length - 1]}
            </Text>
          </VStack>
        )}

        <Flex justify="flex-end">
          <Button
            colorScheme="blue"
            size="md"
            width="auto"
            onClick={() => handleOfferingSelect(offerings)}
            _hover={{ bg: "blue.600", boxShadow: "lg" }}
          >
            Select Offering
          </Button>
        </Flex>
      </VStack>
    </Box>
  );
};

const OfferingsDisplay: React.FC<{
  conversionPaths: ConversionPath[];
  baseAmount?: number;
  pairAmount?: number;
  handleOfferingSelect: (offr: Offering[]) => void;
}> = ({ conversionPaths, baseAmount, pairAmount, handleOfferingSelect }) => {
  return (
    <VStack spacing={6} align="stretch">
      {conversionPaths.map((offeringPath, index) => (
        <OfferingCard
          key={index}
          {...offeringPath}
          baseAmount={baseAmount ? baseAmount : undefined}
          pairAmount={pairAmount ? pairAmount : undefined}
          handleOfferingSelect={handleOfferingSelect}
        />
      ))}
    </VStack>
  );
};

export default OfferingsDisplay;
