import { Spinner, Stack, Text } from "@chakra-ui/react";

function Loading({ text }: { text: string }) {
    return (
        <Stack
            w={"100vw"} 
            h={"100vh"}
            dir={"column"}
            spacing={2}
            display={"flex"}
            justifyContent={"center"}
            alignItems={"center"}
        >
            <Spinner size={"xl"} />
            <Text fontSize={"2xl"} fontWeight={"bold"}>
                { text }
            </Text>
        </Stack>
    );
}

export default Loading;