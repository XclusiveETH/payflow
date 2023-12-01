import { Box, BoxProps, Button, ButtonProps } from '@mui/material';
import { ProfileType } from '../types/ProfleType';
import { ProfileSection } from './ProfileSection';
import { useNavigate } from 'react-router-dom';

export default function ProfileSectionButton({
  profile,
  ...props
}: BoxProps & ButtonProps & { profile: ProfileType }) {
  const navigate = useNavigate();

  return (
    <Box
      {...props}
      display="flex"
      flexDirection="row"
      justifyContent="flex-start"
      color="inherit"
      component={Button}
      textTransform="none"
      onClick={async () => {
        if (profile) {
          navigate(`/${profile.username}`);
        }
      }}
      sx={{ borderRadius: 5 }}>
      <ProfileSection profile={profile} />
    </Box>
  );
}
