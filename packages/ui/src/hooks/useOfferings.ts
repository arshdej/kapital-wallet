import { Currency } from "@kapital/utils/src/types/currency";
import { Offering, TbdexHttpClient } from "@tbdex/http-client";
import { useCallback, useMemo } from "react";

interface PFIInfo {
  uri: string;
  name: string;
  description: string;
  supportedCurrencies: {
    [key: string]: Currency[];
  };
}

export interface ConversionPath {
  path: string[];
  pfis: string[];
  offerings?: Offering[];
}

const sampleOffer = [
  {
    metadata: {
      from: "did:dht:3fkz5ssfxbriwks3iy5nwys3q5kyx64ettp9wfn1yfekfkiguj1y",
      protocol: "1.0",
      kind: "offering",
      id: "offering_01j609945hf088ftk6vgke40y3",
      createdAt: "2024-08-23T18:51:45.714Z",
    },
    data: {
      description: "Exchange your Ghanaian Cedis for USDC",
      payoutUnitsPerPayinUnit: "0.10",
      payout: {
        currencyCode: "USDC",
        methods: [
          {
            kind: "USDC_WALLET_ADDRESS",
            estimatedSettlementTime: 43200,
            requiredPaymentDetails: {
              $schema: "http://json-schema.org/draft-07/schema#",
              title: "USDC Required Payment Details",
              type: "object",
              required: ["address"],
              additionalProperties: false,
              properties: {
                address: {
                  title: "USDC Wallet Address",
                  description: "Wallet address to pay out USDC to",
                  type: "string",
                },
              },
            },
          },
        ],
      },
      payin: {
        currencyCode: "GHS",
        methods: [
          {
            kind: "GHS_BANK_TRANSFER",
            requiredPaymentDetails: {},
          },
        ],
      },
      requiredClaims: {
        id: "3f78edc1-9f75-478b-a0d8-c9ee2550d366",
        format: {
          jwt_vc: {
            alg: ["ES256K", "EdDSA"],
          },
        },
        input_descriptors: [
          {
            id: "73b86039-d07e-4f9a-9f3d-a8f7a8ec1635",
            constraints: {
              fields: [
                {
                  path: ["$.vc.credentialSchema.id", "$.credentialSchema.id"],
                  filter: {
                    type: "string",
                    const: "https://vc.schemas.host/kcc.schema.json",
                  },
                },
                {
                  path: ["$.vc.issuer", "$.issuer"],
                  filter: {
                    type: "string",
                    const:
                      "did:dht:bh8me68fsdb6xuyy3dsh4aanczexga3k3m7fk4ie6hj5jy6inq5y",
                  },
                },
              ],
            },
          },
        ],
      },
    },
    signature:
      "eyJhbGciOiJFZERTQSIsImtpZCI6ImRpZDpkaHQ6M2ZrejVzc2Z4YnJpd2tzM2l5NW53eXMzcTVreXg2NGV0dHA5d2ZuMXlmZWtma2lndWoxeSMwIn0..OGRjggiDJlZc0SGdBVD2BeLuolMTQNuRpVGAvO3R20Y11nv5O-I-4lA92SVlfgfSTnsubzLrrG2GeSssJn4LCw",
  },
  {
    metadata: {
      from: "did:dht:3fkz5ssfxbriwks3iy5nwys3q5kyx64ettp9wfn1yfekfkiguj1y",
      protocol: "1.0",
      kind: "offering",
      id: "offering_01j609945vfm49rf5zef5sp5rr",
      createdAt: "2024-08-23T18:51:45.723Z",
    },
    data: {
      description: "Exchange your Nigerian Naira for Kenyan Shilling",
      payoutUnitsPerPayinUnit: "0.30",
      payout: {
        currencyCode: "KES",
        methods: [
          {
            kind: "KES_BANK_TRANSFER",
            estimatedSettlementTime: 86400,
            requiredPaymentDetails: {
              $schema: "http://json-schema.org/draft-07/schema#",
              title: "KES Required Payment Details",
              type: "object",
              required: ["accountNumber"],
              additionalProperties: false,
              properties: {
                accountNumber: {
                  title: "KES Bank Account Number",
                  description: "Bank account number to pay out KES to",
                  type: "string",
                },
              },
            },
          },
        ],
      },
      payin: {
        currencyCode: "NGN",
        methods: [
          {
            kind: "NGN_BANK_TRANSFER",
            requiredPaymentDetails: {},
          },
        ],
      },
      requiredClaims: {
        id: "3f78edc1-9f75-478b-a0d8-c9ee2550d366",
        format: {
          jwt_vc: {
            alg: ["ES256K", "EdDSA"],
          },
        },
        input_descriptors: [
          {
            id: "73b86039-d07e-4f9a-9f3d-a8f7a8ec1635",
            constraints: {
              fields: [
                {
                  path: ["$.vc.credentialSchema.id", "$.credentialSchema.id"],
                  filter: {
                    type: "string",
                    const: "https://vc.schemas.host/kcc.schema.json",
                  },
                },
                {
                  path: ["$.vc.issuer", "$.issuer"],
                  filter: {
                    type: "string",
                    const:
                      "did:dht:bh8me68fsdb6xuyy3dsh4aanczexga3k3m7fk4ie6hj5jy6inq5y",
                  },
                },
              ],
            },
          },
        ],
      },
    },
    signature:
      "eyJhbGciOiJFZERTQSIsImtpZCI6ImRpZDpkaHQ6M2ZrejVzc2Z4YnJpd2tzM2l5NW53eXMzcTVreXg2NGV0dHA5d2ZuMXlmZWtma2lndWoxeSMwIn0..AFd9_PiUTlwTNtJe7S58Xj-KynxRnAe8rkk_BXqOkP0iQr7str2KeCfMZnTBGyMfxNTTX94qk9UILUu4GxStDA",
  },
  {
    metadata: {
      from: "did:dht:3fkz5ssfxbriwks3iy5nwys3q5kyx64ettp9wfn1yfekfkiguj1y",
      protocol: "1.0",
      kind: "offering",
      id: "offering_01j609945xe18tc33hfbvpx4zq",
      createdAt: "2024-08-23T18:51:45.725Z",
    },
    data: {
      description: "Exchange your Kenyan Shilling for US Dollars",
      payoutUnitsPerPayinUnit: "0.007",
      payout: {
        currencyCode: "USD",
        methods: [
          {
            kind: "USD_BANK_TRANSFER",
            estimatedSettlementTime: 43200,
            requiredPaymentDetails: {
              $schema: "http://json-schema.org/draft-07/schema#",
              title: "USD Required Payment Details",
              type: "object",
              required: ["accountNumber", "routingNumber"],
              additionalProperties: false,
              properties: {
                accountNumber: {
                  title: "USD Bank Account Number",
                  description: "Bank account number to pay out USD to",
                  type: "string",
                },
                routingNumber: {
                  title: "USD Bank Routing Number",
                  description: "Bank routing number for the USD account",
                  type: "string",
                },
              },
            },
          },
        ],
      },
      payin: {
        currencyCode: "KES",
        methods: [
          {
            kind: "KES_BANK_TRANSFER",
            requiredPaymentDetails: {},
          },
        ],
      },
      requiredClaims: {
        id: "3f78edc1-9f75-478b-a0d8-c9ee2550d366",
        format: {
          jwt_vc: {
            alg: ["ES256K", "EdDSA"],
          },
        },
        input_descriptors: [
          {
            id: "73b86039-d07e-4f9a-9f3d-a8f7a8ec1635",
            constraints: {
              fields: [
                {
                  path: ["$.vc.credentialSchema.id", "$.credentialSchema.id"],
                  filter: {
                    type: "string",
                    const: "https://vc.schemas.host/kcc.schema.json",
                  },
                },
                {
                  path: ["$.vc.issuer", "$.issuer"],
                  filter: {
                    type: "string",
                    const:
                      "did:dht:bh8me68fsdb6xuyy3dsh4aanczexga3k3m7fk4ie6hj5jy6inq5y",
                  },
                },
              ],
            },
          },
        ],
      },
    },
    signature:
      "eyJhbGciOiJFZERTQSIsImtpZCI6ImRpZDpkaHQ6M2ZrejVzc2Z4YnJpd2tzM2l5NW53eXMzcTVreXg2NGV0dHA5d2ZuMXlmZWtma2lndWoxeSMwIn0..IZ9gWZw1H0vgvJNFbmAoxflExbbW29RhReQ8JmHsNtSvuCvDDijJOHIs5qtzW9xG_jvYVPUYXCYer9F7VG3ODg",
  },
  {
    metadata: {
      from: "did:dht:3fkz5ssfxbriwks3iy5nwys3q5kyx64ettp9wfn1yfekfkiguj1y",
      protocol: "1.0",
      kind: "offering",
      id: "offering_01j609945yeat8m92mzgc12nk0",
      createdAt: "2024-08-23T18:51:45.726Z",
    },
    data: {
      description: "Exchange your US Dollars for Kenyan Shilling",
      payoutUnitsPerPayinUnit: "140.00",
      payout: {
        currencyCode: "KES",
        methods: [
          {
            kind: "KES_BANK_TRANSFER",
            estimatedSettlementTime: 43200,
            requiredPaymentDetails: {
              $schema: "http://json-schema.org/draft-07/schema#",
              title: "KES Required Payment Details",
              type: "object",
              required: ["accountNumber"],
              additionalProperties: false,
              properties: {
                accountNumber: {
                  title: "KES Bank Account Number",
                  description: "Bank account number to pay out KES to",
                  type: "string",
                },
              },
            },
          },
        ],
      },
      payin: {
        currencyCode: "USD",
        methods: [
          {
            kind: "USD_BANK_TRANSFER",
            requiredPaymentDetails: {
              $schema: "http://json-schema.org/draft-07/schema#",
              title: "USD Required Payment Details",
              type: "object",
              required: ["accountNumber", "routingNumber"],
              additionalProperties: false,
              properties: {
                accountNumber: {
                  title: "USD Bank Account Number",
                  description: "Bank account number to pay in USD",
                  type: "string",
                },
                routingNumber: {
                  title: "USD Bank Routing Number",
                  description: "Bank routing number for the USD account",
                  type: "string",
                },
              },
            },
          },
        ],
      },
      requiredClaims: {
        id: "3f78edc1-9f75-478b-a0d8-c9ee2550d366",
        format: {
          jwt_vc: {
            alg: ["ES256K", "EdDSA"],
          },
        },
        input_descriptors: [
          {
            id: "73b86039-d07e-4f9a-9f3d-a8f7a8ec1635",
            constraints: {
              fields: [
                {
                  path: ["$.vc.credentialSchema.id", "$.credentialSchema.id"],
                  filter: {
                    type: "string",
                    const: "https://vc.schemas.host/kcc.schema.json",
                  },
                },
                {
                  path: ["$.vc.issuer", "$.issuer"],
                  filter: {
                    type: "string",
                    const:
                      "did:dht:bh8me68fsdb6xuyy3dsh4aanczexga3k3m7fk4ie6hj5jy6inq5y",
                  },
                },
              ],
            },
          },
        ],
      },
    },
    signature:
      "eyJhbGciOiJFZERTQSIsImtpZCI6ImRpZDpkaHQ6M2ZrejVzc2Z4YnJpd2tzM2l5NW53eXMzcTVreXg2NGV0dHA5d2ZuMXlmZWtma2lndWoxeSMwIn0..5vG4pVZlHGF8UH6LbZhkYXbV59QgZpNc7UTarH3OCj5ihP50YD9X4sXUg4_8shsfDfTxqFL_w7qu3Ge3r9iTDg",
  },
];

// Remark: the protocol should expose a discovery api that includes supportedCurrencies mapping
// pfi should announce their availability, and supported currencies to this api,
// and wallet can fetch accordingly
// TODO: store this providerDids in a CENTRAL DWN control by the wallet maker DID (our DID)
const mockProviderDids: { [key: string]: PFIInfo } = {
  aquafinance_capital: {
    uri: "did:dht:3fkz5ssfxbriwks3iy5nwys3q5kyx64ettp9wfn1yfekfkiguj1y",
    name: "AquaFinance Capital",
    description: "Provides exchanges with the Ghanaian Cedis",
    supportedCurrencies: {
      GHS: ["USDC"],
      NGN: ["KES"],
      KES: ["USD"],
      USD: ["KES"],
    },
  },
  swiftliquidity_solutions: {
    uri: "did:dht:zz3m6ph36p1d8qioqfhp5dh5j6xn49cequ1yw9jnfxbz1uyfnddy",
    name: "SwiftLiquidity Solutions",
    description:
      "Offers exchange rates with the South African Rand: ZAR to BTC and EUR to ZAR.",
    supportedCurrencies: {
      ZAR: ["BTC"],
      EUR: ["ZAR"],
    },
  },
  flowback_financial: {
    uri: "did:dht:zkp5gbsqgzn69b3y5dtt5nnpjtdq6sxyukpzo68npsf79bmtb9zy",
    name: "Flowback Financial",
    description:
      "Offers international rates with various currencies - USD to GBP, EUR to USD.",
    supportedCurrencies: {
      USD: ["EUR", "GBP", "BTC"],
      EUR: ["USD"],
    },
  },
  vertex_liquid_assets: {
    uri: "did:dht:enwguxo8uzqexq14xupe4o9ymxw3nzeb9uug5ijkj9rhfbf1oy5y",
    name: "Vertex Liquid Assets",
    description: "Offers currency exchanges between USD and EUR.",
    supportedCurrencies: {
      USD: ["EUR"],
      EUR: ["USD", "USDC", "GBP"],
    },
  },
  titanium_trust: {
    uri: "did:dht:ozn5c51ruo7z63u1h748ug7rw5p1mq3853ytrd5gatu9a8mm8f1o",
    name: "Titanium Trust",
    description:
      "Provides offerings to exchange USD to African currencies - USD to GHS, USD to KES.",
    supportedCurrencies: {
      USD: ["AUD", "GBP", "MXN", "KES"],
    },
  },
};

function getSupportedCurrencies(pfiData: { [key: string]: PFIInfo }): {
  baseCurrencies: Set<Currency>;
  pairCurrencies: Set<Currency>;
} {
  const baseCurrencies = new Set<Currency>();
  const pairCurrencies = new Set<Currency>();

  Object.values(pfiData).forEach((pfi: PFIInfo) => {
    Object.entries(pfi.supportedCurrencies).forEach(([base, pairs]) => {
      baseCurrencies.add(base as Currency);
      pairs.forEach((pair) => pairCurrencies.add(pair));
    });
  });

  return { baseCurrencies, pairCurrencies };
}

const filteredPfiList = ({
  baseCurrency,
  pairCurrency,
}: {
  baseCurrency: Currency;
  pairCurrency: Currency;
}): ConversionPath[] => {
  const graph: { [key: string]: { [key: string]: string } } = {};
  const pfiMap: { [key: string]: Set<string> } = {};

  // Build the graph and PFI map
  Object.entries(mockProviderDids).forEach(([pfi, info]) => {
    Object.entries(info.supportedCurrencies).forEach(([base, pairs]) => {
      if (!graph[base]) graph[base] = {};
      pairs.forEach((pair) => {
        graph[base][pair] = pfi;
        if (!pfiMap[`${base}-${pair}`]) pfiMap[`${base}-${pair}`] = new Set();
        pfiMap[`${base}-${pair}`].add(pfi);
      });
    });
  });

  // Breadth-First Search to find all possible paths
  const queue: ConversionPath[] = [{ path: [baseCurrency], pfis: [] }];
  const results: ConversionPath[] = [];

  while (queue.length > 0) {
    const { path, pfis } = queue.shift()!;
    const lastCurrency = path[path.length - 1];

    if (lastCurrency === pairCurrency) {
      results.push({ path, pfis });
      continue;
    }

    if (graph[lastCurrency]) {
      Object.entries(graph[lastCurrency]).forEach(([nextCurrency, pfi]) => {
        if (!path.includes(nextCurrency)) {
          queue.push({
            path: [...path, nextCurrency],
            pfis: [...pfis, pfi],
          });
        }
      });
    }
  }

  return results;
};

const pickApplicableOffer = ({
  offerings,
  baseCurrency,
  pairCurrency,
}: {
  offerings: Offering[];
  baseCurrency: Currency;
  pairCurrency: Currency;
}) => {
  return offerings.filter((ofr) => {
    if (
      ofr?.data?.payin?.currencyCode === baseCurrency &&
      ofr?.data?.payout?.currencyCode === pairCurrency
    ) {
      return true;
    }
    return false;
  });
};

export default function useOfferings() {
  const fetchOfferings = useCallback(
    async ({
      baseCurrency,
      pairCurrency,
    }: {
      refetch?: boolean;
      baseCurrency: Currency;
      pairCurrency: Currency;
    }) => {
      const matchingPFIs = filteredPfiList({ baseCurrency, pairCurrency });
      const offerings = await Promise.all(
        matchingPFIs.map(async (p) => {
          const pWithOfferings = { ...p };
          const offerings = await Promise.all(
            p.pfis.map(async (p2, index) => {
              const thePFI = mockProviderDids[p2];
              const bc = p.path[index] as Currency;
              const pc = p.path[index + 1] as Currency;
              try {
                const offer = await TbdexHttpClient.getOfferings({
                  pfiDid: thePFI.uri,
                });

                return (
                  pickApplicableOffer({
                    offerings: offer,
                    baseCurrency: bc,
                    pairCurrency: pc,
                  })[0] || null
                );
              } catch (err) {
                console.log({ err });
                if (sampleOffer) {
                  return (
                    pickApplicableOffer({
                      offerings: sampleOffer as unknown as Offering[],
                      baseCurrency: bc,
                      pairCurrency: pc,
                    })[0] || null
                  );
                }
                return null;
              }
            })
          );
          pWithOfferings.offerings = offerings.filter((offr) => !!offr);
          return pWithOfferings;
        })
      );
      console.log({ offerings });
      return offerings;
    },
    []
  );
  return { fetchOfferings };
}

export function useSupportedCurrencies() {
  const { baseCurrencies, pairCurrencies } =
    getSupportedCurrencies(mockProviderDids);

  const allCurrencies = useMemo(() => {
    const list = [...baseCurrencies, ...pairCurrencies];
    return [...new Set(list)];
  }, [baseCurrencies, pairCurrencies]);
  return {
    allCurrencies,
    baseCurrencies: [...baseCurrencies],
    pairCurrencies: [...pairCurrencies],
  };
}
