import { Menu, MenuDivider, MenuGroup, MenuItem, MenuList, Text, useColorModeValue } from "@chakra-ui/react";
import NavigationButton from "./NavigationButton";

function FileDropdown({ triggerFileUploadDialog, triggerCloseActiveFile }: { triggerFileUploadDialog: () => void, triggerCloseActiveFile: () => void }) {
    const menuBorderColor = useColorModeValue("#eeeeee", "#1d2528");
    const menuBgColor = useColorModeValue("#ffffff", "#273136");
    const menuHoverBgColor = useColorModeValue("#f2f2f2", "#3a4449");
    const menuDividerBorderColor = useColorModeValue("#cccccc", "#3a4449");
    
    const handleExit = () => {
        window.electron.quit();
    }

    return (
        <Menu>
            <NavigationButton>File</NavigationButton>
            <MenuList
                borderColor={menuBorderColor}
                bg={menuBgColor}
            >
                <MenuGroup title="Files">
                    <MenuItem onClick={triggerFileUploadDialog} bg="inherit" sx={{ '&:hover': { backgroundColor: menuHoverBgColor } }}>Open File</MenuItem>
                    <MenuItem onClick={triggerCloseActiveFile} bg="inherit" sx={{ '&:hover': { backgroundColor: menuHoverBgColor } }}>Close File</MenuItem>
                </MenuGroup>
                <MenuDivider borderColor={menuDividerBorderColor}></MenuDivider>
                <MenuItem onClick={handleExit} bg="inherit" sx={{ '&:hover': { backgroundColor: menuHoverBgColor } }}>Exit</MenuItem>
            </MenuList>
        </Menu>
    );
}

export default FileDropdown;