import { Account } from "../Account";

export interface AccountState {
  account: Account | null;
  isLocked: boolean;
  exchangeRatings?: {
    [exchangeId: string]: {
      pfiDid: string;
      rating: number;
    };
  };
}

export interface RootState {
  account: AccountState;
}

export interface Offering {
  id: string;
  metadata: {
    id: string;
    createdAt: string;
    from: string;
    kind: "offering";
    protocol: "1.0";
  };
  data: {
    description: string;
    payoutUnitsPerPayinUnit: string;
    payin: {
      currencyCode: string;
      min?: number;
      max?: number;
      methods?: Array<{ kind: string; requiredPaymentDetails: any }>;
    };
    payout: {
      currencyCode: string;
      methods: Array<{
        kind: string;
        estimatedSettlementTime?: number;
        requiredPaymentDetails: {
          required?: string[];
          title?: string;
          properties: Record<
            string,
            {
              title: string;
              type: string;
              pattern?: string;
              description: string;
            }
          >;
        };
      }>;
    };
    requiredClaims?: {
      id: string;
      format: {
        jwt_vc?: { alg: Array<any> };
      };
      input_descriptors: Array<any>;
    };
  };
  signature: string;
}
