import { Menu, MenuButton, MenuGroup, MenuItem, MenuList, useColorModeValue } from "@chakra-ui/react";
import NavigationButton from "./NavigationButton";


function ViewDropdown() {
    const menuBorderColor = useColorModeValue("#eeeeee", "#1d2528");
    const menuBgColor = useColorModeValue("#ffffff", "#273136");
    const menuHoverBgColor = useColorModeValue("#f2f2f2", "#3a4449");

    return (
        <Menu>
            <NavigationButton>View</NavigationButton>
            <MenuList
                borderColor={menuBorderColor}
                bg={menuBgColor}
            >
                <MenuGroup title="Display mode">
                    <MenuItem bg="inherit" sx={{ '&:hover': { backgroundColor: menuHoverBgColor } }}>Automatic</MenuItem>
                    <MenuItem bg="inherit" sx={{ '&:hover': { backgroundColor: menuHoverBgColor } }}>Centered</MenuItem>
                    <MenuItem bg="inherit" sx={{ '&:hover': { backgroundColor: menuHoverBgColor } }}>Custom</MenuItem>
                </MenuGroup>
            </MenuList>
        </Menu>
    );
}

export default ViewDropdown;