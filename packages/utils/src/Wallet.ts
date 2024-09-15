import { DID } from "@tbdex/http-client";
import { Jwt } from "@web5/credentials";
import { DidDht } from "@web5/dids";

export class Wallet {
  private did: DID | null;
  private credentials: any[];
  private transactions: any[];
  private encryptionKey: CryptoKey | null;
  private salt: Uint8Array;
  public lockedOut: boolean;

  constructor() {
    this.did = null;
    this.credentials = [];
    this.transactions = [];
    this.encryptionKey = null;
    this.salt = new Uint8Array(16);
    this.lockedOut = false;
  }

  public async initialize(password: string) {
    await this.deriveEncryptionKey(password);
    await this.loadEncryptedData();
    this.lockedOut = false;
    console.log("wallet unlocked");
  }

  private async deriveEncryptionKey(password: string) {
    const storedSalt = localStorage.getItem("walletSalt");
    if (storedSalt) {
      this.salt = new Uint8Array(JSON.parse(storedSalt));
    } else {
      crypto.getRandomValues(this.salt);
      localStorage.setItem("walletSalt", JSON.stringify(Array.from(this.salt)));
    }

    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );

    this.encryptionKey = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: this.salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  }

  private async encrypt(data: any): Promise<string> {
    if (!this.encryptionKey) throw new Error("Encryption key not set");
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encodedData = new TextEncoder().encode(JSON.stringify(data));
    const encryptedData = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      this.encryptionKey,
      encodedData
    );
    const encryptedArray = new Uint8Array(encryptedData);
    const result = new Uint8Array(iv.length + encryptedArray.length);
    result.set(iv);
    result.set(encryptedArray, iv.length);
    return btoa(String.fromCharCode.apply(null, result as any));
  }

  private async decrypt(encryptedData: string): Promise<any> {
    if (!this.encryptionKey) throw new Error("Encryption key not set");
    const data = Uint8Array.from(atob(encryptedData), (c) => c.charCodeAt(0));
    const iv = data.slice(0, 12);
    const encryptedPayload = data.slice(12);
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      this.encryptionKey,
      encryptedPayload
    );
    return JSON.parse(new TextDecoder().decode(decrypted));
  }

  public async initializeDid() {
    try {
      const storedDid = localStorage.getItem("encryptedDid");
      if (storedDid) {
        const decryptedDid = await this.decrypt(storedDid);
        this.did = await DidDht.import({ portableDid: decryptedDid });
      } else {
        this.did = await DidDht.create({ options: { publish: true } });
        const exportedDid = await this.did.export();
        const encryptedDid = await this.encrypt(exportedDid);
        localStorage.setItem("encryptedDid", encryptedDid);
      }
    } catch (error) {
      console.error("Failed to initialize DID:", error);
    }
  }

  public getDid(): string {
    if (!this.did) throw new Error("DID not initialized");
    return this.did.uri;
  }

  public getConnectedDid(): DID {
    if (!this.did) throw new Error("DID not initialized");
    return this.did;
  }

  public async signTransaction(transaction: any): Promise<string> {
    if (!this.did) throw new Error("DID not initialized");
    const message = JSON.stringify(transaction);
    const signature = await this.did.signer.sign({
      data: Buffer.from(message),
    });
    return Buffer.from(signature).toString("base64");
  }

  private async loadEncryptedData() {
    try {
      await this.loadEncryptedCredentials();
      await this.loadEncryptedTransactions();
    } catch {}
  }

  private async loadEncryptedCredentials() {
    const encryptedCredentials = localStorage.getItem("encryptedCredentials");
    if (encryptedCredentials) {
      this.credentials = await this.decrypt(encryptedCredentials);
    }
  }

  public async addCredential(credential: any) {
    this.credentials.push(credential);
    const encryptedCredentials = await this.encrypt(this.credentials);
    localStorage.setItem("encryptedCredentials", encryptedCredentials);
  }

  public getCredentials(): any[] {
    return this.credentials;
  }

  public renderCredential(credentialJwt: string) {
    const vc = Jwt.parse({ jwt: credentialJwt }).decoded.payload["vc"];
    return {
      title: vc.type[vc.type.length - 1].replace(/([A-Z])/g, " $1").trim(),
      issuer: vc.issuer,
      issuanceDate: vc.issuanceDate,
      expirationDate: vc.expirationDate,
      claims: vc.credentialSubject,
    };
  }

  private async loadEncryptedTransactions() {
    const encryptedTransactions = localStorage.getItem("encryptedTransactions");
    if (encryptedTransactions) {
      this.transactions = await this.decrypt(encryptedTransactions);
    }
  }

  public async addTransaction(transaction: any) {
    this.transactions.push(transaction);
    const encryptedTransactions = await this.encrypt(this.transactions);
    localStorage.setItem("encryptedTransactions", encryptedTransactions);
  }

  public getTransactions(): any[] {
    return this.transactions;
  }

  public async changePassword(oldPassword: string, newPassword: string) {
    // Verify old password
    await this.deriveEncryptionKey(oldPassword);
    await this.loadEncryptedData();

    // Derive new key and re-encrypt data
    await this.deriveEncryptionKey(newPassword);
    const encryptedDid = await this.encrypt(await this.did?.export());
    const encryptedCredentials = await this.encrypt(this.credentials);
    const encryptedTransactions = await this.encrypt(this.transactions);

    // Save re-encrypted data
    localStorage.setItem("encryptedDid", encryptedDid);
    localStorage.setItem("encryptedCredentials", encryptedCredentials);
    localStorage.setItem("encryptedTransactions", encryptedTransactions);
  }

  // To lock the wallet (e.g., on logout)
  public async lock() {
    this.lockedOut = true;
    this.did = null;
    this.credentials = [];
    this.transactions = [];
    this.encryptionKey = null;
  }
}
