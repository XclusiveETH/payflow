import { Avatar, Stack, Typography } from '@mui/material';
import { MetaType } from '../types/ProfleType';
import AddressAvatar from './AddressAvatar';
import { shortenWalletAddressLabel } from '../utils/address';

export function AddressSection(props: { meta: MetaType; fontSize?: number; maxWidth?: number }) {
  const { meta, fontSize, maxWidth } = props;
  return (
    <Stack maxWidth={maxWidth ?? 120} direction="row" spacing={0.5} alignItems="center">
      {meta.ensAvatar ? (
        <Avatar src={meta.ensAvatar} />
      ) : (
        <AddressAvatar address={meta.addresses[0] ?? '0x'} />
      )}

      <Stack direction="column" spacing={0.1} alignItems="flex-start" overflow="scroll">
        <Typography variant="subtitle2" fontSize={fontSize}>
          {shortenWalletAddressLabel(meta.addresses[0])}
        </Typography>
        {meta.ens && <Typography variant="caption">{meta.ens}</Typography>}
      </Stack>
    </Stack>
  );
}
