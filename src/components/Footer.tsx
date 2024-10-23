import { Box, Stack, Text, useColorModeValue } from "@chakra-ui/react";

function Footer() {
    const bgColor = useColorModeValue("#ffffff", "#1d2528");
    const bgBorderColor = useColorModeValue("#e1e1e1", "#161b1e");
    const textColor = useColorModeValue("#000000", "#60686A");

    return (
        <Box
            as="footer"
            bg={bgColor}
            width="100vw"
            height="30px"
            minH="30px"
            border={bgBorderColor}
            alignContent={"center"}
            className="nonselectable"
        >
            <Stack direction={"row"} align={"center"} justifyContent={"space-between"} width="100%" px={2}>
                <Text fontSize="sm" color={textColor}>
                    Market Maker v0.1.0
                </Text>
                <Text fontSize="sm" color={textColor}>
                    Made by Jonathan Schultz
                </Text>
            </Stack>
        </Box>
    )
}

export default Footer;