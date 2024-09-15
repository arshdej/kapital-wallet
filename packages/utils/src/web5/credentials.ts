import { Web5 } from "@web5/api/browser";
import { VerifiableCredential } from "@web5/credentials";

export const fetchCredentialsFromDWN = async (
  web5: Web5,
  userDid: string,
  requiredCredentials: any[]
) => {
  const existingCredentials = [];

  for (const cred of requiredCredentials) {
    try {
      const { records } = await web5.dwn.records.query({
        // from: userDid,
        message: {
          filter: {
            schema: cred.schema,
            //   issuer: cred.issuer,
            dataFormat: "application/vc+jwt",
          },
        },
      });

      if (records.length > 0) {
        const latestRecord = records.reduce((latest, current) =>
          new Date(current.dateCreated) > new Date(latest.dateCreated)
            ? current
            : latest
        );
        const credentialData = await latestRecord.data.text();

        const credential = VerifiableCredential.parseJwt({
          vcJwt: credentialData,
        });

        const payload = {
          name: credential.vcDataModel.credentialSubject.name,
          country: credential.vcDataModel.credentialSubject.countryOfResidence,
          expiresAt: new Date(
            credential.vcDataModel.expirationDate
          ).toISOString(),
          issuer: credential.vcDataModel.issuer,
          type: credential.vcDataModel.type[1],
        };

        existingCredentials.push({ id: cred.id, jwt: credentialData, payload });
      }
    } catch (err) {
      console.log("[fetchCredentialsFromDWN]: ", err);
    }
  }

  return existingCredentials;
};

export const createNewCredential = async (
  web5: Web5,
  userDid: string,
  name: string,
  country: string,
  schema: string,
  issuer: string
): Promise<string> => {
  try {
    const response = await fetch(
      `https://mock-idv.tbddev.org/kcc?name=${encodeURIComponent(
        name
      )}&country=${encodeURIComponent(country)}&did=${userDid}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch credential");
    }

    const credentialJwt = await response.text();
    console.log({ credentialJwt });

    // Save credential to DWN
    await web5.dwn.records.create({
      data: credentialJwt,
      message: {
        schema,
        dataFormat: "application/vc+jwt",
      },
    });

    return credentialJwt;
  } catch (error) {
    console.error("Error fetching or storing credential:", error);
    throw error;
  }
};
