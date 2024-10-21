import { Box, Stack, Text, useColorModeValue } from "@chakra-ui/react";

function Footer() {
    return (
        <Box
            as="footer"
            bg={useColorModeValue("white", "#1d2528")}
            width="100vw"
            height="30px"
            minH="30px"
            border={useColorModeValue("1px solid #e1e1e1", "1px solid #161b1e")}
            alignContent={"center"}
        >
            <Stack direction={"row"} align={"center"} justifyContent={"space-between"} width="100%" px={2}>
                <Text fontSize="sm" color={useColorModeValue("#000000", "#60686A")}>
                    Market Maker v0.1.0
                </Text>
                <Text fontSize="sm" color={useColorModeValue("#000000", "#60686A")}>
                    Made by Jonathan Schultz
                </Text>
            </Stack>
        </Box>
    )
}

export default Footer;