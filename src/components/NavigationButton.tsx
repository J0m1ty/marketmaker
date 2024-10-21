import { Button, useColorModeValue } from "@chakra-ui/react";

function NavigationButton({ text }: { text: string }) {
    return (
        <Button
            height="30px"
            size={"sm"}
            className="nondraggable"
            variant={"ghost"}
            verticalAlign={"middle"}
            fontWeight={300}
            fontSize={"18px"}
            color={useColorModeValue("#000000", "#808b8d")}
            textAlign={"center"}
            lineHeight={"1"}
            sx={{
                '&:hover': {
                    backgroundColor: useColorModeValue("#000000", "#303739"),
                    color: useColorModeValue("#ffffff", "#f2fffc")
                },
            }}
        >
            {text}
        </Button>
    );
}

export default NavigationButton;