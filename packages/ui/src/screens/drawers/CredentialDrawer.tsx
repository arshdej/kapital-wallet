import {
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Text,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { Web5 } from "@web5/api/browser";
import { VerifiableCredential } from "@web5/credentials";
import React, { useEffect } from "react";
import EmptyState from "../../components/EmptyState";
import CustomSpinner from "../../components/Spinner";
import usePartialState from "../../hooks/usePartialState";

interface CredentialDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  web5: Web5;
  userDid: string;
}

interface Credential {
  id: string;
  payload: {
    name: string;
    country: string;
    expiresAt: string;
    issuer: string;
    type: string;
  };
  recordId: string;
}

const CredentialDrawer: React.FC<CredentialDrawerProps> = ({
  isOpen,
  onClose,
  web5,
  userDid,
}) => {
  const [state, set] = usePartialState({
    loading: false,
    credentials: [] as Credential[],
  });
  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchCredentials();
    }
  }, [isOpen]);

  const fetchCredentials = async () => {
    try {
      set({ loading: true });
      const { records } = await web5.dwn.records.query({
        message: {
          filter: {
            dataFormat: "application/vc+jwt",
          },
        },
      });

      const fetchedCredentials = await Promise.all(
        records.map(async (record) => {
          const credentialData = await record.data.text();
          const credential = VerifiableCredential.parseJwt({
            vcJwt: credentialData,
          });
          return {
            id: record.id,
            payload: {
              name: credential.vcDataModel.credentialSubject.name,
              country:
                credential.vcDataModel.credentialSubject.countryOfResidence,
              expiresAt: new Date(
                credential.vcDataModel.expirationDate
              ).toISOString(),
              issuer: credential.vcDataModel.issuer,
              type: credential.vcDataModel.type[1],
            },
            recordId: record.id,
          };
        })
      );

      set({ loading: false, credentials: fetchedCredentials });
    } catch (error) {
      console.error("Error fetching credentials:", error);
      toast({
        title: "Error",
        description: "Failed to fetch credentials",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      set({ loading: false });
    }
  };

  const handleDelete = async (recordId: string) => {
    try {
      const deleteResult = await web5.dwn.records.delete({
        message: {
          recordId,
        },
      });

      if (deleteResult.status.code === 202) {
        set({
          credentials: state?.credentials?.filter?.(
            (cred) => cred.recordId !== recordId
          ),
        });
        toast({
          title: "Credential Deleted",
          description: "The credential has been successfully deleted.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        throw new Error("Failed to delete credential");
      }
    } catch (error) {
      console.error("Error deleting credential:", error);
      toast({
        title: "Error",
        description: "Failed to delete credential",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>Your Credentials</DrawerHeader>
        <DrawerBody>
          {state.loading ? (
            <VStack spacing={4} my="2rem">
              <CustomSpinner />
            </VStack>
          ) : state?.credentials?.length === 0 ? (
            <EmptyState
              title="No Credentials Found"
              message="You don't have any credentials stored yet. Credentials will appear here when you obtain them during exchanges."
            />
          ) : (
            <VStack spacing={4} align="stretch">
              {state?.credentials?.map((cred) => (
                <Box key={cred.id} p={4} borderWidth={1} borderRadius="md">
                  <Text fontWeight="bold">{cred.payload.type}</Text>
                  <Text>Name: {cred.payload.name}</Text>
                  <Text>Country: {cred.payload.country}</Text>
                  <Text>
                    Expires:{" "}
                    {new Date(cred.payload.expiresAt).toLocaleDateString()}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    Issuer: {cred.payload.issuer}
                  </Text>
                  <Button
                    mt={2}
                    colorScheme="red"
                    size="sm"
                    onClick={() => handleDelete(cred.recordId)}
                  >
                    Delete
                  </Button>
                </Box>
              ))}
            </VStack>
          )}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};

export default CredentialDrawer;
