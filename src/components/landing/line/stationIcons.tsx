import type { SvgIconComponent } from '@mui/icons-material';
import MoveToInboxRounded from '@mui/icons-material/MoveToInboxRounded';
import FactCheckRounded from '@mui/icons-material/FactCheckRounded';
import ReceiptLongRounded from '@mui/icons-material/ReceiptLongRounded';
import NotificationsActiveRounded from '@mui/icons-material/NotificationsActiveRounded';
import SyncAltRounded from '@mui/icons-material/SyncAltRounded';
import InsightsRounded from '@mui/icons-material/InsightsRounded';
import type { StationKind } from './lineModel';

/** One icon per station kind, shared by the tray and the stations drawn on the belt. */
export const STATION_ICONS: Record<StationKind, SvgIconComponent> = {
  Intake: MoveToInboxRounded,
  Validate: FactCheckRounded,
  Invoice: ReceiptLongRounded,
  Notify: NotificationsActiveRounded,
  Sync: SyncAltRounded,
  Report: InsightsRounded,
};
