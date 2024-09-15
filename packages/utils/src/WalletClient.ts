import { Close, Order, Rfq, TbdexHttpClient } from "@tbdex/http-client";
import { Account } from "./Account";

export class WalletClient {
  private account: Account;
  private tbdexClient: TbdexHttpClient;
  private pfiAllowlist: any[];

  constructor(account: Account) {
    this.account = account;
    this.tbdexClient = new TbdexHttpClient();
    this.pfiAllowlist = [];
  }

  public async initialize() {
    this.account.getCredentials();
    this.account.getTransactions();
    await this.fetchPfiAllowlist();
  }

  private async fetchPfiAllowlist() {
    // In a real-world scenario, this would be fetched from a server or blockchain
    this.pfiAllowlist = [
      {
        pfiUri: "did:dht:qewzcx3fj8uuq7y551deqdfd1wbe6ymicr8xnua3xzkdw4n6j3bo",
        pfiName: "AquaFinance Capital",
        pfiDescription:
          "Provides exchanges with the Ghanaian Cedis: GHS to USDC, GHS to KES",
      },
      // Add more PFIs as needed
    ];
  }

  public async fetchOfferings() {
    const offerings = [];
    for (const pfi of this.pfiAllowlist) {
      try {
        const pfiOfferings = await this.tbdexClient.getOfferings({
          pfiDid: pfi.pfiUri,
        });
        offerings.push(...pfiOfferings);
      } catch (error) {
        console.error(`Failed to fetch offerings from ${pfi.pfiName}:`, error);
      }
    }
    return offerings;
  }

  public async submitRfq(
    offering: any,
    payinAmount: number,
    payoutAmount: number
  ) {
    const rfq = await Rfq.create({
      metadata: {
        from: this.account.getDid(),
        to: offering.metadata.from,
      },
      data: {
        offeringId: offering.id,
        payinAmount: {
          currency: offering.data.payinCurrency,
          amount: payinAmount.toString(),
        },
        payoutAmount: {
          currency: offering.data.payoutCurrency,
          amount: payoutAmount.toString(),
        },
        claims: this.account.getCredentials(),
      },
    });

    const submittedRfq = await this.tbdexClient.submitRfq(rfq);
    this.account.addTransaction({
      type: "RFQ",
      data: submittedRfq,
      timestamp: new Date().toISOString(),
    });
    return submittedRfq;
  }

  public async submitOrder(rfq: any, quote: any) {
    const order = await Order.create({
      metadata: {
        from: this.account.getDid(),
        to: quote.metadata.from,
      },
      data: {
        rfqId: rfq.id,
        quoteId: quote.id,
      },
    });

    const submittedOrder = await this.tbdexClient.submitOrder(order);
    this.account.addTransaction({
      type: "Order",
      data: submittedOrder,
      timestamp: new Date().toISOString(),
    });
    return submittedOrder;
  }

  public async closeOrder(order: any, reason: string) {
    const close = await Close.create({
      metadata: {
        from: this.account.getDid(),
        to: order.metadata.to,
      },
      data: {
        orderId: order.id,
        reason: reason,
      },
    });

    const closedOrder = await this.tbdexClient.submitClose(close);
    this.account.addTransaction({
      type: "Close",
      data: closedOrder,
      timestamp: new Date().toISOString(),
    });
    return closedOrder;
  }

  public getTransactionHistory(): any[] {
    return this.account.getTransactions();
  }
}
