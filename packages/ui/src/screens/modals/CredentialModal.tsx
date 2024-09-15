import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { RootState } from "@kapital/utils/src/types";
import { createNewCredential } from "@kapital/utils/src/web5/credentials";
import React, { useState } from "react";
import { useSelector } from "react-redux";

export interface Credential {
  id: string;
  schema: string;
  issuer: string;
  name?: string;
  expirationDate?: string;
  payload?: any;
}

interface CredentialModalProps {
  isOpen: boolean;
  onClose: () => void;
  requiredCredentials: Credential[];
  selectedCredentials: { id: string; jwt: string; payload?: any }[];
  setSelectedCredentials: (
    credentials: { id: string; jwt: string; payload?: any }[]
  ) => void;
  onSubmit: () => void;
  userDid: string;
}

const CredentialModal: React.FC<CredentialModalProps> = ({
  isOpen,
  onClose,
  requiredCredentials,
  selectedCredentials,
  setSelectedCredentials,
  onSubmit,
  userDid,
}) => {
  const toast = useToast();
  const { account } = useSelector((state: RootState) => state.account);

  const [credentialInput, setCredentialInput] = useState({
    name: "",
    country: "",
  });
  const [fetchingCredential, setFetchingCredential] = useState(false);
  const handleCreateCredential = async (credential: Credential) => {
    setFetchingCredential(true);
    try {
      const credentialJwt = await createNewCredential(
        // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
        account?.getWeb5()!,
        userDid,
        credentialInput.name,
        credentialInput.country,
        credential.schema,
        credential.issuer
      );
      setSelectedCredentials([
        ...selectedCredentials,
        {
          id: credential.id,
          jwt: credentialJwt,
          payload: {
            name: credentialInput.name,
            country: credentialInput.country,
          },
        },
      ]);
    } catch (error) {
      console.error("Error fetching credential:", error);
      toast({
        title: "Error",
        description: String(error),
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setFetchingCredential(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Provide Credentials</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Alert status="info" mb={4}>
            <VStack alignItems={"flex-start"}>
              <HStack gap={2}>
                <AlertIcon />
                <AlertTitle mr={2}>Credential Required</AlertTitle>
              </HStack>
              <Box>
                <AlertDescription fontSize={"0.85rem"}>
                  The providers require some credentials for the exchange.
                </AlertDescription>
              </Box>
            </VStack>
          </Alert>
          <VStack spacing={4}>
            {requiredCredentials.map((credential) => {
              const provided = selectedCredentials.find(
                (c) => c.id === credential.id
              );
              return (
                <Box key={credential.id} width="100%">
                  <VStack spacing={4} mb="8px" align="stretch">
                    <Input
                      placeholder="Name"
                      value={
                        credentialInput.name || provided?.payload?.name || ""
                      }
                      onChange={(e) =>
                        setCredentialInput({
                          ...credentialInput,
                          name: e.target.value,
                        })
                      }
                      disabled={!!provided}
                    />
                    <Input
                      placeholder="Country"
                      value={
                        credentialInput.country ||
                        provided?.payload?.country ||
                        ""
                      }
                      onChange={(e) =>
                        setCredentialInput({
                          ...credentialInput,
                          country: e.target.value,
                        })
                      }
                      disabled={!!provided}
                    />
                  </VStack>

                  <Box mb="1rem">
                    <Text fontWeight="bold">{`Credential: ${credential.id}`}</Text>
                    {provided ? (
                      <VStack align="stretch" spacing={2} mt={2}>
                        <Text color="green.500">Provided</Text>
                        {provided.payload?.expiresAt && (
                          <Text fontSize="sm" color="gray.600">
                            Expires on: {formatDate(provided.payload.expiresAt)}
                          </Text>
                        )}
                        {provided.payload?.type && (
                          <Text fontSize="sm" color="gray.600">
                            Type: {provided.payload.type}
                          </Text>
                        )}
                      </VStack>
                    ) : (
                      <Button
                        onClick={() => handleCreateCredential(credential)}
                        isLoading={fetchingCredential}
                        disabled={
                          !credentialInput.name || !credentialInput.country
                        }
                        mt={2}
                      >
                        Submit Credential
                      </Button>
                    )}
                  </Box>
                </Box>
              );
            })}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button
            colorScheme="blue"
            mr={3}
            onClick={onSubmit}
            isDisabled={selectedCredentials.length < requiredCredentials.length}
          >
            Proceed
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CredentialModal;
