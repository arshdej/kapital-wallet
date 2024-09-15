export const fetchCredential = async (
  did: string,
  name: string,
  country: string
): Promise<string> => {
  const response = await fetch(
    `https://mock-idv.tbddev.org/kcc?name=${encodeURIComponent(
      name
    )}&country=${encodeURIComponent(country)}&did=${did}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch credential");
  }

  return await response.text();
};
