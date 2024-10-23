import {  Button, MenuButton, useColorModeValue } from "@chakra-ui/react";
import { ReactNode } from "react";

function NavigationButton({ children }: { children?: ReactNode }) {
    const color = useColorModeValue("#000000", "#808b8d");
    const hoverBg = useColorModeValue("#000000", "#303739");
    const hoverColor = useColorModeValue("#ffffff", "#f2fffc");
    
    return (
        <MenuButton
            as={Button}
            size={"sm"}
            height="30px"
            className="nondraggable"
            variant={"ghost"}
            verticalAlign={"middle"}
            fontWeight={300}
            fontSize={"18px"}
            color={color}
            textAlign={"center"}
            lineHeight={"1"}
            sx={{
                '&:hover': {
                    backgroundColor: hoverBg,
                    color: hoverColor,
                },
            }}
        >
            { children }
        </MenuButton>
    );
}

export default NavigationButton;