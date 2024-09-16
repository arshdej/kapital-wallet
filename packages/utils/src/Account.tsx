import { Web5 } from "@web5/api/browser";
import { Wallet } from "./Wallet";

export class Account {
  private did: string;
  private wallet: Wallet;
  private lastAccess: Date;
  private web5: Web5;
  private static readonly TIMEOUT_DURATION = 15 * 60 * 1000; // 15 minutes

  private constructor(wallet: Wallet) {
    this.wallet = wallet;
    this.did = wallet.getDid();
    this.lastAccess = new Date();
  }

  public static async loadWallet(password: string): Promise<Account> {
    const wallet = new Wallet();
    await wallet.initialize(password);
    await wallet.initializeDid();
    const acc = new Account(wallet);

    try {
      const { web5 } = await Web5.connect({
        password: password,
        // sync: true,
      });
      acc.web5 = web5;
    } catch (err) {
      console.log(err);
    }
    return acc;
  }
  public static async create(password: string): Promise<Account> {
    return this.loadWallet(password);
  }

  public getDid(): string {
    return this.did;
  }

  public getConnectedDid() {
    return this.wallet.getConnectedDid();
  }

  public getWeb5(): Web5 {
    if (this.isLocked()) {
      throw new Error("Account is locked. Please unlock first.");
    }
    this.refresh();
    return this.web5;
  }

  public async refresh() {
    this.lastAccess = new Date();
  }

  public async unlock(password: string): Promise<boolean> {
    try {
      await this.wallet.initialize(password);
      this.lastAccess = new Date();
      return true;
    } catch {
      return false;
    }
  }

  public isLocked(): boolean {
    if (this.wallet.lockedOut) {
      return true;
    }
    const now = new Date();
    return now.getTime() - this.lastAccess.getTime() > Account.TIMEOUT_DURATION;
  }

  public lock(): void {
    this.wallet.lock();
    this.web5 = null;
  }

  public async signTransaction(transaction: any): Promise<string | null> {
    if (this.isLocked()) {
      throw new Error("Account is locked. Please unlock first.");
    }
    return await this.wallet.signTransaction(transaction);
  }

  public async addCredential(credential: any): Promise<void> {
    if (this.isLocked()) {
      throw new Error("Account is locked. Please unlock first.");
    }
    await this.wallet.addCredential(credential);
  }

  public getCredentials(): any[] {
    if (this.isLocked()) {
      throw new Error("Account is locked. Please unlock first.");
    }
    return this.wallet.getCredentials();
  }

  public async addTransaction(transaction: any): Promise<void> {
    if (this.isLocked()) {
      throw new Error("Account is locked. Please unlock first.");
    }
    await this.wallet.addTransaction(transaction);
  }

  public getTransactions(): any[] {
    if (this.isLocked()) {
      throw new Error("Account is locked. Please unlock first.");
    }
    return this.wallet.getTransactions();
  }

  public async changePassword(
    oldPassword: string,
    newPassword: string
  ): Promise<boolean> {
    try {
      await this.wallet.changePassword(oldPassword, newPassword);
      return true;
    } catch {
      return false;
    }
  }

  public async export(password: string): Promise<string | null> {
    if (await this.unlock(password)) {
      return JSON.stringify({
        did: this.did,
        encryptedWallet: localStorage.getItem("encryptedDid"),
        encryptedCredentials: localStorage.getItem("encryptedCredentials"),
        encryptedTransactions: localStorage.getItem("encryptedTransactions"),
        salt: localStorage.getItem("walletSalt"),
      });
    }
    return null;
  }

  public static async import(
    exportedData: string,
    password: string
  ): Promise<Account | null> {
    try {
      const {
        did,
        encryptedWallet,
        encryptedCredentials,
        encryptedTransactions,
        salt,
      } = JSON.parse(exportedData);

      localStorage.setItem("encryptedDid", encryptedWallet);
      localStorage.setItem("encryptedCredentials", encryptedCredentials);
      localStorage.setItem("encryptedTransactions", encryptedTransactions);
      localStorage.setItem("walletSalt", salt);

      const wallet = new Wallet();
      await wallet.initialize(password);
      const account = new Account(wallet);
      account.did = did;

      return account;
    } catch {
      return null;
    }
  }
}
