import { Box, Flex, keyframes, useToken } from "@chakra-ui/react";

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const CustomSpinner = ({
  size = "md",
  color = "blue.500",
  thickness = 4,
  speed = 0.65,
  ...props
}) => {
  const [spinnerColor] = useToken("colors", [color]);

  const sizeValues = {
    sm: "24px",
    md: "40px",
    lg: "64px",
    xl: "80px",
  };

  const spinnerSize = sizeValues[size] || size;

  return (
    <Flex justifyContent="center" alignItems="center" {...props}>
      <Box
        as="div"
        border={`${thickness}px solid`}
        borderColor="gray.200"
        borderTopColor={spinnerColor}
        borderRadius="50%"
        width={spinnerSize}
        height={spinnerSize}
        animation={`${spin} ${speed}s linear infinite`}
      />
    </Flex>
  );
};

export default CustomSpinner;

// Default spinner
{
  /* <CustomSpinner />

// Small, green spinner
<CustomSpinner size="sm" color="green.400" />

// Large, thick, slow-spinning custom color spinner
<CustomSpinner size="80px" color="#FF6B6B" thickness={6} speed={1.2} /> */
}
