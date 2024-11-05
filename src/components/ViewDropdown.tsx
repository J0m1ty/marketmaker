import { Menu, MenuGroup, MenuItem, MenuList, useColorModeValue } from "@chakra-ui/react";
import NavigationButton from "./NavigationButton";
import { DisplayMode } from "../types";

function ViewDropdown({ triggerDisplayModeChange }: { triggerDisplayModeChange: (mode: DisplayMode) => void }) {
    const menuBorderColor = useColorModeValue("#eeeeee", "#1d2528");
    const menuBgColor = useColorModeValue("#ffffff", "#273136");
    const menuHoverBgColor = useColorModeValue("#f2f2f2", "#3a4449");

    const handleDisplayModeAutomatic = () => {
        triggerDisplayModeChange("auto");
    }

    const handleDisplayModeCentered = () => {
        triggerDisplayModeChange("centered");
    }

    const handleDisplayModeOrigin = () => {
        triggerDisplayModeChange("origin");
    }

    const handleDisplayModeSquare = () => {
        triggerDisplayModeChange("square");
    }

    return (
        <Menu>
            <NavigationButton>View</NavigationButton>
            <MenuList
                borderColor={menuBorderColor}
                bg={menuBgColor}
            >
                <MenuGroup title="Display mode">
                    <MenuItem onClick={handleDisplayModeAutomatic} bg="inherit" sx={{ '&:hover': { backgroundColor: menuHoverBgColor } }}>Automatic</MenuItem>
                    <MenuItem onClick={handleDisplayModeCentered} bg="inherit" sx={{ '&:hover': { backgroundColor: menuHoverBgColor } }}>Centered</MenuItem>
                    <MenuItem onClick={handleDisplayModeOrigin} bg="inherit" sx={{ '&:hover': { backgroundColor: menuHoverBgColor } }}>Origin</MenuItem>
                    <MenuItem onClick={handleDisplayModeSquare} bg="inherit" sx={{ '&:hover': { backgroundColor: menuHoverBgColor } }}>Square</MenuItem>
                </MenuGroup>
            </MenuList>
        </Menu>
    );
}

export default ViewDropdown;