import { useColorModeValue, Box } from "@chakra-ui/react";
import Dropbox from "../components/Dropbox";

function Entry() {
    return (
        <Box
            w="100vw"
            flexDirection={"column"}
            flex={1}
            px={10}
            pt={10}
            backgroundColor={useColorModeValue("white", "#1d2528")}
        >
            <Dropbox />
        </Box>
    );
}

export default Entry;