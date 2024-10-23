import { IconButton, Stack, Text, useColorModeValue } from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";

function Tab({ index, name, isActive, isHover, closeFile, onHover, onLeave, onClick }: { index: number, name: string, isActive: boolean, isHover: boolean, closeFile: (index: number) => void, onHover: (index: number) => void, onLeave: () => void, onClick: (index: number) => void }) {
    
    const hoverColor = useColorModeValue("#121212", "#f2fffc");
    const hoverBorderColor = useColorModeValue("#d9d9d9", "#545f62");
    const activeColor = useColorModeValue("#6a1b9a", "#896f9f");
    const defaultColor = useColorModeValue("#000000", "#808b8d");
    
    return (
        <Stack
            borderBottom={(isHover || isActive) ? `2px solid ${isHover ? hoverBorderColor : activeColor}` : ""}
            gap={0}
            dir="row"
            flexDir={"row"}
            pl={5}
            pr={3}
            align={"center"}
            height="51px"
            color={isHover ? hoverColor : isActive ? activeColor : defaultColor}
            onMouseEnter={() => onHover(index)}
            onMouseLeave={onLeave}
            onClick={() => onClick(index)}
            cursor={"pointer"}
        >
            <Text lineHeight={"1"} fontWeight={300} fontSize={"18px"} className="nonselectable">
                {name}
            </Text>
            <IconButton
                aria-label="Close"
                icon={<CloseIcon />}
                variant={"ghost"}
                onClick={(e) => { 
                    e.stopPropagation();
                    closeFile(index);
                }}
                size={"sm"}
                color="inherit"
                sx={{
                    transition: 'none'
                }}
            />
        </Stack>
    )
}

export default Tab;