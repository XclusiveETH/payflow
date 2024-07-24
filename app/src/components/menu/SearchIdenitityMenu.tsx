import { ListItemIcon, Menu, MenuItem, MenuList, MenuProps } from '@mui/material';
import { People, PersonAdd, Star, StarBorder } from '@mui/icons-material';
import { IdentityType } from '../../types/ProfleType';
import { useContext } from 'react';
import { ProfileContext } from '../../contexts/UserContext';
import { yellow } from '@mui/material/colors';

export function SearchIdentityMenu({
  identity,
  onInviteClick,
  onFavouriteClick,
  onSocilLinksClick,
  favourite,
  ...props
}: {
  identity: IdentityType;
  favourite?: boolean;
  onInviteClick?: () => void;
  onFavouriteClick?: () => void;
  onSocilLinksClick?: () => void;
} & MenuProps) {
  const { isAuthenticated } = useContext(ProfileContext);

  return (
    <Menu
      {...props}
      sx={{ '.MuiMenu-paper': { borderRadius: 5 } }}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right'
      }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}>
      <MenuList dense>
        <MenuItem onClick={onSocilLinksClick}>
          <ListItemIcon>
            <People fontSize="small" />
          </ListItemIcon>
          Social links
        </MenuItem>
        {isAuthenticated && (
          <>
            <MenuItem onClick={onFavouriteClick}>
              <ListItemIcon>
                {favourite ? (
                  <Star fontSize="small" sx={{ color: yellow.A700 }} />
                ) : (
                  <StarBorder fontSize="small" />
                )}
              </ListItemIcon>
              {favourite ? 'Remove from favourites' : 'Add to favourites'}
            </MenuItem>
            {!identity.invited && !identity.profile && (
              <MenuItem onClick={onInviteClick} sx={{ fontSize: 14 }}>
                <ListItemIcon>
                  <PersonAdd fontSize="small" />
                </ListItemIcon>
                Invite
              </MenuItem>
            )}
          </>
        )}
      </MenuList>
    </Menu>
  );
}