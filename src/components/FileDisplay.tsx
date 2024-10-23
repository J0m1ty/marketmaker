import { Box, Text, useColorModeValue } from "@chakra-ui/react";

function FileDisplay({ content }: { content: string }) {
    const contentColor = useColorModeValue("#000000", "#eeeeee");

    

    return (
        <Box flex={1} px={10}>
            <Text color={contentColor}>
                {content}
            </Text>
        </Box>
    )
}

export default FileDisplay;