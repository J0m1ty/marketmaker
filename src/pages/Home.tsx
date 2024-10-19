import { useColorModeValue, Text } from "@chakra-ui/react";

function Home() {
    return (
        <Text color={useColorModeValue('white', 'black')}>
            Main content
        </Text>
    );
}

export default Home;