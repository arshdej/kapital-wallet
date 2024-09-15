import {
  Box,
  Button,
  Flex,
  IconButton,
  Input,
  Select,
  Text,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import { getCurrencySymbol } from "@kapital/utils/src/helpers/currency";
import { Currency } from "@kapital/utils/src/types/currency";
import React from "react";
import { ArrowRightIcon } from "../components/Icons";
import useOfferings, { ConversionPath } from "../hooks/useOfferings";

const initialCurrencyList: Currency[] = [
  "NGN",
  "GHS",
  "KES",
  "ZAR",
  "MAD",
  "EGP",
  "JPY",
  "GBP",
  "CAD",
  "USD",
  "EUR",
  "USDC",
  "BTC",
];

export interface ISendMoney {
  sendPayload: {
    baseCurrency?: Currency;
    pairCurrency?: Currency;
    baseAmount?: number;
    pairAmount?: number;
    isLoadingOfferings?: boolean;
    conversionPaths?: ConversionPath[];
    showOfferings?: boolean;
  };
  baseCurrencies?: Currency[];
  pairCurrencies?: Currency[];
  setSendPayload: (v: ISendMoney["sendPayload"]) => void;
  isLoadingOfferings: boolean;
}

interface CurrencyInputProps {
  currency: Currency;
  amount: string;
  onAmountChange: (value: string) => void;
  onCurrencyChange: (value: Currency) => void;
  currencyList: Currency[];
}

const CurrencyInput: React.FC<CurrencyInputProps> = ({
  currency,
  amount,
  onAmountChange,
  onCurrencyChange,
  currencyList,
}) => {
  const bgColor = useColorModeValue("gray.100", "gray.700");
  const borderColor = useColorModeValue("gray.300", "gray.600");

  return (
    <Flex
      bg={bgColor}
      borderRadius="xl"
      border="1px"
      borderColor={borderColor}
      p={2}
      alignItems="center"
    >
      <Select
        value={currency}
        onChange={(e) => onCurrencyChange(e.target.value as Currency)}
        variant="unstyled"
        icon={
          <VStack alignItems="center" h="100%" justify="center">
            <Text fontSize="lg" mr={2}>
              {getCurrencySymbol(currency)}
            </Text>
          </VStack>
        }
        width="auto"
        mr={2}
      >
        {currencyList.map((currency) => (
          <option key={currency} value={currency}>
            {currency}
          </option>
        ))}
      </Select>
      <Input
        flex={1}
        border="none"
        fontSize="lg"
        fontWeight="medium"
        textAlign="right"
        type="number"
        placeholder="0.0"
        value={amount}
        onChange={(e) => onAmountChange(e.target.value)}
        _focus={{ boxShadow: "none" }}
      />
    </Flex>
  );
};

const SendMoneyComponent: React.FC<ISendMoney> = ({
  sendPayload,
  setSendPayload,
  baseCurrencies,
  pairCurrencies,
  isLoadingOfferings,
}) => {
  const offrings = useOfferings();
  const handleGetOfferings = async () => {
    setSendPayload({
      isLoadingOfferings: true,
      conversionPaths: [],
      showOfferings: true,
    });
    try {
      const paths = await offrings.fetchOfferings({
        baseCurrency: sendPayload.baseCurrency!,
        pairCurrency: sendPayload.pairCurrency!,
      });
      setSendPayload({ isLoadingOfferings: false, conversionPaths: paths });
    } catch {
      setSendPayload({ isLoadingOfferings: false });
    }
  };

  return (
    <Box maxWidth="600px" mx="auto" mt={8}>
      <Flex alignItems="center" mb={4}>
        <CurrencyInput
          currency={sendPayload.baseCurrency!}
          amount={String(sendPayload.baseAmount || "")}
          onAmountChange={(amt) =>
            setSendPayload({ baseAmount: Number(amt), pairAmount: 0 })
          }
          onCurrencyChange={(curr: Currency) =>
            setSendPayload({ baseCurrency: curr })
          }
          currencyList={baseCurrencies || initialCurrencyList}
        />
        <IconButton
          icon={<ArrowRightIcon />}
          aria-label="Send currencies"
          variant="ghost"
          mx={2}
        />
        <CurrencyInput
          currency={sendPayload.pairCurrency!}
          amount={String(sendPayload.pairAmount || "")}
          onAmountChange={(amt) =>
            setSendPayload({ pairAmount: Number(amt), baseAmount: 0 })
          }
          onCurrencyChange={(curr: Currency) =>
            setSendPayload({ pairCurrency: curr })
          }
          currencyList={pairCurrencies || initialCurrencyList}
        />
      </Flex>

      <Button
        colorScheme="blue"
        size="lg"
        width="100%"
        borderRadius="xl"
        isLoading={isLoadingOfferings}
        onClick={handleGetOfferings}
      >
        Get Offerings
      </Button>
    </Box>
  );
};

export default SendMoneyComponent;
